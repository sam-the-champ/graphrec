import { ApiError } from '../utils/response.js';

export function notFoundMiddleware(req, res, next) {
  next(ApiError.notFound(`No route matches ${req.method} ${req.originalUrl}`));
}
