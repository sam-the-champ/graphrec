import neo4j from 'neo4j-driver';
import { env } from '../config/env.js';



let driverInstance = null;

/**
 * Lazily creates (once) and returns the shared driver instance.
 */
export function getDriver() {
  if (!driverInstance) {
    driverInstance = neo4j.driver(
      env.cognodb.uri,
      neo4j.auth.basic(env.cognodb.username, env.cognodb.password),
      {
        // Reasonable defaults for a small-to-medium API service.
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 30_000, // 30s
        disableLosslessIntegers: false, // we handle Neo4j Integers explicitly, see utils/neo4jHelpers.js
      }
    );
  }
  return driverInstance;
}

/**
 * Verifies the driver can actually reach CognoDB. Used by:
 *  - startup (fail fast if credentials/URI are wrong)
 *  - GET /health/db
 */
export async function verifyConnectivity() {
  const driver = getDriver();
  const serverInfo = await driver.getServerInfo();
  return serverInfo;
}

/**
 * Closes the driver and all pooled connections. Must be called during
 * graceful shutdown (SIGINT/SIGTERM) so the process doesn't hang on open
 * sockets.
 */
export async function closeDriver() {
  if (driverInstance) {
    await driverInstance.close();
    driverInstance = null;
  }
}
