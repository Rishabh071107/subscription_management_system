import { Router } from 'express';
import * as PortalController from './portal.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

// Strict Authentication and Role-Based Access Control
router.use(authenticate);
router.use(authorize('CUSTOMER'));

// Customer Self-Service Dashboard
router.get('/dashboard', PortalController.getDashboard);

// Customer Subscriptions
router.get('/subscriptions', PortalController.getSubscriptions);
router.get('/subscriptions/:id', PortalController.getSubscriptionDetails);

// Customer Invoices
router.get('/invoices', PortalController.getInvoices);
router.get('/invoices/:id', PortalController.getInvoiceDetails);

// Customer Profile
router.get('/profile', PortalController.getProfile);
router.patch('/profile', PortalController.updateProfile);

export default router;

