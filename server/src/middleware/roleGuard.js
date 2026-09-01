import { ForbiddenError } from '../utils/errors.js';

/**
 * Factory that returns middleware restricting access to the given role(s).
 * @param  {...string} allowedRoles — e.g. 'manager'
 */
export default function roleGuard(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new ForbiddenError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `This action requires one of the following roles: ${allowedRoles.join(', ')}`,
        ),
      );
    }

    next();
  };
}
