import { logOperations } from '../database.js';
import {
  validateLogEntry,
  validateLogQuery,
  validateLogId,
  validateDaysParam,
  validateBulkLogs
} from '../utils/validation.js';

// Create a new log entry
export function createLog(req, res) {
  try {
    const { timestamp, action, jobTitle, company, details, username } = req.body;

    // Validate and sanitize input
    const validation = validateLogEntry({
      timestamp,
      action,
      jobTitle,
      company,
      details,
      username
    });

    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      });
    }

    const info = logOperations.create.run(validation.sanitized);

    res.status(201).json({
      success: true,
      id: info.lastInsertRowid,
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
    // Validate query parameters
    const validation = validateLogQuery(req.query);

    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: validation.errors
      });
    }

    const sanitized = validation.sanitized;
    let logs;

    // Filter by action
    if (sanitized.action) {
      logs = logOperations.getByAction.all({ action: sanitized.action });
    }
    // Filter by company
    else if (sanitized.company) {
      logs = logOperations.getByCompany.all({ company: sanitized.company });
    }
    // Filter by username
    else if (sanitized.username) {
      logs = logOperations.getByUsername.all({ username: sanitized.username });
    }
    // Filter by date range
    else if (sanitized.startDate && sanitized.endDate) {
      logs = logOperations.getByDateRange.all({
        startDate: sanitized.startDate,
        endDate: sanitized.endDate
      });
    }
    // Search by keyword
    else if (sanitized.search) {
      logs = logOperations.search.all({ keyword: sanitized.search });
    }
    // Get recent activity (last N days)
    else if (sanitized.days) {
      logs = logOperations.getRecentActivity.all({ days: sanitized.days });
    }
    // Pagination
    else if (sanitized.limit !== undefined) {
      logs = logOperations.getPaginated.all({
        limit: sanitized.limit,
        offset: sanitized.offset || 0
      });
    }
    // Get all logs
    else {
      logs = logOperations.getAll.all();
    }

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
    const stats = logOperations.getStats.all();

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

    // Validate ID
    const validation = validateLogId(id);

    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }

    const log = logOperations.getById.get({ id: validation.value });

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

    // Validate ID
    const validation = validateLogId(id);

    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }

    const info = logOperations.deleteById.run({ id: validation.value });

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

    // Validate days parameter
    const validation = validateDaysParam(days);

    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }

    const info = logOperations.deleteOlderThan.run({ days: `-${validation.value}` });

    res.json({
      success: true,
      deleted: info.changes,
      message: `Deleted ${info.changes} log entries older than ${validation.value} days`
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

    // Validate bulk logs
    const bulkValidation = validateBulkLogs(logs);

    if (!bulkValidation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: bulkValidation.errors
      });
    }

    let successCount = 0;
    let errors = [];

    logs.forEach((log, index) => {
      try {
        // Validate each log entry
        const validation = validateLogEntry({
          timestamp: log.timestamp,
          action: log.action,
          jobTitle: log.jobTitle,
          company: log.company,
          details: log.details,
          username: log.username
        });

        if (!validation.isValid) {
          errors.push({
            index,
            errors: validation.errors
          });
          return;
        }

        logOperations.create.run(validation.sanitized);
        successCount++;
      } catch (error) {
        errors.push({ index, error: error.message });
      }
    });

    res.json({
      success: true,
      imported: successCount,
      total: logs.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error bulk creating logs:', error);
    res.status(500).json({ error: 'Failed to bulk create logs' });
  }
}
