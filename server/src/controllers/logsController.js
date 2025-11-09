import { logOperations } from '../database.js';

// Create a new log entry
export function createLog(req, res) {
  try {
    const { timestamp, action, jobTitle, company, details, username } = req.body;

    // Validation
    if (!timestamp || !action || !username) {
      return res.status(400).json({
        error: 'Missing required fields: timestamp, action, and username are required'
      });
    }

    const info = logOperations.create.run({
      timestamp,
      action,
      jobTitle: jobTitle || null,
      company: company || null,
      details: details || null,
      username
    });

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
    const {
      action,
      company,
      username,
      startDate,
      endDate,
      search,
      days,
      limit,
      offset
    } = req.query;

    let logs;

    // Filter by action
    if (action) {
      logs = logOperations.getByAction.all({ action });
    }
    // Filter by company
    else if (company) {
      logs = logOperations.getByCompany.all({ company: `%${company}%` });
    }
    // Filter by username
    else if (username) {
      logs = logOperations.getByUsername.all({ username });
    }
    // Filter by date range
    else if (startDate && endDate) {
      logs = logOperations.getByDateRange.all({ startDate, endDate });
    }
    // Search by keyword
    else if (search) {
      logs = logOperations.search.all({ keyword: `%${search}%` });
    }
    // Get recent activity (last N days)
    else if (days) {
      logs = logOperations.getRecentActivity.all({ days: `-${days}` });
    }
    // Pagination
    else if (limit) {
      logs = logOperations.getPaginated.all({
        limit: parseInt(limit),
        offset: parseInt(offset) || 0
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
    const log = logOperations.getById.get({ id: parseInt(id) });

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
    const info = logOperations.deleteById.run({ id: parseInt(id) });

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
    const info = logOperations.deleteOlderThan.run({ days: `-${days}` });

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

    let successCount = 0;
    let errors = [];

    logs.forEach((log, index) => {
      try {
        logOperations.create.run({
          timestamp: log.timestamp,
          action: log.action,
          jobTitle: log.jobTitle || null,
          company: log.company || null,
          details: log.details || null,
          username: log.username
        });
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
