import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { logsAPI, checkHealth } from '../api'

global.fetch = vi.fn()

describe('Logs API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('create', () => {
    it('should create a log entry successfully', async () => {
      const mockResponse = {
        success: true,
        id: 1,
        message: 'Log entry created successfully'
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const logData = {
        timestamp: '2025-01-01T00:00:00.000Z',
        action: 'created',
        jobTitle: 'Software Engineer',
        company: 'Tech Corp',
        details: 'Applied to position',
        username: 'testuser'
      }

      const result = await logsAPI.create(logData)

      expect(result).toEqual(mockResponse)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/logs'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(logData)
        })
      )
    })

    it('should retry on failure', async () => {
      global.fetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true })
        })

      const result = await logsAPI.create({})

      expect(global.fetch).toHaveBeenCalledTimes(2)
      expect(result.success).toBe(true)
    })

    it('should throw error after max retries', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'))

      await expect(logsAPI.create({})).rejects.toThrow('Network error')

      expect(global.fetch).toHaveBeenCalledTimes(2) // 2 retries for POST
    })
  })

  describe('getAll', () => {
    it('should fetch all logs', async () => {
      const mockLogs = {
        success: true,
        count: 2,
        data: [
          { id: 1, action: 'created' },
          { id: 2, action: 'updated' }
        ]
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLogs
      })

      const result = await logsAPI.getAll()

      expect(result).toEqual(mockLogs)
      expect(global.fetch).toHaveBeenCalled()
    })

    it('should fetch logs with filters', async () => {
      const mockLogs = {
        success: true,
        count: 1,
        data: [{ id: 1, action: 'created', company: 'Tech Corp' }]
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLogs
      })

      const result = await logsAPI.getAll({ company: 'Tech Corp', days: 7 })

      expect(result).toEqual(mockLogs)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('company=Tech+Corp'),
        expect.any(Object)
      )
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('days=7'),
        expect.any(Object)
      )
    })

    it('should handle empty filters', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] })
      })

      await logsAPI.getAll({ emptyFilter: '' })

      const callUrl = global.fetch.mock.calls[0][0]
      expect(callUrl).not.toContain('emptyFilter')
    })
  })

  describe('delete', () => {
    it('should delete a log by ID', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Log deleted successfully' })
      })

      const result = await logsAPI.delete(1)

      expect(result.success).toBe(true)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/logs/1'),
        expect.objectContaining({ method: 'DELETE' })
      )
    })
  })

  describe('bulkCreate', () => {
    it('should bulk create logs', async () => {
      const mockResponse = {
        success: true,
        imported: 2,
        total: 2
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const logs = [
        { timestamp: '2025-01-01T00:00:00Z', action: 'created', username: 'user1' },
        { timestamp: '2025-01-01T00:00:00Z', action: 'updated', username: 'user2' }
      ]

      const result = await logsAPI.bulkCreate(logs)

      expect(result).toEqual(mockResponse)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/logs/bulk'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ logs })
        })
      )
    })
  })

  describe('error handling', () => {
    it('should handle 404 errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' })
      })

      await expect(logsAPI.getById(999)).rejects.toThrow('Not found')
    })

    it('should handle 500 errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' })
      })

      await expect(logsAPI.getAll()).rejects.toThrow('Internal server error')
    })

    it('should handle malformed JSON responses', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Invalid JSON')
        }
      })

      await expect(logsAPI.getAll()).rejects.toThrow()
    })
  })

  describe('timeout handling', () => {
    it('should timeout long requests', async () => {
      global.fetch.mockImplementationOnce(() =>
        new Promise((resolve) => setTimeout(resolve, 15000))
      )

      await expect(logsAPI.getAll()).rejects.toThrow()
    }, 12000)
  })

  describe('query helpers', () => {
    it('should query logs', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] })
      })

      await logsAPI.query({ action: 'created' })

      expect(global.fetch).toHaveBeenCalled()
    })

    it('should get recent logs', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] })
      })

      await logsAPI.getRecent(30)

      const callUrl = global.fetch.mock.calls[0][0]
      expect(callUrl).toContain('days=30')
    })

    it('should search logs', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] })
      })

      await logsAPI.search('test keyword')

      const callUrl = global.fetch.mock.calls[0][0]
      expect(callUrl).toContain('search=test')
    })

    it('should get logs by action', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] })
      })

      await logsAPI.getByAction('created')

      const callUrl = global.fetch.mock.calls[0][0]
      expect(callUrl).toContain('action=created')
    })

    it('should get logs by company', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] })
      })

      await logsAPI.getByCompany('Tech Corp')

      const callUrl = global.fetch.mock.calls[0][0]
      expect(callUrl).toContain('company=Tech')
    })

    it('should get logs by username', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] })
      })

      await logsAPI.getByUsername('testuser')

      const callUrl = global.fetch.mock.calls[0][0]
      expect(callUrl).toContain('username=testuser')
    })

    it('should get logs by date range', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] })
      })

      await logsAPI.getByDateRange('2025-01-01', '2025-01-31')

      const callUrl = global.fetch.mock.calls[0][0]
      expect(callUrl).toContain('startDate=2025-01-01')
      expect(callUrl).toContain('endDate=2025-01-31')
    })
  })

  describe('checkHealth', () => {
    it('should check server health successfully', async () => {
      const mockHealth = {
        status: 'healthy',
        timestamp: '2025-01-01T00:00:00Z',
        uptime: 1000
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockHealth
      })

      const result = await checkHealth()

      expect(result).toEqual(mockHealth)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/health'),
        expect.any(Object)
      )
    })

    it('should handle health check failure', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Connection failed'))

      const result = await checkHealth()

      expect(result.status).toBe('unhealthy')
      expect(result.error).toBe('Connection failed')
    })
  })
})
