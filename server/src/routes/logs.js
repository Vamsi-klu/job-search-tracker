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

const router = express.Router();

// Create a new log entry
router.post('/', createLog);

// Bulk create logs (for migration)
router.post('/bulk', bulkCreateLogs);

// Get all logs (supports query parameters for filtering)
router.get('/', getLogs);

// Get log statistics
router.get('/stats', getLogStats);

// Get a specific log by ID
router.get('/:id', getLogById);

// Delete a log by ID
router.delete('/:id', deleteLog);

// Cleanup old logs
router.delete('/cleanup/:days', cleanupOldLogs);

export default router;
