import { migrateJobsFromLocalStorage, migrateLogsFromLocalStorage } from '../migration.js';

/**
 * MIGRATION CONTROLLER
 *
 * Handles migration of data from localStorage to the new database.
 */

/**
 * Migrate jobs from localStorage
 * POST /api/migrate/jobs
 */
export function migrateJobs(req, res) {
  try {
    const { jobs, username } = req.body;

    // Validation
    if (!jobs || !Array.isArray(jobs)) {
      return res.status(400).json({
        error: 'Missing or invalid jobs array'
      });
    }

    if (!username) {
      return res.status(400).json({
        error: 'Missing required field: username'
      });
    }

    // Perform migration
    const result = migrateJobsFromLocalStorage(jobs, username);

    if (result.success) {
      res.json({
        success: true,
        migrated: result.migrated,
        skipped: result.skipped,
        errors: result.errors,
        message: `Successfully migrated ${result.migrated} jobs`
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Migration failed',
        details: result.error
      });
    }

  } catch (error) {
    console.error('Error migrating jobs:', error);
    res.status(500).json({
      error: 'Failed to migrate jobs',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Migrate logs from localStorage
 * POST /api/migrate/logs
 */
export function migrateLogs(req, res) {
  try {
    const { logs, username } = req.body;

    // Validation
    if (!logs || !Array.isArray(logs)) {
      return res.status(400).json({
        error: 'Missing or invalid logs array'
      });
    }

    if (!username) {
      return res.status(400).json({
        error: 'Missing required field: username'
      });
    }

    // Perform migration
    const result = migrateLogsFromLocalStorage(logs, username);

    if (result.success) {
      res.json({
        success: true,
        migrated: result.migrated,
        skipped: result.skipped,
        errors: result.errors,
        message: `Successfully migrated ${result.migrated} logs (${result.skipped} skipped)`
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Migration failed',
        details: result.error
      });
    }

  } catch (error) {
    console.error('Error migrating logs:', error);
    res.status(500).json({
      error: 'Failed to migrate logs',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
