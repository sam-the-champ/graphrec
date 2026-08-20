import { Router } from 'express';
import * as tutorialController from '../controllers/tutorial.controller.js';
import * as interactionController from '../controllers/interaction.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createTutorialSchema,
  updateTutorialSchema,
  listTutorialsSchema,
  tutorialIdParamSchema,
} from '../validators/tutorial.validator.js';
import { interactionParamSchema } from '../validators/interaction.validator.js';

const router = Router();

// Tutorial creation requires auth so we know who authored it in principle;
// this project doesn't track authorship on the Tutorial node itself, but
// keeping writes behind auth avoids an open write API to the public.
router.post('/', requireAuth, validate(createTutorialSchema), tutorialController.createTutorial);
router.get('/', validate(listTutorialsSchema), tutorialController.listTutorials);
router.get('/:id', validate(tutorialIdParamSchema), tutorialController.getTutorial);
router.patch(
  '/:id',
  requireAuth,
  validate(updateTutorialSchema),
  tutorialController.updateTutorial
);
router.delete(
  '/:id',
  requireAuth,
  validate(tutorialIdParamSchema),
  tutorialController.deleteTutorial
);

// Interactions
router.post(
  '/:id/view',
  requireAuth,
  validate(interactionParamSchema),
  interactionController.view
);
router.post(
  '/:id/like',
  requireAuth,
  validate(interactionParamSchema),
  interactionController.like
);
router.post(
  '/:id/complete',
  requireAuth,
  validate(interactionParamSchema),
  interactionController.complete
);

export default router;
