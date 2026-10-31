import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import * as UsersService from '../users/users.service.js';
import { successResponse } from '../../utils/response.js';

const router = Router();

router.use(authenticate);

// GET /api/profile - View own profile
router.get('/', async (req, res, next) => {
  try {
    const user = await UsersService.getUserDetails(req.user.id, req.user);
    return successResponse(res, 200, 'Profile retrieved successfully', { user });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/profile - Update own permitted profile fields
router.patch('/', async (req, res, next) => {
  try {
    const updated = await UsersService.updateUser(req.user.id, req.body, req.user);
    return successResponse(res, 200, 'Profile updated successfully', { user: updated });
  } catch (error) {
    next(error);
  }
});

export default router;

