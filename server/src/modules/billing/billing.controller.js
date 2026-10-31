import * as BillingService from './billing.service.js';
import { successResponse } from '../../utils/response.js';

export const triggerBillingRun = async (req, res, next) => {
  try {
    const targetDate = req.body?.targetDate ? new Date(req.body.targetDate) : new Date();
    const result = await BillingService.executeBillingRun(req.user, targetDate);
    return successResponse(res, 200, 'Recurring billing cycle completed', result);
  } catch (error) {
    next(error);
  }
};

export const getBillingRuns = async (req, res, next) => {
  try {
    const result = await BillingService.listBillingRuns(req.query);
    return successResponse(res, 200, 'Billing runs retrieved successfully', result.runs, result.pagination);
  } catch (error) {
    next(error);
  }
};

export const getBillingRunDetails = async (req, res, next) => {
  try {
    const run = await BillingService.getBillingRunById(req.params.id);
    return successResponse(res, 200, 'Billing run details retrieved successfully', { run });
  } catch (error) {
    next(error);
  }
};

export const retryBillingRun = async (req, res, next) => {
  try {
    const result = await BillingService.retryFailedItems(req.params.id, req.user);
    return successResponse(res, 200, result.message, result);
  } catch (error) {
    next(error);
  }
};

