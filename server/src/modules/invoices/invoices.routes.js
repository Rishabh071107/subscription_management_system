import { Router } from 'express';
import * as InvoicesController from './invoices.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

router.use(authenticate);

// List and get details (Customer scoped automatically)
router.get('/', InvoicesController.getInvoices);
router.get('/:id', InvoicesController.getInvoiceById);

// Render HTML for Print / PDF download
router.get('/:id/print', InvoicesController.renderInvoiceHtml);

// Create manual invoice
router.post('/', authorize('ADMIN', 'STAFF'), InvoicesController.createInvoice);

// Generate recurring or manual invoice from subscription
router.post('/generate', authorize('ADMIN', 'STAFF'), InvoicesController.generateInvoice);

// Automated recurring billing run
router.post('/run-billing-cycle', authorize('ADMIN'), InvoicesController.runBilling);

// Status workflows
router.post('/:id/confirm', authorize('ADMIN', 'STAFF'), InvoicesController.confirmInvoice);
router.post('/:id/cancel', authorize('ADMIN', 'STAFF'), InvoicesController.cancelInvoice);
router.post('/:id/send', authorize('ADMIN', 'STAFF'), InvoicesController.sendInvoice);
router.patch('/:id/status', authorize('ADMIN', 'STAFF'), InvoicesController.updateInvoiceStatus);

export default router;
