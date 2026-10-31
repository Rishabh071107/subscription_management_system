import { Router } from 'express';
import * as SubscriptionsController from './subscriptions.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

router.use(authenticate);

// View subscriptions
router.get('/', SubscriptionsController.getSubscriptions);
router.get('/:id', SubscriptionsController.getSubscriptionById);

// Create subscription
router.post('/', authorize('ADMIN', 'STAFF'), SubscriptionsController.createSubscription);

// Lifecycle management: Pause, Resume, Renew, Close
router.patch('/:id/lifecycle', authorize('ADMIN', 'STAFF'), SubscriptionsController.updateSubscriptionLifecycle);

export default router;
