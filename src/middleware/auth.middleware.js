import { verifyAccessToken } from '../utils/jwt.js';
import { ApiError } from '../utils/response.js';


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

/**
 * For routes that are public but want to know who's asking, if anyone.
 * Unlike requireAuth, a missing/invalid/expired token is NOT an error
 * here — it just means req.user stays unset (anonymous). Used on
 * GET /api/tutorials/:id so it can report the CURRENT user's
 * liked/viewed/completed state on that tutorial when they're logged in,
 * while still working normally for logged-out visitors.
 */
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
