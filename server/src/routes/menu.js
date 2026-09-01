import { Router } from 'express';
import { validationResult } from 'express-validator';
import authenticate from '../middleware/auth.js';
import roleGuard from '../middleware/roleGuard.js';
import * as menuService from '../services/menuService.js';
import { menuItemRules, menuItemUpdateRules, uuidParam } from '../utils/validators.js';

const router = Router();

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
}

// GET /api/menu — list menu items (any authenticated user)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const includeArchived = req.query.includeArchived === 'true';
    const items = await menuService.listMenuItems({ includeArchived });
    res.json(items);
  } catch (err) {
    next(err);
  }
});

// GET /api/menu/:id
router.get('/:id', authenticate, uuidParam(), validate, async (req, res, next) => {
  try {
    const item = await menuService.getMenuItem(req.params.id);
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// POST /api/menu — create (manager only)
router.post(
  '/',
  authenticate,
  roleGuard('manager'),
  menuItemRules,
  validate,
  async (req, res, next) => {
    try {
      const item = await menuService.createMenuItem(req.body, req.user.id);
      res.status(201).json(item);
    } catch (err) {
      next(err);
    }
  },
);

// PATCH /api/menu/:id — update (manager only)
router.patch(
  '/:id',
  authenticate,
  roleGuard('manager'),
  uuidParam(),
  menuItemUpdateRules,
  validate,
  async (req, res, next) => {
    try {
      const item = await menuService.updateMenuItem(req.params.id, req.body);
      res.json(item);
    } catch (err) {
      next(err);
    }
  },
);

// PATCH /api/menu/:id/archive — archive / restore (manager only)
router.patch(
  '/:id/archive',
  authenticate,
  roleGuard('manager'),
  uuidParam(),
  validate,
  async (req, res, next) => {
    try {
      const archived = req.body.archived !== false;
      const item = await menuService.archiveMenuItem(req.params.id, archived);
      res.json(item);
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/menu/bulk — bulk update (manager only)
router.post(
  '/bulk',
  authenticate,
  roleGuard('manager'),
  async (req, res, next) => {
    try {
      const { item_ids, changes } = req.body;
      if (!Array.isArray(item_ids) || item_ids.length === 0) {
        return res.status(400).json({ error: 'item_ids must be a non-empty array' });
      }
      const result = await menuService.bulkUpdateMenuItems(item_ids, changes);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
