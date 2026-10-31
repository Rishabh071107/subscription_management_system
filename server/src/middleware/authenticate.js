import jwt from 'jsonwebtoken';
import { JWT_CONFIG } from '../config/jwt.js';
import prisma from '../config/db.js';
import { errorResponse } from '../utils/response.js';

/**
 * JWT Authentication Middleware
 * Verifies bearer token, checks database for user status, and sets req.user
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 401, 'Authentication token missing or invalid format');
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_CONFIG.secret);
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        return errorResponse(res, 401, 'Authentication token has expired. Please log in again.');
      }
      return errorResponse(res, 401, 'Invalid authentication token');
    }

    if (!decoded || !decoded.id) {
      return errorResponse(res, 401, 'Malformed token payload');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true
      }
    });

    if (!user) {
      return errorResponse(res, 401, 'User account no longer exists');
    }

    if (!user.isActive) {
      return errorResponse(res, 403, 'Account has been deactivated. Please contact an administrator.');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
