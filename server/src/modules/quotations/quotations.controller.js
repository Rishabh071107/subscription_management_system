import * as QuotationsService from './quotations.service.js';
import { successResponse } from '../../utils/response.js';

export const getQuotations = async (req, res, next) => {
  try {
    const result = await QuotationsService.listQuotations(req.query, req.user);
    return successResponse(res, 200, 'Quotations retrieved successfully', result.quotations, result.pagination);
  } catch (error) {
    next(error);
  }
};

export const getQuotationById = async (req, res, next) => {
  try {
    const quotation = await QuotationsService.getQuotationById(req.params.id, req.user);
    return successResponse(res, 200, 'Quotation details retrieved successfully', { quotation });
  } catch (error) {
    next(error);
  }
};

export const createQuotation = async (req, res, next) => {
  try {
    const quotation = await QuotationsService.createQuotation(req.body, req.user);
    return successResponse(res, 201, 'Quotation created successfully', { quotation });
  } catch (error) {
    next(error);
  }
};

export const updateQuotation = async (req, res, next) => {
  try {
    const quotation = await QuotationsService.updateQuotation(req.params.id, req.body, req.user);
    return successResponse(res, 200, 'Quotation updated successfully', { quotation });
  } catch (error) {
    next(error);
  }
};

export const updateQuotationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const quotation = await QuotationsService.updateQuotationStatus(req.params.id, status, req.user);
    return successResponse(res, 200, `Quotation status updated to ${quotation.status}`, { quotation });
  } catch (error) {
    next(error);
  }
};

export const convertToSubscription = async (req, res, next) => {
  try {
    const subscription = await QuotationsService.convertToSubscription(req.params.id, req.body, req.user);
    return successResponse(res, 201, 'Quotation converted into subscription successfully', { subscription });
  } catch (error) {
    next(error);
  }
};
