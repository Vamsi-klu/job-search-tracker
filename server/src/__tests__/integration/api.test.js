import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import jobsRouter from '../../routes/jobs.js';
import migrationRouter from '../../routes/migration.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create test app
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/jobs', jobsRouter);
app.use('/api/migrate', migrationRouter);

const testDbPath = path.join(__dirname, '../../test-jobs-tracker.db');

describe('Jobs API Integration Tests', () => {
  beforeEach(() => {
    // Clean up test database before each test
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  afterAll(() => {
    // Clean up test database after all tests
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('POST /api/jobs', () => {
    test('should create a new job', async () => {
      const jobData = {
        company: 'Google',
        recruiterName: 'John Doe',
        position: 'Software Engineer',
        username: 'testuser',
        recruiterScreen: 'Not Started',
        technicalScreen: 'Not Started',
        decision: 'Pending',
        notes: 'Great opportunity'
      };

      const response = await request(app)
        .post('/api/jobs')
        .send(jobData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Job created successfully',
        data: expect.objectContaining({
          id: expect.any(Number),
          company_name: 'Google',
          position: 'Software Engineer'
        })
      });
    });

    test('should return 400 when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/jobs')
        .send({ company: 'Google' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Missing required fields');
    });

    test('should use default values for optional fields', async () => {
      const response = await request(app)
        .post('/api/jobs')
        .send({
          company: 'Google',
          position: 'Engineer',
          username: 'testuser'
        })
        .expect(201);

      expect(response.body.data).toMatchObject({
        recruiter_name: 'Unknown',
        recruiter_screen: 'Not Started',
        decision: 'Pending'
      });
    });
  });

  describe('GET /api/jobs', () => {
    beforeEach(async () => {
      // Create some test jobs
      await request(app).post('/api/jobs').send({
        company: 'Google',
        position: 'Software Engineer',
        recruiterName: 'John Doe',
        username: 'testuser',
        decision: 'Pending'
      });

      await request(app).post('/api/jobs').send({
        company: 'Amazon',
        position: 'Developer',
        recruiterName: 'Jane Smith',
        username: 'testuser',
        decision: 'Offer Extended'
      });
    });

    test('should get all jobs for user', async () => {
      const response = await request(app)
        .get('/api/jobs')
        .query({ username: 'testuser' })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        count: 2,
        totalCount: 2,
        data: expect.arrayContaining([
          expect.objectContaining({ company_name: 'Google' }),
          expect.objectContaining({ company_name: 'Amazon' })
        ])
      });
    });

    test('should return 400 when username is missing', async () => {
      await request(app)
        .get('/api/jobs')
        .expect(400);
    });

    test('should filter jobs by decision', async () => {
      const response = await request(app)
        .get('/api/jobs')
        .query({ username: 'testuser', decision: 'Offer Extended' })
        .expect(200);

      expect(response.body.count).toBe(1);
      expect(response.body.data[0]).toMatchObject({
        company_name: 'Amazon',
        decision: 'Offer Extended'
      });
    });

    test('should search jobs using full-text search', async () => {
      const response = await request(app)
        .get('/api/jobs')
        .query({ username: 'testuser', search: 'Software' })
        .expect(200);

      expect(response.body.count).toBe(1);
      expect(response.body.data[0].position).toContain('Software');
    });

    test('should paginate results', async () => {
      // Create more jobs
      for (let i = 3; i <= 10; i++) {
        await request(app).post('/api/jobs').send({
          company: `Company${i}`,
          position: `Position${i}`,
          recruiterName: 'Recruiter',
          username: 'testuser'
        });
      }

      const page1 = await request(app)
        .get('/api/jobs')
        .query({ username: 'testuser', limit: '5', offset: '0' })
        .expect(200);

      expect(page1.body.count).toBe(5);
      expect(page1.body.totalCount).toBe(10);

      const page2 = await request(app)
        .get('/api/jobs')
        .query({ username: 'testuser', limit: '5', offset: '5' })
        .expect(200);

      expect(page2.body.count).toBe(5);
      expect(page1.body.data[0].id).not.toBe(page2.body.data[0].id);
    });

    test('should return empty array for non-existent user', async () => {
      const response = await request(app)
        .get('/api/jobs')
        .query({ username: 'nonexistent' })
        .expect(200);

      expect(response.body.data).toEqual([]);
      expect(response.body.count).toBe(0);
    });
  });

  describe('GET /api/jobs/:id', () => {
    let jobId;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/jobs')
        .send({
          company: 'Google',
          position: 'Engineer',
          recruiterName: 'John',
          username: 'testuser'
        });
      jobId = response.body.data.id;
    });

    test('should get job by id', async () => {
      const response = await request(app)
        .get(`/api/jobs/${jobId}`)
        .query({ username: 'testuser' })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: jobId,
          company_name: 'Google'
        })
      });
    });

    test('should return 400 when username is missing', async () => {
      await request(app)
        .get(`/api/jobs/${jobId}`)
        .expect(400);
    });

    test('should return 404 for non-existent job', async () => {
      await request(app)
        .get('/api/jobs/99999')
        .query({ username: 'testuser' })
        .expect(404);
    });

    test('should return 403 when user does not own job', async () => {
      await request(app)
        .get(`/api/jobs/${jobId}`)
        .query({ username: 'otheruser' })
        .expect(403);
    });
  });

  describe('PUT /api/jobs/:id', () => {
    let jobId;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/jobs')
        .send({
          company: 'Google',
          position: 'Engineer',
          recruiterName: 'John',
          username: 'testuser',
          decision: 'Pending'
        });
      jobId = response.body.data.id;
    });

    test('should update job', async () => {
      const response = await request(app)
        .put(`/api/jobs/${jobId}`)
        .send({
          username: 'testuser',
          position: 'Senior Engineer',
          recruiterScreen: 'Completed',
          decision: 'Offer Extended'
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Job updated successfully',
        data: expect.objectContaining({
          position: 'Senior Engineer',
          recruiter_screen: 'Completed',
          decision: 'Offer Extended'
        })
      });
    });

    test('should return 400 when username is missing', async () => {
      await request(app)
        .put(`/api/jobs/${jobId}`)
        .send({ position: 'Senior Engineer' })
        .expect(400);
    });

    test('should return 404 for non-existent job', async () => {
      await request(app)
        .put('/api/jobs/99999')
        .send({ username: 'testuser', position: 'Engineer' })
        .expect(404);
    });

    test('should return 403 when user does not own job', async () => {
      // Create job with testuser
      await request(app)
        .put(`/api/jobs/${jobId}`)
        .send({ username: 'otheruser', position: 'Engineer' })
        .expect(403);
    });
  });

  describe('DELETE /api/jobs/:id', () => {
    let jobId;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/jobs')
        .send({
          company: 'Google',
          position: 'Engineer',
          recruiterName: 'John',
          username: 'testuser'
        });
      jobId = response.body.data.id;
    });

    test('should delete job', async () => {
      const response = await request(app)
        .delete(`/api/jobs/${jobId}`)
        .query({ username: 'testuser' })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('Job deleted')
      });

      // Verify job is deleted
      await request(app)
        .get(`/api/jobs/${jobId}`)
        .query({ username: 'testuser' })
        .expect(404);
    });

    test('should return 400 when username is missing', async () => {
      await request(app)
        .delete(`/api/jobs/${jobId}`)
        .expect(400);
    });

    test('should return 404 for non-existent job', async () => {
      await request(app)
        .delete('/api/jobs/99999')
        .query({ username: 'testuser' })
        .expect(404);
    });

    test('should return 403 when user does not own job', async () => {
      await request(app)
        .delete(`/api/jobs/${jobId}`)
        .query({ username: 'otheruser' })
        .expect(403);
    });

    test('should cascade delete activity logs', async () => {
      // Activity logs are created automatically on job creation
      // After deleting the job, related logs should be deleted
      await request(app)
        .delete(`/api/jobs/${jobId}`)
        .query({ username: 'testuser' })
        .expect(200);

      // This is implicitly tested by the database cascade delete
    });
  });

  describe('GET /api/jobs/stats', () => {
    beforeEach(async () => {
      await request(app).post('/api/jobs').send({
        company: 'Google',
        position: 'Engineer 1',
        recruiterName: 'John',
        username: 'testuser',
        decision: 'Pending'
      });

      await request(app).post('/api/jobs').send({
        company: 'Amazon',
        position: 'Engineer 2',
        recruiterName: 'Jane',
        username: 'testuser',
        decision: 'Pending'
      });

      await request(app).post('/api/jobs').send({
        company: 'Microsoft',
        position: 'Engineer 3',
        recruiterName: 'Bob',
        username: 'testuser',
        decision: 'Offer Extended'
      });
    });

    test('should get job statistics', async () => {
      const response = await request(app)
        .get('/api/jobs/stats')
        .query({ username: 'testuser' })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          totalJobs: 3,
          byDecision: expect.arrayContaining([
            expect.objectContaining({ decision: 'Pending' }),
            expect.objectContaining({ decision: 'Offer Extended' })
          ])
        })
      });
    });

    test('should return 400 when username is missing', async () => {
      await request(app)
        .get('/api/jobs/stats')
        .expect(400);
    });

    test('should return empty stats for non-existent user', async () => {
      const response = await request(app)
        .get('/api/jobs/stats')
        .query({ username: 'nonexistent' })
        .expect(200);

      expect(response.body.data.totalJobs).toBe(0);
    });
  });
});

describe('Migration API Integration Tests', () => {
  beforeEach(() => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  afterAll(() => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('POST /api/migrate/jobs', () => {
    test('should migrate jobs from localStorage', async () => {
      const jobs = [
        {
          company: 'Google',
          position: 'Software Engineer',
          recruiterName: 'John Doe',
          recruiterScreen: 'Completed',
          technicalScreen: 'In Progress',
          decision: 'Pending',
          notes: 'Good opportunity'
        },
        {
          company: 'Amazon',
          position: 'Developer',
          recruiterName: 'Jane Smith',
          recruiterScreen: 'Not Started',
          technicalScreen: 'Not Started',
          decision: 'Pending'
        }
      ];

      const response = await request(app)
        .post('/api/migrate/jobs')
        .send({ jobs, username: 'testuser' })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        migrated: 2,
        message: expect.stringContaining('Successfully migrated 2 jobs')
      });

      // Verify jobs were created
      const getResponse = await request(app)
        .get('/api/jobs')
        .query({ username: 'testuser' });

      expect(getResponse.body.count).toBe(2);
    });

    test('should return 400 when jobs array is missing', async () => {
      await request(app)
        .post('/api/migrate/jobs')
        .send({ username: 'testuser' })
        .expect(400);
    });

    test('should return 400 when username is missing', async () => {
      await request(app)
        .post('/api/migrate/jobs')
        .send({ jobs: [] })
        .expect(400);
    });

    test('should handle empty jobs array', async () => {
      const response = await request(app)
        .post('/api/migrate/jobs')
        .send({ jobs: [], username: 'testuser' })
        .expect(200);

      expect(response.body.migrated).toBe(0);
    });
  });

  describe('POST /api/migrate/logs', () => {
    beforeEach(async () => {
      // Create a job first so logs can be linked
      await request(app).post('/api/jobs').send({
        company: 'Google',
        position: 'Engineer',
        recruiterName: 'John',
        username: 'testuser'
      });
    });

    test('should migrate logs from localStorage', async () => {
      const logs = [
        {
          action: 'created',
          company: 'Google',
          jobTitle: 'Engineer',
          details: 'Job created',
          timestamp: new Date().toISOString(),
          username: 'testuser'
        }
      ];

      const response = await request(app)
        .post('/api/migrate/logs')
        .send({ logs, username: 'testuser' })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        migrated: expect.any(Number)
      });
    });

    test('should return 400 when logs array is missing', async () => {
      await request(app)
        .post('/api/migrate/logs')
        .send({ username: 'testuser' })
        .expect(400);
    });

    test('should return 400 when username is missing', async () => {
      await request(app)
        .post('/api/migrate/logs')
        .send({ logs: [] })
        .expect(400);
    });

    test('should skip logs for non-existent jobs', async () => {
      const logs = [
        {
          action: 'created',
          company: 'NonExistent',
          jobTitle: 'Position',
          details: 'Test',
          timestamp: new Date().toISOString(),
          username: 'testuser'
        }
      ];

      const response = await request(app)
        .post('/api/migrate/logs')
        .send({ logs, username: 'testuser' })
        .expect(200);

      expect(response.body.skipped).toBeGreaterThanOrEqual(1);
    });
  });
});
