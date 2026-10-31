/**
 * Customer Portal Validation Utilities
 */

const FORBIDDEN_PROFILE_FIELDS = ['id', 'email', 'role', 'password', 'isActive', 'createdAt', 'updatedAt'];

export const validateProfileUpdate = (data) => {
  const errors = [];

  if (!data || typeof data !== 'object') {
    const error = new Error('Request body must be a valid JSON object');
    error.statusCode = 400;
    throw error;
  }

  // Reject attempts to tamper with protected fields
  for (const field of FORBIDDEN_PROFILE_FIELDS) {
    if (data[field] !== undefined) {
      errors.push(`Field '${field}' cannot be updated through the customer portal`);
    }
  }

  if (data.firstName !== undefined) {
    if (typeof data.firstName !== 'string' || !data.firstName.trim()) {
      errors.push('firstName must be a non-empty string');
    } else if (data.firstName.trim().length > 100) {
      errors.push('firstName cannot exceed 100 characters');
    }
  }

  if (data.lastName !== undefined) {
    if (typeof data.lastName !== 'string' || !data.lastName.trim()) {
      errors.push('lastName must be a non-empty string');
    } else if (data.lastName.trim().length > 100) {
      errors.push('lastName cannot exceed 100 characters');
    }
  }

  if (data.phone !== undefined && data.phone !== null && data.phone !== '') {
    if (typeof data.phone !== 'string') {
      errors.push('phone must be a string');
    } else if (data.phone.trim().length > 30) {
      errors.push('phone cannot exceed 30 characters');
    }
  }

  if (errors.length > 0) {
    const error = new Error('Validation failed');
    error.statusCode = 400;
    error.errors = errors;
    throw error;
  }
};

export const validatePortalQuery = (query) => {
  const errors = [];

  if (query.page && (isNaN(parseInt(query.page, 10)) || parseInt(query.page, 10) < 1)) {
    errors.push('page must be a positive integer');
  }

  if (query.limit && (isNaN(parseInt(query.limit, 10)) || parseInt(query.limit, 10) < 1)) {
    errors.push('limit must be a positive integer');
  }

  if (errors.length > 0) {
    const error = new Error('Invalid query parameters');
    error.statusCode = 400;
    error.errors = errors;
    throw error;
  }
};

