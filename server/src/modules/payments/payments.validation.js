/**
 * Payment Validation Utilities
 */

const VALID_METHODS = ['CASH', 'CARD', 'BANK_TRANSFER', 'UPI', 'OTHER'];

export const validateRecordPayment = (data) => {
  const errors = [];

  if (!data.invoiceId || typeof data.invoiceId !== 'string' || !data.invoiceId.trim()) {
    errors.push('invoiceId is required and must be a non-empty string');
  }

  if (data.amount === undefined || data.amount === null || data.amount === '') {
    errors.push('amount is required');
  } else {
    const parsedAmount = Number(data.amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      errors.push('amount must be a positive number greater than 0');
    }
  }

  if (data.paymentMethod && !VALID_METHODS.includes(data.paymentMethod)) {
    errors.push(`paymentMethod must be one of: ${VALID_METHODS.join(', ')}`);
  }

  if (data.paymentDate && isNaN(Date.parse(data.paymentDate))) {
    errors.push('paymentDate must be a valid ISO date string');
  }

  if (errors.length > 0) {
    const error = new Error('Validation failed');
    error.statusCode = 400;
    error.errors = errors;
    throw error;
  }
};

export const validatePaymentQuery = (query) => {
  const errors = [];

  if (query.page && (isNaN(parseInt(query.page, 10)) || parseInt(query.page, 10) < 1)) {
    errors.push('page must be a positive integer');
  }

  if (query.limit && (isNaN(parseInt(query.limit, 10)) || parseInt(query.limit, 10) < 1)) {
    errors.push('limit must be a positive integer');
  }

  if (query.paymentMethod && !VALID_METHODS.includes(query.paymentMethod)) {
    errors.push(`paymentMethod must be one of: ${VALID_METHODS.join(', ')}`);
  }

  if (query.startDate && isNaN(Date.parse(query.startDate))) {
    errors.push('startDate must be a valid ISO date string');
  }

  if (query.endDate && isNaN(Date.parse(query.endDate))) {
    errors.push('endDate must be a valid ISO date string');
  }

  if (errors.length > 0) {
    const error = new Error('Invalid query parameters');
    error.statusCode = 400;
    error.errors = errors;
    throw error;
  }
};

