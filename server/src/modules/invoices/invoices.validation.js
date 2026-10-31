/**
 * Invoice Input Validation Helpers
 */

export const validateGenerateInvoice = (data) => {
  const errors = [];
  if (!data.subscriptionId || typeof data.subscriptionId !== 'string') {
    errors.push('subscriptionId is required and must be a string');
  }

  if (data.billingPeriodStart && isNaN(Date.parse(data.billingPeriodStart))) {
    errors.push('billingPeriodStart must be a valid ISO date');
  }

  if (data.billingPeriodEnd && isNaN(Date.parse(data.billingPeriodEnd))) {
    errors.push('billingPeriodEnd must be a valid ISO date');
  }

  if (errors.length > 0) {
    const error = new Error('Validation failed');
    error.statusCode = 400;
    error.errors = errors;
    throw error;
  }
};

export const validateCreateManualInvoice = (data) => {
  const errors = [];
  if (!data.customerId || typeof data.customerId !== 'string') {
    errors.push('customerId is required');
  }

  if (!data.dueDate || isNaN(Date.parse(data.dueDate))) {
    errors.push('dueDate is required and must be a valid date');
  }

  if (!Array.isArray(data.lines) || data.lines.length === 0) {
    errors.push('lines array must contain at least one item');
  } else {
    data.lines.forEach((line, index) => {
      if (!line.description || typeof line.description !== 'string') {
        errors.push(`lines[${index}].description is required`);
      }
      if (line.quantity === undefined || Number(line.quantity) <= 0) {
        errors.push(`lines[${index}].quantity must be greater than 0`);
      }
      if (line.unitPrice === undefined || Number(line.unitPrice) < 0) {
        errors.push(`lines[${index}].unitPrice must be a non-negative number`);
      }
    });
  }

  if (errors.length > 0) {
    const error = new Error('Validation failed');
    error.statusCode = 400;
    error.errors = errors;
    throw error;
  }
};

export const validateUpdateStatus = (data) => {
  const validStatuses = ['DRAFT', 'CONFIRMED', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED'];
  if (!data.status || !validStatuses.includes(data.status)) {
    const error = new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }
};

