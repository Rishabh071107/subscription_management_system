/**
 * Notifications Query & Input Validation
 */

const VALID_STATUSES = ['PENDING', 'SENT', 'FAILED'];

export const validateNotificationsQuery = (query) => {
  const errors = [];

  if (query.page && (isNaN(parseInt(query.page, 10)) || parseInt(query.page, 10) < 1)) {
    errors.push('page must be a positive integer');
  }

  if (query.limit && (isNaN(parseInt(query.limit, 10)) || parseInt(query.limit, 10) < 1)) {
    errors.push('limit must be a positive integer');
  }

  if (query.status && !VALID_STATUSES.includes(query.status)) {
    errors.push(`status must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  if (errors.length > 0) {
    const error = new Error('Invalid query parameters');
    error.statusCode = 400;
    error.errors = errors;
    throw error;
  }
};

