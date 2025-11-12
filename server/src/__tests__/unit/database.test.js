import { describe, test, expect, beforeEach, afterAll } from '@jest/globals';
import Database from 'better-sqlite3';
import { userOps, companyOps, jobOps, activityLogOps, statsOps, transaction } from '../../database-optimized.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use a test database
const testDbPath = path.join(__dirname, '../../test-jobs-tracker.db');

describe('Database Operations', () => {
  beforeEach(() => {
    // Clean up test database if it exists
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  afterAll(() => {
    // Clean up test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('User Operations', () => {
    test('should create a new user', () => {
      const result = userOps.upsert.get({ username: 'testuser' });

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.username).toBe('testuser');
      expect(result.created_at).toBeDefined();
    });

    test('should update existing user timestamp on upsert', () => {
      const first = userOps.upsert.get({ username: 'testuser' });
      const second = userOps.upsert.get({ username: 'testuser' });

      expect(first.id).toBe(second.id);
      expect(second.updated_at).toBeGreaterThanOrEqual(first.updated_at);
    });

    test('should get user by username', () => {
      userOps.upsert.run({ username: 'testuser' });
      const result = userOps.getByUsername.get({ username: 'testuser' });

      expect(result).toBeDefined();
      expect(result.username).toBe('testuser');
    });

    test('should get user by id', () => {
      const created = userOps.upsert.get({ username: 'testuser' });
      const result = userOps.getById.get({ id: created.id });

      expect(result).toBeDefined();
      expect(result.username).toBe('testuser');
    });

    test('should return undefined for non-existent user', () => {
      const result = userOps.getByUsername.get({ username: 'nonexistent' });

      expect(result).toBeUndefined();
    });

    test('should enforce unique username constraint', () => {
      userOps.upsert.run({ username: 'testuser' });

      // Second insert with same username should update, not create
      const result = userOps.upsert.get({ username: 'testuser' });
      expect(result.id).toBe(1);
    });
  });

  describe('Company Operations', () => {
    test('should create a new company', () => {
      const result = companyOps.upsert.get({ name: 'Google' });

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.name).toBe('Google');
      expect(result.created_at).toBeDefined();
    });

    test('should not duplicate companies', () => {
      const first = companyOps.upsert.get({ name: 'Google' });
      const second = companyOps.upsert.get({ name: 'Google' });

      expect(first.id).toBe(second.id);
    });

    test('should get company by name', () => {
      companyOps.upsert.run({ name: 'Google' });
      const result = companyOps.getByName.get({ name: 'Google' });

      expect(result).toBeDefined();
      expect(result.name).toBe('Google');
    });

    test('should get company by id', () => {
      const created = companyOps.upsert.get({ name: 'Google' });
      const result = companyOps.getById.get({ id: created.id });

      expect(result).toBeDefined();
      expect(result.name).toBe('Google');
    });

    test('should get all companies', () => {
      companyOps.upsert.run({ name: 'Google' });
      companyOps.upsert.run({ name: 'Amazon' });
      companyOps.upsert.run({ name: 'Microsoft' });

      const result = companyOps.getAll.all();

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Amazon'); // Alphabetical order
      expect(result[1].name).toBe('Google');
      expect(result[2].name).toBe('Microsoft');
    });

    test('should enforce unique company name constraint', () => {
      companyOps.upsert.run({ name: 'Google' });
      companyOps.upsert.run({ name: 'Google' });

      const all = companyOps.getAll.all();
      expect(all).toHaveLength(1);
    });
  });

  describe('Job Operations', () => {
    let user, company;

    beforeEach(() => {
      user = userOps.upsert.get({ username: 'testuser' });
      company = companyOps.upsert.get({ name: 'Google' });
    });

    test('should create a new job', () => {
      const result = jobOps.create.run({
        company_id: company.id,
        user_id: user.id,
        recruiter_name: 'John Doe',
        position: 'Software Engineer',
        recruiter_screen: 'Not Started',
        technical_screen: 'Not Started',
        onsite_round1: 'Not Started',
        onsite_round2: 'Not Started',
        onsite_round3: 'Not Started',
        onsite_round4: 'Not Started',
        decision: 'Pending',
        notes: 'Great opportunity'
      });

      expect(result.lastInsertRowid).toBe(1);
      expect(result.changes).toBe(1);
    });

    test('should get all jobs for user with company name', () => {
      jobOps.create.run({
        company_id: company.id,
        user_id: user.id,
        recruiter_name: 'John Doe',
        position: 'Software Engineer',
        recruiter_screen: 'Completed',
        technical_screen: 'In Progress',
        onsite_round1: 'Not Started',
        onsite_round2: 'Not Started',
        onsite_round3: 'Not Started',
        onsite_round4: 'Not Started',
        decision: 'Pending',
        notes: null
      });

      const jobs = jobOps.getAllByUser.all({ user_id: user.id });

      expect(jobs).toHaveLength(1);
      expect(jobs[0].company_name).toBe('Google');
      expect(jobs[0].position).toBe('Software Engineer');
      expect(jobs[0].recruiter_name).toBe('John Doe');
    });

    test('should get job by id with company name', () => {
      const created = jobOps.create.run({
        company_id: company.id,
        user_id: user.id,
        recruiter_name: 'Jane Smith',
        position: 'Senior Engineer',
        recruiter_screen: 'Completed',
        technical_screen: 'Completed',
        onsite_round1: 'Scheduled',
        onsite_round2: 'Not Started',
        onsite_round3: 'Not Started',
        onsite_round4: 'Not Started',
        decision: 'Pending',
        notes: 'Very excited about this role'
      });

      const job = jobOps.getById.get({ id: created.lastInsertRowid });

      expect(job).toBeDefined();
      expect(job.company_name).toBe('Google');
      expect(job.position).toBe('Senior Engineer');
      expect(job.notes).toBe('Very excited about this role');
    });

    test('should update a job', () => {
      const created = jobOps.create.run({
        company_id: company.id,
        user_id: user.id,
        recruiter_name: 'John Doe',
        position: 'Engineer',
        recruiter_screen: 'Not Started',
        technical_screen: 'Not Started',
        onsite_round1: 'Not Started',
        onsite_round2: 'Not Started',
        onsite_round3: 'Not Started',
        onsite_round4: 'Not Started',
        decision: 'Pending',
        notes: null
      });

      const result = jobOps.update.run({
        id: created.lastInsertRowid,
        user_id: user.id,
        company_id: company.id,
        recruiter_name: 'John Doe',
        position: 'Senior Engineer',
        recruiter_screen: 'Completed',
        technical_screen: 'In Progress',
        onsite_round1: 'Not Started',
        onsite_round2: 'Not Started',
        onsite_round3: 'Not Started',
        onsite_round4: 'Not Started',
        decision: 'Pending',
        notes: 'Updated position title'
      });

      expect(result.changes).toBe(1);

      const updated = jobOps.getById.get({ id: created.lastInsertRowid });
      expect(updated.position).toBe('Senior Engineer');
      expect(updated.recruiter_screen).toBe('Completed');
      expect(updated.notes).toBe('Updated position title');
    });

    test('should delete a job', () => {
      const created = jobOps.create.run({
        company_id: company.id,
        user_id: user.id,
        recruiter_name: 'John Doe',
        position: 'Engineer',
        recruiter_screen: 'Not Started',
        technical_screen: 'Not Started',
        onsite_round1: 'Not Started',
        onsite_round2: 'Not Started',
        onsite_round3: 'Not Started',
        onsite_round4: 'Not Started',
        decision: 'Pending',
        notes: null
      });

      const result = jobOps.delete.run({
        id: created.lastInsertRowid,
        user_id: user.id
      });

      expect(result.changes).toBe(1);

      const deleted = jobOps.getById.get({ id: created.lastInsertRowid });
      expect(deleted).toBeUndefined();
    });

    test('should full-text search jobs', () => {
      jobOps.create.run({
        company_id: company.id,
        user_id: user.id,
        recruiter_name: 'John Doe',
        position: 'Frontend Engineer',
        recruiter_screen: 'Not Started',
        technical_screen: 'Not Started',
        onsite_round1: 'Not Started',
        onsite_round2: 'Not Started',
        onsite_round3: 'Not Started',
        onsite_round4: 'Not Started',
        decision: 'Pending',
        notes: 'React and TypeScript'
      });

      jobOps.create.run({
        company_id: company.id,
        user_id: user.id,
        recruiter_name: 'Jane Smith',
        position: 'Backend Engineer',
        recruiter_screen: 'Not Started',
        technical_screen: 'Not Started',
        onsite_round1: 'Not Started',
        onsite_round2: 'Not Started',
        onsite_round3: 'Not Started',
        onsite_round4: 'Not Started',
        decision: 'Pending',
        notes: 'Python and Django'
      });

      const results = jobOps.search.all({
        query: 'Frontend',
        user_id: user.id
      });

      expect(results).toHaveLength(1);
      expect(results[0].position).toBe('Frontend Engineer');
    });

    test('should get jobs by decision', () => {
      jobOps.create.run({
        company_id: company.id,
        user_id: user.id,
        recruiter_name: 'John Doe',
        position: 'Engineer 1',
        recruiter_screen: 'Completed',
        technical_screen: 'Completed',
        onsite_round1: 'Passed',
        onsite_round2: 'Passed',
        onsite_round3: 'Not Started',
        onsite_round4: 'Not Started',
        decision: 'Offer Extended',
        notes: null
      });

      jobOps.create.run({
        company_id: company.id,
        user_id: user.id,
        recruiter_name: 'Jane Smith',
        position: 'Engineer 2',
        recruiter_screen: 'Completed',
        technical_screen: 'Rejected',
        onsite_round1: 'Not Started',
        onsite_round2: 'Not Started',
        onsite_round3: 'Not Started',
        onsite_round4: 'Not Started',
        decision: 'Rejected',
        notes: null
      });

      const offers = jobOps.getByDecision.all({
        user_id: user.id,
        decision: 'Offer Extended'
      });

      expect(offers).toHaveLength(1);
      expect(offers[0].position).toBe('Engineer 1');
    });

    test('should paginate jobs', () => {
      // Create 10 jobs
      for (let i = 1; i <= 10; i++) {
        jobOps.create.run({
          company_id: company.id,
          user_id: user.id,
          recruiter_name: 'Recruiter ' + i,
          position: 'Position ' + i,
          recruiter_screen: 'Not Started',
          technical_screen: 'Not Started',
          onsite_round1: 'Not Started',
          onsite_round2: 'Not Started',
          onsite_round3: 'Not Started',
          onsite_round4: 'Not Started',
          decision: 'Pending',
          notes: null
        });
      }

      const page1 = jobOps.getPaginated.all({
        user_id: user.id,
        limit: 5,
        offset: 0
      });

      const page2 = jobOps.getPaginated.all({
        user_id: user.id,
        limit: 5,
        offset: 5
      });

      expect(page1).toHaveLength(5);
      expect(page2).toHaveLength(5);
      expect(page1[0].id).not.toBe(page2[0].id);
    });

    test('should count jobs for user', () => {
      jobOps.create.run({
        company_id: company.id,
        user_id: user.id,
        recruiter_name: 'John',
        position: 'Engineer',
        recruiter_screen: 'Not Started',
        technical_screen: 'Not Started',
        onsite_round1: 'Not Started',
        onsite_round2: 'Not Started',
        onsite_round3: 'Not Started',
        onsite_round4: 'Not Started',
        decision: 'Pending',
        notes: null
      });

      jobOps.create.run({
        company_id: company.id,
        user_id: user.id,
        recruiter_name: 'Jane',
        position: 'Engineer 2',
        recruiter_screen: 'Not Started',
        technical_screen: 'Not Started',
        onsite_round1: 'Not Started',
        onsite_round2: 'Not Started',
        onsite_round3: 'Not Started',
        onsite_round4: 'Not Started',
        decision: 'Pending',
        notes: null
      });

      const result = jobOps.countByUser.get({ user_id: user.id });
      expect(result.count).toBe(2);
    });

    test('should auto-update updated_at on job update', () => {
      const created = jobOps.create.run({
        company_id: company.id,
        user_id: user.id,
        recruiter_name: 'John Doe',
        position: 'Engineer',
        recruiter_screen: 'Not Started',
        technical_screen: 'Not Started',
        onsite_round1: 'Not Started',
        onsite_round2: 'Not Started',
        onsite_round3: 'Not Started',
        onsite_round4: 'Not Started',
        decision: 'Pending',
        notes: null
      });

      const before = jobOps.getById.get({ id: created.lastInsertRowid });

      // Wait a tiny bit to ensure timestamp changes
      const delay = new Promise(resolve => setTimeout(resolve, 10));

      return delay.then(() => {
        jobOps.update.run({
          id: created.lastInsertRowid,
          user_id: user.id,
          company_id: company.id,
          recruiter_name: 'John Doe',
          position: 'Senior Engineer',
          recruiter_screen: 'Not Started',
          technical_screen: 'Not Started',
          onsite_round1: 'Not Started',
          onsite_round2: 'Not Started',
          onsite_round3: 'Not Started',
          onsite_round4: 'Not Started',
          decision: 'Pending',
          notes: null
        });

        const after = jobOps.getById.get({ id: created.lastInsertRowid });
        expect(after.updated_at).toBeGreaterThan(before.updated_at);
      });
    });
  });

  describe('Activity Log Operations', () => {
    let user, company, job;

    beforeEach(() => {
      user = userOps.upsert.get({ username: 'testuser' });
      company = companyOps.upsert.get({ name: 'Google' });
      const jobResult = jobOps.create.run({
        company_id: company.id,
        user_id: user.id,
        recruiter_name: 'John Doe',
        position: 'Engineer',
        recruiter_screen: 'Not Started',
        technical_screen: 'Not Started',
        onsite_round1: 'Not Started',
        onsite_round2: 'Not Started',
        onsite_round3: 'Not Started',
        onsite_round4: 'Not Started',
        decision: 'Pending',
        notes: null
      });
      job = jobOps.getById.get({ id: jobResult.lastInsertRowid });
    });

    test('should create an activity log', () => {
      const result = activityLogOps.create.run({
        job_id: job.id,
        user_id: user.id,
        action: 'created',
        field_changed: null,
        old_value: null,
        new_value: null,
        details: 'Job application created'
      });

      expect(result.lastInsertRowid).toBe(1);
      expect(result.changes).toBe(1);
    });

    test('should get all logs for user with job details', () => {
      activityLogOps.create.run({
        job_id: job.id,
        user_id: user.id,
        action: 'created',
        field_changed: null,
        old_value: null,
        new_value: null,
        details: 'Job created'
      });

      activityLogOps.create.run({
        job_id: job.id,
        user_id: user.id,
        action: 'updated',
        field_changed: 'decision',
        old_value: 'Pending',
        new_value: 'Offer Extended',
        details: 'Status updated'
      });

      const logs = activityLogOps.getAllByUser.all({ user_id: user.id });

      expect(logs).toHaveLength(2);
      expect(logs[0].job_title).toBe('Engineer');
      expect(logs[0].company_name).toBe('Google');
    });

    test('should get logs for specific job', () => {
      activityLogOps.create.run({
        job_id: job.id,
        user_id: user.id,
        action: 'created',
        field_changed: null,
        old_value: null,
        new_value: null,
        details: 'Job created'
      });

      const logs = activityLogOps.getByJob.all({ job_id: job.id });

      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe('created');
    });

    test('should get logs by action type', () => {
      activityLogOps.create.run({
        job_id: job.id,
        user_id: user.id,
        action: 'created',
        field_changed: null,
        old_value: null,
        new_value: null,
        details: 'Job created'
      });

      activityLogOps.create.run({
        job_id: job.id,
        user_id: user.id,
        action: 'updated',
        field_changed: 'status',
        old_value: null,
        new_value: null,
        details: 'Status changed'
      });

      const createdLogs = activityLogOps.getByAction.all({
        user_id: user.id,
        action: 'created'
      });

      expect(createdLogs).toHaveLength(1);
      expect(createdLogs[0].action).toBe('created');
    });

    test('should get recent logs', () => {
      activityLogOps.create.run({
        job_id: job.id,
        user_id: user.id,
        action: 'created',
        field_changed: null,
        old_value: null,
        new_value: null,
        details: 'Job created today'
      });

      const recentLogs = activityLogOps.getRecent.all({
        user_id: user.id,
        days: '-7'
      });

      expect(recentLogs.length).toBeGreaterThanOrEqual(1);
    });

    test('should cascade delete logs when job is deleted', () => {
      activityLogOps.create.run({
        job_id: job.id,
        user_id: user.id,
        action: 'created',
        field_changed: null,
        old_value: null,
        new_value: null,
        details: 'Job created'
      });

      // Delete the job
      jobOps.delete.run({
        id: job.id,
        user_id: user.id
      });

      // Logs should be deleted too
      const logs = activityLogOps.getByJob.all({ job_id: job.id });
      expect(logs).toHaveLength(0);
    });
  });

  describe('Stats Operations', () => {
    let user, company;

    beforeEach(() => {
      user = userOps.upsert.get({ username: 'testuser' });
      company = companyOps.upsert.get({ name: 'Google' });
    });

    test('should get stats by decision', () => {
      jobOps.create.run({
        company_id: company.id,
        user_id: user.id,
        recruiter_name: 'John',
        position: 'Engineer 1',
        recruiter_screen: 'Completed',
        technical_screen: 'Completed',
        onsite_round1: 'Passed',
        onsite_round2: 'Not Started',
        onsite_round3: 'Not Started',
        onsite_round4: 'Not Started',
        decision: 'Offer Extended',
        notes: null
      });

      jobOps.create.run({
        company_id: company.id,
        user_id: user.id,
        recruiter_name: 'Jane',
        position: 'Engineer 2',
        recruiter_screen: 'Completed',
        technical_screen: 'Completed',
        onsite_round1: 'Passed',
        onsite_round2: 'Not Started',
        onsite_round3: 'Not Started',
        onsite_round4: 'Not Started',
        decision: 'Offer Extended',
        notes: null
      });

      jobOps.create.run({
        company_id: company.id,
        user_id: user.id,
        recruiter_name: 'Bob',
        position: 'Engineer 3',
        recruiter_screen: 'Rejected',
        technical_screen: 'Not Started',
        onsite_round1: 'Not Started',
        onsite_round2: 'Not Started',
        onsite_round3: 'Not Started',
        onsite_round4: 'Not Started',
        decision: 'Rejected',
        notes: null
      });

      const stats = statsOps.getByDecision.all({ user_id: user.id });

      const offerStats = stats.find(s => s.decision === 'Offer Extended');
      const rejectStats = stats.find(s => s.decision === 'Rejected');

      expect(offerStats.count).toBe(2);
      expect(rejectStats.count).toBe(1);
    });

    test('should get cached stats', () => {
      const cache = statsOps.getCache.get();

      expect(cache).toBeDefined();
      expect(cache.id).toBe(1);
      expect(cache.total_jobs).toBeGreaterThanOrEqual(0);
      expect(cache.total_logs).toBeGreaterThanOrEqual(0);
    });

    test('should refresh stats cache', () => {
      // Create some jobs
      jobOps.create.run({
        company_id: company.id,
        user_id: user.id,
        recruiter_name: 'John',
        position: 'Engineer',
        recruiter_screen: 'Not Started',
        technical_screen: 'Not Started',
        onsite_round1: 'Not Started',
        onsite_round2: 'Not Started',
        onsite_round3: 'Not Started',
        onsite_round4: 'Not Started',
        decision: 'Pending',
        notes: null
      });

      statsOps.refresh.run();
      const cache = statsOps.getCache.get();

      expect(cache.total_jobs).toBeGreaterThan(0);
    });
  });

  describe('Transaction Support', () => {
    test('should execute operations in transaction', () => {
      const createMultipleJobs = transaction(() => {
        const user = userOps.upsert.get({ username: 'testuser' });
        const company = companyOps.upsert.get({ name: 'Google' });

        for (let i = 0; i < 5; i++) {
          jobOps.create.run({
            company_id: company.id,
            user_id: user.id,
            recruiter_name: 'Recruiter ' + i,
            position: 'Position ' + i,
            recruiter_screen: 'Not Started',
            technical_screen: 'Not Started',
            onsite_round1: 'Not Started',
            onsite_round2: 'Not Started',
            onsite_round3: 'Not Started',
            onsite_round4: 'Not Started',
            decision: 'Pending',
            notes: null
          });
        }
      });

      createMultipleJobs();

      const user = userOps.getByUsername.get({ username: 'testuser' });
      const jobs = jobOps.getAllByUser.all({ user_id: user.id });

      expect(jobs).toHaveLength(5);
    });

    test('should rollback on transaction error', () => {
      const failingTransaction = transaction(() => {
        const user = userOps.upsert.get({ username: 'testuser' });
        const company = companyOps.upsert.get({ name: 'Google' });

        jobOps.create.run({
          company_id: company.id,
          user_id: user.id,
          recruiter_name: 'John',
          position: 'Engineer',
          recruiter_screen: 'Not Started',
          technical_screen: 'Not Started',
          onsite_round1: 'Not Started',
          onsite_round2: 'Not Started',
          onsite_round3: 'Not Started',
          onsite_round4: 'Not Started',
          decision: 'Pending',
          notes: null
        });

        // This will throw an error
        throw new Error('Transaction failed');
      });

      expect(() => failingTransaction()).toThrow('Transaction failed');

      // Jobs should not be created due to rollback
      const user = userOps.getByUsername.get({ username: 'testuser' });
      if (user) {
        const jobs = jobOps.getAllByUser.all({ user_id: user.id });
        expect(jobs).toHaveLength(0);
      }
    });
  });
});
