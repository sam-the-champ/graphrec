import { Router } from 'express';
import * as recommendationController from '../controllers/recommendation.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { recommendationQuerySchema } from '../validators/interaction.validator.js';

const router = Router();

router.get(
  '/',
  requireAuth,
  validate(recommendationQuerySchema),
  recommendationController.getRecommendations
);

export default router;
