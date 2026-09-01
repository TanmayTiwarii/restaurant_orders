import { Router } from 'express';
import { validationResult } from 'express-validator';
import authenticate from '../middleware/auth.js';
import * as orderService from '../services/orderService.js';
import { query } from '../config/db.js';
import { createOrderRules, transitionRules, uuidParam } from '../utils/validators.js';

const router = Router();

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
}

// GET /api/orders — server-side search/filter/sort/paginate
router.get('/', authenticate, async (req, res, next) => {
  try {
    const result = await orderService.findOrders({
      search: req.query.search,
      status: req.query.status,
      waiter_id: req.query.waiter_id,
      date: req.query.date,
      sort: req.query.sort,
      order: req.query.order,
      page: parseInt(req.query.page || '1', 10),
      limit: parseInt(req.query.limit || '20', 10),
      archived: req.query.archived === 'true',
      user: req.user,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/:id
router.get('/:id', authenticate, uuidParam(), validate, async (req, res, next) => {
  try {
    const order = await orderService.getOrder(req.params.id);
    res.json(order);
  } catch (err) {
    next(err);
  }
});

// POST /api/orders — create a new order
router.post('/', authenticate, createOrderRules, validate, async (req, res, next) => {
  try {
    const order = await orderService.createOrder(req.body, req.user);
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/orders/:id/status — transition order status
router.patch(
  '/:id/status',
  authenticate,
  uuidParam(),
  transitionRules,
  validate,
  async (req, res, next) => {
    try {
      const order = await orderService.transitionStatus(
        req.params.id,
        req.body.status,
        req.user,
      );
      res.json(order);
    } catch (err) {
      next(err);
    }
  },
);

// PATCH /api/orders/:id/archive
router.patch('/:id/archive', authenticate, uuidParam(), validate, async (req, res, next) => {
  try {
    const order = await orderService.archiveOrder(req.params.id, req.user);
    res.json(order);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/orders/:id/restore
router.patch('/:id/restore', authenticate, uuidParam(), validate, async (req, res, next) => {
  try {
    const order = await orderService.restoreOrder(req.params.id, req.user);
    res.json(order);
  } catch (err) {
    next(err);
  }
});

// POST /api/orders/:id/notes — add a note
router.post('/:id/notes', authenticate, uuidParam(), validate, async (req, res, next) => {
  try {
    const { note } = req.body;
    if (!note || !note.trim()) {
      return res.status(400).json({ error: 'Note text is required' });
    }
    const result = await orderService.addNote(req.params.id, note.trim(), req.user);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/:id/history — immutable order timeline
router.get('/:id/history', authenticate, uuidParam(), validate, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT oh.*, u.name AS performed_by_name
       FROM order_history oh
       JOIN users u ON u.id = oh.performed_by
       WHERE oh.order_id = $1
       ORDER BY oh.created_at ASC`,
      [req.params.id],
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

export default router;
