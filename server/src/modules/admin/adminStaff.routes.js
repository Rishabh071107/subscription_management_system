import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireAdmin } from '../../middleware/authorize.js';
import * as UsersService from '../users/users.service.js';
import { successResponse } from '../../utils/response.js';

const router = Router();

// All admin staff management routes strictly require authentication and ADMIN role
router.use(authenticate, requireAdmin);

// GET /api/admin/staff - View Staff list & search
router.get('/', async (req, res, next) => {
  try {
    const { page, limit, search, isActive } = req.query;
    const result = await UsersService.listUsers({ page, limit, search, isActive, role: 'STAFF' }, req.user);
    return successResponse(res, 200, 'Staff accounts retrieved successfully', result.users, result.pagination);
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/staff - Create Staff account
router.post('/', async (req, res, next) => {
  try {
    const staff = await UsersService.createStaff({ ...req.body, role: 'STAFF' }, req.user);
    return successResponse(res, 201, 'Staff account created successfully', { staff });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/staff/:id - View Staff details
router.get('/:id', async (req, res, next) => {
  try {
    const staff = await UsersService.getUserDetails(req.params.id, req.user);
    return successResponse(res, 200, 'Staff details retrieved successfully', { staff });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/staff/:id - Update permitted Staff fields
router.patch('/:id', async (req, res, next) => {
  try {
    const updated = await UsersService.updateUser(req.params.id, req.body, req.user);
    return successResponse(res, 200, 'Staff information updated successfully', { staff: updated });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/staff/:id/status - Activate/Deactivate Staff
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const updated = await UsersService.toggleUserStatus(req.params.id, isActive, req.user);
    return successResponse(
      res,
      200,
      `Staff account ${updated.isActive ? 'activated' : 'deactivated'} successfully`,
      { staff: updated }
    );
  } catch (error) {
    next(error);
  }
});

export default router;

