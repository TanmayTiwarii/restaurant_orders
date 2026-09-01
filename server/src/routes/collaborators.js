import { Router } from 'express';
import { validationResult } from 'express-validator';
import authenticate from '../middleware/auth.js';
import * as collaboratorService from '../services/collaboratorService.js';
import { uuidParam } from '../utils/validators.js';
import { body } from 'express-validator';

const router = Router();

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
}

// GET /api/orders/:orderId/collaborators
router.get(
  '/:orderId/collaborators',
  authenticate,
  async (req, res, next) => {
    try {
      const collaborators = await collaboratorService.getCollaborators(req.params.orderId);
      res.json(collaborators);
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/orders/:orderId/collaborators — add collaborator
router.post(
  '/:orderId/collaborators',
  authenticate,
  body('user_id').isUUID().withMessage('Valid user ID required'),
  validate,
  async (req, res, next) => {
    try {
      const result = await collaboratorService.addCollaborator(
        req.params.orderId,
        req.body.user_id,
        req.user.id,
      );
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/orders/:orderId/collaborators/:userId
router.delete(
  '/:orderId/collaborators/:userId',
  authenticate,
  async (req, res, next) => {
    try {
      const result = await collaboratorService.removeCollaborator(
        req.params.orderId,
        req.params.userId,
        req.user.id,
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
