import { verifyAccessToken } from '../utils/jwt.js';
import { ApiError } from '../utils/response.js';

/**
 * Requires a valid `Authorization: Bearer <token>` header.
 * On success sets `req.user = { id: decoded.sub }`.
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Missing or malformed Authorization header'));
  }

  const token = header.slice('Bearer '.length).trim();

  if (!token) {
    return next(ApiError.unauthorized('Missing bearer token'));
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = { id: decoded.sub };
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Token expired'));
    }
    return next(ApiError.unauthorized('Invalid token'));
  }
}


export function optionalAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return next();
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    return next();
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = { id: decoded.sub };
  } catch {
    // Invalid/expired token on a public route: treat as anonymous
    // rather than rejecting the request.
  }

  return next();
}
