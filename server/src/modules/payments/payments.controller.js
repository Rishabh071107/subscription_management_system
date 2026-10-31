import * as PaymentsService from './payments.service.js';
import { successResponse } from '../../utils/response.js';

export const getPayments = async (req, res, next) => {
  try {
    const result = await PaymentsService.listPayments(req.query, req.user);
    return successResponse(res, 200, 'Payments retrieved successfully', result.payments, result.pagination);
  } catch (error) {
    next(error);
  }
};

export const getPaymentById = async (req, res, next) => {
  try {
    const payment = await PaymentsService.getPaymentById(req.params.id, req.user);
    return successResponse(res, 200, 'Payment retrieved successfully', { payment });
  } catch (error) {
    next(error);
  }
};

export const createPayment = async (req, res, next) => {
  try {
    const payment = await PaymentsService.recordPayment(req.body, req.user);
    return successResponse(res, 201, 'Payment recorded successfully', { payment });
  } catch (error) {
    next(error);
  }
};
