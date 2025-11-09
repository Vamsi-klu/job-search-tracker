import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createLog,
  getLogs,
  getLogStats,
  getLogById,
  deleteLog,
  cleanupOldLogs,
  bulkCreateLogs,
} from '../controllers/logsController.js';

// Mock the database and logger
vi.mock('../database.js', () => ({
  logStore: {
    createLog: vi.fn(),
    queryLogs: vi.fn(),
    getStats: vi.fn(),
    getById: vi.fn(),
    deleteById: vi.fn(),
    deleteOlderThan: vi.fn(),
    bulkInsert: vi.fn(),
  },
}));

vi.mock('../middleware/logger.js', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

import { logStore } from '../database.js';
import logger from '../middleware/logger.js';

describe('Logs Controller', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      query: {},
      user: { username: 'testuser', userId: '123' },
    };
    mockRes = {
      status: function (code) {
        this.statusCode = code;
        return this;
      },
      json: function (data) {
        this.data = data;
        return this;
      },
    };
    vi.clearAllMocks();
  });

  describe('createLog', () => {
    it('should create a log successfully', () => {
      mockReq.body = {
        timestamp: '2024-01-01T00:00:00.000Z',
        action: 'created',
        jobTitle: 'Software Engineer',
        company: 'Test Company',
      };

      logStore.createLog.mockReturnValue(1);

      createLog(mockReq, mockRes);

      expect(logStore.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: '2024-01-01T00:00:00.000Z',
          action: 'created',
          username: 'testuser',
        })
      );
      expect(mockRes.statusCode).toBe(201);
      expect(mockRes.data.success).toBe(true);
      expect(mockRes.data.id).toBe(1);
    });

    it('should return 400 when missing required fields', () => {
      mockReq.body = {};

      createLog(mockReq, mockRes);

      expect(mockRes.statusCode).toBe(400);
      expect(mockRes.data.error).toContain('required');
    });

    it('should handle errors during log creation', () => {
      mockReq.body = {
        timestamp: '2024-01-01T00:00:00.000Z',
        action: 'created',
      };

      logStore.createLog.mockImplementation(() => {
        throw new Error('Database error');
      });

      createLog(mockReq, mockRes);

      expect(mockRes.statusCode).toBe(500);
      expect(mockRes.data.error).toBe('Failed to create log entry');
      expect(logger.error).toHaveBeenCalled();
    });
  });

    describe('getLogs', () => {
    it('should get all logs for authenticated user', () => {
      const mockLogs = [
        { id: 1, username: 'testuser', action: 'created' },
        { id: 2, username: 'testuser', action: 'updated' },
      ];

      logStore.queryLogs.mockReturnValue(mockLogs);

      getLogs(mockReq, mockRes);

      expect(logStore.queryLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'testuser',
        })
      );
      expect(mockRes.data.success).toBe(true);
      expect(mockRes.data.count).toBe(2);
      expect(mockRes.data.data).toEqual(mockLogs);
    });

    it('should handle query filters', () => {
      mockReq.query = {
        action: 'created',
        company: 'Test Company',
        days: '7',
      };

      logStore.queryLogs.mockReturnValue([]);

      getLogs(mockReq, mockRes);

      expect(logStore.queryLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'created',
          company: 'Test Company',
          days: '7',
          username: 'testuser',
        })
      );
    });

    it('should handle errors during log retrieval', () => {
      logStore.queryLogs.mockImplementation(() => {
        throw new Error('Database error');
      });

      getLogs(mockReq, mockRes);

      expect(mockRes.statusCode).toBe(500);
      expect(mockRes.data.error).toBe('Failed to fetch logs');
    });
  });

    describe('getLogStats', () => {
    it('should return log statistics', () => {
      const mockStats = {
        total: 10,
        byAction: { created: 5, updated: 3, deleted: 2 },
      };

      logStore.getStats.mockReturnValue(mockStats);

      getLogStats(mockReq, mockRes);

      expect(mockRes.data.success).toBe(true);
      expect(mockRes.data.data).toEqual(mockStats);
    });

    it('should handle errors during stats retrieval', () => {
      logStore.getStats.mockImplementation(() => {
        throw new Error('Database error');
      });

      getLogStats(mockReq, mockRes);

      expect(mockRes.statusCode).toBe(500);
      expect(mockRes.data.error).toBe('Failed to fetch log statistics');
    });
  });

    describe('getLogById', () => {
    it('should get log by ID for owner', () => {
      mockReq.params = { id: '1' };
      const mockLog = { id: 1, username: 'testuser', action: 'created' };

      logStore.getById.mockReturnValue(mockLog);

      getLogById(mockReq, mockRes);

      expect(logStore.getById).toHaveBeenCalledWith(1);
      expect(mockRes.data.success).toBe(true);
      expect(mockRes.data.data).toEqual(mockLog);
    });

    it('should return 404 when log not found', () => {
      mockReq.params = { id: '999' };
      logStore.getById.mockReturnValue(null);

      getLogById(mockReq, mockRes);

      expect(mockRes.statusCode).toBe(404);
      expect(mockRes.data.error).toBe('Log not found');
    });

    it('should return 403 when accessing other user log', () => {
      mockReq.params = { id: '1' };
      const mockLog = { id: 1, username: 'otheruser', action: 'created' };

      logStore.getById.mockReturnValue(mockLog);

      getLogById(mockReq, mockRes);

      expect(mockRes.statusCode).toBe(403);
      expect(mockRes.data.error).toBe('Access denied');
    });
  });

    describe('deleteLog', () => {
    it('should delete log by ID for owner', () => {
      mockReq.params = { id: '1' };
      const mockLog = { id: 1, username: 'testuser', action: 'created' };

      logStore.getById.mockReturnValue(mockLog);
      logStore.deleteById.mockReturnValue({ changes: 1 });

      deleteLog(mockReq, mockRes);

      expect(logStore.deleteById).toHaveBeenCalledWith(1);
      expect(mockRes.data.success).toBe(true);
      expect(logger.info).toHaveBeenCalled();
    });

    it('should return 404 when deleting non-existent log', () => {
      mockReq.params = { id: '999' };
      logStore.getById.mockReturnValue(null);

      deleteLog(mockReq, mockRes);

      expect(mockRes.statusCode).toBe(404);
      expect(mockRes.data.error).toBe('Log not found');
    });

    it('should return 403 when deleting other user log', () => {
      mockReq.params = { id: '1' };
      const mockLog = { id: 1, username: 'otheruser', action: 'created' };

      logStore.getById.mockReturnValue(mockLog);

      deleteLog(mockReq, mockRes);

      expect(mockRes.statusCode).toBe(403);
      expect(mockRes.data.error).toBe('Access denied');
    });
  });

    describe('cleanupOldLogs', () => {
    it('should cleanup old logs', () => {
      mockReq.params = { days: '30' };
      logStore.deleteOlderThan.mockReturnValue({ changes: 5 });

      cleanupOldLogs(mockReq, mockRes);

      expect(logStore.deleteOlderThan).toHaveBeenCalledWith(30);
      expect(mockRes.data.success).toBe(true);
      expect(mockRes.data.deleted).toBe(5);
    });

    it('should handle invalid days parameter', () => {
      mockReq.params = { days: 'invalid' };

      cleanupOldLogs(mockReq, mockRes);

      expect(mockRes.statusCode).toBe(400);
      expect(mockRes.data.error).toBe('Invalid days parameter');
    });
  });

  describe('bulkCreateLogs', () => {
    it('should bulk create logs', () => {
      mockReq.body = {
        logs: [
          { timestamp: '2024-01-01', action: 'created' },
          { timestamp: '2024-01-02', action: 'updated' },
        ],
      };

      logStore.bulkInsert.mockReturnValue(2);

      bulkCreateLogs(mockReq, mockRes);

      expect(logStore.bulkInsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ username: 'testuser' }),
        ])
      );
      expect(mockRes.data.success).toBe(true);
      expect(mockRes.data.imported).toBe(2);
    });

    it('should return 400 when logs is not an array', () => {
      mockReq.body = { logs: 'not-an-array' };

      bulkCreateLogs(mockReq, mockRes);

      expect(mockRes.statusCode).toBe(400);
      expect(mockRes.data.error).toBe('logs must be an array');
    });
  });
});
