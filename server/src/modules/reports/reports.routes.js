import { Router } from 'express';
import * as ReportsController from './reports.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

router.use(authenticate);

// Financial Reports (Admin & Staff)
router.get('/subscriptions', authorize('ADMIN', 'STAFF'), ReportsController.getSubscriptionReport);
router.get('/invoices', authorize('ADMIN', 'STAFF'), ReportsController.getInvoiceReport);
router.get('/payments', authorize('ADMIN', 'STAFF'), ReportsController.getPaymentReport);
router.get('/revenue', authorize('ADMIN', 'STAFF'), ReportsController.getRevenueReport);

export default router;
