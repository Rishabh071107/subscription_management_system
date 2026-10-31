/**
 * Overdue & Collection Management Validation
 */

export const validateOverdueQuery = (query) => {
  const errors = [];

  if (query.page && (isNaN(parseInt(query.page, 10)) || parseInt(query.page, 10) < 1)) {
    errors.push('page must be a positive integer');
  }

  if (query.limit && (isNaN(parseInt(query.limit, 10)) || parseInt(query.limit, 10) < 1)) {
    errors.push('limit must be a positive integer');
  }

  if (query.dueStartDate && isNaN(Date.parse(query.dueStartDate))) {
    errors.push('dueStartDate must be a valid ISO date');
  }

  if (query.dueEndDate && isNaN(Date.parse(query.dueEndDate))) {
    errors.push('dueEndDate must be a valid ISO date');
  }

  if (query.bucket && !['1-30', '31-60', '61-90', '90+'].includes(query.bucket)) {
    errors.push('bucket must be one of: 1-30, 31-60, 61-90, 90+');
  }

  if (errors.length > 0) {
    const error = new Error('Invalid query parameters');
    error.statusCode = 400;
    error.errors = errors;
    throw error;
  }
};

export const validateAddFollowUp = (data) => {
  const errors = [];

  if (!data.note || typeof data.note !== 'string' || !data.note.trim()) {
    errors.push('note is required and cannot be empty');
  }

  if (errors.length > 0) {
    const error = new Error('Validation failed');
    error.statusCode = 400;
    error.errors = errors;
    throw error;
  }
};

