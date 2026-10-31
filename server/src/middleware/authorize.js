import { errorResponse } from '../utils/response.js';

/**
 * Role-Based Access Control (RBAC) Middleware
 * @param  {...string} allowedRoles - Permitted roles (e.g. 'ADMIN', 'STAFF', 'CUSTOMER')
 */
export const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 401, 'Unauthorized: User not authenticated');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(
        res,
        403,
        `Forbidden: Role '${req.user.role}' is not authorized to perform this action`
      );
    }

    next();
  };
};

// Aliases and dedicated role middlewares
export const authorize = authorizeRole;

export const requireAdmin = authorizeRole('ADMIN');

export const requireInternalUser = authorizeRole('ADMIN', 'STAFF');

export const requireCustomer = authorizeRole('CUSTOMER');
