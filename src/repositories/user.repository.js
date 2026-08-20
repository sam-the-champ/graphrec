import { randomUUID } from 'node:crypto';
import { withSession } from '../database/session.js';
import { toPlainObject } from '../utils/neo4jHelpers.js';

/**
 * Never returns passwordHash to callers outside findByEmailWithPassword
 * (which is only used internally by the login flow to compare hashes).
 */
function toPublicUser(props) {
  if (!props) return null;
  const { passwordHash, ...rest } = toPlainObject(props);
  void passwordHash;
  return rest;
}

export async function findByEmail(email) {
  return withSession('READ', async (session) => {
    const result = await session.executeRead((tx) =>
      tx.run(`MATCH (u:User {email: $email}) RETURN u`, { email })
    );
    if (result.records.length === 0) return null;
    return toPublicUser(result.records[0].get('u').properties);
  });
}

/**
 * Only used by the login controller — includes passwordHash so bcrypt
 * can compare it. Never expose this function's return value directly.
 */
export async function findByEmailWithPassword(email) {
  return withSession('READ', async (session) => {
    const result = await session.executeRead((tx) =>
      tx.run(`MATCH (u:User {email: $email}) RETURN u`, { email })
    );
    if (result.records.length === 0) return null;
    return toPlainObject(result.records[0].get('u').properties);
  });
}

export async function findById(id) {
  return withSession('READ', async (session) => {
    const result = await session.executeRead((tx) =>
      tx.run(`MATCH (u:User {id: $id}) RETURN u`, { id })
    );
    if (result.records.length === 0) return null;
    return toPublicUser(result.records[0].get('u').properties);
  });
}

export async function createUser({ name, email, passwordHash }) {
  const now = new Date().toISOString();
  const id = randomUUID();

  return withSession('WRITE', async (session) => {
    const result = await session.executeWrite((tx) =>
      tx.run(
        `
        CREATE (u:User {
          id: $id,
          name: $name,
          email: $email,
          passwordHash: $passwordHash,
          createdAt: $now,
          updatedAt: $now
        })
        RETURN u
        `,
        { id, name, email, passwordHash, now }
      )
    );
    return toPublicUser(result.records[0].get('u').properties);
  });
}
