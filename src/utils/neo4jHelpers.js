import neo4j from 'neo4j-driver';

/**
 * PostgreSQL/Prisma concept → Graph equivalent
 * ─────────────────────────────────────────────
 * Prisma returns plain JS objects/numbers straight from the query.
 * The Neo4j driver does NOT: integers come back as `Integer` objects
 * (because Cypher integers are 64-bit and can exceed JS's safe integer
 * range), and Nodes/Relationships come back as driver-specific wrapper
 * objects with `.properties`, `.labels`, `.elementId`, etc.
 *
 * Repositories must always pass raw records through `toPlainObject`
 * (or the more specific helpers below) before returning data to
 * controllers — controllers/clients should never see driver internals.
 */

/**
 * Recursively converts Neo4j driver values (Integer, Node, Relationship,
 * Date/DateTime, arrays, nested objects) into plain JS-friendly values.
 */
export function toPlainValue(value) {
  if (value === null || value === undefined) return value;

  if (neo4j.isInt(value)) {
    // Safe for our domain (counts, scores, timestamps as epoch millis)
    // since none of these realistically exceed Number.MAX_SAFE_INTEGER.
    return value.toNumber();
  }

  if (Array.isArray(value)) {
    return value.map(toPlainValue);
  }

  // Neo4j temporal types (Date, DateTime, Duration, etc.) implement
  // toString() with ISO-8601-ish output, which is what we want in JSON.
  if (
    value &&
    typeof value === 'object' &&
    typeof value.toString === 'function' &&
    (value.constructor?.name === 'DateTime' ||
      value.constructor?.name === 'Date' ||
      value.constructor?.name === 'LocalDateTime')
  ) {
    return value.toString();
  }

  // Node: extract labels + properties
  if (value && typeof value === 'object' && value.labels && value.properties) {
    return toPlainObject(value.properties);
  }

  // Relationship: extract type + properties
  if (value && typeof value === 'object' && value.type && value.properties) {
    return toPlainObject(value.properties);
  }

  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return toPlainObject(value);
  }

  return value;
}

/**
 * Converts an object's own enumerable properties via toPlainValue.
 */
export function toPlainObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = toPlainValue(value);
  }
  return result;
}

/**
 * Extracts and flattens a single named field from every record in a
 * driver result (e.g. records.map(r => r.get('u'))), then converts it.
 */
export function mapRecords(records, fieldName) {
  return records.map((record) => toPlainValue(record.get(fieldName)));
}
