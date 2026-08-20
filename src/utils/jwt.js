import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * Signs an access token. Payload always carries `sub` = userId, per spec.
 */
export function signAccessToken(userId) {
  return jwt.sign({ sub: userId }, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn,
  });
}

/**
 * Verifies a token and returns its decoded payload.
 * Throws (jsonwebtoken's own errors: TokenExpiredError, JsonWebTokenError)
 * on invalid/expired tokens — callers (auth middleware) handle that.
 */
export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.accessSecret);
}
