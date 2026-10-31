import { Router } from 'express';
import * as DashboardController from './dashboard.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

router.use(authenticate);

// Role-aware dashboard summary (Admin, Staff, Customer all get their tailored metrics)
router.get('/summary', DashboardController.getSummary);

// Reports: Admin & Staff
router.get('/reports/revenue', authorize('ADMIN', 'STAFF'), DashboardController.getRevenueReport);
router.get('/reports/subscriptions', authorize('ADMIN', 'STAFF'), DashboardController.getSubscriptionReport);
router.get('/reports/overdue', authorize('ADMIN', 'STAFF'), DashboardController.getOverdueReport);

export default router;
