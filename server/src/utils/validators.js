import { body, param, query } from 'express-validator';

/* ------------------------------------------------------------------ */
/*  Auth                                                               */
/* ------------------------------------------------------------------ */

export const registerRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('role')
    .optional()
    .isIn(['manager', 'waiter'])
    .withMessage('Role must be manager or waiter'),
];

export const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
];

/* ------------------------------------------------------------------ */
/*  Menu items                                                         */
/* ------------------------------------------------------------------ */

export const menuItemRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a non-negative number'),
  body('description').optional().trim(),
  body('available').optional().isBoolean(),
];

export const menuItemUpdateRules = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a non-negative number'),
  body('description').optional().trim(),
  body('available').optional().isBoolean(),
];

/* ------------------------------------------------------------------ */
/*  Orders                                                             */
/* ------------------------------------------------------------------ */

export const createOrderRules = [
  body('table_number')
    .isInt({ min: 1 })
    .withMessage('Table number must be a positive integer'),
];

export const orderLineRules = [
  body('menu_item_id').isUUID().withMessage('Valid menu item ID required'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('special_instructions').optional().trim(),
];

export const voidLineRules = [
  body('reason').trim().notEmpty().withMessage('Void reason is required'),
];

export const transitionRules = [
  body('status')
    .isIn(['placed', 'accepted', 'preparing', 'ready', 'served', 'cancelled'])
    .withMessage('Invalid status'),
];

/* ------------------------------------------------------------------ */
/*  Common param validators                                            */
/* ------------------------------------------------------------------ */

export const uuidParam = (name = 'id') =>
  param(name).isUUID().withMessage(`${name} must be a valid UUID`);
