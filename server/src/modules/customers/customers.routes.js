import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireInternalUser, requireAdmin } from '../../middleware/authorize.js';
import * as UsersService from '../users/users.service.js';
import { successResponse } from '../../utils/response.js';

const router = Router();

router.use(authenticate, requireInternalUser);

// GET /api/customers - List customers
router.get('/', async (req, res, next) => {
  try {
    const { page, limit, search, isActive } = req.query;
    const result = await UsersService.listUsers({ page, limit, search, isActive, role: 'CUSTOMER' }, req.user);
    return successResponse(res, 200, 'Customers retrieved successfully', result.users, result.pagination);
  } catch (error) {
    next(error);
  }
});

// GET /api/customers/:id - View customer details
router.get('/:id', async (req, res, next) => {
  try {
    const customer = await UsersService.getUserDetails(req.params.id, req.user);
    return successResponse(res, 200, 'Customer details retrieved successfully', { customer });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/customers/:id - Edit permitted customer information
router.patch('/:id', async (req, res, next) => {
  try {
    const updated = await UsersService.updateUser(req.params.id, req.body, req.user);
    return successResponse(res, 200, 'Customer details updated successfully', { customer: updated });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/customers/:id/status - Activate/Deactivate customer (Admin only)
router.patch('/:id/status', requireAdmin, async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const updated = await UsersService.toggleUserStatus(req.params.id, isActive, req.user);
    return successResponse(
      res,
      200,
      `Customer account ${updated.isActive ? 'activated' : 'deactivated'} successfully`,
      { customer: updated }
    );
  } catch (error) {
    next(error);
  }
});

export default router;

