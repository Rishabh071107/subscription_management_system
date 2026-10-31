import { Router } from 'express';
import * as DiscountsController from './discounts.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

router.use(authenticate);

// List discounts: Admin & Staff
router.get('/', authorize('ADMIN', 'STAFF'), DiscountsController.getDiscounts);
router.get('/:id', authorize('ADMIN', 'STAFF'), DiscountsController.getDiscountById);

// Validate discount code: Any authenticated user (including Customers at checkout/quote)
router.post('/validate', DiscountsController.validateDiscount);

// Create and update: Admin only
router.post('/', authorize('ADMIN'), DiscountsController.createDiscount);
router.put('/:id', authorize('ADMIN'), DiscountsController.updateDiscount);

export default router;
