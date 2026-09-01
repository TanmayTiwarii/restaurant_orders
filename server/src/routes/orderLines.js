import { Router } from 'express';
import { validationResult } from 'express-validator';
import authenticate from '../middleware/auth.js';
import * as orderLineService from '../services/orderLineService.js';
import { orderLineRules, voidLineRules, uuidParam } from '../utils/validators.js';

const router = Router();

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
}

// GET /api/orders/:orderId/lines
router.get(
  '/:orderId/lines',
  authenticate,
  async (req, res, next) => {
    try {
      const lines = await orderLineService.getLines(req.params.orderId);
      res.json(lines);
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/orders/:orderId/lines — add a line
router.post(
  '/:orderId/lines',
  authenticate,
  orderLineRules,
  validate,
  async (req, res, next) => {
    try {
      const line = await orderLineService.addLine(
        req.params.orderId,
        req.body,
        req.user,
      );
      res.status(201).json(line);
    } catch (err) {
      next(err);
    }
  },
);

// PATCH /api/orders/:orderId/lines/:lineId/void — void a line
router.patch(
  '/:orderId/lines/:lineId/void',
  authenticate,
  voidLineRules,
  validate,
  async (req, res, next) => {
    try {
      const result = await orderLineService.voidLine(
        req.params.lineId,
        req.body.reason,
        req.user,
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
