import * as PortalService from './portal.service.js';
import { successResponse } from '../../utils/response.js';

export const getDashboard = async (req, res, next) => {
  try {
    const data = await PortalService.getDashboard(req.user.id);
    return successResponse(res, 200, 'Customer dashboard retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getSubscriptions = async (req, res, next) => {
  try {
    const data = await PortalService.getSubscriptions(req.user.id, req.query);
    return successResponse(res, 200, 'Customer subscriptions retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getSubscriptionDetails = async (req, res, next) => {
  try {
    const subscription = await PortalService.getSubscriptionById(req.user.id, req.params.id);
    return successResponse(res, 200, 'Subscription details retrieved successfully', { subscription });
  } catch (error) {
    next(error);
  }
};

export const getInvoices = async (req, res, next) => {
  try {
    const data = await PortalService.getInvoices(req.user.id, req.query);
    return successResponse(res, 200, 'Customer invoices retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getInvoiceDetails = async (req, res, next) => {
  try {
    const invoice = await PortalService.getInvoiceById(req.user.id, req.params.id);
    return successResponse(res, 200, 'Invoice details retrieved successfully', { invoice });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const user = await PortalService.getProfile(req.user.id);
    return successResponse(res, 200, 'Customer profile retrieved successfully', { user });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const user = await PortalService.updateProfile(req.user.id, req.body);
    return successResponse(res, 200, 'Customer profile updated successfully', { user });
  } catch (error) {
    next(error);
  }
};

