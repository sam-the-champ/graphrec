import { ApiError } from '../utils/response.js';

/**
 * Wraps a Zod schema that validates { body, params, query } together.
 * On success, replaces req.body/req.params/req.query with the *parsed*
 * (and possibly coerced/defaulted) values so downstream code can trust
 * their shape and types.
 */
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));
      const error = ApiError.badRequest('Validation failed', 'VALIDATION_ERROR');
      error.details = details;
      return next(error);
    }

    if (result.data.body !== undefined) req.body = result.data.body;
    if (result.data.params !== undefined) req.params = result.data.params;
    if (result.data.query !== undefined) req.query = result.data.query;

    return next();
  };
}
