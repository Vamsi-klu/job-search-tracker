import { describe, it, expect } from 'vitest'
import {
  validateLogEntry,
  validateLogQuery,
  validateLogId,
  validateDaysParam,
  validateBulkLogs,
  ALLOWED_ACTIONS
} from '../validation.js'

describe('Validation Utilities', () => {
  describe('validateLogEntry', () => {
    it('should validate correct log entry', () => {
      const logData = {
        timestamp: '2025-01-01T00:00:00.000Z',
        action: 'created',
        jobTitle: 'Software Engineer',
        company: 'Tech Corp',
        details: 'Applied to position',
        username: 'testuser'
      }

      const result = validateLogEntry(logData)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.sanitized.timestamp).toBe(logData.timestamp)
      expect(result.sanitized.action).toBe(logData.action)
      expect(result.sanitized.username).toBeDefined()
    })

    it('should reject missing timestamp', () => {
      const logData = {
        action: 'created',
        username: 'testuser'
      }

      const result = validateLogEntry(logData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Timestamp is required')
    })

    it('should reject invalid timestamp format', () => {
      const logData = {
        timestamp: 'invalid-date',
        action: 'created',
        username: 'testuser'
      }

      const result = validateLogEntry(logData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid timestamp format. Must be ISO 8601')
    })

    it('should reject missing action', () => {
      const logData = {
        timestamp: '2025-01-01T00:00:00.000Z',
        username: 'testuser'
      }

      const result = validateLogEntry(logData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Action is required')
    })

    it('should reject invalid action type', () => {
      const logData = {
        timestamp: '2025-01-01T00:00:00.000Z',
        action: 'invalid_action',
        username: 'testuser'
      }

      const result = validateLogEntry(logData)

      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('Invalid action'))).toBe(true)
    })

    it('should reject missing username', () => {
      const logData = {
        timestamp: '2025-01-01T00:00:00.000Z',
        action: 'created'
      }

      const result = validateLogEntry(logData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Username is required')
    })

    it('should reject empty username', () => {
      const logData = {
        timestamp: '2025-01-01T00:00:00.000Z',
        action: 'created',
        username: '   '
      }

      const result = validateLogEntry(logData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Username must be a non-empty string')
    })

    it('should reject username over 100 characters', () => {
      const logData = {
        timestamp: '2025-01-01T00:00:00.000Z',
        action: 'created',
        username: 'a'.repeat(101)
      }

      const result = validateLogEntry(logData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Username must be less than 100 characters')
    })

    it('should sanitize and trim fields', () => {
      const logData = {
        timestamp: '2025-01-01T00:00:00.000Z',
        action: 'created',
        jobTitle: '  <script>alert("xss")</script>  ',
        company: '  Test & Company  ',
        details: '  Some <b>details</b>  ',
        username: '  testuser  '
      }

      const result = validateLogEntry(logData)

      expect(result.isValid).toBe(true)
      expect(result.sanitized.jobTitle).not.toContain('<script>')
      expect(result.sanitized.company).not.toContain('&')
      expect(result.sanitized.company).toContain('&amp;')
      expect(result.sanitized.username).toBe('testuser')
    })

    it('should handle null optional fields', () => {
      const logData = {
        timestamp: '2025-01-01T00:00:00.000Z',
        action: 'created',
        username: 'testuser',
        jobTitle: null,
        company: null,
        details: null
      }

      const result = validateLogEntry(logData)

      expect(result.isValid).toBe(true)
      expect(result.sanitized.jobTitle).toBe(null)
      expect(result.sanitized.company).toBe(null)
      expect(result.sanitized.details).toBe(null)
    })

    it('should reject non-string jobTitle', () => {
      const logData = {
        timestamp: '2025-01-01T00:00:00.000Z',
        action: 'created',
        username: 'testuser',
        jobTitle: 12345
      }

      const result = validateLogEntry(logData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Job title must be a string')
    })

    it('should reject jobTitle over 200 characters', () => {
      const logData = {
        timestamp: '2025-01-01T00:00:00.000Z',
        action: 'created',
        username: 'testuser',
        jobTitle: 'a'.repeat(201)
      }

      const result = validateLogEntry(logData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Job title must be less than 200 characters')
    })

    it('should reject details over 1000 characters', () => {
      const logData = {
        timestamp: '2025-01-01T00:00:00.000Z',
        action: 'created',
        username: 'testuser',
        details: 'a'.repeat(1001)
      }

      const result = validateLogEntry(logData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Details must be less than 1000 characters')
    })
  })

  describe('validateLogQuery', () => {
    it('should validate correct query parameters', () => {
      const query = {
        action: 'created',
        company: 'Tech Corp',
        username: 'testuser',
        days: '7',
        limit: '10',
        offset: '0'
      }

      const result = validateLogQuery(query)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject invalid action', () => {
      const query = { action: 'invalid' }

      const result = validateLogQuery(query)

      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('Invalid action filter'))).toBe(true)
    })

    it('should reject invalid startDate', () => {
      const query = { startDate: 'not-a-date' }

      const result = validateLogQuery(query)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid startDate format. Must be ISO 8601')
    })

    it('should reject invalid days value', () => {
      const query = { days: 'abc' }

      const result = validateLogQuery(query)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Days must be a positive integer between 1 and 3650')
    })

    it('should reject days over 3650', () => {
      const query = { days: '9999' }

      const result = validateLogQuery(query)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Days must be a positive integer between 1 and 3650')
    })

    it('should reject invalid limit', () => {
      const query = { limit: '-5' }

      const result = validateLogQuery(query)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Limit must be a positive integer between 1 and 1000')
    })

    it('should reject limit over 1000', () => {
      const query = { limit: '2000' }

      const result = validateLogQuery(query)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Limit must be a positive integer between 1 and 1000')
    })

    it('should reject negative offset', () => {
      const query = { offset: '-1' }

      const result = validateLogQuery(query)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Offset must be a non-negative integer')
    })

    it('should sanitize search keyword', () => {
      const query = { search: '<script>alert("xss")</script>' }

      const result = validateLogQuery(query)

      expect(result.isValid).toBe(true)
      expect(result.sanitized.search).not.toContain('<script>')
    })
  })

  describe('validateLogId', () => {
    it('should validate correct ID', () => {
      const result = validateLogId('123')

      expect(result.isValid).toBe(true)
      expect(result.value).toBe(123)
      expect(result.error).toBe(null)
    })

    it('should reject non-numeric ID', () => {
      const result = validateLogId('abc')

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Invalid ID. Must be a positive integer')
      expect(result.value).toBe(null)
    })

    it('should reject negative ID', () => {
      const result = validateLogId('-1')

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Invalid ID. Must be a positive integer')
    })

    it('should reject zero ID', () => {
      const result = validateLogId('0')

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Invalid ID. Must be a positive integer')
    })
  })

  describe('validateDaysParam', () => {
    it('should validate correct days value', () => {
      const result = validateDaysParam('30')

      expect(result.isValid).toBe(true)
      expect(result.value).toBe(30)
      expect(result.error).toBe(null)
    })

    it('should reject invalid days', () => {
      const result = validateDaysParam('abc')

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Days must be a positive integer between 1 and 3650')
    })

    it('should reject days over 3650', () => {
      const result = validateDaysParam('5000')

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Days must be a positive integer between 1 and 3650')
    })
  })

  describe('validateBulkLogs', () => {
    it('should validate correct bulk logs', () => {
      const logs = [
        { timestamp: '2025-01-01T00:00:00Z', action: 'created', username: 'user1' },
        { timestamp: '2025-01-01T00:00:00Z', action: 'updated', username: 'user2' }
      ]

      const result = validateBulkLogs(logs)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject non-array', () => {
      const result = validateBulkLogs({})

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Logs must be an array')
    })

    it('should reject empty array', () => {
      const result = validateBulkLogs([])

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Logs array cannot be empty')
    })

    it('should reject array over 1000 items', () => {
      const logs = new Array(1001).fill({ timestamp: '2025-01-01T00:00:00Z', action: 'created', username: 'user' })

      const result = validateBulkLogs(logs)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Cannot import more than 1000 logs at once')
    })
  })

  describe('ALLOWED_ACTIONS', () => {
    it('should export allowed actions', () => {
      expect(ALLOWED_ACTIONS).toEqual(['created', 'updated', 'deleted', 'status_update'])
    })
  })
})
