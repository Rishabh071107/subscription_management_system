import * as SubscriptionsModel from './subscriptions.model.js';
import prisma from '../../config/db.js';

const VALID_STATUS_TRANSITIONS = {
  DRAFT: ['QUOTATION', 'CONFIRMED', 'CLOSED'],
  QUOTATION: ['CONFIRMED', 'CLOSED'],
  CONFIRMED: ['ACTIVE', 'CLOSED'],
  ACTIVE: ['PAUSED', 'CLOSED'],
  PAUSED: ['ACTIVE', 'CLOSED'],
  CLOSED: ['ACTIVE'] // Renewal
};

const generateSubscriptionNumber = async () => {
  const year = new Date().getFullYear();
  const count = await SubscriptionsModel.countSubscriptionsForYear(year);
  const nextNum = (count + 1).toString().padStart(4, '0');
  return `SUB-${year}-${nextNum}`;
};

export const listSubscriptions = async ({ page = 1, limit = 10, customerId, status, planId, search }, currentUser) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  // Customer data isolation
  let filterCustomerId = customerId;
  if (currentUser.role === 'CUSTOMER') {
    filterCustomerId = currentUser.id;
  }

  const { total, subscriptions } = await SubscriptionsModel.findSubscriptions({
    skip,
    take: limitNum,
    customerId: filterCustomerId,
    status,
    planId,
    search
  });

  return {
    subscriptions,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    }
  };
};

export const getSubscriptionById = async (id, currentUser) => {
  const subscription = await SubscriptionsModel.findSubscriptionById(id);
  if (!subscription) {
    const error = new Error('Subscription not found');
    error.statusCode = 404;
    throw error;
  }

  // Customer isolation
  if (currentUser.role === 'CUSTOMER' && subscription.customerId !== currentUser.id) {
    const error = new Error('Unauthorized to view this subscription');
    error.statusCode = 403;
    throw error;
  }

  return subscription;
};

export const createSubscription = async (subscriptionData, currentUser) => {
  const {
    customerId,
    planId,
    startDate,
    expiryDate,
    paymentTerms = 'Net 15',
    notes,
    autoRenew = true,
    lines = []
  } = subscriptionData;

  const targetCustomerId = currentUser.role === 'CUSTOMER' ? currentUser.id : customerId;

  if (!targetCustomerId) {
    const error = new Error('Customer ID is required');
    error.statusCode = 400;
    throw error;
  }

  if (!planId) {
    const error = new Error('Plan ID is required');
    error.statusCode = 400;
    throw error;
  }

  const plan = await prisma.plan.findUnique({
    where: { id: planId }
  });

  if (!plan) {
    const error = new Error('Subscription plan not found');
    error.statusCode = 404;
    throw error;
  }

  const sDate = startDate ? new Date(startDate) : new Date();
  let nextBillingDate = new Date(sDate);

  if (plan.billingInterval === 'DAILY') {
    nextBillingDate.setDate(nextBillingDate.getDate() + 1);
  } else if (plan.billingInterval === 'WEEKLY') {
    nextBillingDate.setDate(nextBillingDate.getDate() + 7);
  } else if (plan.billingInterval === 'MONTHLY') {
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
  } else if (plan.billingInterval === 'YEARLY') {
    nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
  }

  let overallSubtotal = 0;
  let overallTax = 0;

  const processedLines = lines.map(line => {
    const qty = parseInt(line.quantity, 10) || 1;
    const uPrice = parseFloat(line.unitPrice || 0);
    const tRate = line.taxRate !== undefined ? parseFloat(line.taxRate) : 18.0;

    const subtotal = Math.round(qty * uPrice * 100) / 100;
    const tax = Math.round(subtotal * (tRate / 100) * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;

    overallSubtotal += subtotal;
    overallTax += tax;

    return {
      productId: line.productId,
      variantId: line.variantId || null,
      quantity: qty,
      unitPrice: uPrice,
      taxRate: tRate,
      subtotal,
      total
    };
  });

  const totalAmount = Math.round((overallSubtotal + overallTax) * 100) / 100;
  const subscriptionNumber = await generateSubscriptionNumber();

  return SubscriptionsModel.createSubscription(
    {
      subscriptionNumber,
      customerId: targetCustomerId,
      planId: plan.id,
      status: 'CONFIRMED',
      startDate: sDate,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      nextBillingDate,
      paymentTerms,
      billingInterval: plan.billingInterval,
      subtotal: overallSubtotal,
      taxRate: 18.0,
      taxAmount: overallTax,
      discountAmount: 0,
      totalAmount,
      autoRenew: Boolean(autoRenew),
      notes: notes ? notes.trim() : null
    },
    processedLines
  );
};

export const updateSubscriptionLifecycle = async (id, { action, reason }, currentUser) => {
  const existing = await SubscriptionsModel.findSubscriptionById(id);
  if (!existing) {
    const error = new Error('Subscription not found');
    error.statusCode = 404;
    throw error;
  }

  const currentStatus = existing.status;
  const updateData = {};

  switch (action.toUpperCase()) {
    case 'ACTIVATE':
      if (!VALID_STATUS_TRANSITIONS[currentStatus]?.includes('ACTIVE')) {
        const error = new Error(`Cannot activate subscription from status '${currentStatus}'`);
        error.statusCode = 400;
        throw error;
      }
      updateData.status = 'ACTIVE';
      break;

    case 'PAUSE':
      if (!VALID_STATUS_TRANSITIONS[currentStatus]?.includes('PAUSED')) {
        const error = new Error(`Cannot pause subscription from status '${currentStatus}'`);
        error.statusCode = 400;
        throw error;
      }
      updateData.status = 'PAUSED';
      updateData.pausedAt = new Date();
      break;

    case 'RESUME':
      if (currentStatus !== 'PAUSED') {
        const error = new Error(`Only paused subscriptions can be resumed. Current status: '${currentStatus}'`);
        error.statusCode = 400;
        throw error;
      }
      updateData.status = 'ACTIVE';
      updateData.pausedAt = null;
      break;

    case 'CLOSE':
    case 'EARLY_CLOSE':
      if (!VALID_STATUS_TRANSITIONS[currentStatus]?.includes('CLOSED')) {
        const error = new Error(`Cannot close subscription from status '${currentStatus}'`);
        error.statusCode = 400;
        throw error;
      }
      updateData.status = 'CLOSED';
      updateData.closedAt = new Date();
      updateData.closureReason = reason || 'Closed by operator';
      break;

    case 'RENEW': {
      if (currentStatus !== 'CLOSED' && currentStatus !== 'ACTIVE') {
        const error = new Error(`Renewal is only valid for active or expired/closed subscriptions`);
        error.statusCode = 400;
        throw error;
      }
      updateData.status = 'ACTIVE';
      updateData.closedAt = null;
      updateData.closureReason = null;

      // Extend expiry date
      const baseDate = existing.expiryDate && new Date(existing.expiryDate) > new Date()
        ? new Date(existing.expiryDate)
        : new Date();

      if (existing.billingInterval === 'DAILY') {
        baseDate.setDate(baseDate.getDate() + 1);
      } else if (existing.billingInterval === 'WEEKLY') {
        baseDate.setDate(baseDate.getDate() + 7);
      } else if (existing.billingInterval === 'MONTHLY') {
        baseDate.setMonth(baseDate.getMonth() + 1);
      } else if (existing.billingInterval === 'YEARLY') {
        baseDate.setFullYear(baseDate.getFullYear() + 1);
      }

      updateData.expiryDate = baseDate;
      break;
    }

    default: {
      const error = new Error(`Unsupported lifecycle action: '${action}'`);
      error.statusCode = 400;
      throw error;
    }
  }

  return SubscriptionsModel.updateSubscription(id, updateData);
};
