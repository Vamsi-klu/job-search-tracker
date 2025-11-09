import { logStore } from '../database.js';

// Create a new log entry
export function createLog(req, res) {
  try {
    const {
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
    } = req.body;

    // Validation
    if (!timestamp || !action || !username) {
      return res.status(400).json({
        error: 'Missing required fields: timestamp, action, and username are required'
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

    res.status(201).json({
      success: true,
      id: newLogId,
      message: 'Log entry created successfully'
    });
  } catch (error) {
    console.error('Error creating log:', error);
    res.status(500).json({ error: 'Failed to create log entry' });
  }
}

// Get all logs or filter by query parameters
export function getLogs(req, res) {
  try {
    const filters = {
      action: req.query.action,
      company: req.query.company,
      username: req.query.username,
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
    console.error('Error fetching logs:', error);
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
    console.error('Error fetching log stats:', error);
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

    res.json({
      success: true,
      data: log
    });
  } catch (error) {
    console.error('Error fetching log:', error);
    res.status(500).json({ error: 'Failed to fetch log' });
  }
}

// Delete a log by ID
export function deleteLog(req, res) {
  try {
    const { id } = req.params;
    const info = logStore.deleteById(parseInt(id, 10));

    if (info.changes === 0) {
      return res.status(404).json({ error: 'Log not found' });
    }

    res.json({
      success: true,
      message: 'Log deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting log:', error);
    res.status(500).json({ error: 'Failed to delete log' });
  }
}

// Delete old logs (cleanup)
export function cleanupOldLogs(req, res) {
  try {
    const { days } = req.params;
    const info = logStore.deleteOlderThan(parseInt(days, 10));

    res.json({
      success: true,
      deleted: info.changes,
      message: `Deleted ${info.changes} log entries older than ${days} days`
    });
  } catch (error) {
    console.error('Error cleaning up logs:', error);
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

    const imported = logStore.bulkInsert(logs);

    res.json({
      success: true,
      imported,
      total: logs.length
    });
  } catch (error) {
    console.error('Error bulk creating logs:', error);
    res.status(500).json({ error: 'Failed to bulk create logs' });
  }
}
