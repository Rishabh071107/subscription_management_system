import * as DiscountsService from './discounts.service.js';
import { successResponse } from '../../utils/response.js';

export const getDiscounts = async (req, res, next) => {
  try {
    const result = await DiscountsService.listDiscounts(req.query);
    return successResponse(res, 200, 'Discounts retrieved successfully', result.discounts, result.pagination);
  } catch (error) {
    next(error);
  }
};

export const getDiscountById = async (req, res, next) => {
  try {
    const discount = await DiscountsService.getDiscountById(req.params.id);
    return successResponse(res, 200, 'Discount retrieved successfully', { discount });
  } catch (error) {
    next(error);
  }
};

export const createDiscount = async (req, res, next) => {
  try {
    const discount = await DiscountsService.createDiscount(req.body);
    return successResponse(res, 201, 'Discount code created successfully', { discount });
  } catch (error) {
    next(error);
  }
};

export const updateDiscount = async (req, res, next) => {
  try {
    const discount = await DiscountsService.updateDiscount(req.params.id, req.body);
    return successResponse(res, 200, 'Discount updated successfully', { discount });
  } catch (error) {
    next(error);
  }
};

export const validateDiscount = async (req, res, next) => {
  try {
    const { code, subtotal, quantity, productIds } = req.body;
    const result = await DiscountsService.validateDiscountEligibility(code, {
      customerId: req.user.role === 'CUSTOMER' ? req.user.id : req.body.customerId,
      subtotal,
      quantity,
      productIds
    });
    return successResponse(res, 200, 'Discount code is valid', result);
  } catch (error) {
    next(error);
  }
};
