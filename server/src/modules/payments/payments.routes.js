import { Router } from 'express';
import * as PaymentsController from './payments.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

router.use(authenticate);

// List payments (Admin, Staff, or Customer filtered to self)
router.get('/', PaymentsController.getPayments);

// Get payments for a specific invoice (placed before /:id to prevent route shadowing)
router.get('/invoice/:invoiceId', PaymentsController.getPaymentsByInvoiceId);

// Payment details
router.get('/:id', PaymentsController.getPaymentById);

// Record payment (Staff or Admin only)
router.post('/', authorize('ADMIN', 'STAFF'), PaymentsController.createPayment);

export default router;
