import { describe, it, expect, beforeEach } from 'vitest';
import { validationResult } from 'express-validator';
import {
  validateLog,
  validateBulkLogs,
  validateId,
  validateDays,
  handleValidationErrors,
} from '../middleware/validation.js';

describe('Validation Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
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
    mockNext = () => {};
  });

  describe('validateLog', () => {
    it('should validate correct log data', async () => {
      mockReq.body = {
        username: 'testuser',
        company: 'Test Company',
        position: 'Software Engineer',
        status: 'Applied',
        date: '2024-01-01T00:00:00.000Z',
        notes: 'Test notes',
        salary: '$100k',
        location: 'Remote',
        jobUrl: 'https://example.com/job',
        contactPerson: 'John Doe',
        contactEmail: 'john@example.com',
      };

      for (const validator of validateLog) {
        await validator.run(mockReq);
      }

      const errors = validationResult(mockReq);
      expect(errors.isEmpty()).toBe(true);
    });

    it('should reject invalid status', async () => {
      mockReq.body = {
        username: 'testuser',
        company: 'Test Company',
        position: 'Software Engineer',
        status: 'InvalidStatus',
        date: '2024-01-01T00:00:00.000Z',
      };

      for (const validator of validateLog) {
        await validator.run(mockReq);
      }

      const errors = validationResult(mockReq);
      expect(errors.isEmpty()).toBe(false);
    });

    it('should reject invalid email', async () => {
      mockReq.body = {
        username: 'testuser',
        company: 'Test Company',
        position: 'Software Engineer',
        status: 'Applied',
        date: '2024-01-01T00:00:00.000Z',
        contactEmail: 'invalid-email',
      };

      for (const validator of validateLog) {
        await validator.run(mockReq);
      }

      const errors = validationResult(mockReq);
      expect(errors.isEmpty()).toBe(false);
    });

    it('should reject invalid URL', async () => {
      mockReq.body = {
        username: 'testuser',
        company: 'Test Company',
        position: 'Software Engineer',
        status: 'Applied',
        date: '2024-01-01T00:00:00.000Z',
        jobUrl: 'not-a-url',
      };

      for (const validator of validateLog) {
        await validator.run(mockReq);
      }

      const errors = validationResult(mockReq);
      expect(errors.isEmpty()).toBe(false);
    });

    it('should reject too long fields', async () => {
      mockReq.body = {
        username: 'testuser',
        company: 'A'.repeat(101),
        position: 'Software Engineer',
        status: 'Applied',
        date: '2024-01-01T00:00:00.000Z',
      };

      for (const validator of validateLog) {
        await validator.run(mockReq);
      }

      const errors = validationResult(mockReq);
      expect(errors.isEmpty()).toBe(false);
    });
  });

  describe('validateBulkLogs', () => {
    it('should validate correct bulk logs', async () => {
      mockReq.body = {
        logs: [
          {
            username: 'testuser',
            company: 'Test Company',
            position: 'Software Engineer',
            status: 'Applied',
            date: '2024-01-01T00:00:00.000Z',
          },
        ],
      };

      for (const validator of validateBulkLogs) {
        await validator.run(mockReq);
      }

      const errors = validationResult(mockReq);
      expect(errors.isEmpty()).toBe(true);
    });

    it('should reject empty logs array', async () => {
      mockReq.body = {
        logs: [],
      };

      for (const validator of validateBulkLogs) {
        await validator.run(mockReq);
      }

      const errors = validationResult(mockReq);
      expect(errors.isEmpty()).toBe(false);
    });

    it('should reject too many logs', async () => {
      mockReq.body = {
        logs: Array(101).fill({
          username: 'testuser',
          company: 'Test Company',
          position: 'Software Engineer',
          status: 'Applied',
          date: '2024-01-01T00:00:00.000Z',
        }),
      };

      for (const validator of validateBulkLogs) {
        await validator.run(mockReq);
      }

      const errors = validationResult(mockReq);
      expect(errors.isEmpty()).toBe(false);
    });
  });

  describe('validateId', () => {
    it('should validate correct ID', async () => {
      mockReq.params = { id: '123' };

      for (const validator of validateId) {
        await validator.run(mockReq);
      }

      const errors = validationResult(mockReq);
      expect(errors.isEmpty()).toBe(true);
    });

    it('should reject negative ID', async () => {
      mockReq.params = { id: '-1' };

      for (const validator of validateId) {
        await validator.run(mockReq);
      }

      const errors = validationResult(mockReq);
      expect(errors.isEmpty()).toBe(false);
    });

    it('should reject non-integer ID', async () => {
      mockReq.params = { id: 'abc' };

      for (const validator of validateId) {
        await validator.run(mockReq);
      }

      const errors = validationResult(mockReq);
      expect(errors.isEmpty()).toBe(false);
    });
  });

  describe('validateDays', () => {
    it('should validate correct days', async () => {
      mockReq.params = { days: '30' };

      for (const validator of validateDays) {
        await validator.run(mockReq);
      }

      const errors = validationResult(mockReq);
      expect(errors.isEmpty()).toBe(true);
    });

    it('should reject days over 365', async () => {
      mockReq.params = { days: '366' };

      for (const validator of validateDays) {
        await validator.run(mockReq);
      }

      const errors = validationResult(mockReq);
      expect(errors.isEmpty()).toBe(false);
    });

    it('should reject zero days', async () => {
      mockReq.params = { days: '0' };

      for (const validator of validateDays) {
        await validator.run(mockReq);
      }

      const errors = validationResult(mockReq);
      expect(errors.isEmpty()).toBe(false);
    });
  });

  describe('handleValidationErrors', () => {
    it('should call next when no errors', () => {
      let nextCalled = false;
      const next = () => {
        nextCalled = true;
      };

      mockReq._validationErrors = [];

      handleValidationErrors(mockReq, mockRes, next);

      expect(nextCalled).toBe(true);
    });

    it('should return 400 with errors when validation fails', async () => {
      mockReq.body = {
        username: '',
        company: '',
        position: '',
        status: 'Invalid',
        date: 'invalid-date',
      };

      for (const validator of validateLog) {
        await validator.run(mockReq);
      }

      handleValidationErrors(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(400);
      expect(mockRes.data).toHaveProperty('error');
      expect(mockRes.data.error).toBe('Validation failed');
      expect(mockRes.data).toHaveProperty('details');
    });
  });
});
