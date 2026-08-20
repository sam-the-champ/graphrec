import bcrypt from 'bcryptjs';
import * as userRepository from '../repositories/user.repository.js';
import { signAccessToken } from '../utils/jwt.js';
import { created, ok, ApiError } from '../utils/response.js';

const BCRYPT_ROUNDS = 12;

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw ApiError.conflict('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await userRepository.createUser({ name, email, passwordHash });

    const token = signAccessToken(user.id);

    return created(res, { user, token });
  } catch (err) {
    return next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await userRepository.findByEmailWithPassword(email);
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const token = signAccessToken(user.id);
    const { passwordHash, ...publicUser } = user;
    void passwordHash;

    return ok(res, { user: publicUser, token });
  } catch (err) {
    return next(err);
  }
}

export async function me(req, res, next) {
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
