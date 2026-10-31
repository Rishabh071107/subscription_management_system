import jwt from 'jsonwebtoken';
import { JWT_CONFIG } from '../config/jwt.js';
import prisma from '../config/db.js';
import { errorResponse } from '../utils/response.js';

/**
 * Authentication Middleware
 * Checks HTTP-only cookie first, falls back to Bearer header.
 * Verifies token, verifies user active status in database, and sets req.user.
 */
export const authenticate = async (req, res, next) => {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return errorResponse(res, 401, 'Authentication required. Please log in.');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_CONFIG.secret);
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        return errorResponse(res, 401, 'Authentication token has expired. Please log in again.');
      }
      return errorResponse(res, 401, 'Invalid authentication token.');
    }

    if (!decoded || !decoded.id) {
      return errorResponse(res, 401, 'Malformed token payload.');
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
      return errorResponse(res, 401, 'User account no longer exists.');
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
