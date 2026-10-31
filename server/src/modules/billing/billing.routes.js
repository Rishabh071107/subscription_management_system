import { Router } from 'express';
import * as BillingController from './billing.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

router.use(authenticate);

// Trigger a billing run (Admin only)
router.post('/run', authorize('ADMIN'), BillingController.triggerBillingRun);

// List historical billing execution runs
router.get('/runs', authorize('ADMIN', 'STAFF'), BillingController.getBillingRuns);

// View details and execution diagnostics of a specific billing run
router.get('/runs/:id', authorize('ADMIN', 'STAFF'), BillingController.getBillingRunDetails);

// Retry failed items in a run
router.post('/runs/:id/retry', authorize('ADMIN'), BillingController.retryBillingRun);

export default router;

