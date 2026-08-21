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
    // --------------------------------------------------
    // 1. Get the tutorial itself
    // --------------------------------------------------
    const tutorialResult = await session.executeRead((tx) =>
      tx.run(
        `
        MATCH (t:Tutorial {id: $id})

        OPTIONAL MATCH (t)-[:ABOUT]->(topic:Topic)
        OPTIONAL MATCH (t)-[:TEACHES]->(skill:Skill)
        OPTIONAL MATCH (t)-[:TAUGHT_BY]->(instructor:Instructor)
        OPTIONAL MATCH (course:Course)-[:CONTAINS]->(t)

        RETURN t,
               collect(DISTINCT topic {.id, .name, .slug}) AS topics,
               collect(DISTINCT skill {.id, .name, .slug}) AS skills,
               instructor {.id, .name} AS instructor,
               course {.id, .title} AS course
        `,
        { id }
      )
    );

    if (tutorialResult.records.length === 0) {
      return null;
    }

    const record = tutorialResult.records[0];
    const tutorialNode = record.get('t');

    if (!tutorialNode) {
      return null;
    }

    // --------------------------------------------------
    // 2. Build the tutorial response
    // --------------------------------------------------
    const tutorial = {
      ...toPlainObject(tutorialNode.properties),

      topics: toPlainValue(record.get('topics')).filter(
        (topic) => topic?.id
      ),

      skills: toPlainValue(record.get('skills')).filter(
        (skill) => skill?.id
      ),

      instructor: record.get('instructor')?.id
        ? toPlainValue(record.get('instructor'))
        : null,

      course: record.get('course')?.id
        ? toPlainValue(record.get('course'))
        : null,

      // Anonymous users start with no interaction state.
      userHasViewed: false,
      userHasLiked: false,
      userHasCompleted: false,
    };

    // --------------------------------------------------
    // 3. Anonymous user?
    // --------------------------------------------------
    if (!userId) {
      return tutorial;
    }

    // --------------------------------------------------
    // 4. Get ALL interactions belonging to THIS user
    // --------------------------------------------------
    const interactionResult = await session.executeRead((tx) =>
      tx.run(
        `
        MATCH (user:User {id: $userId})

        OPTIONAL MATCH (user)-[:VIEWED]->(viewedTutorial:Tutorial)
        OPTIONAL MATCH (user)-[:LIKED]->(likedTutorial:Tutorial)
        OPTIONAL MATCH (user)-[:COMPLETED]->(completedTutorial:Tutorial)

        RETURN
          collect(DISTINCT viewedTutorial.id) AS viewedTutorialIds,
          collect(DISTINCT likedTutorial.id) AS likedTutorialIds,
          collect(DISTINCT completedTutorial.id) AS completedTutorialIds
        `,
        {
          userId,
        }
      )
    );

    const interactionRecord = interactionResult.records[0];

    if (!interactionRecord) {
      return tutorial;
    }

    const viewedTutorialIds = toPlainValue(
      interactionRecord.get('viewedTutorialIds')
    ).filter(Boolean);

    const likedTutorialIds = toPlainValue(
      interactionRecord.get('likedTutorialIds')
    ).filter(Boolean);

    const completedTutorialIds = toPlainValue(
      interactionRecord.get('completedTutorialIds')
    ).filter(Boolean);

    // --------------------------------------------------
    // 5. Compare IDs in JavaScript
    // --------------------------------------------------
    tutorial.userHasViewed = viewedTutorialIds.includes(id);
    tutorial.userHasLiked = likedTutorialIds.includes(id);
    tutorial.userHasCompleted = completedTutorialIds.includes(id);

    return tutorial;
  });
}
export async function debugInteraction(userId, tutorialId) {
  return withSession('READ', async (session) => {
    const result = await session.executeRead((tx) =>
      tx.run(
        `
        MATCH (u:User {id: $userId})
        MATCH (t:Tutorial {id: $tutorialId})

        OPTIONAL MATCH (u)-[viewed:VIEWED]->(t)
        OPTIONAL MATCH (u)-[liked:LIKED]->(t)
        OPTIONAL MATCH (u)-[completed:COMPLETED]->(t)

        RETURN
          u.id AS userId,
          t.id AS tutorialId,

          viewed IS NOT NULL AS viewed,
          liked IS NOT NULL AS liked,
          completed IS NOT NULL AS completed
        `,
        {
          userId,
          tutorialId,
        }
      )
    );

    const record = result.records[0];

    return {
      userId: record.get('userId'),
      tutorialId: record.get('tutorialId'),
      viewed: record.get('viewed'),
      liked: record.get('liked'),
      completed: record.get('completed'),
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
        {
          difficulty: difficulty ?? null,
          limit,
          offset,
        }
      )
    );

    return result.records.map((record) => {
      const tutorial = record.get('t');

      if (!tutorial) return null;

      return toPlainObject(tutorial.properties);
    }).filter(Boolean);
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
