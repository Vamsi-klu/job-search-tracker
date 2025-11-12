import { describe, it, expect, beforeEach, vi } from 'vitest';
import { logsAPI, checkHealth } from '../services/api';

// Mock fetch globally
global.fetch = vi.fn();

describe('Logs API Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  describe('logsAPI.create', () => {
    it('should create a log entry successfully', async () => {
      const mockResponse = {
        success: true,
        id: 1,
        message: 'Log entry created successfully',
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const logData = {
        timestamp: '2025-11-09T10:30:00.000Z',
        action: 'created',
        jobTitle: 'Software Engineer',
        company: 'Tech Corp',
        details: 'Test',
        username: 'test_user',
      };

      const result = await logsAPI.create(logData);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/logs',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(logData),
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle fetch errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Server error' }),
      });

      const logData = {
        timestamp: '2025-11-09T10:30:00.000Z',
        action: 'created',
        jobTitle: 'Test',
        company: 'Test',
        details: 'Test',
        username: 'test',
      };

      await expect(logsAPI.create(logData)).rejects.toThrow('Server error');
    });
  });

  describe('logsAPI.getAll', () => {
    it('should get all logs without filters', async () => {
      const mockLogs = {
        success: true,
        count: 2,
        data: [
          { id: 1, action: 'created', company: 'A' },
          { id: 2, action: 'updated', company: 'B' },
        ],
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLogs,
      });

      const result = await logsAPI.getAll();

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/api/logs');
      expect(result).toEqual(mockLogs);
    });

    it('should get logs with filters', async () => {
      const mockLogs = {
        success: true,
        count: 1,
        data: [{ id: 1, action: 'created', company: 'A' }],
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLogs,
      });

      const filters = { action: 'created', company: 'A' };
      await logsAPI.getAll(filters);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/logs?action=created&company=A'
      );
    });

    it('should filter out undefined values from query params', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });

      await logsAPI.getAll({ action: 'created', company: undefined, search: null });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/logs?action=created'
      );
    });
  });

  describe('logsAPI.getStats', () => {
    it('should get log statistics', async () => {
      const mockStats = {
        success: true,
        data: [
          { action: 'created', count: 5 },
          { action: 'updated', count: 3 },
        ],
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats,
      });

      const result = await logsAPI.getStats();

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/api/logs/stats');
      expect(result).toEqual(mockStats);
    });
  });

  describe('logsAPI.getById', () => {
    it('should get a log by ID', async () => {
      const mockLog = {
        success: true,
        data: { id: 1, action: 'created', company: 'Test Corp' },
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLog,
      });

      const result = await logsAPI.getById(1);

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/api/logs/1');
      expect(result).toEqual(mockLog);
    });
  });

  describe('logsAPI.delete', () => {
    it('should delete a log by ID', async () => {
      const mockResponse = {
        success: true,
        message: 'Log deleted successfully',
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await logsAPI.delete(1);

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/api/logs/1', {
        method: 'DELETE',
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('logsAPI.bulkCreate', () => {
    it('should bulk create logs', async () => {
      const mockResponse = {
        success: true,
        imported: 2,
        total: 2,
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const logs = [
        { timestamp: '2025-11-09T10:00:00.000Z', action: 'created', username: 'user1' },
        { timestamp: '2025-11-09T11:00:00.000Z', action: 'updated', username: 'user1' },
      ];

      const result = await logsAPI.bulkCreate(logs);

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/api/logs/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs }),
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('logsAPI.query', () => {
    it('should be an alias for getAll', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });

      await logsAPI.query({ action: 'created' });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/logs?action=created'
      );
    });
  });

  describe('logsAPI.getRecent', () => {
    it('should get recent logs', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });

      await logsAPI.getRecent(7);

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/api/logs?days=7');
    });
  });

  describe('logsAPI.search', () => {
    it('should search logs by keyword', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });

      await logsAPI.search('engineer');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/logs?search=engineer'
      );
    });
  });

  describe('logsAPI.getByAction', () => {
    it('should filter logs by action', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });

      await logsAPI.getByAction('created');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/logs?action=created'
      );
    });
  });

  describe('logsAPI.getByCompany', () => {
    it('should filter logs by company', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });

      await logsAPI.getByCompany('Tech Corp');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/logs?company=Tech+Corp'
      );
    });
  });

  describe('logsAPI.getByUsername', () => {
    it('should filter logs by username', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });

      await logsAPI.getByUsername('john_doe');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/logs?username=john_doe'
      );
    });
  });

  describe('logsAPI.getByDateRange', () => {
    it('should filter logs by date range', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });

      await logsAPI.getByDateRange('2025-11-01T00:00:00.000Z', '2025-11-09T23:59:59.000Z');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/logs?startDate=2025-11-01T00%3A00%3A00.000Z&endDate=2025-11-09T23%3A59%3A59.000Z'
      );
    });
  });

  describe('checkHealth', () => {
    it('should check API health', async () => {
      const mockHealth = {
        status: 'healthy',
        timestamp: '2025-11-09T10:00:00.000Z',
        uptime: 100,
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockHealth,
      });

      const result = await checkHealth();

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/health');
      expect(result).toEqual(mockHealth);
    });

    it('should handle health check errors gracefully', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await checkHealth();

      expect(result).toEqual({
        status: 'unhealthy',
        error: 'Network error',
      });
    });
  });
});
