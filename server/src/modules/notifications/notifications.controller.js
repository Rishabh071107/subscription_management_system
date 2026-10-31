import * as NotificationsService from './notifications.service.js';
import { successResponse } from '../../utils/response.js';

export const listNotifications = async (req, res, next) => {
  try {
    const data = await NotificationsService.listNotifications(req.query, req.user);
    return successResponse(res, 200, 'Notifications retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getNotificationDetails = async (req, res, next) => {
  try {
    const notification = await NotificationsService.getNotificationById(req.params.id, req.user);
    return successResponse(res, 200, 'Notification details retrieved successfully', { notification });
  } catch (error) {
    next(error);
  }
};

