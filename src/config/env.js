import 'dotenv/config';

/**
 * Central environment configuration.
 *
 * Fails fast at startup if a required variable is missing, rather than
 * letting the app boot into a broken state (e.g. a driver that will
 * throw on the first query instead of on startup).
 */

const REQUIRED_VARS = [
  'COGNODB_URI',
  'COGNODB_USERNAME',
  'COGNODB_PASSWORD',
  'JWT_ACCESS_SECRET',
];

function assertRequiredEnv() {
  const missing = REQUIRED_VARS.filter((key) => {
    const value = process.env[key];
    return value === undefined || value === null || value.trim() === '';
  });

  if (missing.length > 0) {
    // eslint-disable-next-line no-console
    console.error(
      `\n[FATAL] Missing required environment variable(s): ${missing.join(', ')}\n` +
        'Copy .env.example to .env and fill these in before starting the server.\n'
    );
    process.exit(1);
  }
}

assertRequiredEnv();

export const env = {
  port: Number.parseInt(process.env.PORT ?? '5000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction: process.env.NODE_ENV === 'production',

  cognodb: {
    uri: process.env.COGNODB_URI,
    username: process.env.COGNODB_USERNAME,
    password: process.env.COGNODB_PASSWORD,
    // Empty string / undefined means "use the server's default database".
    database: process.env.COGNODB_DATABASE || undefined,
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '1h',
  },

  cors: {
    origin: process.env.CORS_ORIGIN ?? '*',
  },
};
