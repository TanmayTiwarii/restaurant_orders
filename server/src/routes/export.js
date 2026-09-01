import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import roleGuard from '../middleware/roleGuard.js';
import * as exportService from '../services/exportService.js';

const router = Router();

// GET /api/export/orders?date=YYYY-MM-DD — CSV export of a day's orders
router.get('/orders', authenticate, async (req, res, next) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const csv = await exportService.exportDayOrders(date);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="orders-${date}.csv"`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

export default router;
