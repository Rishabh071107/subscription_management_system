import * as InvoicesService from './invoices.service.js';
import * as InvoicesValidation from './invoices.validation.js';
import { successResponse } from '../../utils/response.js';

export const getInvoices = async (req, res, next) => {
  try {
    const result = await InvoicesService.listInvoices(req.query, req.user);
    return successResponse(res, 200, 'Invoices retrieved successfully', result.invoices, result.pagination);
  } catch (error) {
    next(error);
  }
};

export const getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await InvoicesService.getInvoiceById(req.params.id, req.user);
    return successResponse(res, 200, 'Invoice retrieved successfully', { invoice });
  } catch (error) {
    next(error);
  }
};

export const generateInvoice = async (req, res, next) => {
  try {
    InvoicesValidation.validateGenerateInvoice(req.body);
    const { subscriptionId } = req.body;
    const invoice = await InvoicesService.generateSubscriptionInvoice(subscriptionId, req.body);
    return successResponse(res, 201, 'Invoice generated successfully', { invoice });
  } catch (error) {
    next(error);
  }
};

export const createInvoice = async (req, res, next) => {
  try {
    InvoicesValidation.validateCreateManualInvoice(req.body);
    const invoice = await InvoicesService.createManualInvoice(req.body, req.user);
    return successResponse(res, 201, 'Manual invoice created successfully', { invoice });
  } catch (error) {
    next(error);
  }
};

export const confirmInvoice = async (req, res, next) => {
  try {
    const invoice = await InvoicesService.confirmInvoice(req.params.id, req.user);
    return successResponse(res, 200, 'Invoice confirmed successfully', { invoice });
  } catch (error) {
    next(error);
  }
};

export const cancelInvoice = async (req, res, next) => {
  try {
    const invoice = await InvoicesService.cancelInvoice(req.params.id, req.user);
    return successResponse(res, 200, 'Invoice cancelled successfully', { invoice });
  } catch (error) {
    next(error);
  }
};

export const sendInvoice = async (req, res, next) => {
  try {
    const result = await InvoicesService.sendInvoice(req.params.id, req.user);
    return successResponse(res, 200, result.message, { success: true });
  } catch (error) {
    next(error);
  }
};

export const runBilling = async (req, res, next) => {
  try {
    const result = await InvoicesService.runBillingCycle();
    return successResponse(res, 200, 'Billing cycle executed', result);
  } catch (error) {
    next(error);
  }
};

export const updateInvoiceStatus = async (req, res, next) => {
  try {
    InvoicesValidation.validateUpdateStatus(req.body);
    const { status } = req.body;
    const invoice = await InvoicesService.updateInvoiceStatus(req.params.id, status, req.user);
    return successResponse(res, 200, `Invoice status updated to ${invoice.status}`, { invoice });
  } catch (error) {
    next(error);
  }
};

export const renderInvoiceHtml = async (req, res, next) => {
  try {
    const html = await InvoicesService.generateInvoiceHtml(req.params.id, req.user);
    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  } catch (error) {
    next(error);
  }
};
