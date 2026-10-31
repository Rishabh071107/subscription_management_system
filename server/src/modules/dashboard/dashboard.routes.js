import { Router } from 'express';
import * as DashboardController from './dashboard.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

router.use(authenticate);

// Financial KPI summary (Role-aware: Admin, Staff, Customer)
router.get('/summary', DashboardController.getSummary);

// Reports & Analytics: Admin & Staff
router.get('/revenue', authorize('ADMIN', 'STAFF'), DashboardController.getRevenueReport);
router.get('/subscriptions', authorize('ADMIN', 'STAFF'), DashboardController.getSubscriptionReport);
router.get('/payments', authorize('ADMIN', 'STAFF'), DashboardController.getPaymentsSummary);
router.get('/overdue', authorize('ADMIN', 'STAFF'), DashboardController.getOverdueReport);

// Backward-compatibility aliases for /reports/*
router.get('/reports/revenue', authorize('ADMIN', 'STAFF'), DashboardController.getRevenueReport);
router.get('/reports/subscriptions', authorize('ADMIN', 'STAFF'), DashboardController.getSubscriptionReport);
router.get('/reports/payments', authorize('ADMIN', 'STAFF'), DashboardController.getPaymentsSummary);
router.get('/reports/overdue', authorize('ADMIN', 'STAFF'), DashboardController.getOverdueReport);

export default router;
