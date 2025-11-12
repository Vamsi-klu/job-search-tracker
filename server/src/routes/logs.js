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
import {
  validateCreateLog,
  validateBulkLogs,
  validateLogQuery,
  validateId,
  validateCleanup
} from '../middleware/validation.js';

const router = express.Router();

// Create a new log entry
router.post('/', validateCreateLog, createLog);

// Bulk create logs (for migration)
router.post('/bulk', validateBulkLogs, bulkCreateLogs);

// Get all logs (supports query parameters for filtering)
router.get('/', validateLogQuery, getLogs);

// Get log statistics
router.get('/stats', getLogStats);

// Get a specific log by ID
router.get('/:id', validateId, getLogById);

// Delete a log by ID
router.delete('/:id', validateId, deleteLog);

// Cleanup old logs
router.delete('/cleanup/:days', validateCleanup, cleanupOldLogs);

export default router;
