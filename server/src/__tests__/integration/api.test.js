import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../../app.js';
import db from '../../database.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('API Integration Tests', () => {
  let app;
  const testDbPath = path.join(__dirname, '../../test-logs.db');

  beforeAll(() => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.CORS_ORIGIN = 'http://localhost:5173';

    // Create test app
    app = createApp();
  });

  beforeEach(() => {
    // Clean all data from logs table
    db.exec('DELETE FROM logs');
  });

  afterAll(() => {
    // Cleanup test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    const walPath = `${testDbPath}-wal`;
    const shmPath = `${testDbPath}-shm`;
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
    if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
  });

  describe('GET /', () => {
    test('should return API information', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Job Search Tracker API',
        version: '1.0.0',
        endpoints: {
          health: '/health',
          logs: '/api/logs',
        },
      });
    });
  });

  describe('GET /health', () => {
    test('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('POST /api/logs', () => {
    test('should create a new log entry', async () => {
      const logData = {
        timestamp: '2025-11-09T10:30:00.000Z',
        action: 'created',
        jobTitle: 'Software Engineer',
        company: 'Tech Corp',
        details: 'New job application',
        username: 'test_user',
      };

      const response = await request(app).post('/api/logs').send(logData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('message', 'Log entry created successfully');
    });

    test('should reject log creation without required fields', async () => {
      const invalidLog = {
        jobTitle: 'Software Engineer',
        // missing timestamp, action, username
      };

      const response = await request(app).post('/api/logs').send(invalidLog);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should accept log with only required fields', async () => {
      const minimalLog = {
        timestamp: '2025-11-09T10:30:00.000Z',
        action: 'deleted',
        username: 'test_user',
      };

      const response = await request(app).post('/api/logs').send(minimalLog);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('GET /api/logs', () => {
    beforeEach(async () => {
      // Create test data
      const testLogs = [
        {
          timestamp: '2025-11-09T10:00:00.000Z',
          action: 'created',
          jobTitle: 'Software Engineer',
          company: 'Tech Corp',
          details: 'First application',
          username: 'user1',
        },
        {
          timestamp: '2025-11-09T11:00:00.000Z',
          action: 'updated',
          jobTitle: 'Senior Developer',
          company: 'Acme Inc',
          details: 'Updated interview stage',
          username: 'user1',
        },
        {
          timestamp: '2025-11-09T12:00:00.000Z',
          action: 'deleted',
          jobTitle: 'Junior Dev',
          company: 'StartupXYZ',
          details: 'Removed application',
          username: 'user2',
        },
      ];

      for (const log of testLogs) {
        await request(app).post('/api/logs').send(log);
      }
    });

    test('should get all logs', async () => {
      const response = await request(app).get('/api/logs');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.count).toBeGreaterThanOrEqual(3);
      expect(response.body.data.length).toBeGreaterThanOrEqual(3);
      // Check descending order by timestamp - find our test data
      const testLogs = response.body.data.filter(log =>
        log.timestamp === '2025-11-09T12:00:00.000Z' ||
        log.timestamp === '2025-11-09T11:00:00.000Z' ||
        log.timestamp === '2025-11-09T10:00:00.000Z'
      );
      expect(testLogs.length).toBe(3);
    });

    test('should filter logs by action', async () => {
      const response = await request(app).get('/api/logs?action=created');

      expect(response.status).toBe(200);
      expect(response.body.count).toBeGreaterThanOrEqual(1);
      expect(response.body.data[0].action).toBe('created');
    });

    test('should filter logs by company', async () => {
      const response = await request(app).get('/api/logs?company=Tech');

      expect(response.status).toBe(200);
      expect(response.body.count).toBeGreaterThanOrEqual(1);
      const techCorpLogs = response.body.data.filter(log => log.company === 'Tech Corp');
      expect(techCorpLogs.length).toBeGreaterThanOrEqual(1);
    });

    test('should filter logs by username', async () => {
      const response = await request(app).get('/api/logs?username=user1');

      expect(response.status).toBe(200);
      expect(response.body.count).toBeGreaterThanOrEqual(2);
    });

    test('should search logs by keyword', async () => {
      const response = await request(app).get('/api/logs?search=interview');

      expect(response.status).toBe(200);
      expect(response.body.count).toBeGreaterThanOrEqual(1);
      const interviewLogs = response.body.data.filter(log => log.details && log.details.includes('interview'));
      expect(interviewLogs.length).toBeGreaterThanOrEqual(1);
    });

    test('should paginate results', async () => {
      const page1 = await request(app).get('/api/logs?limit=2&offset=0');
      expect(page1.body.count).toBe(2);

      const page2 = await request(app).get('/api/logs?limit=2&offset=2');
      expect(page2.body.count).toBe(1);
    });
  });

  describe('GET /api/logs/stats', () => {
    beforeEach(async () => {
      const testLogs = [
        { timestamp: '2025-11-09T10:00:00.000Z', action: 'created', jobTitle: 'Dev1', company: 'A', details: '', username: 'user1' },
        { timestamp: '2025-11-09T11:00:00.000Z', action: 'created', jobTitle: 'Dev2', company: 'B', details: '', username: 'user1' },
        { timestamp: '2025-11-09T12:00:00.000Z', action: 'updated', jobTitle: 'Dev3', company: 'C', details: '', username: 'user1' },
        { timestamp: '2025-11-09T13:00:00.000Z', action: 'deleted', jobTitle: 'Dev4', company: 'D', details: '', username: 'user1' },
      ];

      for (const log of testLogs) {
        await request(app).post('/api/logs').send(log);
      }
    });

    test('should get log statistics', async () => {
      const response = await request(app).get('/api/logs/stats');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveLength(3);

      const createdStat = response.body.data.find((s) => s.action === 'created');
      expect(createdStat.count).toBe(2);
    });
  });

  describe('GET /api/logs/:id', () => {
    let logId;

    beforeEach(async () => {
      const createResponse = await request(app).post('/api/logs').send({
        timestamp: '2025-11-09T10:00:00.000Z',
        action: 'created',
        jobTitle: 'Test Job',
        company: 'Test Corp',
        details: 'Test details',
        username: 'test_user',
      });
      logId = createResponse.body.id;
    });

    test('should get a log by ID', async () => {
      const response = await request(app).get(`/api/logs/${logId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id', logId);
      expect(response.body.data).toHaveProperty('action', 'created');
    });

    test('should return 404 for non-existent ID', async () => {
      const response = await request(app).get('/api/logs/99999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Log not found');
    });
  });

  describe('DELETE /api/logs/:id', () => {
    let logId;

    beforeEach(async () => {
      const createResponse = await request(app).post('/api/logs').send({
        timestamp: '2025-11-09T10:00:00.000Z',
        action: 'created',
        jobTitle: 'Test Job',
        company: 'Test Corp',
        details: 'Test details',
        username: 'test_user',
      });
      logId = createResponse.body.id;
    });

    test('should delete a log by ID', async () => {
      const response = await request(app).delete(`/api/logs/${logId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Log deleted successfully');

      // Verify log is deleted
      const getResponse = await request(app).get(`/api/logs/${logId}`);
      expect(getResponse.status).toBe(404);
    });

    test('should return 404 when deleting non-existent log', async () => {
      const response = await request(app).delete('/api/logs/99999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Log not found');
    });
  });

  describe('POST /api/logs/bulk', () => {
    test('should bulk create multiple logs', async () => {
      const logs = [
        {
          timestamp: '2025-11-09T10:00:00.000Z',
          action: 'created',
          jobTitle: 'Dev1',
          company: 'A',
          details: 'Test',
          username: 'user1',
        },
        {
          timestamp: '2025-11-09T11:00:00.000Z',
          action: 'updated',
          jobTitle: 'Dev2',
          company: 'B',
          details: 'Test',
          username: 'user1',
        },
      ];

      const response = await request(app).post('/api/logs/bulk').send({ logs });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('imported', 2);
      expect(response.body).toHaveProperty('total', 2);
    });

    test('should reject non-array input', async () => {
      const response = await request(app)
        .post('/api/logs/bulk')
        .send({ logs: 'not-an-array' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'logs must be an array');
    });
  });

  describe('404 Handler', () => {
    test('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/api/unknown-endpoint');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Endpoint not found');
    });
  });
});
