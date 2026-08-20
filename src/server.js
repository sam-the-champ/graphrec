import { createApp } from './app.js';
import { env } from './config/env.js';
import { verifyConnectivity, closeDriver } from './database/driver.js';

async function main() {
  try {
    await verifyConnectivity();
    // eslint-disable-next-line no-console
    console.log('[startup] Connected to CognoDB.');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[startup] Could not connect to CognoDB:', err.message);
    process.exit(1);
  }

  const app = createApp();

  const server = app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`[startup] GraphRec API listening on port ${env.port} (${env.nodeEnv})`);
  });

  let shuttingDown = false;

  async function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;

    // eslint-disable-next-line no-console
    console.log(`\n[shutdown] Received ${signal}, shutting down gracefully...`);

    server.close(async (err) => {
      if (err) {
        // eslint-disable-next-line no-console
        console.error('[shutdown] Error closing HTTP server:', err);
      } else {
        // eslint-disable-next-line no-console
        console.log('[shutdown] HTTP server closed.');
      }

      await closeDriver();
      // eslint-disable-next-line no-console
      console.log('[shutdown] Database driver closed. Bye.');
      process.exit(err ? 1 : 0);
    });

    // Safety net: force-exit if something hangs (e.g. a stuck connection)
    setTimeout(() => {
      // eslint-disable-next-line no-console
      console.error('[shutdown] Forced exit after timeout.');
      process.exit(1);
    }, 10_000).unref();
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main();
