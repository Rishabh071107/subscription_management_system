import { Router } from 'express';
import * as ProductsController from './products.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

// Products can be viewed by authenticated users (Customers, Staff, Admin)
router.use(authenticate);

router.get('/', ProductsController.getProducts);
router.get('/:id', ProductsController.getProductById);

// Modifications restricted to ADMIN and STAFF
router.post('/', authorize('ADMIN', 'STAFF'), ProductsController.createProduct);
router.put('/:id', authorize('ADMIN', 'STAFF'), ProductsController.updateProduct);
router.patch('/:id/status', authorize('ADMIN', 'STAFF'), ProductsController.toggleProductStatus);
router.delete('/:id', authorize('ADMIN'), ProductsController.deleteProduct);

// Variant endpoints
router.post('/:id/variants', authorize('ADMIN', 'STAFF'), ProductsController.addVariant);
router.put('/:id/variants/:variantId', authorize('ADMIN', 'STAFF'), ProductsController.updateVariant);
router.delete('/:id/variants/:variantId', authorize('ADMIN'), ProductsController.deleteVariant);

export default router;
