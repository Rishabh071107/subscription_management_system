import * as PortalModel from './portal.model.js';
import { validateProfileUpdate, validatePortalQuery } from './portal.validation.js';
import { prisma } from '../../config/db.js';

/**
 * Customer Self-Service Dashboard
 */
export const getDashboard = async (customerId) => {
  return PortalModel.getCustomerDashboardMetrics(customerId);
};

/**
 * List own subscriptions with pagination and status filter
 */
export const getSubscriptions = async (customerId, query = {}) => {
  validatePortalQuery(query);

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const { total, subscriptions } = await PortalModel.findCustomerSubscriptions(customerId, {
    skip,
    take: limit,
    status: query.status,
    search: query.search
  });

  return {
    subscriptions,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1
    }
  };
};

/**
 * View own subscription details with strict ownership verification
 */
export const getSubscriptionById = async (customerId, subscriptionId) => {
  const subscription = await PortalModel.findCustomerSubscriptionById(subscriptionId);

  if (!subscription) {
    const error = new Error('Subscription not found');
    error.statusCode = 404;
    throw error;
  }

  // Strict ownership isolation check
  if (subscription.customerId !== customerId) {
    const error = new Error('Forbidden: You do not have permission to access this subscription');
    error.statusCode = 403;
    throw error;
  }

  return subscription;
};

/**
 * List own invoices with pagination and status filter
 */
export const getInvoices = async (customerId, query = {}) => {
  validatePortalQuery(query);

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const { total, invoices } = await PortalModel.findCustomerInvoices(customerId, {
    skip,
    take: limit,
    status: query.status,
    search: query.search
  });

  // Calculate dynamic overdue status
  const now = new Date();
  const adjustedInvoices = invoices.map((inv) => {
    let status = inv.status;
    if (['DRAFT', 'CONFIRMED', 'PARTIALLY_PAID'].includes(inv.status) && new Date(inv.dueDate) < now) {
      status = 'OVERDUE';
    }
    return { ...inv, status };
  });

  return {
    invoices: adjustedInvoices,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1
    }
  };
};

/**
 * View own invoice details with strict ownership verification
 */
export const getInvoiceById = async (customerId, invoiceId) => {
  const invoice = await PortalModel.findCustomerInvoiceById(invoiceId);

  if (!invoice) {
    const error = new Error('Invoice not found');
    error.statusCode = 404;
    throw error;
  }

  // Strict ownership isolation check
  if (invoice.customerId !== customerId) {
    const error = new Error('Forbidden: You do not have permission to access this invoice');
    error.statusCode = 403;
    throw error;
  }

  // Check dynamic overdue status
  let status = invoice.status;
  if (['DRAFT', 'CONFIRMED', 'PARTIALLY_PAID'].includes(invoice.status) && new Date(invoice.dueDate) < new Date()) {
    status = 'OVERDUE';
  }

  return { ...invoice, status };
};

/**
 * View own profile details
 */
export const getProfile = async (customerId) => {
  const profile = await PortalModel.findCustomerProfile(customerId);

  if (!profile) {
    const error = new Error('Customer profile not found');
    error.statusCode = 404;
    throw error;
  }

  return profile;
};

/**
 * Update permitted customer profile attributes
 */
export const updateProfile = async (customerId, data) => {
  validateProfileUpdate(data);

  const sanitizedData = {};
  if (data.firstName !== undefined) sanitizedData.firstName = data.firstName.trim();
  if (data.lastName !== undefined) sanitizedData.lastName = data.lastName.trim();
  if (data.phone !== undefined) sanitizedData.phone = data.phone ? data.phone.trim() : null;

  const updatedUser = await PortalModel.updateCustomerProfile(customerId, sanitizedData);

  try {
    await prisma.auditLog.create({
      data: {
        userId: customerId,
        action: 'PROFILE_UPDATED',
        entityType: 'User',
        entityId: customerId,
        details: JSON.stringify(sanitizedData)
      }
    });
  } catch (auditErr) {
    console.warn('Failed to record profile audit log:', auditErr.message);
  }

  return updatedUser;
};

