import { logStore } from '../database.js';
import logger from '../middleware/logger.js';

// Create a new log entry
export function createLog(req, res) {
  try {
    const {
      timestamp,
      action,
      jobTitle,
      company,
      details,
      jobId,
      recruiterName,
      metadata,
      hiringManager
    } = req.body;

    // Use authenticated username
    const username = req.user.username;

    // Validation
    if (!timestamp || !action) {
      return res.status(400).json({
        error: 'Missing required fields: timestamp and action are required'
      });
    }

    const newLogId = logStore.createLog({
      timestamp,
      action,
      jobTitle,
      company,
      details,
      username,
      jobId,
      recruiterName,
      metadata,
      hiringManager
    });

    logger.info(`Log created by ${username}: ${action}`);

    res.status(201).json({
      success: true,
      id: newLogId,
      message: 'Log entry created successfully'
    });
  } catch (error) {
    logger.error('Error creating log:', error);
    res.status(500).json({ error: 'Failed to create log entry' });
  }
}

// Get all logs or filter by query parameters
export function getLogs(req, res) {
  try {
    const filters = {
      action: req.query.action,
      company: req.query.company,
      username: req.user.username, // Filter by authenticated user
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      search: req.query.search,
      days: req.query.days,
      limit: req.query.limit,
      offset: req.query.offset,
      jobId: req.query.jobId
    };

    const logs = logStore.queryLogs(filters);

    res.json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    logger.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
}

// Get log statistics
export function getLogStats(req, res) {
  try {
    const stats = logStore.getStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error fetching log stats:', error);
    res.status(500).json({ error: 'Failed to fetch log statistics' });
  }
}

// Get a single log by ID
export function getLogById(req, res) {
  try {
    const { id } = req.params;
    const log = logStore.getById(parseInt(id, 10));

    if (!log) {
      return res.status(404).json({ error: 'Log not found' });
    }

    // Ensure user can only access their own logs
    if (log.username !== req.user.username) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      success: true,
      data: log
    });
  } catch (error) {
    logger.error('Error fetching log:', error);
    res.status(500).json({ error: 'Failed to fetch log' });
  }
}

// Delete a log by ID
export function deleteLog(req, res) {
  try {
    const { id } = req.params;
    const logId = parseInt(id, 10);
    
    // Check if log exists and belongs to user
    const log = logStore.getById(logId);
    if (!log) {
      return res.status(404).json({ error: 'Log not found' });
    }
    
    if (log.username !== req.user.username) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const info = logStore.deleteById(logId);

    logger.info(`Log deleted by ${req.user.username}: ${logId}`);

    res.json({
      success: true,
      message: 'Log deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting log:', error);
    res.status(500).json({ error: 'Failed to delete log' });
  }
}

// Delete old logs (cleanup)
export function cleanupOldLogs(req, res) {
  try {
    const { days } = req.params;
    
    // Validate days parameter
    const daysNum = parseInt(days, 10);
    if (isNaN(daysNum) || daysNum < 1) {
      return res.status(400).json({ error: 'Invalid days parameter' });
    }
    
    const info = logStore.deleteOlderThan(daysNum);

    logger.info(`Cleanup performed by ${req.user.username}: ${info.changes} logs deleted`);

    res.json({
      success: true,
      deleted: info.changes,
      message: `Deleted ${info.changes} log entries older than ${days} days`
    });
  } catch (error) {
    logger.error('Error cleaning up logs:', error);
    res.status(500).json({ error: 'Failed to cleanup old logs' });
  }
}

// Bulk create logs (for migration from localStorage)
export function bulkCreateLogs(req, res) {
  try {
    const { logs } = req.body;

    if (!Array.isArray(logs)) {
      return res.status(400).json({ error: 'logs must be an array' });
    }

    // Ensure all logs belong to authenticated user
    const logsWithUser = logs.map(log => ({
      ...log,
      username: req.user.username
    }));

    const imported = logStore.bulkInsert(logsWithUser);

    logger.info(`Bulk import by ${req.user.username}: ${imported} logs`);

    res.json({
      success: true,
      imported,
      total: logs.length
    });
  } catch (error) {
    logger.error('Error bulk creating logs:', error);
    res.status(500).json({ error: 'Failed to bulk create logs' });
  }
}
