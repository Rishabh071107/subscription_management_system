import * as SubscriptionsService from './subscriptions.service.js';
import { successResponse } from '../../utils/response.js';

export const getSubscriptions = async (req, res, next) => {
  try {
    const result = await SubscriptionsService.listSubscriptions(req.query, req.user);
    return successResponse(res, 200, 'Subscriptions retrieved successfully', result.subscriptions, result.pagination);
  } catch (error) {
    next(error);
  }
};

export const getSubscriptionById = async (req, res, next) => {
  try {
    const subscription = await SubscriptionsService.getSubscriptionById(req.params.id, req.user);
    return successResponse(res, 200, 'Subscription details retrieved successfully', { subscription });
  } catch (error) {
    next(error);
  }
};

export const createSubscription = async (req, res, next) => {
  try {
    const subscription = await SubscriptionsService.createSubscription(req.body, req.user);
    return successResponse(res, 201, 'Subscription created successfully', { subscription });
  } catch (error) {
    next(error);
  }
};

export const updateSubscriptionLifecycle = async (req, res, next) => {
  try {
    const subscription = await SubscriptionsService.updateSubscriptionLifecycle(req.params.id, req.body, req.user);
    return successResponse(res, 200, `Subscription status updated to ${subscription.status}`, { subscription });
  } catch (error) {
    next(error);
  }
};
