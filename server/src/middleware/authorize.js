import { errorResponse } from '../utils/response.js';

/**
 * Role-Based Access Control (RBAC) Middleware
 * @param  {...string} allowedRoles - List of roles permitted (e.g. 'ADMIN', 'STAFF', 'CUSTOMER')
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 401, 'Unauthorized: User not authenticated');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(
        res,
        403,
        `Forbidden: Role '${req.user.role}' does not have sufficient permission to perform this action`
      );
    }

    next();
  };
};
