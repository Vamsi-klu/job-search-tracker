import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { migrateJobs, migrateLogs } from '../../controllers/migrationController.js';
import * as migration from '../../migration.js';

// Mock the migration module
jest.mock('../../migration.js');

describe('Migration Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    jest.clearAllMocks();
  });

  describe('migrateJobs', () => {
    test('should migrate jobs successfully', () => {
      req.body = {
        jobs: [
          { company: 'Google', position: 'Engineer', recruiterName: 'John' },
          { company: 'Amazon', position: 'Developer', recruiterName: 'Jane' }
        ],
        username: 'testuser'
      };

      migration.migrateJobsFromLocalStorage.mockReturnValue({
        success: true,
        migrated: 2,
        skipped: 0,
        errors: []
      });

      migrateJobs(req, res);

      expect(migration.migrateJobsFromLocalStorage).toHaveBeenCalledWith(
        req.body.jobs,
        'testuser'
      );

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          migrated: 2,
          message: expect.stringContaining('Successfully migrated 2 jobs')
        })
      );
    });

    test('should return 400 when jobs array is missing', () => {
      req.body = { username: 'testuser' };

      migrateJobs(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Missing or invalid jobs array'
        })
      );
    });

    test('should return 400 when jobs is not an array', () => {
      req.body = {
        jobs: 'not an array',
        username: 'testuser'
      };

      migrateJobs(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should return 400 when username is missing', () => {
      req.body = {
        jobs: []
      };

      migrateJobs(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Missing required field: username'
        })
      );
    });

    test('should return 500 when migration fails', () => {
      req.body = {
        jobs: [{ company: 'Google', position: 'Engineer' }],
        username: 'testuser'
      };

      migration.migrateJobsFromLocalStorage.mockReturnValue({
        success: false,
        error: 'Migration failed'
      });

      migrateJobs(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Migration failed'
        })
      );
    });

    test('should include errors in response', () => {
      req.body = {
        jobs: [
          { company: 'Google', position: 'Engineer' },
          { company: 'Amazon', position: 'Developer' }
        ],
        username: 'testuser'
      };

      migration.migrateJobsFromLocalStorage.mockReturnValue({
        success: true,
        migrated: 1,
        skipped: 0,
        errors: [{ job: 'Amazon - Developer', error: 'Database error' }]
      });

      migrateJobs(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          migrated: 1,
          errors: expect.arrayContaining([
            expect.objectContaining({
              job: 'Amazon - Developer'
            })
          ])
        })
      );
    });

    test('should handle exceptions', () => {
      req.body = {
        jobs: [],
        username: 'testuser'
      };

      migration.migrateJobsFromLocalStorage.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      migrateJobs(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Failed to migrate jobs'
        })
      );
    });
  });

  describe('migrateLogs', () => {
    test('should migrate logs successfully', () => {
      req.body = {
        logs: [
          { action: 'created', company: 'Google', jobTitle: 'Engineer', details: 'Created' },
          { action: 'updated', company: 'Google', jobTitle: 'Engineer', details: 'Updated' }
        ],
        username: 'testuser'
      };

      migration.migrateLogsFromLocalStorage.mockReturnValue({
        success: true,
        migrated: 2,
        skipped: 0,
        errors: []
      });

      migrateLogs(req, res);

      expect(migration.migrateLogsFromLocalStorage).toHaveBeenCalledWith(
        req.body.logs,
        'testuser'
      );

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          migrated: 2,
          message: expect.stringContaining('Successfully migrated 2 logs')
        })
      );
    });

    test('should return 400 when logs array is missing', () => {
      req.body = { username: 'testuser' };

      migrateLogs(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Missing or invalid logs array'
        })
      );
    });

    test('should return 400 when logs is not an array', () => {
      req.body = {
        logs: 'not an array',
        username: 'testuser'
      };

      migrateLogs(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should return 400 when username is missing', () => {
      req.body = {
        logs: []
      };

      migrateLogs(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should return 500 when migration fails', () => {
      req.body = {
        logs: [{ action: 'created' }],
        username: 'testuser'
      };

      migration.migrateLogsFromLocalStorage.mockReturnValue({
        success: false,
        error: 'Migration failed'
      });

      migrateLogs(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    test('should include skipped count in response', () => {
      req.body = {
        logs: [
          { action: 'created', company: 'Google', jobTitle: 'Engineer' }
        ],
        username: 'testuser'
      };

      migration.migrateLogsFromLocalStorage.mockReturnValue({
        success: true,
        migrated: 0,
        skipped: 1,
        errors: []
      });

      migrateLogs(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          skipped: 1,
          message: expect.stringContaining('1 skipped')
        })
      );
    });

    test('should handle exceptions', () => {
      req.body = {
        logs: [],
        username: 'testuser'
      };

      migration.migrateLogsFromLocalStorage.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      migrateLogs(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
