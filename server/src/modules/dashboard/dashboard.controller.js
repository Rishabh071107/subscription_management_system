import * as DashboardService from './dashboard.service.js';
import { successResponse } from '../../utils/response.js';

export const getSummary = async (req, res, next) => {
  try {
    const summary = await DashboardService.getDashboardSummary(req.query, req.user);
    return successResponse(res, 200, 'Dashboard summary retrieved successfully', summary);
  } catch (error) {
    next(error);
  }
};

export const getRevenueReport = async (req, res, next) => {
  try {
    const report = await DashboardService.getRevenueReport(req.query);
    return successResponse(res, 200, 'Revenue report retrieved successfully', report);
  } catch (error) {
    next(error);
  }
};

export const getSubscriptionReport = async (req, res, next) => {
  try {
    const report = await DashboardService.getSubscriptionReport();
    return successResponse(res, 200, 'Subscription distribution report retrieved successfully', report);
  } catch (error) {
    next(error);
  }
};

export const getPaymentsSummary = async (req, res, next) => {
  try {
    const summary = await DashboardService.getPaymentsSummary(req.query);
    return successResponse(res, 200, 'Payments summary retrieved successfully', summary);
  } catch (error) {
    next(error);
  }
};

export const getOverdueReport = async (req, res, next) => {
  try {
    const report = await DashboardService.getOverdueReport();
    return successResponse(res, 200, 'Overdue report retrieved successfully', report);
  } catch (error) {
    next(error);
  }
};
