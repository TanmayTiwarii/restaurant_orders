import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import * as alertService from '../services/alertService.js';

const router = Router();

// GET /api/alerts — list slow orders
router.get('/', authenticate, async (_req, res, next) => {
  try {
    const orders = await alertService.getSlowOrders();
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

// GET /api/alerts/count — badge count
router.get('/count', authenticate, async (_req, res, next) => {
  try {
    const count = await alertService.getAlertCount();
    res.json({ count });
  } catch (err) {
    next(err);
  }
});

// POST /api/alerts/:orderId/acknowledge
router.post('/:orderId/acknowledge', authenticate, async (req, res, next) => {
  try {
    const result = await alertService.acknowledgeAlert(
      req.params.orderId,
      req.user.id,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
