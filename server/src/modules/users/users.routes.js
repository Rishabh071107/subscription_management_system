import { Router } from 'express';
import * as UsersController from './users.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Listing users: Admin & Staff
router.get('/', authorize('ADMIN', 'STAFF'), UsersController.getUsers);

// Only Admin can create staff accounts
router.post('/staff', authorize('ADMIN'), UsersController.createStaff);

// User details
router.get('/:id', UsersController.getUserById);

// Update user details
router.put('/:id', UsersController.updateUser);

// Activate / Deactivate user (Admin only)
router.patch('/:id/status', authorize('ADMIN'), UsersController.toggleUserStatus);

export default router;
