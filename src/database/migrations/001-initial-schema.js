import { getDriver, closeDriver, verifyConnectivity } from '../driver.js';
import { withSession } from '../session.js';

/**
 * SCHEMA MANAGEMENT STRATEGY
 * ──────────────────────────
 * Prisma migration → Graph schema/migration mechanism (with a caveat)
 *
 * Prisma tracks migration history in a `_prisma_migrations` table and
 * refuses to re-run a migration it has already applied. Neo4j/CognoDB
 * (via Cypher) offers a simpler, built-in idempotency primitive instead:
 *
 *     CREATE CONSTRAINT ... IF NOT EXISTS
 *     CREATE INDEX ... IF NOT EXISTS
 *
 * Because every statement below is self-idempotent, we don't need a
 * separate migrations-history table to know what's "already applied" —
 * running this script twice (or on every deploy) is always safe. That's
 * why this lives as a standalone script (`npm run db:migrate`) rather
 * than code that runs automatically on every server boot: schema changes
 * should be a deliberate, explicit step, not a side effect of starting
 * the API process.
 *
 * If you later need multi-step, ordered migrations (e.g. backfilling
 * data, renaming relationship types), add 002-..., 003-... files in this
 * directory and run them in order — the numeric prefix defines sequence,
 * same convention as most SQL migration tools.
 *
 * NOTE ON COGNODB: this uses standard Cypher `IF NOT EXISTS` constraint
 * syntax, which is standard in Neo4j 5.x. Confirm CognoDB supports this
 * exact syntax against your instance (`:schema` in the CognoDB Browser
 * will show you current constraints/indexes) before relying on it in
 * production — if CognoDB requires different syntax, adjust the
 * statements below accordingly.
 */

const STATEMENTS = [
  // Uniqueness constraints (also implicitly create backing indexes)
  `CREATE CONSTRAINT user_id_unique IF NOT EXISTS
     FOR (u:User) REQUIRE u.id IS UNIQUE`,
  `CREATE CONSTRAINT user_email_unique IF NOT EXISTS
     FOR (u:User) REQUIRE u.email IS UNIQUE`,
  `CREATE CONSTRAINT tutorial_id_unique IF NOT EXISTS
     FOR (t:Tutorial) REQUIRE t.id IS UNIQUE`,
  `CREATE CONSTRAINT course_id_unique IF NOT EXISTS
     FOR (c:Course) REQUIRE c.id IS UNIQUE`,
  `CREATE CONSTRAINT topic_id_unique IF NOT EXISTS
     FOR (t:Topic) REQUIRE t.id IS UNIQUE`,
  `CREATE CONSTRAINT topic_slug_unique IF NOT EXISTS
     FOR (t:Topic) REQUIRE t.slug IS UNIQUE`,
  `CREATE CONSTRAINT skill_id_unique IF NOT EXISTS
     FOR (s:Skill) REQUIRE s.id IS UNIQUE`,
  `CREATE CONSTRAINT skill_slug_unique IF NOT EXISTS
     FOR (s:Skill) REQUIRE s.slug IS UNIQUE`,
  `CREATE CONSTRAINT instructor_id_unique IF NOT EXISTS
     FOR (i:Instructor) REQUIRE i.id IS UNIQUE`,

  // Supporting lookup indexes (traversals in the recommendation query
  // filter/sort on these; constraints above already index the `id`
  // fields used for direct MATCH-by-id lookups).
  `CREATE INDEX tutorial_created_at IF NOT EXISTS
     FOR (t:Tutorial) ON (t.createdAt)`,
  `CREATE INDEX tutorial_difficulty IF NOT EXISTS
     FOR (t:Tutorial) ON (t.difficulty)`,
];

async function runMigration() {
  // eslint-disable-next-line no-console
  console.log('[migrate] Verifying CognoDB connectivity...');
  await verifyConnectivity();

  // eslint-disable-next-line no-console
  console.log(`[migrate] Applying ${STATEMENTS.length} schema statement(s)...`);

  await withSession('WRITE', async (session) => {
    for (const statement of STATEMENTS) {
      const label = statement.trim().split('\n')[0];
      try {
        await session.executeWrite((tx) => tx.run(statement));
        // eslint-disable-next-line no-console
        console.log(`  ✓ ${label}`);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`  ✗ ${label}\n    ${err.message}`);
        throw err;
      }
    }
  });

  // eslint-disable-next-line no-console
  console.log('[migrate] Schema is up to date.');
}

runMigration()
  .then(() => closeDriver())
  .then(() => process.exit(0))
  .catch(async (err) => {
    // eslint-disable-next-line no-console
    console.error('[migrate] Migration failed:', err);
    await closeDriver();
    process.exit(1);
  });

// Keep a reference so bundlers/linters don't flag getDriver as unused
// if this file is imported elsewhere in the future.
void getDriver;
