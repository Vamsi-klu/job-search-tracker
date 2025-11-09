import { body, param, validationResult } from 'express-validator';

export const validateLog = [
  body('username').trim().isLength({ min: 1, max: 50 }).escape(),
  body('company').trim().isLength({ min: 1, max: 100 }).escape(),
  body('position').trim().isLength({ min: 1, max: 100 }).escape(),
  body('status').isIn(['Applied', 'Interview', 'Offer', 'Rejected', 'Accepted']),
  body('date').isISO8601().toDate(),
  body('notes').optional().trim().isLength({ max: 1000 }).escape(),
  body('salary').optional().trim().isLength({ max: 50 }).escape(),
  body('location').optional().trim().isLength({ max: 100 }).escape(),
  body('jobUrl').optional().trim().isURL(),
  body('contactPerson').optional().trim().isLength({ max: 100 }).escape(),
  body('contactEmail').optional().trim().isEmail().normalizeEmail(),
];

export const validateBulkLogs = [
  body('logs').isArray({ min: 1, max: 100 }),
  body('logs.*.username').trim().isLength({ min: 1, max: 50 }).escape(),
  body('logs.*.company').trim().isLength({ min: 1, max: 100 }).escape(),
  body('logs.*.position').trim().isLength({ min: 1, max: 100 }).escape(),
  body('logs.*.status').isIn(['Applied', 'Interview', 'Offer', 'Rejected', 'Accepted']),
  body('logs.*.date').isISO8601().toDate(),
];

export const validateId = [
  param('id').isInt({ min: 1 }),
];

export const validateDays = [
  param('days').isInt({ min: 1, max: 365 }),
];

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};
