import * as interactionRepository from '../repositories/interaction.repository.js';
import { ok } from '../utils/response.js';

export async function view(req, res, next) {
  try {
    const interaction = await interactionRepository.recordView(req.user.id, req.params.id);
    return ok(res, { interaction });
  } catch (err) {
    return next(err);
  }
}

export async function like(req, res, next) {
  try {
    const interaction = await interactionRepository.recordLike(req.user.id, req.params.id);
    return ok(res, { interaction });
  } catch (err) {
    return next(err);
  }
}

export async function complete(req, res, next) {
  try {
    const interaction = await interactionRepository.recordCompletion(req.user.id, req.params.id);
    return ok(res, { interaction });
  } catch (err) {
    return next(err);
  }
}
