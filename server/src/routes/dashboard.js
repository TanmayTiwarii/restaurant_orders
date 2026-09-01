import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import * as dashboardService from '../services/dashboardService.js';

const router = Router();

// GET /api/dashboard/stats
router.get('/stats', authenticate, async (_req, res, next) => {
  try {
    const stats = await dashboardService.getStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/status-breakdown
router.get('/status-breakdown', authenticate, async (_req, res, next) => {
  try {
    const breakdown = await dashboardService.getStatusBreakdown();
    res.json(breakdown);
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/waiter-breakdown
router.get('/waiter-breakdown', authenticate, async (_req, res, next) => {
  try {
    const breakdown = await dashboardService.getWaiterBreakdown();
    res.json(breakdown);
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/daily-served
router.get('/daily-served', authenticate, async (req, res, next) => {
  try {
    const days = parseInt(req.query.days || '14', 10);
    const data = await dashboardService.getDailyServed(days);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
