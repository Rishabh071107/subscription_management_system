import * as OverdueService from './overdue.service.js';
import { successResponse } from '../../utils/response.js';

export const getOverdueInvoices = async (req, res, next) => {
  try {
    const result = await OverdueService.listOverdueInvoices(req.query, req.user);
    return successResponse(res, 200, 'Overdue invoices retrieved successfully', result.invoices, result.pagination);
  } catch (error) {
    next(error);
  }
};

export const getOverdueSummary = async (req, res, next) => {
  try {
    const summary = await OverdueService.getOverdueSummary(req.query, req.user);
    return successResponse(res, 200, 'Overdue summary retrieved successfully', summary);
  } catch (error) {
    next(error);
  }
};

export const getOverdueInvoiceById = async (req, res, next) => {
  try {
    const invoice = await OverdueService.getOverdueInvoiceById(req.params.id, req.user);
    return successResponse(res, 200, 'Overdue invoice retrieved successfully', { invoice });
  } catch (error) {
    next(error);
  }
};

export const createFollowUpNote = async (req, res, next) => {
  try {
    const followUp = await OverdueService.recordFollowUpNote(req.params.id, req.body, req.user);
    return successResponse(res, 201, 'Collection follow-up logged successfully', { followUp });
  } catch (error) {
    next(error);
  }
};

export const syncOverdueStatuses = async (req, res, next) => {
  try {
    const result = await OverdueService.syncOverdueStatuses();
    return successResponse(res, 200, 'Overdue statuses synchronized successfully', result);
  } catch (error) {
    next(error);
  }
};
