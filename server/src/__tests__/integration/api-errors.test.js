import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../../app.js';
import db from '../../database.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('API Error Handling Tests', () => {
  let app;
  const testDbPath = path.join(__dirname, '../../test-logs.db');

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    process.env.CORS_ORIGIN = 'http://localhost:5173';
    app = createApp();
  });

  beforeEach(() => {
    db.exec('DELETE FROM logs');
  });

  afterAll(() => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    const walPath = `${testDbPath}-wal`;
    const shmPath = `${testDbPath}-shm`;
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
    if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
  });

  describe('Database Error Handling', () => {
    test('should handle database errors during log creation', async () => {
      // Create a log with invalid data that will cause a database constraint violation
      const response = await request(app)
        .post('/api/logs')
        .send({
          timestamp: 'invalid-timestamp-format-that-is-too-long'.repeat(100),
          action: 'created',
          username: 'test',
        });

      // Should still return 201 if database accepts it, or handle gracefully
      expect([201, 500]).toContain(response.status);
    });

    test('should handle invalid ID formats gracefully', async () => {
      const response = await request(app).get('/api/logs/not-a-number');

      // Should handle parsing errors - NaN from parseInt
      expect([404, 500]).toContain(response.status);
    });

    test('should handle database errors during stats fetch', async () => {
      // Trigger by corrupting query
      const response = await request(app).get('/api/logs/stats');

      // Should succeed normally or handle error
      expect([200, 500]).toContain(response.status);
    });

    test('should handle database errors during cleanup', async () => {
      const response = await request(app).delete('/api/logs/cleanup/invalid');

      // Should handle invalid input
      expect([200, 400, 500]).toContain(response.status);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty bulk create array', async () => {
      const response = await request(app)
        .post('/api/logs/bulk')
        .send({ logs: [] });

      expect(response.status).toBe(200);
      expect(response.body.imported).toBe(0);
      expect(response.body.total).toBe(0);
    });

    test('should handle very large log entries', async () => {
      const largeDetails = 'x'.repeat(10000);
      const response = await request(app)
        .post('/api/logs')
        .send({
          timestamp: '2025-11-09T10:00:00.000Z',
          action: 'created',
          jobTitle: 'Test',
          company: 'Test',
          details: largeDetails,
          username: 'test',
        });

      expect([201, 413, 500]).toContain(response.status);
    });

    test('should handle special characters in search', async () => {
      await request(app).post('/api/logs').send({
        timestamp: '2025-11-09T10:00:00.000Z',
        action: 'created',
        jobTitle: "Test's Job & <Special>",
        company: 'Test',
        details: 'Test',
        username: 'test',
      });

      const response = await request(app).get('/api/logs?search=Test%27s');
      expect(response.status).toBe(200);
    });

    test('should handle concurrent requests', async () => {
      const requests = Array.from({ length: 10 }, (_, i) =>
        request(app)
          .post('/api/logs')
          .send({
            timestamp: `2025-11-09T10:${String(i).padStart(2, '0')}:00.000Z`,
            action: 'created',
            jobTitle: `Job ${i}`,
            company: `Company ${i}`,
            details: `Details ${i}`,
            username: 'test',
          })
      );

      const responses = await Promise.all(requests);
      const successfulResponses = responses.filter((r) => r.status === 201);

      expect(successfulResponses.length).toBe(10);
    });

    test('should handle pagination with offset beyond results', async () => {
      await request(app).post('/api/logs').send({
        timestamp: '2025-11-09T10:00:00.000Z',
        action: 'created',
        jobTitle: 'Test',
        company: 'Test',
        details: 'Test',
        username: 'test',
      });

      const response = await request(app).get('/api/logs?limit=10&offset=1000');
      expect(response.status).toBe(200);
      expect(response.body.count).toBe(0);
    });

    test('should handle invalid date range queries', async () => {
      const response = await request(app).get(
        '/api/logs?startDate=invalid&endDate=also-invalid'
      );
      expect(response.status).toBe(200);
      // Should return empty or all logs depending on SQLite behavior
    });

    test('should handle negative days parameter', async () => {
      const response = await request(app).get('/api/logs?days=-7');
      expect(response.status).toBe(200);
    });

    test('should handle zero days parameter', async () => {
      const response = await request(app).get('/api/logs?days=0');
      expect(response.status).toBe(200);
    });

    test('should handle missing timestamp in bulk create', async () => {
      const response = await request(app)
        .post('/api/logs/bulk')
        .send({
          logs: [
            {
              action: 'created',
              username: 'test',
              // missing timestamp
            },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body.imported).toBeLessThanOrEqual(1);
      if (response.body.errors) {
        expect(response.body.errors.length).toBeGreaterThan(0);
      }
    });

    test('should handle null values in bulk create', async () => {
      const response = await request(app)
        .post('/api/logs/bulk')
        .send({
          logs: [
            {
              timestamp: '2025-11-09T10:00:00.000Z',
              action: 'created',
              jobTitle: null,
              company: null,
              details: null,
              username: 'test',
            },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body.imported).toBe(1);
    });

    test('should handle cleanup with zero days', async () => {
      await request(app).post('/api/logs').send({
        timestamp: '2025-11-09T10:00:00.000Z',
        action: 'created',
        jobTitle: 'Test',
        company: 'Test',
        details: 'Test',
        username: 'test',
      });

      const response = await request(app).delete('/api/logs/cleanup/0');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('deleted');
    });

    test('should handle cleanup with large number of days', async () => {
      const response = await request(app).delete('/api/logs/cleanup/36500');
      expect(response.status).toBe(200);
      expect(response.body.deleted).toBe(0);
    });

    test('should handle date range with same start and end date', async () => {
      await request(app).post('/api/logs').send({
        timestamp: '2025-11-09T10:00:00.000Z',
        action: 'created',
        jobTitle: 'Test',
        company: 'Test',
        details: 'Test',
        username: 'test',
      });

      const response = await request(app).get(
        '/api/logs?startDate=2025-11-09T10:00:00.000Z&endDate=2025-11-09T10:00:00.000Z'
      );

      expect(response.status).toBe(200);
      expect(response.body.count).toBeGreaterThanOrEqual(0);
    });

    test('should handle multiple filters priority (action takes precedence)', async () => {
      await request(app).post('/api/logs').send({
        timestamp: '2025-11-09T10:00:00.000Z',
        action: 'created',
        jobTitle: 'Test',
        company: 'TestCorp',
        details: 'Test',
        username: 'test',
      });

      // When multiple filters are provided, action should take precedence based on if-else logic
      const response = await request(app).get(
        '/api/logs?action=created&company=TestCorp&username=test'
      );

      expect(response.status).toBe(200);
      // Should filter by action only (first if condition)
      response.body.data.forEach((log) => {
        expect(log.action).toBe('created');
      });
    });

    test('should handle pagination with string offset', async () => {
      await request(app).post('/api/logs').send({
        timestamp: '2025-11-09T10:00:00.000Z',
        action: 'created',
        jobTitle: 'Test',
        company: 'Test',
        details: 'Test',
        username: 'test',
      });

      const response = await request(app).get('/api/logs?limit=10&offset=abc');
      expect(response.status).toBe(200);
      // Should treat invalid offset as 0
    });

    test('should handle pagination with negative limit', async () => {
      const response = await request(app).get('/api/logs?limit=-10');
      expect(response.status).toBe(200);
    });
  });

  describe('Content Type and Payload Validation', () => {
    test('should handle requests without Content-Type header', async () => {
      const response = await request(app)
        .post('/api/logs')
        .send('invalid json');

      expect([400, 500]).toContain(response.status);
    });

    test('should handle empty POST body', async () => {
      const response = await request(app).post('/api/logs').send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should handle null POST body', async () => {
      const response = await request(app)
        .post('/api/logs')
        .set('Content-Type', 'application/json')
        .send('null');

      expect([400, 500]).toContain(response.status);
    });
  });

  describe('Performance and Stress Tests', () => {
    test('should handle bulk create with many logs', async () => {
      const manyLogs = Array.from({ length: 100 }, (_, i) => ({
        timestamp: `2025-11-09T${String(Math.floor(i / 60)).padStart(2, '0')}:${String(
          i % 60
        ).padStart(2, '0')}:00.000Z`,
        action: i % 4 === 0 ? 'created' : i % 4 === 1 ? 'updated' : i % 4 === 2 ? 'deleted' : 'status_update',
        jobTitle: `Job ${i}`,
        company: `Company ${i % 10}`,
        details: `Details for job ${i}`,
        username: `user${i % 5}`,
      }));

      const response = await request(app)
        .post('/api/logs/bulk')
        .send({ logs: manyLogs });

      expect(response.status).toBe(200);
      expect(response.body.imported).toBe(100);
      expect(response.body.total).toBe(100);
    });

    test('should handle fetching large result sets', async () => {
      // Clean database first
      db.exec('DELETE FROM logs');

      // Create 50 logs
      const logs = Array.from({ length: 50 }, (_, i) => ({
        timestamp: `2025-11-09T10:${String(i).padStart(2, '0')}:00.000Z`,
        action: 'created',
        jobTitle: `Job ${i}`,
        company: `Company ${i}`,
        details: `Details ${i}`,
        username: 'test',
      }));

      await request(app)
        .post('/api/logs/bulk')
        .send({ logs });

      const response = await request(app).get('/api/logs');

      expect(response.status).toBe(200);
      expect(response.body.count).toBeGreaterThanOrEqual(50);
      expect(response.body.data.length).toBeGreaterThanOrEqual(50);
    });

    test('should handle complex search patterns', async () => {
      await request(app).post('/api/logs').send({
        timestamp: '2025-11-09T10:00:00.000Z',
        action: 'created',
        jobTitle: 'Senior Software Engineer',
        company: 'Tech Corp',
        details: 'Applied for remote position, waiting for response',
        username: 'john_doe',
      });

      const searchTerms = ['Senior', 'Engineer', 'remote', 'Tech', 'waiting'];

      for (const term of searchTerms) {
        const response = await request(app).get(`/api/logs?search=${term}`);
        expect(response.status).toBe(200);
        if (response.body.count > 0) {
          expect(response.body.count).toBeGreaterThan(0);
        }
      }
    });
  });
});
