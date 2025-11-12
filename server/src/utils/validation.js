import validator from 'validator';

/**
 * Validation utilities for input sanitization and validation
 */

// Allowed action types
const ALLOWED_ACTIONS = ['created', 'updated', 'deleted', 'status_update'];

/**
 * Validates and sanitizes log entry data
 * @param {Object} data - Log entry data
 * @returns {Object} - { isValid: boolean, errors: Array, sanitized: Object }
 */
export function validateLogEntry(data) {
  const errors = [];
  const sanitized = {};

  // Validate timestamp
  if (!data.timestamp) {
    errors.push('Timestamp is required');
  } else if (!validator.isISO8601(data.timestamp)) {
    errors.push('Invalid timestamp format. Must be ISO 8601');
  } else {
    sanitized.timestamp = data.timestamp;
  }

  // Validate action
  if (!data.action) {
    errors.push('Action is required');
  } else if (!ALLOWED_ACTIONS.includes(data.action)) {
    errors.push(`Invalid action. Must be one of: ${ALLOWED_ACTIONS.join(', ')}`);
  } else {
    sanitized.action = data.action;
  }

  // Validate username
  if (!data.username) {
    errors.push('Username is required');
  } else if (typeof data.username !== 'string' || data.username.trim().length === 0) {
    errors.push('Username must be a non-empty string');
  } else if (data.username.length > 100) {
    errors.push('Username must be less than 100 characters');
  } else {
    // Sanitize username (escape HTML and trim)
    sanitized.username = validator.escape(validator.trim(data.username));
  }

  // Validate and sanitize optional fields
  if (data.jobTitle !== undefined && data.jobTitle !== null) {
    if (typeof data.jobTitle !== 'string') {
      errors.push('Job title must be a string');
    } else if (data.jobTitle.length > 200) {
      errors.push('Job title must be less than 200 characters');
    } else {
      sanitized.jobTitle = validator.escape(validator.trim(data.jobTitle));
    }
  } else {
    sanitized.jobTitle = null;
  }

  if (data.company !== undefined && data.company !== null) {
    if (typeof data.company !== 'string') {
      errors.push('Company must be a string');
    } else if (data.company.length > 200) {
      errors.push('Company must be less than 200 characters');
    } else {
      sanitized.company = validator.escape(validator.trim(data.company));
    }
  } else {
    sanitized.company = null;
  }

  if (data.details !== undefined && data.details !== null) {
    if (typeof data.details !== 'string') {
      errors.push('Details must be a string');
    } else if (data.details.length > 1000) {
      errors.push('Details must be less than 1000 characters');
    } else {
      sanitized.details = validator.escape(validator.trim(data.details));
    }
  } else {
    sanitized.details = null;
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  };
}

/**
 * Validates query parameters for log filtering
 * @param {Object} query - Query parameters
 * @returns {Object} - { isValid: boolean, errors: Array, sanitized: Object }
 */
export function validateLogQuery(query) {
  const errors = [];
  const sanitized = {};

  // Validate action filter
  if (query.action) {
    if (!ALLOWED_ACTIONS.includes(query.action)) {
      errors.push(`Invalid action filter. Must be one of: ${ALLOWED_ACTIONS.join(', ')}`);
    } else {
      sanitized.action = query.action;
    }
  }

  // Validate company filter
  if (query.company) {
    if (typeof query.company !== 'string' || query.company.length > 200) {
      errors.push('Company filter must be a string less than 200 characters');
    } else {
      sanitized.company = `%${validator.escape(validator.trim(query.company))}%`;
    }
  }

  // Validate username filter
  if (query.username) {
    if (typeof query.username !== 'string' || query.username.length > 100) {
      errors.push('Username filter must be a string less than 100 characters');
    } else {
      sanitized.username = validator.escape(validator.trim(query.username));
    }
  }

  // Validate date range
  if (query.startDate) {
    if (!validator.isISO8601(query.startDate)) {
      errors.push('Invalid startDate format. Must be ISO 8601');
    } else {
      sanitized.startDate = query.startDate;
    }
  }

  if (query.endDate) {
    if (!validator.isISO8601(query.endDate)) {
      errors.push('Invalid endDate format. Must be ISO 8601');
    } else {
      sanitized.endDate = query.endDate;
    }
  }

  // Validate search keyword
  if (query.search) {
    if (typeof query.search !== 'string' || query.search.length > 200) {
      errors.push('Search keyword must be a string less than 200 characters');
    } else {
      sanitized.search = `%${validator.escape(validator.trim(query.search))}%`;
    }
  }

  // Validate days (must be a positive integer)
  if (query.days) {
    const days = parseInt(query.days);
    if (isNaN(days) || days < 1 || days > 3650) {
      errors.push('Days must be a positive integer between 1 and 3650');
    } else {
      sanitized.days = `-${days}`;
    }
  }

  // Validate pagination
  if (query.limit) {
    const limit = parseInt(query.limit);
    if (isNaN(limit) || limit < 1 || limit > 1000) {
      errors.push('Limit must be a positive integer between 1 and 1000');
    } else {
      sanitized.limit = limit;
    }
  }

  if (query.offset) {
    const offset = parseInt(query.offset);
    if (isNaN(offset) || offset < 0) {
      errors.push('Offset must be a non-negative integer');
    } else {
      sanitized.offset = offset;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  };
}

/**
 * Validates log ID parameter
 * @param {string} id - Log ID
 * @returns {Object} - { isValid: boolean, error: string, value: number }
 */
export function validateLogId(id) {
  const numericId = parseInt(id);

  if (isNaN(numericId) || numericId < 1) {
    return {
      isValid: false,
      error: 'Invalid ID. Must be a positive integer',
      value: null
    };
  }

  return {
    isValid: true,
    error: null,
    value: numericId
  };
}

/**
 * Validates days parameter for cleanup
 * @param {string} days - Number of days
 * @returns {Object} - { isValid: boolean, error: string, value: number }
 */
export function validateDaysParam(days) {
  const numericDays = parseInt(days);

  if (isNaN(numericDays) || numericDays < 1 || numericDays > 3650) {
    return {
      isValid: false,
      error: 'Days must be a positive integer between 1 and 3650',
      value: null
    };
  }

  return {
    isValid: true,
    error: null,
    value: numericDays
  };
}

/**
 * Validates bulk logs array
 * @param {Array} logs - Array of log entries
 * @returns {Object} - { isValid: boolean, errors: Array }
 */
export function validateBulkLogs(logs) {
  if (!Array.isArray(logs)) {
    return {
      isValid: false,
      errors: ['Logs must be an array']
    };
  }

  if (logs.length === 0) {
    return {
      isValid: false,
      errors: ['Logs array cannot be empty']
    };
  }

  if (logs.length > 1000) {
    return {
      isValid: false,
      errors: ['Cannot import more than 1000 logs at once']
    };
  }

  return {
    isValid: true,
    errors: []
  };
}

export default {
  validateLogEntry,
  validateLogQuery,
  validateLogId,
  validateDaysParam,
  validateBulkLogs,
  ALLOWED_ACTIONS
};
