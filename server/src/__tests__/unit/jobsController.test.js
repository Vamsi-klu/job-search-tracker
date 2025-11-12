import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { createJob, getJobs, getJobById, updateJob, deleteJob, getJobStats } from '../../controllers/jobsController.js';
import { userOps, companyOps, jobOps, activityLogOps, transaction } from '../../database-optimized.js';

// Mock the database operations
jest.mock('../../database-optimized.js', () => ({
  userOps: {
    upsert: { get: jest.fn() },
    getByUsername: { get: jest.fn() }
  },
  companyOps: {
    upsert: { get: jest.fn() }
  },
  jobOps: {
    create: { run: jest.fn() },
    getById: { get: jest.fn() },
    getAllByUser: { all: jest.fn() },
    update: { run: jest.fn() },
    delete: { run: jest.fn() },
    search: { all: jest.fn() },
    getByDecision: { all: jest.fn() },
    getPaginated: { all: jest.fn() },
    countByUser: { get: jest.fn() }
  },
  activityLogOps: {
    create: { run: jest.fn() }
  },
  transaction: jest.fn((fn) => fn)
}));

describe('Jobs Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      query: {},
      params: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    jest.clearAllMocks();
  });

  describe('createJob', () => {
    test('should create a job successfully', () => {
      req.body = {
        company: 'Google',
        recruiterName: 'John Doe',
        position: 'Software Engineer',
        username: 'testuser',
        recruiterScreen: 'Not Started',
        technicalScreen: 'Not Started',
        decision: 'Pending'
      };

      userOps.upsert.get.mockReturnValue({ id: 1, username: 'testuser' });
      companyOps.upsert.get.mockReturnValue({ id: 1, name: 'Google' });
      jobOps.create.run.mockReturnValue({ lastInsertRowid: 1 });
      jobOps.getById.get.mockReturnValue({
        id: 1,
        company_id: 1,
        company_name: 'Google',
        position: 'Software Engineer',
        recruiter_name: 'John Doe'
      });

      createJob(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Job created successfully'
        })
      );
    });

    test('should return 400 when company is missing', () => {
      req.body = {
        position: 'Engineer',
        username: 'testuser'
      };

      createJob(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Missing required fields')
        })
      );
    });

    test('should return 400 when position is missing', () => {
      req.body = {
        company: 'Google',
        username: 'testuser'
      };

      createJob(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should return 400 when username is missing', () => {
      req.body = {
        company: 'Google',
        position: 'Engineer'
      };

      createJob(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should handle errors and return 500', () => {
      req.body = {
        company: 'Google',
        position: 'Engineer',
        username: 'testuser'
      };

      userOps.upsert.get.mockImplementation(() => {
        throw new Error('Database error');
      });

      createJob(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Failed to create job'
        })
      );
    });

    test('should use default values for optional fields', () => {
      req.body = {
        company: 'Google',
        position: 'Engineer',
        username: 'testuser'
      };

      userOps.upsert.get.mockReturnValue({ id: 1, username: 'testuser' });
      companyOps.upsert.get.mockReturnValue({ id: 1, name: 'Google' });
      jobOps.create.run.mockReturnValue({ lastInsertRowid: 1 });
      jobOps.getById.get.mockReturnValue({ id: 1 });

      createJob(req, res);

      expect(jobOps.create.run).toHaveBeenCalledWith(
        expect.objectContaining({
          recruiter_name: 'Unknown',
          recruiter_screen: 'Not Started',
          decision: 'Pending'
        })
      );
    });
  });

  describe('getJobs', () => {
    beforeEach(() => {
      userOps.getByUsername.get.mockReturnValue({ id: 1, username: 'testuser' });
    });

    test('should get all jobs for user', () => {
      req.query = { username: 'testuser' };

      const mockJobs = [
        { id: 1, company_name: 'Google', position: 'Engineer' },
        { id: 2, company_name: 'Amazon', position: 'Developer' }
      ];

      jobOps.getAllByUser.all.mockReturnValue(mockJobs);

      getJobs(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockJobs,
          count: 2,
          totalCount: 2
        })
      );
    });

    test('should return 400 when username is missing', () => {
      req.query = {};

      getJobs(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Missing required parameter: username'
        })
      );
    });

    test('should return empty array when user not found', () => {
      req.query = { username: 'nonexistent' };
      userOps.getByUsername.get.mockReturnValue(null);

      getJobs(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: [],
          count: 0
        })
      );
    });

    test('should filter by search query', () => {
      req.query = { username: 'testuser', search: 'engineer' };

      const mockResults = [
        { id: 1, company_name: 'Google', position: 'Engineer' }
      ];

      jobOps.search.all.mockReturnValue(mockResults);

      getJobs(req, res);

      expect(jobOps.search.all).toHaveBeenCalledWith({
        query: 'engineer',
        user_id: 1
      });
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: mockResults,
          count: 1
        })
      );
    });

    test('should filter by decision', () => {
      req.query = { username: 'testuser', decision: 'Offer Extended' };

      const mockResults = [
        { id: 1, company_name: 'Google', position: 'Engineer', decision: 'Offer Extended' }
      ];

      jobOps.getByDecision.all.mockReturnValue(mockResults);

      getJobs(req, res);

      expect(jobOps.getByDecision.all).toHaveBeenCalledWith({
        user_id: 1,
        decision: 'Offer Extended'
      });
    });

    test('should paginate results', () => {
      req.query = { username: 'testuser', limit: '10', offset: '0' };

      const mockResults = [{ id: 1 }, { id: 2 }];
      jobOps.getPaginated.all.mockReturnValue(mockResults);
      jobOps.countByUser.get.mockReturnValue({ count: 20 });

      getJobs(req, res);

      expect(jobOps.getPaginated.all).toHaveBeenCalledWith({
        user_id: 1,
        limit: 10,
        offset: 0
      });
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          count: 2,
          totalCount: 20
        })
      );
    });

    test('should handle errors', () => {
      req.query = { username: 'testuser' };
      jobOps.getAllByUser.all.mockImplementation(() => {
        throw new Error('Database error');
      });

      getJobs(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getJobById', () => {
    test('should get job by id', () => {
      req.params = { id: '1' };
      req.query = { username: 'testuser' };

      const mockJob = {
        id: 1,
        user_id: 1,
        company_name: 'Google',
        position: 'Engineer'
      };

      userOps.getByUsername.get.mockReturnValue({ id: 1, username: 'testuser' });
      jobOps.getById.get.mockReturnValue(mockJob);

      getJobById(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockJob
        })
      );
    });

    test('should return 400 when username is missing', () => {
      req.params = { id: '1' };
      req.query = {};

      getJobById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should return 404 when job not found', () => {
      req.params = { id: '999' };
      req.query = { username: 'testuser' };

      userOps.getByUsername.get.mockReturnValue({ id: 1 });
      jobOps.getById.get.mockReturnValue(null);

      getJobById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('should return 403 when user does not own job', () => {
      req.params = { id: '1' };
      req.query = { username: 'testuser' };

      const mockJob = {
        id: 1,
        user_id: 2, // Different user
        company_name: 'Google'
      };

      userOps.getByUsername.get.mockReturnValue({ id: 1, username: 'testuser' });
      jobOps.getById.get.mockReturnValue(mockJob);

      getJobById(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('updateJob', () => {
    test('should update job successfully', () => {
      req.params = { id: '1' };
      req.body = {
        username: 'testuser',
        company: 'Google',
        position: 'Senior Engineer',
        recruiterScreen: 'Completed'
      };

      const existingJob = {
        id: 1,
        user_id: 1,
        company_id: 1,
        company_name: 'Google',
        position: 'Engineer',
        recruiter_screen: 'Not Started'
      };

      userOps.getByUsername.get.mockReturnValue({ id: 1, username: 'testuser' });
      jobOps.getById.get.mockReturnValueOnce(existingJob).mockReturnValueOnce({
        ...existingJob,
        position: 'Senior Engineer',
        recruiter_screen: 'Completed'
      });
      jobOps.update.run.mockReturnValue({ changes: 1 });

      updateJob(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Job updated successfully'
        })
      );
    });

    test('should return 400 when username is missing', () => {
      req.params = { id: '1' };
      req.body = {};

      updateJob(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should return 404 when user not found', () => {
      req.params = { id: '1' };
      req.body = { username: 'nonexistent' };

      userOps.getByUsername.get.mockReturnValue(null);

      updateJob(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('should return 404 when job not found', () => {
      req.params = { id: '999' };
      req.body = { username: 'testuser' };

      userOps.getByUsername.get.mockReturnValue({ id: 1 });
      jobOps.getById.get.mockReturnValue(null);

      updateJob(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('should return 403 when user does not own job', () => {
      req.params = { id: '1' };
      req.body = { username: 'testuser' };

      userOps.getByUsername.get.mockReturnValue({ id: 1 });
      jobOps.getById.get.mockReturnValue({ id: 1, user_id: 2 });

      updateJob(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('deleteJob', () => {
    test('should delete job successfully', () => {
      req.params = { id: '1' };
      req.query = { username: 'testuser' };

      const mockJob = {
        id: 1,
        user_id: 1,
        company_name: 'Google',
        position: 'Engineer'
      };

      userOps.getByUsername.get.mockReturnValue({ id: 1, username: 'testuser' });
      jobOps.getById.get.mockReturnValue(mockJob);
      jobOps.delete.run.mockReturnValue({ changes: 1 });

      deleteJob(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('Job deleted')
        })
      );
    });

    test('should return 400 when username is missing', () => {
      req.params = { id: '1' };
      req.query = {};

      deleteJob(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should return 404 when user not found', () => {
      req.params = { id: '1' };
      req.query = { username: 'nonexistent' };

      userOps.getByUsername.get.mockReturnValue(null);

      deleteJob(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('should return 404 when job not found', () => {
      req.params = { id: '999' };
      req.query = { username: 'testuser' };

      userOps.getByUsername.get.mockReturnValue({ id: 1 });
      jobOps.getById.get.mockReturnValue(null);

      deleteJob(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('should return 403 when user does not own job', () => {
      req.params = { id: '1' };
      req.query = { username: 'testuser' };

      userOps.getByUsername.get.mockReturnValue({ id: 1 });
      jobOps.getById.get.mockReturnValue({ id: 1, user_id: 2 });

      deleteJob(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    test('should return 404 when delete fails', () => {
      req.params = { id: '1' };
      req.query = { username: 'testuser' };

      userOps.getByUsername.get.mockReturnValue({ id: 1 });
      jobOps.getById.get.mockReturnValue({ id: 1, user_id: 1 });
      jobOps.delete.run.mockReturnValue({ changes: 0 });

      deleteJob(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getJobStats', () => {
    test('should get job statistics', () => {
      req.query = { username: 'testuser' };

      const mockStats = [
        { decision: 'Pending', count: 5 },
        { decision: 'Offer Extended', count: 2 }
      ];

      userOps.getByUsername.get.mockReturnValue({ id: 1, username: 'testuser' });
      jobOps.getByDecision.all.mockReturnValue(mockStats);
      jobOps.countByUser.get.mockReturnValue({ count: 7 });

      getJobStats(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            byDecision: mockStats,
            totalJobs: 7
          })
        })
      );
    });

    test('should return 400 when username is missing', () => {
      req.query = {};

      getJobStats(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should return empty stats when user not found', () => {
      req.query = { username: 'nonexistent' };

      userOps.getByUsername.get.mockReturnValue(null);

      getJobStats(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            totalJobs: 0
          })
        })
      );
    });

    test('should handle errors', () => {
      req.query = { username: 'testuser' };

      userOps.getByUsername.get.mockImplementation(() => {
        throw new Error('Database error');
      });

      getJobStats(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
