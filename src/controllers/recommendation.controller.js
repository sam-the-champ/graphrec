import * as recommendationRepository from '../repositories/recommendation.repository.js';
import { ok } from '../utils/response.js';

export async function getRecommendations(req, res, next) {
  try {
    const { limit } = req.query;
    const { recommendations, usedFallback } = await recommendationRepository.getRecommendations(
      req.user.id,
      limit
    );
    return ok(res, {
      recommendations,
      count: recommendations.length,
      usedFallback,
    });
  } catch (err) {
    return next(err);
  }
}
