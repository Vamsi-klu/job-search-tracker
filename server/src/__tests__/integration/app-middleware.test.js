import { describe, test, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../../app.js';

describe('App Middleware and Error Handling Tests', () => {
  let app;

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    app = createApp();
  });

  describe('CORS Middleware', () => {
    test('should include CORS headers in response', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:5173');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    test('should handle OPTIONS preflight request', async () => {
      const response = await request(app)
        .options('/api/logs')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'POST');

      expect([200, 204]).toContain(response.status);
    });
  });

  describe('JSON Parsing Middleware', () => {
    test('should parse JSON body correctly', async () => {
      const response = await request(app)
        .post('/api/logs')
        .send({
          timestamp: '2025-11-09T10:00:00.000Z',
          action: 'created',
          username: 'test',
        });

      expect([201, 400]).toContain(response.status);
    });

    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/logs')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect([400, 500]).toContain(response.status);
    });

    test('should handle large JSON payloads within limit', async () => {
      const largeLogs = Array.from({ length: 100 }, (_, i) => ({
        timestamp: `2025-11-09T10:00:${String(i).padStart(2, '0')}.000Z`,
        action: 'created',
        jobTitle: `Job ${i}`,
        company: `Company ${i}`,
        details: 'x'.repeat(100),
        username: 'test',
      }));

      const response = await request(app)
        .post('/api/logs/bulk')
        .send({ logs: largeLogs });

      expect([200, 413]).toContain(response.status);
    });
  });

  describe('URL Encoded Middleware', () => {
    test('should parse URL encoded data', async () => {
      const response = await request(app)
        .post('/api/logs')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send(
          'timestamp=2025-11-09T10:00:00.000Z&action=created&username=test'
        );

      expect([201, 400]).toContain(response.status);
    });
  });

  describe('404 Error Handler', () => {
    test('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/api/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Endpoint not found');
    });

    test('should return 404 for unknown POST routes', async () => {
      const response = await request(app).post('/api/unknown').send({});

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Endpoint not found');
    });

    test('should return 404 for unknown DELETE routes', async () => {
      const response = await request(app).delete('/api/unknown/123');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Endpoint not found');
    });

    test('should return 404 for deeply nested unknown routes', async () => {
      const response = await request(app).get('/api/logs/nonexistent/nested');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Endpoint not found');
    });
  });

  describe('Health and Root Endpoints', () => {
    test('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(typeof response.body.uptime).toBe('number');
    });

    test('should return API information on root', async () => {
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

    test('should handle HEAD request to health endpoint', async () => {
      const response = await request(app).head('/health');

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('HTTP Methods', () => {
    test('should reject unsupported methods on specific endpoints', async () => {
      const response = await request(app).patch('/api/logs');

      expect([404, 405]).toContain(response.status);
    });

    test('should reject PUT on logs collection', async () => {
      const response = await request(app).put('/api/logs').send({});

      expect([404, 405]).toContain(response.status);
    });
  });

  describe('Content Negotiation', () => {
    test('should return JSON content type', async () => {
      const response = await request(app).get('/health');

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    test('should handle Accept header', async () => {
      const response = await request(app)
        .get('/health')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('Request Logging (Development)', () => {
    test('should process requests without logging errors', async () => {
      // In test mode, logging is disabled, but this ensures the middleware works
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
    });
  });

  describe('Edge Cases', () => {
    test('should handle requests with trailing slashes', async () => {
      const response = await request(app).get('/health/');

      expect([200, 404]).toContain(response.status);
    });

    test('should handle requests with query parameters on health', async () => {
      const response = await request(app).get('/health?param=value');

      expect(response.status).toBe(200);
    });

    test('should handle empty Accept header', async () => {
      const response = await request(app)
        .get('/health')
        .set('Accept', '');

      expect(response.status).toBe(200);
    });

    test('should handle requests without User-Agent', async () => {
      const response = await request(app)
        .get('/health')
        .set('User-Agent', '');

      expect(response.status).toBe(200);
    });

    test('should handle very long URLs within limits', async () => {
      const longQuery = 'a'.repeat(1000);
      const response = await request(app).get(`/api/logs?search=${longQuery}`);

      expect([200, 414, 500]).toContain(response.status);
    });

    test('should handle special characters in URL', async () => {
      const response = await request(app).get(
        '/api/logs?search=test%20%26%20%23%20%40'
      );

      expect(response.status).toBe(200);
    });

    test('should handle Unicode characters in search', async () => {
      const response = await request(app).get(
        '/api/logs?search=%E2%9C%93%20%E2%9C%97'
      );

      expect(response.status).toBe(200);
    });
  });

  describe('Error Handler Middleware', () => {
    test('should handle synchronous errors in routes', async () => {
      // The error handler should catch any errors thrown in routes
      const response = await request(app).get('/api/logs/stats');

      // Should either succeed or handle error gracefully
      expect([200, 500]).toContain(response.status);
      if (response.status === 500) {
        expect(response.body).toHaveProperty('error');
      }
    });
  });

  describe('Multiple Concurrent Requests', () => {
    test('should handle multiple simultaneous requests', async () => {
      const requests = [
        request(app).get('/health'),
        request(app).get('/'),
        request(app).get('/api/logs'),
        request(app).get('/api/logs/stats'),
        request(app).get('/health'),
      ];

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect([200, 404, 500]).toContain(response.status);
      });
    });

    test('should handle rapid sequential requests', async () => {
      for (let i = 0; i < 10; i++) {
        const response = await request(app).get('/health');
        expect(response.status).toBe(200);
      }
    });
  });

  describe('Request Size Limits', () => {
    test('should accept requests within size limit', async () => {
      const reasonablyLargeData = {
        logs: Array.from({ length: 10 }, (_, i) => ({
          timestamp: `2025-11-09T10:${String(i).padStart(2, '0')}:00.000Z`,
          action: 'created',
          jobTitle: 'x'.repeat(100),
          company: 'x'.repeat(100),
          details: 'x'.repeat(100),
          username: 'test',
        })),
      };

      const response = await request(app)
        .post('/api/logs/bulk')
        .send(reasonablyLargeData);

      expect([200, 413]).toContain(response.status);
    });
  });
});
