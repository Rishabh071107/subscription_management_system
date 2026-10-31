import { Router } from 'express';
import * as InvoicesController from './invoices.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

router.use(authenticate);

// List and get details
router.get('/', InvoicesController.getInvoices);
router.get('/:id', InvoicesController.getInvoiceById);

// Render HTML for Print / PDF download
router.get('/:id/print', InvoicesController.renderInvoiceHtml);

// Generate recurring or manual invoice
router.post('/generate', authorize('ADMIN', 'STAFF'), InvoicesController.generateInvoice);

// Automated recurring billing run
router.post('/run-billing-cycle', authorize('ADMIN'), InvoicesController.runBilling);

// Update status
router.patch('/:id/status', authorize('ADMIN', 'STAFF'), InvoicesController.updateInvoiceStatus);

export default router;
