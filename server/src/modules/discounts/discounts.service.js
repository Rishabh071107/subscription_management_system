import * as DiscountsModel from './discounts.model.js';
import prisma from '../../config/db.js';

export const listDiscounts = async ({ page = 1, limit = 10, isActive, search }) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  let activeFilter = undefined;
  if (isActive === 'true' || isActive === true) activeFilter = true;
  if (isActive === 'false' || isActive === false) activeFilter = false;

  const { total, discounts } = await DiscountsModel.findDiscounts({
    skip,
    take: limitNum,
    isActive: activeFilter,
    search
  });

  return {
    discounts,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    }
  };
};

export const getDiscountById = async (id) => {
  const discount = await DiscountsModel.findDiscountById(id);
  if (!discount) {
    const error = new Error('Discount not found');
    error.statusCode = 404;
    throw error;
  }
  return discount;
};

export const createDiscount = async (discountData) => {
  const {
    code,
    description,
    discountType = 'PERCENTAGE',
    value,
    scope = 'ENTIRE_SUBSCRIPTION',
    productId,
    minPurchaseAmount,
    minQuantity,
    startDate,
    expiryDate,
    usageLimit
  } = discountData;

  if (!code || code.trim() === '') {
    const error = new Error('Discount code is required');
    error.statusCode = 400;
    throw error;
  }

  const existing = await DiscountsModel.findDiscountByCode(code);
  if (existing) {
    const error = new Error(`Discount code '${code.toUpperCase()}' already exists`);
    error.statusCode = 409;
    throw error;
  }

  const parsedValue = parseFloat(value);
  if (isNaN(parsedValue) || parsedValue <= 0) {
    const error = new Error('Discount value must be greater than zero');
    error.statusCode = 400;
    throw error;
  }

  if (discountType === 'PERCENTAGE' && parsedValue > 100) {
    const error = new Error('Percentage discount cannot exceed 100%');
    error.statusCode = 400;
    throw error;
  }

  if (scope === 'PRODUCT_SPECIFIC' && !productId) {
    const error = new Error('Product must be specified for product-specific discounts');
    error.statusCode = 400;
    throw error;
  }

  const sDate = startDate ? new Date(startDate) : new Date();
  let eDate = null;
  if (expiryDate) {
    eDate = new Date(expiryDate);
    if (eDate <= sDate) {
      const error = new Error('Expiry date must be after start date');
      error.statusCode = 400;
      throw error;
    }
  }

  return DiscountsModel.createDiscount({
    code: code.trim().toUpperCase(),
    description: description ? description.trim() : null,
    discountType,
    value: parsedValue,
    scope,
    productId: scope === 'PRODUCT_SPECIFIC' ? productId : null,
    minPurchaseAmount: minPurchaseAmount ? parseFloat(minPurchaseAmount) : null,
    minQuantity: minQuantity ? parseInt(minQuantity, 10) : null,
    startDate: sDate,
    expiryDate: eDate,
    usageLimit: usageLimit ? parseInt(usageLimit, 10) : null,
    isActive: true
  });
};

export const updateDiscount = async (id, discountData) => {
  const existing = await DiscountsModel.findDiscountById(id);
  if (!existing) {
    const error = new Error('Discount not found');
    error.statusCode = 404;
    throw error;
  }

  const updatePayload = {};

  if (discountData.description !== undefined) {
    updatePayload.description = discountData.description ? discountData.description.trim() : null;
  }

  if (discountData.isActive !== undefined) {
    updatePayload.isActive = Boolean(discountData.isActive);
  }

  if (discountData.usageLimit !== undefined) {
    updatePayload.usageLimit = discountData.usageLimit ? parseInt(discountData.usageLimit, 10) : null;
  }

  if (discountData.expiryDate !== undefined) {
    updatePayload.expiryDate = discountData.expiryDate ? new Date(discountData.expiryDate) : null;
  }

  return DiscountsModel.updateDiscount(id, updatePayload);
};

/**
 * Validates discount code eligibility against purchase criteria
 */
export const validateDiscountEligibility = async (code, { customerId, subtotal = 0, quantity = 1, productIds = [] }) => {
  if (!code || code.trim() === '') {
    const error = new Error('Please enter a discount code');
    error.statusCode = 400;
    throw error;
  }

  const discount = await DiscountsModel.findDiscountByCode(code);
  if (!discount) {
    const error = new Error('Invalid discount code');
    error.statusCode = 404;
    throw error;
  }

  if (!discount.isActive) {
    const error = new Error('This discount code is currently inactive');
    error.statusCode = 400;
    throw error;
  }

  const now = new Date();
  if (discount.startDate && new Date(discount.startDate) > now) {
    const error = new Error('This discount promotion has not started yet');
    error.statusCode = 400;
    throw error;
  }

  if (discount.expiryDate && new Date(discount.expiryDate) < now) {
    const error = new Error('This discount code has expired');
    error.statusCode = 400;
    throw error;
  }

  if (discount.usageLimit !== null && discount.timesUsed >= discount.usageLimit) {
    const error = new Error('This discount code has reached its maximum global usage limit');
    error.statusCode = 400;
    throw error;
  }

  // Check minimum purchase amount
  if (discount.minPurchaseAmount && Number(subtotal) < Number(discount.minPurchaseAmount)) {
    const error = new Error(
      `Order subtotal must be at least $${Number(discount.minPurchaseAmount).toFixed(2)} to use this code`
    );
    error.statusCode = 400;
    throw error;
  }

  // Check minimum quantity
  if (discount.minQuantity && quantity < discount.minQuantity) {
    const error = new Error(`Order quantity must be at least ${discount.minQuantity} items`);
    error.statusCode = 400;
    throw error;
  }

  // Check product-specific scope
  if (discount.scope === 'PRODUCT_SPECIFIC' && discount.productId) {
    if (!productIds.includes(discount.productId)) {
      const error = new Error(`This discount code applies only to ${discount.product?.name || 'specified product'}`);
      error.statusCode = 400;
      throw error;
    }
  }

  // Check single-use per customer if already used
  if (customerId) {
    const existingUsage = await prisma.discountUsage.findFirst({
      where: {
        discountId: discount.id,
        customerId
      }
    });

    if (existingUsage) {
      const error = new Error('You have already redeemed this discount code');
      error.statusCode = 400;
      throw error;
    }
  }

  // Calculate discount amount
  let discountAmount = 0;
  const numSubtotal = Number(subtotal);
  if (discount.discountType === 'PERCENTAGE') {
    discountAmount = Math.round((numSubtotal * (Number(discount.value) / 100)) * 100) / 100;
  } else {
    discountAmount = Math.min(numSubtotal, Number(discount.value));
  }

  return {
    valid: true,
    discount,
    discountAmount
  };
};
