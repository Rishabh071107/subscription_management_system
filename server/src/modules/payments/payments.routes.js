import { Router } from 'express';
import * as PaymentsController from './payments.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

router.use(authenticate);

// View payment history
router.get('/', PaymentsController.getPayments);
router.get('/:id', PaymentsController.getPaymentById);

// Record payment (Staff or Admin)
router.post('/', authorize('ADMIN', 'STAFF'), PaymentsController.createPayment);

export default router;
