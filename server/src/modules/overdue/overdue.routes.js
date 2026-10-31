import { Router } from 'express';
import * as OverdueController from './overdue.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

router.use(authenticate);

// Overdue summary
router.get('/summary', OverdueController.getOverdueSummary);

// List overdue invoices
router.get('/invoices', OverdueController.getOverdueInvoices);

// Batch synchronize overdue statuses
router.post('/sync', authorize('ADMIN', 'STAFF'), OverdueController.syncOverdueStatuses);

// Single overdue invoice details
router.get('/invoices/:id', OverdueController.getOverdueInvoiceById);

// Log collection follow-up / reminder note
router.post('/invoices/:id/follow-up', authorize('ADMIN', 'STAFF'), OverdueController.createFollowUpNote);

export default router;

