import { withSession } from '../database/session.js';
import { toPlainObject } from '../utils/neo4jHelpers.js';
import { ApiError } from '../utils/response.js';

/**
 * Confirms both endpoints of the relationship exist before writing.
 * Cypher's MERGE would otherwise silently do nothing (and report success)
 * if the Tutorial doesn't exist, which would hide a bad tutorialId from
 * the client.
 */
async function assertTutorialExists(tx, tutorialId) {
  const result = await tx.run(`MATCH (t:Tutorial {id: $tutorialId}) RETURN t.id AS id`, {
    tutorialId,
  });
  if (result.records.length === 0) {
    throw ApiError.notFound(`Tutorial ${tutorialId} not found`);
  }
}

/**
 * Records a VIEWED interaction. Uses MERGE so repeated view calls do not
 * create duplicate relationships — instead we track a viewCount and
 * firstViewedAt/lastViewedAt on the single relationship, which is exactly
 * the kind of data that belongs on a relationship rather than duplicated
 * across nodes.
 */
export async function recordView(userId, tutorialId) {
  const now = new Date().toISOString();
  return withSession('WRITE', async (session) => {
    const result = await session.executeWrite(async (tx) => {
      await assertTutorialExists(tx, tutorialId);
      return tx.run(
        `
        MATCH (u:User {id: $userId}), (t:Tutorial {id: $tutorialId})
        MERGE (u)-[r:VIEWED]->(t)
        ON CREATE SET r.viewCount = 1, r.firstViewedAt = $now, r.lastViewedAt = $now
        ON MATCH SET r.viewCount = r.viewCount + 1, r.lastViewedAt = $now
        RETURN r
        `,
        { userId, tutorialId, now }
      );
    });
    return toPlainObject(result.records[0].get('r').properties);
  });
}

export async function recordLike(userId, tutorialId) {
  const now = new Date().toISOString();
  return withSession('WRITE', async (session) => {
    const result = await session.executeWrite(async (tx) => {
      await assertTutorialExists(tx, tutorialId);
      return tx.run(
        `
        MATCH (u:User {id: $userId}), (t:Tutorial {id: $tutorialId})
        MERGE (u)-[r:LIKED]->(t)
        ON CREATE SET r.createdAt = $now
        RETURN r
        `,
        { userId, tutorialId, now }
      );
    });
    return toPlainObject(result.records[0].get('r').properties);
  });
}

export async function recordCompletion(userId, tutorialId) {
  const now = new Date().toISOString();
  return withSession('WRITE', async (session) => {
    const result = await session.executeWrite(async (tx) => {
      await assertTutorialExists(tx, tutorialId);
      return tx.run(
        `
        MATCH (u:User {id: $userId}), (t:Tutorial {id: $tutorialId})
        MERGE (u)-[r:COMPLETED]->(t)
        ON CREATE SET r.completedAt = $now, r.progress = 100
        ON MATCH SET r.progress = 100
        RETURN r
        `,
        { userId, tutorialId, now }
      );
    });
    return toPlainObject(result.records[0].get('r').properties);
  });
}
