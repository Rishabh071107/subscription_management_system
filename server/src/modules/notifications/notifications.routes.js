import { Router } from 'express';
import * as NotificationsController from './notifications.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();

// Protected Routes (Role-aware within controller/service)
router.use(authenticate);

// List permitted notifications
router.get('/', NotificationsController.listNotifications);

// Notification details
router.get('/:id', NotificationsController.getNotificationDetails);

export default router;

