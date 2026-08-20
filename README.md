# GraphRec

GraphRec is a graph-based recommendation engine for an educational platform
(tutorials, courses, topics, skills, instructors), built on Node.js,
Express, and a Cypher/Bolt-compatible graph database (**CognoDB Cloud**,
via the standard `neo4j-driver`).

> ⚠️ **A note on CognoDB**: I could not find comprehensive public
> documentation for CognoDB (only a minimal browser/workbench UI showing
> `MATCH (a)-[r]->(b) RETURN a, r, b` style Cypher queries). Everything in
> this project assumes CognoDB is Bolt-protocol and Cypher-compatible —
> the same assumption its own browser tool's query syntax implies. Before
> deploying, sanity-check the connection URI scheme and constraint/index
> syntax (`CREATE CONSTRAINT ... IF NOT EXISTS`) against your actual
> CognoDB Cloud instance; the `:schema` command in the CognoDB Browser and
> `npm run db:migrate`'s output are your two fastest ways to confirm.

---

## 1. Recommendation approaches — and why graph-based

| Approach | How it works | Weakness for this domain |
|---|---|---|
| **Popularity-based** | Recommend whatever is most-viewed/liked globally | Ignores the individual user entirely |
| **Content-based** | Recommend items similar to ones the user liked, using item attributes | Misses connections that aren't attribute-similarity (e.g. "people who master X often move to Y") |
| **Collaborative filtering** | Recommend what similar *users* liked | Needs a large user base to work well ("cold start" for small platforms); relationships are implicit, computed statistically |
| **Hybrid** | Blend of the above | Still generally treats relationships as a byproduct of matrix math, not first-class data |
| **Graph-based** | Recommend by traversing explicit relationships between users, content, topics, and skills | Needs a graph database; but relationships are explicit, inspectable, and cheap to traverse |

**Why graph-based here:** the interesting recommendation signal in
GraphRec isn't just "users like Alex liked tutorial X" — it's *why*:
Alex liked a React tutorial, React relates to Next.js, and there's a
Next.js tutorial they haven't seen. That's a **path** through typed,
directional relationships (`LIKED`, `ABOUT`, `RELATED_TO`, `TEACHES`).
A relational database would need a chain of JOINs (one per hop) whose
cost grows with each additional hop; a graph database walks the same
path via direct pointer-following (index-free adjacency), and the
*relationships themselves* — not just the rows — are the data we
actually care about. That's also what makes the score explainable: each
recommendation carries the literal path(s) that produced it.

---

## 2. Architecture

```
Client
  ↓
Express Server (src/app.js)
  ↓
Routes (src/routes/*.routes.js)
  ↓
Middleware (auth, validation, error handling)
  ↓
Controllers (src/controllers/*.controller.js)
  ↓
Repositories (src/repositories/*.repository.js)
  ↓
Neo4j JavaScript Driver
  ↓
Bolt
  ↓
CognoDB Cloud
```

No service layer is used, **except implicitly inside
`recommendation.repository.js`**, which is intentionally heavier than the
other repositories: it owns the traversal + scoring Cypher and the
fallback logic. It's still a repository (not a separate service file)
because it has exactly one responsibility — "give me ranked candidates
for this user" — and splitting it into a service-that-calls-a-repository
would just add an indirection layer with nothing on either side of it.

### PostgreSQL/Prisma → CognoDB/graph concept map

| Prisma / PostgreSQL | CognoDB / Graph |
|---|---|
| Prisma model | Node label + properties (`(:Tutorial {title, ...})`) |
| SQL `JOIN` | Graph traversal (`(a)-[:REL]->(b)`) |
| Prisma Client | `neo4j-driver` + Cypher strings |
| PostgreSQL table | Node label |
| Foreign key | Relationship (typed, directional, can carry its own properties) |
| Prisma migration (tracked history table) | `CREATE CONSTRAINT ... IF NOT EXISTS` (self-idempotent, no history table needed — see §7) |
| `prisma.user.findUnique({ where: { email }})` | `MATCH (u:User {email: $email}) RETURN u` |

One place this mapping breaks down: **there's no clean equivalent of a
SQL "many-to-many join table"** in the graph model — a relationship
*is* the join, and can hold its own data (e.g. `VIEWED.viewCount`)
without needing a separate node to represent it.

---

## 3. Recommendation algorithm — exact scoring

For the authenticated user, the engine traverses five weighted paths to
candidate tutorials (excluding anything already viewed/liked/completed),
sums the weights per candidate, adds a small popularity term, and
returns the top N:

| Path | Points |
|---|---|
| `(user)-[:LIKED]->(tutorial)-[:ABOUT]->(topic)<-[:ABOUT]-(candidate)` | **+5** |
| `(user)-[:COMPLETED]->(tutorial)-[:TEACHES]->(skill)<-[:TEACHES]-(candidate)` | **+4** |
| `(user)-[:LIKED]->(tutorial)-[:ABOUT]->(topic)-[:RELATED_TO]->(topic)<-[:ABOUT]-(candidate)` | **+3** |
| `(user)-[:COMPLETED]->(tutorial)-[:TEACHES]->(skill)-[:RELATED_TO]->(skill)<-[:TEACHES]-(candidate)` | **+2** |
| `(user)-[:VIEWED]->(tutorial)-[:ABOUT]->(topic)<-[:ABOUT]-(candidate)` | **+1** |
| *(global popularity)* `count(any user's VIEWED/LIKED/COMPLETED on candidate) × 0.1` | tie-breaker only |

A candidate reachable via multiple paths accumulates multiple scores
(e.g. matching both a liked topic *and* a completed skill = +5 +4 = +9).
Each recommendation in the API response includes `reasons`, the list of
path types that contributed — that's the "explainability" requirement.

**Fallback** (`usedFallback: true` in the response): if the traversal
above returns zero candidates — always true for a brand-new user with no
interaction history — the engine falls back to tutorials ranked by
global engagement count, then recency, excluding anything already
consumed. New users always get a sensible, non-empty response.

---

## 4. Graph data model

**Nodes**

- `User { id, name, email, passwordHash, createdAt, updatedAt }`
- `Tutorial { id, title, description, contentUrl, difficulty, duration, createdAt }`
- `Course { id, title, description, createdAt }`
- `Topic { id, name, slug }`
- `Skill { id, name, slug }`
- `Instructor { id, name, bio }`

**Relationships**

- `(User)-[:VIEWED {viewCount, firstViewedAt, lastViewedAt}]->(Tutorial)`
- `(User)-[:LIKED {createdAt}]->(Tutorial)`
- `(User)-[:COMPLETED {completedAt, progress}]->(Tutorial)`
- `(Tutorial)-[:ABOUT]->(Topic)`
- `(Tutorial)-[:TEACHES]->(Skill)`
- `(Course)-[:CONTAINS]->(Tutorial)`
- `(Tutorial)-[:TAUGHT_BY]->(Instructor)`
- `(Topic)-[:RELATED_TO]->(Topic)` (seeded bidirectionally)
- `(Skill)-[:RELATED_TO]->(Skill)` (seeded bidirectionally)

`ENROLLED_IN` and `FOLLOWS` from the original relationship list aren't
wired into any endpoint in this version (no product requirement drove
them yet) — they're natural, low-effort additions: `ENROLLED_IN` would
follow the same MERGE pattern as the interaction relationships, and
`FOLLOWS` would let you add a collaborative-filtering-style path
(`(user)-[:FOLLOWS]->(other)-[:LIKED]->(candidate)`) alongside the
existing graph-based ones.

---

## 5. Project structure

```
graphrec/
├── src/
│   ├── config/env.js                     # env loading + startup validation
│   ├── database/
│   │   ├── driver.js                     # single long-lived driver
│   │   ├── session.js                    # per-operation sessions
│   │   ├── seed.js                       # idempotent seed data
│   │   └── migrations/001-initial-schema.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── validate.middleware.js
│   │   ├── error.middleware.js
│   │   └── not-found.middleware.js
│   ├── repositories/
│   │   ├── user.repository.js
│   │   ├── tutorial.repository.js
│   │   ├── interaction.repository.js
│   │   └── recommendation.repository.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── tutorial.controller.js
│   │   ├── interaction.controller.js
│   │   └── recommendation.controller.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── tutorial.routes.js            # also mounts /:id/view|like|complete
│   │   └── recommendation.routes.js
│   ├── validators/
│   │   ├── auth.validator.js
│   │   ├── tutorial.validator.js
│   │   └── interaction.validator.js      # also covers recommendation ?limit
│   ├── utils/
│   │   ├── jwt.js
│   │   ├── response.js                   # ok/created + ApiError
│   │   └── neo4jHelpers.js               # driver-value → plain JSON conversion
│   ├── app.js
│   └── server.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

**Deviation from the originally proposed structure:** interaction
endpoints (`view`/`like`/`complete`) live inside `tutorial.routes.js`
rather than a separate `interaction.routes.js`, because they're mounted
as sub-paths of a specific tutorial (`POST /api/tutorials/:id/view`) —
splitting them into another router file would just re-declare the same
`/:id` prefix a second time for no real separation of concerns. The
controller logic itself is still cleanly separated in
`interaction.controller.js` and `interaction.repository.js`.

---

## 6. Setup

```bash
npm install
cp .env.example .env
```

### CognoDB Cloud credentials

You'll need, from your CognoDB Cloud dashboard:

- **Connection URI** — put this in `COGNODB_URI`. This is normally a
  `neo4j://`, `neo4j+s://`, or `bolt://` URI depending on whether your
  instance is clustered/uses routing and whether it requires TLS. Use
  exactly what CognoDB's dashboard gives you.
- **Username / password** — `COGNODB_USERNAME` / `COGNODB_PASSWORD`.
- **Database name**, if CognoDB supports multiple named databases per
  instance — `COGNODB_DATABASE` (leave blank to use the default).

Also set `JWT_ACCESS_SECRET` to a long random string (e.g.
`openssl rand -hex 32`).

### Schema initialization

```bash
npm run db:migrate
```

Runs `src/database/migrations/001-initial-schema.js`, which creates
uniqueness constraints and supporting indexes using
`CREATE CONSTRAINT ... IF NOT EXISTS` / `CREATE INDEX ... IF NOT EXISTS`.
Every statement is self-idempotent — rerunning this command any number
of times (redeploys, CI, etc.) is always safe and will never fail
because "it already exists." See the comment block at the top of that
file for the full reasoning versus Prisma's migration-history-table
approach.

### Seeding

```bash
npm run db:seed
```

Creates 3 users, 8 tutorials, 8 topics, 8 skills, 3 instructors, 2
courses, topic/skill `RELATED_TO` edges, and realistic interactions —
enough graph density to produce non-trivial recommendations. Seed users
all share the password `Password123!`:

- `alex@example.com` — liked/completed/viewed several JS+React tutorials
  → graph-based recommendations will surface related TypeScript/Next.js
  content.
- `sam@example.com` — backend/cloud interaction history → recommendations
  lean toward AWS/PostgreSQL/Docker content.
- `jordan@example.com` — **no interactions at all** → exercises the
  popularity/recency fallback path.

The seed script uses `MERGE` on stable, hand-assigned IDs throughout, so
it's safe to rerun — it won't create duplicate nodes or relationships.

### Running

```bash
npm run dev     # nodemon, auto-restart
npm start       # production
```

The server verifies CognoDB connectivity **before** it starts accepting
requests and exits with a clear error if it can't connect — it won't
silently boot into a broken state.

---

## 7. API endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | – | Liveness check |
| GET | `/health/db` | – | Verifies CognoDB connectivity |
| POST | `/api/auth/register` | – | Create account, returns JWT |
| POST | `/api/auth/login` | – | Returns JWT |
| GET | `/api/auth/me` | ✓ | Current user |
| GET | `/api/users/me` | ✓ | Current user (alias, see §5) |
| POST | `/api/tutorials` | ✓ | Create tutorial (+ topic/skill/course/instructor links) |
| GET | `/api/tutorials` | – | List (`?difficulty=&limit=&offset=`) |
| GET | `/api/tutorials/:id` | – | Detail, with topics/skills/instructor/course |
| PATCH | `/api/tutorials/:id` | ✓ | Partial update |
| DELETE | `/api/tutorials/:id` | ✓ | Delete |
| POST | `/api/tutorials/:id/view` | ✓ | Record a view (increments `viewCount`) |
| POST | `/api/tutorials/:id/like` | ✓ | Record a like (idempotent) |
| POST | `/api/tutorials/:id/complete` | ✓ | Record completion |
| GET | `/api/recommendations` | ✓ | `?limit=` (default 10, max 50) |

All responses use `{ success: true, data: {...} }` or
`{ success: false, error: { message, code, details? } }`.

---

## 8. Full request-lifecycle walkthrough (curl)

```bash
# 1. Register
curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Taylor Chen","email":"taylor@example.com","password":"Password123!"}'

# 2. Login (or reuse the token from step 1's response)
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"taylor@example.com","password":"Password123!"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["data"]["token"])')

# 3. Whoami
curl -s http://localhost:5000/api/auth/me -H "Authorization: Bearer $TOKEN"

# 4. Create a tutorial (or just use seeded ones)
curl -s -X POST http://localhost:5000/api/tutorials \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"Intro to Cypher","description":"Graph queries 101","difficulty":"beginner","duration":30,"topicIds":["topic-javascript"]}'

# 5. Interact (use a seeded tutorial id, e.g. tutorial-react-hooks-deep-dive)
curl -s -X POST http://localhost:5000/api/tutorials/tutorial-react-hooks-deep-dive/view \
  -H "Authorization: Bearer $TOKEN"
curl -s -X POST http://localhost:5000/api/tutorials/tutorial-react-hooks-deep-dive/like \
  -H "Authorization: Bearer $TOKEN"

# 6. Get recommendations
curl -s "http://localhost:5000/api/recommendations?limit=5" \
  -H "Authorization: Bearer $TOKEN"
```

Using seeded users directly (skip steps 1 and 4):

```bash
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alex@example.com","password":"Password123!"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["data"]["token"])')

curl -s "http://localhost:5000/api/recommendations" -H "Authorization: Bearer $TOKEN"
# → graph-based recommendations, usedFallback: false

TOKEN2=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jordan@example.com","password":"Password123!"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["data"]["token"])')

curl -s "http://localhost:5000/api/recommendations" -H "Authorization: Bearer $TOKEN2"
# → popularity/recency fallback, usedFallback: true
```

---

## 9. Testing

This was tested during development against a running app instance
(HTTP layer, validation, auth, and error-handling paths were verified
directly — see the "what was verified" note below), covering:

- `GET /health` → 200 without touching the database
- `POST /api/auth/register` with an invalid body → 400 with per-field
  Zod validation messages
- `GET /api/recommendations` with no `Authorization` header → 401
- `GET /api/auth/me` with a garbage bearer token → 401
- `GET /api/nope` (unknown route) → 404 via the centralized not-found
  middleware
- A valid request reaching the database layer when the database is
  unreachable → 503 via `classifyDatabaseError`, not a crash or a raw
  stack trace leak

**What I could not verify in this environment:** actual Cypher execution
against a live CognoDB/Neo4j instance — this sandbox has no outbound
network access to a database server and no Docker/Neo4j binary
available. Every query was written against, and follows, standard
Neo4j 5.x Cypher syntax (`MERGE`, `CALL { ... }` correlated subqueries,
`UNION ALL`, `FOREACH`, `IF NOT EXISTS` constraints). **Run
`npm run db:migrate && npm run db:seed` against your real CognoDB
instance and walk through §8 before treating this as fully verified
end-to-end** — that's the one part of "don't stop halfway" I can't do
for you without real credentials.

To extend this into an automated suite, `node --test tests/` is already
wired up via `npm test`; add files under `tests/` using Node's built-in
test runner (or swap in Jest/Vitest) plus `supertest` against
`createApp()` from `src/app.js`.

---

## 10. Security checklist

- `helmet()` for standard secure headers
- `cors()` configurable via `CORS_ORIGIN`
- Passwords hashed with bcrypt (12 rounds), never returned in any
  response
- JWTs signed with `JWT_ACCESS_SECRET`, verified on every protected route
- All Cypher queries are parameterized — no string interpolation of user
  input anywhere
- Centralized error handler strips stack traces / raw driver errors from
  responses when `NODE_ENV=production`
- `.env` is git-ignored; only `.env.example` (with empty secrets) is
  committed

---

## 11. Troubleshooting

- **"Missing required environment variable(s)" on boot** — copy
  `.env.example` to `.env` and fill in `COGNODB_URI`,
  `COGNODB_USERNAME`, `COGNODB_PASSWORD`, `JWT_ACCESS_SECRET`.
- **Server exits immediately with a connectivity error** — verify the
  URI scheme (`neo4j://` vs `neo4j+s://` vs `bolt://`) matches what
  CognoDB's dashboard specifies, and that your IP/network is allow-listed
  if CognoDB restricts inbound connections.
- **`db:migrate` fails on a constraint statement** — run `:schema` in
  the CognoDB Browser to see what constraint/index syntax it actually
  accepted, and compare against
  `src/database/migrations/001-initial-schema.js`; adjust syntax if
  CognoDB diverges from standard Neo4j 5.x here.
- **`GET /api/recommendations` always returns `usedFallback: true`** —
  either the user genuinely has no interaction history yet, or the seed
  script hasn't been run. Confirm with `GET /api/tutorials` that seeded
  tutorials exist, and that you're logged in as a seeded user with
  history (`alex@example.com` or `sam@example.com`).
- **`409 Conflict` on registration** — that email already exists; the
  `user_email_unique` constraint (and the app-level check before it) are
  both working as intended.
