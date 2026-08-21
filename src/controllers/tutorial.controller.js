import * as tutorialRepository from '../repositories/tutorial.repository.js';
import { created, ok, ApiError } from '../utils/response.js';

export async function createTutorial(req, res, next) {
  try {
    const tutorial = await tutorialRepository.createTutorial(req.body);
    return created(res, { tutorial });
  } catch (err) {
    return next(err);
  }
}

export async function listTutorials(req, res, next) {
  try {
    const tutorials = await tutorialRepository.list(req.query);
    return ok(res, { tutorials, count: tutorials.length });
  } catch (err) {
    return next(err);
  }
}

export async function getTutorial(req, res, next) {
  try {
    const tutorial = await tutorialRepository.findById(req.params.id, req.user?.id);
    if (!tutorial) {
      throw ApiError.notFound(`Tutorial ${req.params.id} not found`);
    }
    return ok(res, { tutorial });
  } catch (err) {
    return next(err);
  }
}

export async function updateTutorial(req, res, next) {
  try {
    const tutorial = await tutorialRepository.updateTutorial(req.params.id, req.body);
    if (!tutorial) {
      throw ApiError.notFound(`Tutorial ${req.params.id} not found`);
    }
    return ok(res, { tutorial });
  } catch (err) {
    return next(err);
  }
}

export async function deleteTutorial(req, res, next) {
  try {
    const deleted = await tutorialRepository.deleteTutorial(req.params.id);
    if (!deleted) {
      throw ApiError.notFound(`Tutorial ${req.params.id} not found`);
    }
    return ok(res, { deleted: true });
  } catch (err) {
    return next(err);
  }
}
