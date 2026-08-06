import express from 'express';
import {
  createLog,
  getLogs,
  getLogStats,
  getLogById,
  deleteLog,
  cleanupOldLogs,
  bulkCreateLogs
} from '../controllers/logsController.js';
import { authenticateToken } from '../middleware/auth.js';
import {
  validateLog,
  validateBulkLogs,
  validateId,
  validateDays,
  handleValidationErrors
} from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get log statistics
router.get('/stats', getLogStats);

// Get all logs (supports query parameters for filtering)
router.get('/', getLogs);

// Get a specific log by ID
router.get('/:id', validateId, handleValidationErrors, getLogById);

// Create a new log entry
router.post('/', validateLog, handleValidationErrors, createLog);

// Bulk create logs (for migration)
router.post('/bulk', validateBulkLogs, handleValidationErrors, bulkCreateLogs);

// Delete a log by ID
router.delete('/:id', validateId, handleValidationErrors, deleteLog);

// Cleanup old logs
router.delete('/cleanup/:days', validateDays, handleValidationErrors, cleanupOldLogs);

export default router;
