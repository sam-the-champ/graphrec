import { randomUUID } from 'node:crypto';
import { withSession } from '../database/session.js';
import { toPlainObject, toPlainValue } from '../utils/neo4jHelpers.js';

/**
 * Creates a Tutorial node and, in the SAME Cypher statement, wires up its
 * relationships to existing Topic/Skill/Course/Instructor nodes.
 *
 * TRANSACTION NOTE: this is a single `tx.run(...)` call, and every Cypher
 * query already executes atomically within its own implicit transaction
 * (all writes in the statement commit together or not at all). We don't
 * need an explicit multi-statement transaction wrapper here because we
 * are not issuing multiple *separate* `tx.run` calls that need to succeed
 * or fail as a unit — one Cypher statement already gives us that
 * guarantee. Explicit `session.executeWrite(tx => { multiple tx.run() })`
 * transactions are reserved (see recommendation.repository.js note) for
 * cases that genuinely need multiple round trips to stay atomic.
 */
export async function createTutorial({
  title,
  description,
  contentUrl,
  difficulty,
  duration,
  topicIds = [],
  skillIds = [],
  courseId,
  instructorId,
}) {
  const id = randomUUID();
  const now = new Date().toISOString();

  return withSession('WRITE', async (session) => {
    const result = await session.executeWrite((tx) =>
      tx.run(
        `
        CREATE (t:Tutorial {
          id: $id,
          title: $title,
          description: $description,
          contentUrl: $contentUrl,
          difficulty: $difficulty,
          duration: $duration,
          createdAt: $now
        })

        WITH t
        UNWIND (CASE WHEN size($topicIds) = 0 THEN [null] ELSE $topicIds END) AS topicId
        OPTIONAL MATCH (topic:Topic {id: topicId})
        FOREACH (_ IN CASE WHEN topic IS NOT NULL THEN [1] ELSE [] END |
          MERGE (t)-[:ABOUT]->(topic)
        )

        WITH t
        UNWIND (CASE WHEN size($skillIds) = 0 THEN [null] ELSE $skillIds END) AS skillId
        OPTIONAL MATCH (skill:Skill {id: skillId})
        FOREACH (_ IN CASE WHEN skill IS NOT NULL THEN [1] ELSE [] END |
          MERGE (t)-[:TEACHES]->(skill)
        )

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

        RETURN t
        `,
        {
          id,
          title,
          description,
          contentUrl: contentUrl ?? null,
          difficulty,
          duration,
          now,
          topicIds,
          skillIds,
          courseId: courseId ?? null,
          instructorId: instructorId ?? null,
        }
      )
    );
    return toPlainObject(result.records[0].get('t').properties);
  });
}

export async function findById(id, userId = null) {
  return withSession('READ', async (session) => {
    const result = await session.executeRead((tx) =>
      tx.run(
        `
        MATCH (t:Tutorial {id: $id})
        OPTIONAL MATCH (t)-[:ABOUT]->(topic:Topic)
        OPTIONAL MATCH (t)-[:TEACHES]->(skill:Skill)
        OPTIONAL MATCH (t)-[:TAUGHT_BY]->(instructor:Instructor)
        OPTIONAL MATCH (course:Course)-[:CONTAINS]->(t)

        // userId is null for anonymous requests (see optionalAuth) — in
        // that case this simply never matches, so all three flags below
        // correctly come back false rather than needing separate branching.
        OPTIONAL MATCH (currentUser:User {id: $userId})
        OPTIONAL MATCH (currentUser)-[viewedRel:VIEWED]->(t)
        OPTIONAL MATCH (currentUser)-[likedRel:LIKED]->(t)
        OPTIONAL MATCH (currentUser)-[completedRel:COMPLETED]->(t)

        RETURN t,
               collect(DISTINCT topic {.id, .name, .slug}) AS topics,
               collect(DISTINCT skill {.id, .name, .slug}) AS skills,
               instructor {.id, .name} AS instructor,
               course {.id, .title} AS course,
               count(DISTINCT viewedRel) > 0 AS userHasViewed,
               count(DISTINCT likedRel) > 0 AS userHasLiked,
               count(DISTINCT completedRel) > 0 AS userHasCompleted
        `,
        { id, userId }
      )
    );
    if (result.records.length === 0) return null;
    const record = result.records[0];
    return {
      ...toPlainObject(record.get('t').properties),
      topics: toPlainValue(record.get('topics')).filter((t) => t.id),
      skills: toPlainValue(record.get('skills')).filter((s) => s.id),
      instructor: record.get('instructor')?.id ? toPlainValue(record.get('instructor')) : null,
      course: record.get('course')?.id ? toPlainValue(record.get('course')) : null,
      userHasViewed: record.get('userHasViewed'),
      userHasLiked: record.get('userHasLiked'),
      userHasCompleted: record.get('userHasCompleted'),
    };
  });
}

export async function list({ difficulty, limit, offset }) {
  return withSession('READ', async (session) => {
    const result = await session.executeRead((tx) =>
      tx.run(
        `
        MATCH (t:Tutorial)
        WHERE $difficulty IS NULL OR t.difficulty = $difficulty
        RETURN t
        ORDER BY t.createdAt DESC
        SKIP $offset
        LIMIT $limit
        `,
        { difficulty: difficulty ?? null, limit, offset }
      )
    );
    return result.records.map((r) => toPlainObject(r.get('t').properties));
  });
}

export async function updateTutorial(id, updates) {
  const setFragments = Object.keys(updates)
    .map((key) => `t.${key} = $${key}`)
    .join(', ');

  return withSession('WRITE', async (session) => {
    const result = await session.executeWrite((tx) =>
      tx.run(
        `
        MATCH (t:Tutorial {id: $id})
        SET ${setFragments}, t.updatedAt = $updatedAt
        RETURN t
        `,
        { id, ...updates, updatedAt: new Date().toISOString() }
      )
    );
    if (result.records.length === 0) return null;
    return toPlainObject(result.records[0].get('t').properties);
  });
}

export async function deleteTutorial(id) {
  return withSession('WRITE', async (session) => {
    const result = await session.executeWrite((tx) =>
      tx.run(
        `
        MATCH (t:Tutorial {id: $id})
        DETACH DELETE t
        RETURN count(t) AS deletedCount
        `,
        { id }
      )
    );
    return toPlainValue(result.records[0].get('deletedCount')) > 0;
  });
}
