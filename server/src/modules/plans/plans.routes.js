import { Router } from 'express';
import * as PlansController from './plans.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

router.use(authenticate);

router.get('/', PlansController.getPlans);
router.get('/:id', PlansController.getPlanById);

// Management restricted to ADMIN and STAFF
router.post('/', authorize('ADMIN', 'STAFF'), PlansController.createPlan);
router.put('/:id', authorize('ADMIN', 'STAFF'), PlansController.updatePlan);
router.patch('/:id/status', authorize('ADMIN', 'STAFF'), PlansController.updatePlanStatus);

export default router;
