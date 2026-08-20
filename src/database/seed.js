import bcrypt from 'bcryptjs';
import { getDriver, closeDriver, verifyConnectivity } from './driver.js';
import { withSession } from './session.js';

/**
 * SEED STRATEGY: every node uses a stable, hand-assigned `id` (e.g.
 * 'topic-javascript', 'tutorial-js-fundamentals') and every write uses
 * MERGE keyed on that id. Re-running this script updates properties on
 * existing nodes and MERGEs (not duplicates) relationships — it never
 * creates a second copy of "JavaScript" or a duplicate LIKED edge.
 */

const now = new Date().toISOString();
const SEED_PASSWORD = 'Password123!';

const topics = [
  { id: 'topic-javascript', name: 'JavaScript', slug: 'javascript' },
  { id: 'topic-react', name: 'React', slug: 'react' },
  { id: 'topic-typescript', name: 'TypeScript', slug: 'typescript' },
  { id: 'topic-nodejs', name: 'Node.js', slug: 'nodejs' },
  { id: 'topic-nextjs', name: 'Next.js', slug: 'nextjs' },
  { id: 'topic-aws', name: 'AWS', slug: 'aws' },
  { id: 'topic-docker', name: 'Docker', slug: 'docker' },
  { id: 'topic-postgresql', name: 'PostgreSQL', slug: 'postgresql' },
];

const topicRelations = [
  ['topic-javascript', 'topic-typescript'],
  ['topic-javascript', 'topic-react'],
  ['topic-javascript', 'topic-nodejs'],
  ['topic-react', 'topic-nextjs'],
  ['topic-nodejs', 'topic-nextjs'],
  ['topic-nodejs', 'topic-docker'],
  ['topic-docker', 'topic-aws'],
  ['topic-postgresql', 'topic-nodejs'],
];

const skills = [
  { id: 'skill-js-fundamentals', name: 'JavaScript Fundamentals', slug: 'js-fundamentals' },
  { id: 'skill-react-hooks', name: 'React Hooks', slug: 'react-hooks' },
  { id: 'skill-type-safety', name: 'Type Safety', slug: 'type-safety' },
  { id: 'skill-rest-apis', name: 'Building REST APIs', slug: 'rest-apis' },
  { id: 'skill-ssr', name: 'Server-Side Rendering', slug: 'ssr' },
  { id: 'skill-containerization', name: 'Containerization', slug: 'containerization' },
  { id: 'skill-cloud-deploy', name: 'Cloud Deployment', slug: 'cloud-deploy' },
  { id: 'skill-sql', name: 'SQL Querying', slug: 'sql' },
];

const skillRelations = [
  ['skill-js-fundamentals', 'skill-react-hooks'],
  ['skill-js-fundamentals', 'skill-type-safety'],
  ['skill-js-fundamentals', 'skill-rest-apis'],
  ['skill-react-hooks', 'skill-ssr'],
  ['skill-rest-apis', 'skill-sql'],
  ['skill-containerization', 'skill-cloud-deploy'],
];

const instructors = [
  { id: 'instructor-ada', name: 'Ada Kim', bio: 'Full-stack engineer and educator, 10+ years in JS.' },
  { id: 'instructor-leo', name: 'Leo Martins', bio: 'Cloud infrastructure specialist and AWS-certified trainer.' },
  { id: 'instructor-priya', name: 'Priya Nair', bio: 'Frontend architect focused on React and design systems.' },
];

const courses = [
  { id: 'course-fullstack-js', title: 'Full-Stack JavaScript', description: 'From fundamentals to deployed apps.' },
  { id: 'course-cloud-native', title: 'Cloud-Native Engineering', description: 'Containers, orchestration, and cloud deploys.' },
];

const tutorials = [
  {
    id: 'tutorial-js-fundamentals',
    title: 'JavaScript Fundamentals',
    description: 'Variables, functions, closures, and the event loop.',
    contentUrl: 'https://example.com/tutorials/js-fundamentals',
    difficulty: 'beginner',
    duration: 45,
    topicIds: ['topic-javascript'],
    skillIds: ['skill-js-fundamentals'],
    courseId: 'course-fullstack-js',
    instructorId: 'instructor-ada',
  },
  {
    id: 'tutorial-react-hooks-deep-dive',
    title: 'React Hooks Deep Dive',
    description: 'useState, useEffect, useMemo, and building custom hooks.',
    contentUrl: 'https://example.com/tutorials/react-hooks',
    difficulty: 'intermediate',
    duration: 60,
    topicIds: ['topic-react'],
    skillIds: ['skill-react-hooks'],
    courseId: 'course-fullstack-js',
    instructorId: 'instructor-priya',
  },
  {
    id: 'tutorial-typescript-for-js-devs',
    title: 'TypeScript for JavaScript Developers',
    description: 'Static typing, generics, and migrating a JS codebase.',
    contentUrl: 'https://example.com/tutorials/typescript-intro',
    difficulty: 'intermediate',
    duration: 55,
    topicIds: ['topic-typescript'],
    skillIds: ['skill-type-safety'],
    courseId: 'course-fullstack-js',
    instructorId: 'instructor-ada',
  },
  {
    id: 'tutorial-building-rest-apis-nodejs',
    title: 'Building REST APIs with Node.js',
    description: 'Express, routing, validation, and error handling.',
    contentUrl: 'https://example.com/tutorials/rest-apis-node',
    difficulty: 'intermediate',
    duration: 70,
    topicIds: ['topic-nodejs'],
    skillIds: ['skill-rest-apis'],
    courseId: 'course-fullstack-js',
    instructorId: 'instructor-ada',
  },
  {
    id: 'tutorial-nextjs-ssr',
    title: 'Server-Side Rendering with Next.js',
    description: 'App router, data fetching, and rendering strategies.',
    contentUrl: 'https://example.com/tutorials/nextjs-ssr',
    difficulty: 'advanced',
    duration: 80,
    topicIds: ['topic-nextjs'],
    skillIds: ['skill-ssr'],
    courseId: 'course-fullstack-js',
    instructorId: 'instructor-priya',
  },
  {
    id: 'tutorial-docker-for-node-devs',
    title: 'Docker for Node.js Developers',
    description: 'Images, containers, and multi-stage builds.',
    contentUrl: 'https://example.com/tutorials/docker-node',
    difficulty: 'intermediate',
    duration: 50,
    topicIds: ['topic-docker'],
    skillIds: ['skill-containerization'],
    courseId: 'course-cloud-native',
    instructorId: 'instructor-leo',
  },
  {
    id: 'tutorial-deploying-to-aws',
    title: 'Deploying Node.js Apps to AWS',
    description: 'ECS, environment config, and zero-downtime deploys.',
    contentUrl: 'https://example.com/tutorials/deploy-aws',
    difficulty: 'advanced',
    duration: 90,
    topicIds: ['topic-aws'],
    skillIds: ['skill-cloud-deploy'],
    courseId: 'course-cloud-native',
    instructorId: 'instructor-leo',
  },
  {
    id: 'tutorial-postgresql-for-backend-devs',
    title: 'PostgreSQL for Backend Developers',
    description: 'Schema design, indexing, and query performance.',
    contentUrl: 'https://example.com/tutorials/postgresql-backend',
    difficulty: 'intermediate',
    duration: 65,
    topicIds: ['topic-postgresql'],
    skillIds: ['skill-sql'],
    courseId: 'course-fullstack-js',
    instructorId: 'instructor-ada',
  },
];

const users = [
  { id: 'user-alex', name: 'Alex Rivera', email: 'alex@example.com' },
  { id: 'user-sam', name: 'Sam Okafor', email: 'sam@example.com' },
  { id: 'user-jordan', name: 'Jordan Lee', email: 'jordan@example.com' },
];

// Alex: leans JS/React, has real history → good candidate for graph-based recs
// Sam: leans backend/cloud, has real history
// Jordan: brand new, no interactions → exercises the fallback path
const interactions = [
  { userId: 'user-alex', tutorialId: 'tutorial-js-fundamentals', type: 'COMPLETED' },
  { userId: 'user-alex', tutorialId: 'tutorial-react-hooks-deep-dive', type: 'LIKED' },
  { userId: 'user-alex', tutorialId: 'tutorial-react-hooks-deep-dive', type: 'VIEWED' },
  { userId: 'user-alex', tutorialId: 'tutorial-typescript-for-js-devs', type: 'VIEWED' },

  { userId: 'user-sam', tutorialId: 'tutorial-building-rest-apis-nodejs', type: 'COMPLETED' },
  { userId: 'user-sam', tutorialId: 'tutorial-docker-for-node-devs', type: 'LIKED' },
  { userId: 'user-sam', tutorialId: 'tutorial-postgresql-for-backend-devs', type: 'VIEWED' },
];

async function mergeNodes(session, label, items) {
  await session.executeWrite((tx) =>
    tx.run(
      `
      UNWIND $items AS item
      MERGE (n:${label} {id: item.id})
      SET n += item.props
      `,
      { items: items.map(({ id, ...props }) => ({ id, props: { ...props, id } })) }
    )
  );
}

async function mergeRelations(session, cypher, pairs) {
  if (pairs.length === 0) return;
  await session.executeWrite((tx) => tx.run(cypher, { pairs }));
}

async function seed() {
  // eslint-disable-next-line no-console
  console.log('[seed] Verifying CognoDB connectivity...');
  await verifyConnectivity();

  await withSession('WRITE', async (session) => {
    // eslint-disable-next-line no-console
    console.log('[seed] Merging topics, skills, instructors, courses, tutorials...');

    await mergeNodes(session, 'Topic', topics);
    await mergeNodes(session, 'Skill', skills);
    await mergeNodes(session, 'Instructor', instructors);
    await mergeNodes(
      session,
      'Course',
      courses.map((c) => ({ ...c, createdAt: now }))
    );

    for (const tutorial of tutorials) {
      const { topicIds, skillIds, courseId, instructorId, ...tutorialProps } = tutorial;
      await session.executeWrite((tx) =>
        tx.run(
          `
          MERGE (t:Tutorial {id: $id})
          SET t += $props

          WITH t
          UNWIND $topicIds AS topicId
          MATCH (topic:Topic {id: topicId})
          MERGE (t)-[:ABOUT]->(topic)

          WITH t
          UNWIND $skillIds AS skillId
          MATCH (skill:Skill {id: skillId})
          MERGE (t)-[:TEACHES]->(skill)

          WITH t
          OPTIONAL MATCH (course:Course {id: $courseId})
          FOREACH (_ IN CASE WHEN course IS NOT NULL THEN [1] ELSE [] END |
            MERGE (course)-[:CONTAINS]->(t)
          )

          WITH t
          OPTIONAL MATCH (instructor:Instructor {id: $instructorId})
          FOREACH (_ IN CASE WHEN instructor IS NOT NULL THEN [1] ELSE [] END |
            MERGE (t)-[:TAUGHT_BY]->(instructor)
          )
          `,
          {
            id: tutorial.id,
            props: { ...tutorialProps, createdAt: now },
            topicIds,
            skillIds,
            courseId: courseId ?? null,
            instructorId: instructorId ?? null,
          }
        )
      );
    }

    // eslint-disable-next-line no-console
    console.log('[seed] Merging RELATED_TO relationships...');
    await mergeRelations(
      session,
      `
      UNWIND $pairs AS pair
      MATCH (a:Topic {id: pair[0]}), (b:Topic {id: pair[1]})
      MERGE (a)-[:RELATED_TO]->(b)
      MERGE (b)-[:RELATED_TO]->(a)
      `,
      topicRelations
    );
    await mergeRelations(
      session,
      `
      UNWIND $pairs AS pair
      MATCH (a:Skill {id: pair[0]}), (b:Skill {id: pair[1]})
      MERGE (a)-[:RELATED_TO]->(b)
      MERGE (b)-[:RELATED_TO]->(a)
      `,
      skillRelations
    );

    // eslint-disable-next-line no-console
    console.log('[seed] Merging users...');
    const passwordHash = await bcrypt.hash(SEED_PASSWORD, 12);
    await session.executeWrite((tx) =>
      tx.run(
        `
        UNWIND $users AS u
        MERGE (user:User {id: u.id})
        SET user.name = u.name,
            user.email = u.email,
            user.passwordHash = $passwordHash,
            user.createdAt = coalesce(user.createdAt, $now),
            user.updatedAt = $now
        `,
        { users, passwordHash, now }
      )
    );

    // eslint-disable-next-line no-console
    console.log('[seed] Merging user interactions...');
    for (const { userId, tutorialId, type } of interactions) {
      const relTypeSetup = {
        VIEWED: `MERGE (u)-[r:VIEWED]->(t) ON CREATE SET r.viewCount = 1, r.firstViewedAt = $now, r.lastViewedAt = $now ON MATCH SET r.lastViewedAt = $now`,
        LIKED: `MERGE (u)-[r:LIKED]->(t) ON CREATE SET r.createdAt = $now`,
        COMPLETED: `MERGE (u)-[r:COMPLETED]->(t) ON CREATE SET r.completedAt = $now, r.progress = 100`,
      }[type];

      await session.executeWrite((tx) =>
        tx.run(
          `
          MATCH (u:User {id: $userId}), (t:Tutorial {id: $tutorialId})
          ${relTypeSetup}
          `,
          { userId, tutorialId, now }
        )
      );
    }
  });

  // eslint-disable-next-line no-console
  console.log(`
[seed] Done. Seed users (password: "${SEED_PASSWORD}"):`);
  for (const u of users) {
    // eslint-disable-next-line no-console
    console.log(`  - ${u.email}`);
  }
}

seed()
  .then(() => closeDriver())
  .then(() => process.exit(0))
  .catch(async (err) => {
    // eslint-disable-next-line no-console
    console.error('[seed] Seed failed:', err);
    await closeDriver();
    process.exit(1);
  });

void getDriver;
