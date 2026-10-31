import * as PlansModel from './plans.model.js';

const VALID_INTERVALS = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];

export const listPlans = async ({ page = 1, limit = 10, status, billingInterval, search }, currentUser) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  // Customers only see ACTIVE plans within valid date windows
  let planStatus = status;
  if (currentUser?.role === 'CUSTOMER') {
    planStatus = 'ACTIVE';
  }

  const { total, plans } = await PlansModel.findPlans({
    skip,
    take: limitNum,
    status: planStatus,
    billingInterval,
    search
  });

  // Apply automatic date expiration check
  const now = new Date();
  const processedPlans = plans.map(p => {
    if (p.status === 'ACTIVE' && p.availabilityEndDate && new Date(p.availabilityEndDate) < now) {
      return { ...p, status: 'CLOSED', autoExpired: true };
    }
    return p;
  });

  return {
    plans: processedPlans,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    }
  };
};

export const getPlanById = async (id) => {
  const plan = await PlansModel.findPlanById(id);
  if (!plan) {
    const error = new Error('Subscription plan not found');
    error.statusCode = 404;
    throw error;
  }
  return plan;
};

export const createPlan = async (planData) => {
  const {
    name,
    code,
    description,
    billingInterval = 'MONTHLY',
    intervalCount = 1,
    price,
    minQuantity = 1,
    availabilityStartDate,
    availabilityEndDate
  } = planData;

  if (!name || name.trim() === '') {
    const error = new Error('Plan name is required');
    error.statusCode = 400;
    throw error;
  }

  if (!code || code.trim() === '') {
    const error = new Error('Plan code is required');
    error.statusCode = 400;
    throw error;
  }

  if (!VALID_INTERVALS.includes(billingInterval)) {
    const error = new Error(`Billing interval must be one of: ${VALID_INTERVALS.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const parsedPrice = parseFloat(price);
  if (isNaN(parsedPrice) || parsedPrice < 0) {
    const error = new Error('Plan price must be a valid non-negative number');
    error.statusCode = 400;
    throw error;
  }

  const parsedMinQty = parseInt(minQuantity, 10);
  if (isNaN(parsedMinQty) || parsedMinQty < 1) {
    const error = new Error('Minimum quantity must be at least 1');
    error.statusCode = 400;
    throw error;
  }

  const existingCode = await PlansModel.findPlanByCode(code);
  if (existingCode) {
    const error = new Error(`A plan with code '${code.toUpperCase()}' already exists`);
    error.statusCode = 409;
    throw error;
  }

  const startDate = availabilityStartDate ? new Date(availabilityStartDate) : new Date();
  let endDate = null;

  if (availabilityEndDate) {
    endDate = new Date(availabilityEndDate);
    if (endDate <= startDate) {
      const error = new Error('Availability end date must be strictly after the start date');
      error.statusCode = 400;
      throw error;
    }
  }

  return PlansModel.createPlan({
    name: name.trim(),
    code: code.trim().toUpperCase(),
    description: description ? description.trim() : null,
    billingInterval,
    intervalCount: Math.max(1, parseInt(intervalCount, 10) || 1),
    price: parsedPrice,
    minQuantity: parsedMinQty,
    availabilityStartDate: startDate,
    availabilityEndDate: endDate,
    status: 'ACTIVE'
  });
};

export const updatePlan = async (id, planData) => {
  const existing = await PlansModel.findPlanById(id);
  if (!existing) {
    const error = new Error('Plan not found');
    error.statusCode = 404;
    throw error;
  }

  const updatePayload = {};

  if (planData.name !== undefined) {
    if (!planData.name || planData.name.trim() === '') {
      const error = new Error('Plan name cannot be empty');
      error.statusCode = 400;
      throw error;
    }
    updatePayload.name = planData.name.trim();
  }

  if (planData.description !== undefined) {
    updatePayload.description = planData.description ? planData.description.trim() : null;
  }

  if (planData.price !== undefined) {
    const parsedPrice = parseFloat(planData.price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      const error = new Error('Price must be a non-negative number');
      error.statusCode = 400;
      throw error;
    }
    updatePayload.price = parsedPrice;
  }

  if (planData.minQuantity !== undefined) {
    const parsedQty = parseInt(planData.minQuantity, 10);
    if (isNaN(parsedQty) || parsedQty < 1) {
      const error = new Error('Minimum quantity must be at least 1');
      error.statusCode = 400;
      throw error;
    }
    updatePayload.minQuantity = parsedQty;
  }

  if (planData.billingInterval !== undefined) {
    if (!VALID_INTERVALS.includes(planData.billingInterval)) {
      const error = new Error(`Billing interval must be one of: ${VALID_INTERVALS.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }
    updatePayload.billingInterval = planData.billingInterval;
  }

  if (planData.availabilityStartDate !== undefined) {
    updatePayload.availabilityStartDate = new Date(planData.availabilityStartDate);
  }

  if (planData.availabilityEndDate !== undefined) {
    if (planData.availabilityEndDate === null || planData.availabilityEndDate === '') {
      updatePayload.availabilityEndDate = null;
    } else {
      const eDate = new Date(planData.availabilityEndDate);
      const sDate = updatePayload.availabilityStartDate || existing.availabilityStartDate;
      if (eDate <= sDate) {
        const error = new Error('Availability end date must be after start date');
        error.statusCode = 400;
        throw error;
      }
      updatePayload.availabilityEndDate = eDate;
    }
  }

  return PlansModel.updatePlan(id, updatePayload);
};

export const updatePlanLifecycleStatus = async (id, action) => {
  const existing = await PlansModel.findPlanById(id);
  if (!existing) {
    const error = new Error('Plan not found');
    error.statusCode = 404;
    throw error;
  }

  let newStatus;
  switch (action.toUpperCase()) {
    case 'PAUSE':
      if (existing.status !== 'ACTIVE') {
        const error = new Error(`Cannot pause a plan in '${existing.status}' status`);
        error.statusCode = 400;
        throw error;
      }
      newStatus = 'PAUSED';
      break;

    case 'RESUME':
      if (existing.status !== 'PAUSED') {
        const error = new Error(`Cannot resume a plan in '${existing.status}' status`);
        error.statusCode = 400;
        throw error;
      }
      newStatus = 'ACTIVE';
      break;

    case 'CLOSE':
      newStatus = 'CLOSED';
      break;

    case 'REOPEN':
    case 'RENEW':
      newStatus = 'ACTIVE';
      break;

    default: {
      const error = new Error(`Unknown plan lifecycle action: ${action}`);
      error.statusCode = 400;
      throw error;
    }
  }

  return PlansModel.updatePlanStatus(id, newStatus);
};

export const removeOrClosePlan = async (id) => {
  const existing = await PlansModel.findPlanById(id);
  if (!existing) {
    const error = new Error('Plan not found');
    error.statusCode = 404;
    throw error;
  }

  const subscriptionCount = existing._count?.subscriptions || 0;
  if (subscriptionCount > 0) {
    const closed = await PlansModel.updatePlanStatus(id, 'CLOSED');
    return {
      action: 'CLOSED',
      message: 'Plan has existing subscriptions and was closed instead of permanently deleted to preserve contract history.',
      plan: closed
    };
  }

  await PlansModel.deletePlan(id);
  return {
    action: 'DELETED',
    message: 'Subscription plan deleted successfully'
  };
};
