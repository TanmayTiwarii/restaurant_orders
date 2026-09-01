import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../utils/errors.js';

/**
 * Express middleware that verifies the JWT in the Authorization header
 * and attaches the decoded payload to `req.user`.
 */
export default function authenticate(req, _res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing or malformed Authorization header'));
  }

  const token = header.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      name: payload.name,
    };
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
}
