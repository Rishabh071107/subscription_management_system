import { Router } from 'express';
import * as QuotationsController from './quotations.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

router.use(authenticate);

// List and get details
router.get('/', QuotationsController.getQuotations);
router.get('/:id', QuotationsController.getQuotationById);

// Create quotation: Admin, Staff, or Customer requesting quote
router.post('/', QuotationsController.createQuotation);

// Update quotation
router.put('/:id', authorize('ADMIN', 'STAFF'), QuotationsController.updateQuotation);

// Update status
router.patch('/:id/status', authorize('ADMIN', 'STAFF'), QuotationsController.updateQuotationStatus);

// Convert to subscription
router.post('/:id/convert', authorize('ADMIN', 'STAFF'), QuotationsController.convertToSubscription);

export default router;
