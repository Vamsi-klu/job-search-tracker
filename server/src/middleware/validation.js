import { body, param, query, validationResult } from 'express-validator';

/**
 * Middleware to check validation results
 */
export function validate(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }

  next();
}

/**
 * Validation rules for creating a log
 */
export const validateCreateLog = [
  body('timestamp')
    .notEmpty().withMessage('Timestamp is required')
    .isISO8601().withMessage('Invalid timestamp format'),

  body('action')
    .notEmpty().withMessage('Action is required')
    .isIn(['created', 'updated', 'deleted', 'status_update'])
    .withMessage('Invalid action type'),

  body('jobTitle')
    .optional()
    .isString().withMessage('Job title must be a string')
    .isLength({ max: 200 }).withMessage('Job title too long (max 200 characters)'),

  body('company')
    .optional()
    .isString().withMessage('Company must be a string')
    .isLength({ max: 200 }).withMessage('Company name too long (max 200 characters)'),

  body('details')
    .optional()
    .isString().withMessage('Details must be a string')
    .isLength({ max: 1000 }).withMessage('Details too long (max 1000 characters)'),

  body('username')
    .optional()
    .isString().withMessage('Username must be a string')
    .isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),

  body('recruiterName')
    .optional()
    .isString().withMessage('Recruiter name must be a string')
    .isLength({ max: 100 }).withMessage('Recruiter name too long (max 100 characters)'),

  body('hiringManager')
    .optional()
    .isString().withMessage('Hiring manager must be a string')
    .isLength({ max: 100 }).withMessage('Hiring manager name too long (max 100 characters)'),

  validate
];

/**
 * Validation rules for bulk log creation
 */
export const validateBulkLogs = [
  body('logs')
    .isArray().withMessage('Logs must be an array')
    .notEmpty().withMessage('Logs array cannot be empty'),

  body('logs.*.timestamp')
    .notEmpty().withMessage('Each log must have a timestamp'),

  body('logs.*.action')
    .notEmpty().withMessage('Each log must have an action')
    .isIn(['created', 'updated', 'deleted', 'status_update'])
    .withMessage('Invalid action type'),

  validate
];

/**
 * Validation rules for query parameters
 */
export const validateLogQuery = [
  query('action')
    .optional()
    .isIn(['created', 'updated', 'deleted', 'status_update'])
    .withMessage('Invalid action type'),

  query('days')
    .optional()
    .isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 200 }).withMessage('Limit must be between 1 and 200'),

  query('offset')
    .optional()
    .isInt({ min: 0 }).withMessage('Offset must be a non-negative integer'),

  query('company')
    .optional()
    .isString().withMessage('Company must be a string')
    .isLength({ max: 200 }).withMessage('Company name too long'),

  query('search')
    .optional()
    .isString().withMessage('Search must be a string')
    .isLength({ max: 100 }).withMessage('Search query too long'),

  validate
];

/**
 * Validation rules for ID parameters
 */
export const validateId = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID must be a positive integer'),

  validate
];

/**
 * Validation rules for cleanup
 */
export const validateCleanup = [
  param('days')
    .isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365'),

  validate
];

/**
 * Validation rules for authentication
 */
export const validateRegister = [
  body('username')
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/).withMessage('Username can only contain letters, numbers, underscores, and hyphens'),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),

  validate
];

export const validateLogin = [
  body('username')
    .notEmpty().withMessage('Username is required'),

  body('password')
    .notEmpty().withMessage('Password is required'),

  validate
];

export const validateChangePassword = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),

  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),

  validate
];

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(str) {
  if (typeof str !== 'string') return str;

  return str
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim()
    .substring(0, 10000); // Limit length
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const sanitized = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
