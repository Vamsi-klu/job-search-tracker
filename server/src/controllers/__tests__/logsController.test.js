import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  createLog,
  getLogs,
  getLogStats,
  getLogById,
  deleteLog,
  cleanupOldLogs,
  bulkCreateLogs
} from '../logsController.js'

// Mock the database operations
vi.mock('../../database.js', () => ({
  logOperations: {
    create: {
      run: vi.fn()
    },
    getAll: {
      all: vi.fn()
    },
    getByAction: {
      all: vi.fn()
    },
    getByCompany: {
      all: vi.fn()
    },
    getByUsername: {
      all: vi.fn()
    },
    getByDateRange: {
      all: vi.fn()
    },
    search: {
      all: vi.fn()
    },
    getRecentActivity: {
      all: vi.fn()
    },
    getPaginated: {
      all: vi.fn()
    },
    getStats: {
      all: vi.fn()
    },
    getById: {
      get: vi.fn()
    },
    deleteById: {
      run: vi.fn()
    },
    deleteOlderThan: {
      run: vi.fn()
    }
  }
}))

import { logOperations } from '../../database.js'

describe('Logs Controller', () => {
  let req, res

  beforeEach(() => {
    req = {
      body: {},
      query: {},
      params: {}
    }
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    }
    vi.clearAllMocks()
  })

  describe('createLog', () => {
    it('should create log with valid data', () => {
      req.body = {
        timestamp: '2025-01-01T00:00:00.000Z',
        action: 'created',
        jobTitle: 'Software Engineer',
        company: 'Tech Corp',
        details: 'Applied',
        username: 'testuser'
      }

      logOperations.create.run.mockReturnValue({ lastInsertRowid: 1 })

      createLog(req, res)

      expect(logOperations.create.run).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        id: 1,
        message: 'Log entry created successfully'
      })
    })

    it('should reject invalid data', () => {
      req.body = {
        action: 'invalid_action',
        username: 'testuser'
      }

      createLog(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation failed'
        })
      )
    })

    it('should handle database errors', () => {
      req.body = {
        timestamp: '2025-01-01T00:00:00.000Z',
        action: 'created',
        username: 'testuser'
      }

      logOperations.create.run.mockImplementation(() => {
        throw new Error('Database error')
      })

      createLog(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to create log entry' })
    })
  })

  describe('getLogs', () => {
    it('should get all logs', () => {
      const mockLogs = [
        { id: 1, action: 'created' },
        { id: 2, action: 'updated' }
      ]

      logOperations.getAll.all.mockReturnValue(mockLogs)

      getLogs(req, res)

      expect(logOperations.getAll.all).toHaveBeenCalled()
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        data: mockLogs
      })
    })

    it('should filter by action', () => {
      req.query = { action: 'created' }
      const mockLogs = [{ id: 1, action: 'created' }]

      logOperations.getByAction.all.mockReturnValue(mockLogs)

      getLogs(req, res)

      expect(logOperations.getByAction.all).toHaveBeenCalledWith({ action: 'created' })
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 1,
        data: mockLogs
      })
    })

    it('should filter by company', () => {
      req.query = { company: 'Tech Corp' }
      const mockLogs = [{ id: 1, company: 'Tech Corp' }]

      logOperations.getByCompany.all.mockReturnValue(mockLogs)

      getLogs(req, res)

      expect(logOperations.getByCompany.all).toHaveBeenCalled()
    })

    it('should filter by username', () => {
      req.query = { username: 'testuser' }
      const mockLogs = [{ id: 1, username: 'testuser' }]

      logOperations.getByUsername.all.mockReturnValue(mockLogs)

      getLogs(req, res)

      expect(logOperations.getByUsername.all).toHaveBeenCalledWith({ username: 'testuser' })
    })

    it('should filter by date range', () => {
      req.query = {
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: '2025-01-31T00:00:00.000Z'
      }
      const mockLogs = [{ id: 1 }]

      logOperations.getByDateRange.all.mockReturnValue(mockLogs)

      getLogs(req, res)

      expect(logOperations.getByDateRange.all).toHaveBeenCalled()
    })

    it('should search by keyword', () => {
      req.query = { search: 'test' }
      const mockLogs = [{ id: 1 }]

      logOperations.search.all.mockReturnValue(mockLogs)

      getLogs(req, res)

      expect(logOperations.search.all).toHaveBeenCalled()
    })

    it('should get recent activity', () => {
      req.query = { days: '7' }
      const mockLogs = [{ id: 1 }]

      logOperations.getRecentActivity.all.mockReturnValue(mockLogs)

      getLogs(req, res)

      expect(logOperations.getRecentActivity.all).toHaveBeenCalledWith({ days: '-7' })
    })

    it('should support pagination', () => {
      req.query = { limit: '10', offset: '0' }
      const mockLogs = [{ id: 1 }]

      logOperations.getPaginated.all.mockReturnValue(mockLogs)

      getLogs(req, res)

      expect(logOperations.getPaginated.all).toHaveBeenCalledWith({ limit: 10, offset: 0 })
    })

    it('should reject invalid query parameters', () => {
      req.query = { days: 'invalid' }

      getLogs(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('should handle database errors', () => {
      logOperations.getAll.all.mockImplementation(() => {
        throw new Error('Database error')
      })

      getLogs(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
    })
  })

  describe('getLogStats', () => {
    it('should return log statistics', () => {
      const mockStats = [
        { action: 'created', count: 10 },
        { action: 'updated', count: 5 }
      ]

      logOperations.getStats.all.mockReturnValue(mockStats)

      getLogStats(req, res)

      expect(logOperations.getStats.all).toHaveBeenCalled()
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats
      })
    })

    it('should handle errors', () => {
      logOperations.getStats.all.mockImplementation(() => {
        throw new Error('Database error')
      })

      getLogStats(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
    })
  })

  describe('getLogById', () => {
    it('should get log by valid ID', () => {
      req.params = { id: '1' }
      const mockLog = { id: 1, action: 'created' }

      logOperations.getById.get.mockReturnValue(mockLog)

      getLogById(req, res)

      expect(logOperations.getById.get).toHaveBeenCalledWith({ id: 1 })
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockLog
      })
    })

    it('should return 404 if log not found', () => {
      req.params = { id: '999' }

      logOperations.getById.get.mockReturnValue(null)

      getLogById(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({ error: 'Log not found' })
    })

    it('should reject invalid ID', () => {
      req.params = { id: 'abc' }

      getLogById(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })
  })

  describe('deleteLog', () => {
    it('should delete log by valid ID', () => {
      req.params = { id: '1' }

      logOperations.deleteById.run.mockReturnValue({ changes: 1 })

      deleteLog(req, res)

      expect(logOperations.deleteById.run).toHaveBeenCalledWith({ id: 1 })
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Log deleted successfully'
      })
    })

    it('should return 404 if log not found', () => {
      req.params = { id: '999' }

      logOperations.deleteById.run.mockReturnValue({ changes: 0 })

      deleteLog(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
    })

    it('should reject invalid ID', () => {
      req.params = { id: 'abc' }

      deleteLog(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })
  })

  describe('cleanupOldLogs', () => {
    it('should cleanup old logs', () => {
      req.params = { days: '30' }

      logOperations.deleteOlderThan.run.mockReturnValue({ changes: 10 })

      cleanupOldLogs(req, res)

      expect(logOperations.deleteOlderThan.run).toHaveBeenCalledWith({ days: '-30' })
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        deleted: 10,
        message: 'Deleted 10 log entries older than 30 days'
      })
    })

    it('should reject invalid days', () => {
      req.params = { days: 'abc' }

      cleanupOldLogs(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })
  })

  describe('bulkCreateLogs', () => {
    it('should bulk create logs', () => {
      req.body = {
        logs: [
          { timestamp: '2025-01-01T00:00:00Z', action: 'created', username: 'user1' },
          { timestamp: '2025-01-01T00:00:00Z', action: 'updated', username: 'user2' }
        ]
      }

      logOperations.create.run.mockReturnValue({ lastInsertRowid: 1 })

      bulkCreateLogs(req, res)

      expect(logOperations.create.run).toHaveBeenCalledTimes(2)
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        imported: 2,
        total: 2,
        errors: undefined
      })
    })

    it('should reject non-array', () => {
      req.body = { logs: {} }

      bulkCreateLogs(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('should handle partial failures', () => {
      req.body = {
        logs: [
          { timestamp: '2025-01-01T00:00:00Z', action: 'created', username: 'user1' },
          { timestamp: 'invalid', action: 'created', username: 'user2' }
        ]
      }

      logOperations.create.run.mockReturnValue({ lastInsertRowid: 1 })

      bulkCreateLogs(req, res)

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          imported: 1,
          total: 2,
          errors: expect.arrayContaining([
            expect.objectContaining({ index: 1 })
          ])
        })
      )
    })
  })
})
