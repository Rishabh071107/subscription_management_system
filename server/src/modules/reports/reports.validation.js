/**
 * Financial Reports Query Validation
 */

const VALID_INVOICE_STATUSES = ['DRAFT', 'CONFIRMED', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED'];
const VALID_SUBSCRIPTION_STATUSES = ['DRAFT', 'QUOTATION', 'CONFIRMED', 'ACTIVE', 'PAUSED', 'CLOSED'];
const VALID_PAYMENT_METHODS = ['CASH', 'CARD', 'BANK_TRANSFER', 'UPI', 'OTHER'];

export const validateReportQuery = (query, type = 'general') => {
  const errors = [];

  const startDate = query.startDate || query.fromDate;
  if (startDate && isNaN(Date.parse(startDate))) {
    errors.push('startDate must be a valid ISO date');
  }

  const endDate = query.endDate || query.toDate;
  if (endDate && isNaN(Date.parse(endDate))) {
    errors.push('endDate must be a valid ISO date');
  }

  if (query.page && (isNaN(parseInt(query.page, 10)) || parseInt(query.page, 10) < 1)) {
    errors.push('page must be a positive integer');
  }

  if (query.limit && (isNaN(parseInt(query.limit, 10)) || parseInt(query.limit, 10) < 1)) {
    errors.push('limit must be a positive integer');
  }

  if (type === 'invoice' && query.status && !VALID_INVOICE_STATUSES.includes(query.status)) {
    errors.push(`Invalid invoice status. Must be one of: ${VALID_INVOICE_STATUSES.join(', ')}`);
  }

  if (type === 'subscription' && query.status && !VALID_SUBSCRIPTION_STATUSES.includes(query.status)) {
    errors.push(`Invalid subscription status. Must be one of: ${VALID_SUBSCRIPTION_STATUSES.join(', ')}`);
  }

  if (type === 'payment' && query.paymentMethod && !VALID_PAYMENT_METHODS.includes(query.paymentMethod)) {
    errors.push(`Invalid paymentMethod. Must be one of: ${VALID_PAYMENT_METHODS.join(', ')}`);
  }

  if (errors.length > 0) {
    const error = new Error('Invalid report query parameters');
    error.statusCode = 400;
    error.errors = errors;
    throw error;
  }
};
