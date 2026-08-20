import { getDriver } from './driver.js';
import { env } from '../config/env.js';

/**
 * Opens a new session against the shared driver.
 *
 * Sessions are cheap (unlike drivers) — it's correct to open one per
 * repository call and close it when done. Always pair this with a
 * try/finally so the session is released back even if the query throws.
 *
 * @param {'READ'|'WRITE'} mode - routes the query appropriately when
 *   running against a clustered/routed CognoDB deployment.
 */
export function getSession(mode = 'WRITE') {
  const driver = getDriver();
  return driver.session({
    database: env.cognodb.database, // undefined => server default database
    defaultAccessMode: mode,
  });
}

/**
 * Convenience wrapper: runs `fn(session)` inside a session that is
 * guaranteed to be closed afterward, regardless of success or failure.
 *
 * Example:
 *   const user = await withSession('READ', (session) =>
 *     session.executeRead(tx => tx.run(query, params))
 *   );
 */
export async function withSession(mode, fn) {
  const session = getSession(mode);
  try {
    return await fn(session);
  } finally {
    await session.close();
  }
}
