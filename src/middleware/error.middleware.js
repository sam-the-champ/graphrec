import { ApiError } from '../utils/response.js';
import { env } from '../config/env.js';

/**
 * Maps known Neo4j driver error codes to safe, appropriately-classed
 * ApiErrors, so a raw database error never leaks to the client.
 */
function classifyDatabaseError(err) {
  // neo4j-driver errors expose a `.code` like
  // 'Neo.ClientError.Schema.ConstraintValidationFailed'
  const code = err.code || '';

  if (code.includes('ConstraintValidationFailed')) {
    return ApiError.conflict('A resource with these unique fields already exists');
  }

  if (code.startsWith('Neo.ClientError.Security')) {
    return new ApiError(500, 'Database authentication/authorization error');
  }

  if (code.startsWith('ServiceUnavailable') || err.name === 'ServiceUnavailable') {
    return new ApiError(503, 'Database is temporarily unavailable');
  }

  return null;
}

// eslint-disable-next-line no-unused-vars
export function errorMiddleware(err, req, res, next) {
  let apiError = err;

  if (!(err instanceof ApiError)) {
    apiError = classifyDatabaseError(err) ?? new ApiError(500, 'Internal server error');

    // Log the *real* underlying error server-side for diagnosis, but
    // never forward its details (stack traces, driver internals) to
    // the client, especially in production.
    // eslint-disable-next-line no-console
    console.error('[unhandled error]', err);
  }

  const body = {
    success: false,
    error: {
      message: apiError.message,
      code: apiError.code,
    },
  };

  if (apiError.details) {
    body.error.details = apiError.details;
  }

  if (!env.isProduction && !(err instanceof ApiError)) {
    body.error.stack = err.stack;
  }

  res.status(apiError.status ?? 500).json(body);
}
