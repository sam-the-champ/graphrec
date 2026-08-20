import * as userRepository from '../repositories/user.repository.js';
import { ok, ApiError } from '../utils/response.js';

/**
 * GET /api/users/me — deliberately a thin alias over the same data as
 * GET /api/auth/me. Kept separate because "my profile" naturally lives
 * under /users, while "who am I / is my token valid" lives under /auth.
 * We intentionally do NOT expose GET /api/users/:id for arbitrary users
 * in this version — there's no product requirement for public profiles
 * yet, and it's easy to add later (see README) once that's decided.
 */
export async function getCurrentUser(req, res, next) {
  try {
    const user = await userRepository.findById(req.user.id);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return ok(res, { user });
  } catch (err) {
    return next(err);
  }
}
