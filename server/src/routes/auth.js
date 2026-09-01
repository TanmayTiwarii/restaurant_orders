import { Router } from 'express';
import { validationResult } from 'express-validator';
import * as authService from '../services/authService.js';
import authenticate from '../middleware/auth.js';
import { registerRules, loginRules } from '../utils/validators.js';

const router = Router();

/** Helper — sends first validation error or calls next. */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
}

// POST /api/auth/register
router.post('/register', registerRules, validate, async (req, res, next) => {
  try {
    const { email, password, name, role } = req.body;
    const result = await authService.register({ email, password, name, role });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', loginRules, validate, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/users  (for listing users — collaborator assignment, etc.)
router.get('/users', authenticate, async (_req, res, next) => {
  try {
    const users = await authService.listUsers();
    res.json(users);
  } catch (err) {
    next(err);
  }
});

export default router;
