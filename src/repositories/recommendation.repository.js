import neo4j from 'neo4j-driver';
import { withSession } from '../database/session.js';
import { toPlainObject, toPlainValue } from '../utils/neo4jHelpers.js';

/**
 * SCORING MODEL (see README "Recommendation algorithm" for the full
 * write-up). Each traversal path that connects the user to a candidate
 * tutorial contributes points; a candidate reachable via several paths
 * accumulates the sum of all of them. A small popularity term breaks
 * ties and helps surface generally well-engaged content.
 *
 *   liked tutorial      → shared topic  → candidate   : +5
 *   completed tutorial  → shared skill  → candidate   : +4
 *   liked tutorial      → related topic → candidate   : +3
 *   completed tutorial  → related skill → candidate   : +2
 *   viewed tutorial     → shared topic  → candidate   : +1
 *   + (global engagement count on candidate) * 0.1     : popularity nudge
 *
 * This is a single Cypher statement (one implicit transaction, one round
 * trip) rather than N separate queries assembled in application code —
 * that keeps the traversal + aggregation + ranking work inside the graph
 * engine, which is what it's optimized for, instead of pulling large
 * intermediate result sets into Node.js to sum/sort by hand.
 */
const RECOMMENDATION_QUERY = `
MATCH (u:User {id: $userId})
OPTIONAL MATCH (u)-[:VIEWED|LIKED|COMPLETED]->(consumed:Tutorial)
WITH u, collect(DISTINCT consumed.id) AS consumedIds

CALL {
  WITH u, consumedIds
  MATCH (u)-[:LIKED]->(:Tutorial)-[:ABOUT]->(topic:Topic)<-[:ABOUT]-(candidate:Tutorial)
  WHERE NOT candidate.id IN consumedIds
  RETURN candidate, 5 AS score, 'liked_topic_match' AS reason

  UNION ALL
  WITH u, consumedIds
  MATCH (u)-[:COMPLETED]->(:Tutorial)-[:TEACHES]->(skill:Skill)<-[:TEACHES]-(candidate:Tutorial)
  WHERE NOT candidate.id IN consumedIds
  RETURN candidate, 4 AS score, 'completed_skill_match' AS reason

  UNION ALL
  WITH u, consumedIds
  MATCH (u)-[:LIKED]->(:Tutorial)-[:ABOUT]->(:Topic)-[:RELATED_TO]->(:Topic)<-[:ABOUT]-(candidate:Tutorial)
  WHERE NOT candidate.id IN consumedIds
  RETURN candidate, 3 AS score, 'related_topic' AS reason

  UNION ALL
  WITH u, consumedIds
  MATCH (u)-[:COMPLETED]->(:Tutorial)-[:TEACHES]->(:Skill)-[:RELATED_TO]->(:Skill)<-[:TEACHES]-(candidate:Tutorial)
  WHERE NOT candidate.id IN consumedIds
  RETURN candidate, 2 AS score, 'related_skill' AS reason

  UNION ALL
  WITH u, consumedIds
  MATCH (u)-[:VIEWED]->(:Tutorial)-[:ABOUT]->(topic:Topic)<-[:ABOUT]-(candidate:Tutorial)
  WHERE NOT candidate.id IN consumedIds
  RETURN candidate, 1 AS score, 'viewed_topic_match' AS reason
}

WITH candidate, sum(score) AS traversalScore, collect(DISTINCT reason) AS reasons
OPTIONAL MATCH (:User)-[engagement:VIEWED|LIKED|COMPLETED]->(candidate)
WITH candidate, traversalScore, reasons, count(engagement) AS engagementCount
RETURN candidate,
       traversalScore + (toFloat(engagementCount) * 0.1) AS score,
       reasons,
       engagementCount
ORDER BY score DESC
LIMIT $limit
`;

/**
 * Fallback for brand-new users (or whenever traversal doesn't produce
 * enough candidates): most-engaged-then-most-recent tutorials, excluding
 * anything the user has already consumed.
 */
const FALLBACK_QUERY = `
MATCH (u:User {id: $userId})
OPTIONAL MATCH (u)-[:VIEWED|LIKED|COMPLETED]->(consumed:Tutorial)
WITH collect(DISTINCT consumed.id) AS consumedIds

MATCH (candidate:Tutorial)
WHERE NOT candidate.id IN consumedIds
OPTIONAL MATCH (:User)-[engagement:VIEWED|LIKED|COMPLETED]->(candidate)
WITH candidate, count(engagement) AS engagementCount
RETURN candidate, engagementCount
ORDER BY engagementCount DESC, candidate.createdAt DESC
LIMIT $limit
`;

function mapRecommendationRecords(records, isFallback) {
  return records.map((record) => {
    const tutorial = toPlainObject(record.get('candidate').properties);
    const engagementCount = toPlainValue(record.get('engagementCount'));
    if (isFallback) {
      return {
        tutorial,
        score: null,
        reasons: ['popular_or_recent_fallback'],
        engagementCount,
      };
    }
    return {
      tutorial,
      score: toPlainValue(record.get('score')),
      reasons: toPlainValue(record.get('reasons')),
      engagementCount,
    };
  });
}

/**
 * Returns { recommendations, usedFallback }.
 * Falls back to popularity/recency when graph traversal yields nothing
 * (typical for a brand-new user with no interaction history) — see
 * README "Recommendation fallback" section.
 */
export async function getRecommendations(userId, limit) {
  return withSession('READ', async (session) => {
    const primary = await session.executeRead((tx) =>
      tx.run(RECOMMENDATION_QUERY, { userId, limit: neo4jInt(limit) })
    );

    if (primary.records.length > 0) {
      return {
        recommendations: mapRecommendationRecords(primary.records, false),
        usedFallback: false,
      };
    }

    const fallback = await session.executeRead((tx) =>
      tx.run(FALLBACK_QUERY, { userId, limit: neo4jInt(limit) })
    );

    return {
      recommendations: mapRecommendationRecords(fallback.records, true),
      usedFallback: true,
    };
  });
}

// Cypher LIMIT expects an integer; the JS driver is strict about this
// when disableLosslessIntegers is false, so we convert explicitly.
function neo4jInt(n) {
  return neo4j.int(n);
}
