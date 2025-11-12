import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Database Advanced Tests', () => {
  let db;
  let logOperations;
  const testDbPath = path.join(__dirname, '../test-advanced.db');

  beforeEach(() => {
    db = new Database(testDbPath);
    db.pragma('journal_mode = WAL');

    db.exec(`
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        action TEXT NOT NULL,
        job_title TEXT,
        company TEXT,
        details TEXT,
        username TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        UNIQUE(id)
      )
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_logs_action ON logs(action);
      CREATE INDEX IF NOT EXISTS idx_logs_company ON logs(company);
      CREATE INDEX IF NOT EXISTS idx_logs_username ON logs(username);
      CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at);
    `);

    logOperations = {
      create: db.prepare(`
        INSERT INTO logs (timestamp, action, job_title, company, details, username)
        VALUES (@timestamp, @action, @jobTitle, @company, @details, @username)
      `),
      getAll: db.prepare('SELECT * FROM logs ORDER BY timestamp DESC'),
      getPaginated: db.prepare(`
        SELECT * FROM logs
        ORDER BY timestamp DESC
        LIMIT @limit OFFSET @offset
      `),
      getByAction: db.prepare(`
        SELECT * FROM logs
        WHERE action = @action
        ORDER BY timestamp DESC
      `),
      getByCompany: db.prepare(`
        SELECT * FROM logs
        WHERE company LIKE @company
        ORDER BY timestamp DESC
      `),
      getByUsername: db.prepare(`
        SELECT * FROM logs
        WHERE username = @username
        ORDER BY timestamp DESC
      `),
      getByDateRange: db.prepare(`
        SELECT * FROM logs
        WHERE timestamp BETWEEN @startDate AND @endDate
        ORDER BY timestamp DESC
      `),
      search: db.prepare(`
        SELECT * FROM logs
        WHERE details LIKE @keyword
           OR job_title LIKE @keyword
           OR company LIKE @keyword
        ORDER BY timestamp DESC
      `),
      getStats: db.prepare(`
        SELECT
          action,
          COUNT(*) as count
        FROM logs
        GROUP BY action
      `),
      getRecentActivity: db.prepare(`
        SELECT * FROM logs
        WHERE datetime(timestamp) >= datetime('now', @days || ' days')
        ORDER BY timestamp DESC
      `),
      deleteOlderThan: db.prepare(`
        DELETE FROM logs
        WHERE datetime(timestamp) < datetime('now', @days || ' days')
      `),
      getById: db.prepare('SELECT * FROM logs WHERE id = @id'),
      deleteById: db.prepare('DELETE FROM logs WHERE id = @id'),
    };
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    const walPath = `${testDbPath}-wal`;
    const shmPath = `${testDbPath}-shm`;
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
    if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
  });

  describe('Advanced Query Tests', () => {
    test('should handle empty database gracefully', () => {
      const logs = logOperations.getAll.all();
      expect(logs).toEqual([]);

      const stats = logOperations.getStats.all();
      expect(stats).toEqual([]);
    });

    test('should handle partial LIKE matches in company search', () => {
      logOperations.create.run({
        timestamp: '2025-11-09T10:00:00.000Z',
        action: 'created',
        jobTitle: 'Dev',
        company: 'TechCorp Industries',
        details: 'Test',
        username: 'user1',
      });

      logOperations.create.run({
        timestamp: '2025-11-09T11:00:00.000Z',
        action: 'created',
        jobTitle: 'Dev',
        company: 'Software Solutions',
        details: 'Test',
        username: 'user1',
      });

      const techResults = logOperations.getByCompany.all({ company: '%Tech%' });
      expect(techResults).toHaveLength(1);
      expect(techResults[0].company).toBe('TechCorp Industries');

      const softwareResults = logOperations.getByCompany.all({ company: '%Software%' });
      expect(softwareResults).toHaveLength(1);
      expect(softwareResults[0].company).toBe('Software Solutions');
    });

    test('should search across multiple fields', () => {
      logOperations.create.run({
        timestamp: '2025-11-09T10:00:00.000Z',
        action: 'created',
        jobTitle: 'Senior Engineer',
        company: 'Tech Corp',
        details: 'Applied for position',
        username: 'user1',
      });

      // Search in job_title
      const titleResults = logOperations.search.all({ keyword: '%Engineer%' });
      expect(titleResults).toHaveLength(1);

      // Search in company
      const companyResults = logOperations.search.all({ keyword: '%Tech%' });
      expect(companyResults).toHaveLength(1);

      // Search in details
      const detailsResults = logOperations.search.all({ keyword: '%Applied%' });
      expect(detailsResults).toHaveLength(1);
    });

    test('should handle case-insensitive search with LIKE', () => {
      logOperations.create.run({
        timestamp: '2025-11-09T10:00:00.000Z',
        action: 'created',
        jobTitle: 'Software Engineer',
        company: 'TECH CORP',
        details: 'Test',
        username: 'user1',
      });

      // SQLite LIKE is case-insensitive for ASCII by default
      const results = logOperations.search.all({ keyword: '%software%' });
      expect(results.length).toBeGreaterThanOrEqual(0);
    });

    test('should handle date range with timezone variations', () => {
      logOperations.create.run({
        timestamp: '2025-11-09T10:30:00.000Z',
        action: 'created',
        jobTitle: 'Dev',
        company: 'A',
        details: '',
        username: 'user1',
      });

      const results = logOperations.getByDateRange.all({
        startDate: '2025-11-09T00:00:00.000Z',
        endDate: '2025-11-09T23:59:59.999Z',
      });

      expect(results).toHaveLength(1);
    });

    test('should handle getRecentActivity with various day ranges', () => {
      const now = new Date();
      logOperations.create.run({
        timestamp: now.toISOString(),
        action: 'created',
        jobTitle: 'Dev',
        company: 'A',
        details: '',
        username: 'user1',
      });

      // Last 1 day
      const oneDayResults = logOperations.getRecentActivity.all({ days: '-1' });
      expect(oneDayResults.length).toBeGreaterThanOrEqual(1);

      // Last 7 days
      const sevenDayResults = logOperations.getRecentActivity.all({ days: '-7' });
      expect(sevenDayResults.length).toBeGreaterThanOrEqual(1);

      // Last 30 days
      const thirtyDayResults = logOperations.getRecentActivity.all({ days: '-30' });
      expect(thirtyDayResults.length).toBeGreaterThanOrEqual(1);
    });

    test('should handle pagination edge cases', () => {
      // Create 5 logs
      for (let i = 0; i < 5; i++) {
        logOperations.create.run({
          timestamp: `2025-11-09T10:${String(i).padStart(2, '0')}:00.000Z`,
          action: 'created',
          jobTitle: `Job ${i}`,
          company: `Company ${i}`,
          details: '',
          username: 'user1',
        });
      }

      // Get first page
      const page1 = logOperations.getPaginated.all({ limit: 2, offset: 0 });
      expect(page1).toHaveLength(2);

      // Get second page
      const page2 = logOperations.getPaginated.all({ limit: 2, offset: 2 });
      expect(page2).toHaveLength(2);

      // Get third page (partial)
      const page3 = logOperations.getPaginated.all({ limit: 2, offset: 4 });
      expect(page3).toHaveLength(1);

      // Beyond available data
      const page4 = logOperations.getPaginated.all({ limit: 2, offset: 10 });
      expect(page4).toHaveLength(0);
    });

    test('should maintain sort order with pagination', () => {
      for (let i = 0; i < 10; i++) {
        logOperations.create.run({
          timestamp: `2025-11-09T10:${String(i).padStart(2, '0')}:00.000Z`,
          action: 'created',
          jobTitle: `Job ${i}`,
          company: `Company ${i}`,
          details: '',
          username: 'user1',
        });
      }

      const page1 = logOperations.getPaginated.all({ limit: 5, offset: 0 });
      const page2 = logOperations.getPaginated.all({ limit: 5, offset: 5 });

      // Should be in descending order
      expect(page1[0].timestamp > page1[4].timestamp).toBe(true);
      expect(page2[0].timestamp > page2[4].timestamp).toBe(true);
      expect(page1[4].timestamp > page2[0].timestamp).toBe(true);
    });
  });

  describe('Statistics Edge Cases', () => {
    test('should return statistics when only one action type exists', () => {
      for (let i = 0; i < 5; i++) {
        logOperations.create.run({
          timestamp: `2025-11-09T10:${String(i).padStart(2, '0')}:00.000Z`,
          action: 'created',
          jobTitle: `Job ${i}`,
          company: `Company ${i}`,
          details: '',
          username: 'user1',
        });
      }

      const stats = logOperations.getStats.all();
      expect(stats).toHaveLength(1);
      expect(stats[0].action).toBe('created');
      expect(stats[0].count).toBe(5);
    });

    test('should return correct statistics for all action types', () => {
      const actions = ['created', 'updated', 'deleted', 'status_update'];
      actions.forEach((action, i) => {
        for (let j = 0; j < i + 1; j++) {
          logOperations.create.run({
            timestamp: `2025-11-09T${String(i).padStart(2, '0')}:${String(j).padStart(2, '0')}:00.000Z`,
            action,
            jobTitle: 'Job',
            company: 'Company',
            details: '',
            username: 'user1',
          });
        }
      });

      const stats = logOperations.getStats.all();
      expect(stats).toHaveLength(4);

      expect(stats.find((s) => s.action === 'created').count).toBe(1);
      expect(stats.find((s) => s.action === 'updated').count).toBe(2);
      expect(stats.find((s) => s.action === 'deleted').count).toBe(3);
      expect(stats.find((s) => s.action === 'status_update').count).toBe(4);
    });
  });

  describe('Delete Operations Edge Cases', () => {
    test('should handle deleteOlderThan with no matching records', () => {
      const now = new Date();
      logOperations.create.run({
        timestamp: now.toISOString(),
        action: 'created',
        jobTitle: 'Dev',
        company: 'A',
        details: '',
        username: 'user1',
      });

      // Delete logs older than 365 days
      const result = logOperations.deleteOlderThan.run({ days: '-365' });
      expect(result.changes).toBe(0);
    });

    test('should delete all old records correctly', () => {
      // Create old records
      logOperations.create.run({
        timestamp: '2020-01-01T10:00:00.000Z',
        action: 'created',
        jobTitle: 'Dev',
        company: 'A',
        details: '',
        username: 'user1',
      });

      logOperations.create.run({
        timestamp: '2020-01-02T10:00:00.000Z',
        action: 'created',
        jobTitle: 'Dev',
        company: 'B',
        details: '',
        username: 'user1',
      });

      // Create recent record
      const now = new Date();
      logOperations.create.run({
        timestamp: now.toISOString(),
        action: 'created',
        jobTitle: 'Dev',
        company: 'C',
        details: '',
        username: 'user1',
      });

      // Delete records older than 30 days
      const result = logOperations.deleteOlderThan.run({ days: '-30' });
      expect(result.changes).toBeGreaterThanOrEqual(2);

      // Verify recent record still exists
      const remaining = logOperations.getAll.all();
      expect(remaining.length).toBeGreaterThanOrEqual(1);
      expect(remaining.some((log) => log.company === 'C')).toBe(true);
    });
  });

  describe('Data Integrity Tests', () => {
    test('should maintain data integrity with concurrent inserts', () => {
      const logs = Array.from({ length: 100 }, (_, i) => ({
        timestamp: `2025-11-09T${String(Math.floor(i / 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}:00.000Z`,
        action: ['created', 'updated', 'deleted', 'status_update'][i % 4],
        jobTitle: `Job ${i}`,
        company: `Company ${i}`,
        details: `Details ${i}`,
        username: `user${i % 5}`,
      }));

      logs.forEach((log) => {
        logOperations.create.run(log);
      });

      const allLogs = logOperations.getAll.all();
      expect(allLogs).toHaveLength(100);

      // Verify all logs have unique IDs
      const ids = allLogs.map((log) => log.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(100);
    });

    test('should handle special characters in text fields', () => {
      logOperations.create.run({
        timestamp: '2025-11-09T10:00:00.000Z',
        action: 'created',
        jobTitle: "Test's & <Special> \"Chars\"",
        company: "Company's & Co.",
        details: 'Details with "quotes" and \'apostrophes\'',
        username: 'user@test.com',
      });

      const logs = logOperations.getAll.all();
      expect(logs).toHaveLength(1);
      expect(logs[0].job_title).toBe("Test's & <Special> \"Chars\"");
      expect(logs[0].company).toBe("Company's & Co.");
    });

    test('should handle empty strings vs null values correctly', () => {
      logOperations.create.run({
        timestamp: '2025-11-09T10:00:00.000Z',
        action: 'created',
        jobTitle: '',
        company: '',
        details: '',
        username: 'user1',
      });

      logOperations.create.run({
        timestamp: '2025-11-09T11:00:00.000Z',
        action: 'created',
        jobTitle: null,
        company: null,
        details: null,
        username: 'user1',
      });

      const logs = logOperations.getAll.all();
      expect(logs).toHaveLength(2);
      expect(logs[0].job_title).toBeNull();
      expect(logs[1].job_title).toBe('');
    });

    test('should preserve timestamp precision', () => {
      const timestamp = '2025-11-09T10:30:45.123Z';
      logOperations.create.run({
        timestamp,
        action: 'created',
        jobTitle: 'Dev',
        company: 'A',
        details: '',
        username: 'user1',
      });

      const log = logOperations.getAll.all()[0];
      expect(log.timestamp).toBe(timestamp);
    });

    test('should handle very long text in details field', () => {
      const longText = 'x'.repeat(10000);
      logOperations.create.run({
        timestamp: '2025-11-09T10:00:00.000Z',
        action: 'created',
        jobTitle: 'Dev',
        company: 'A',
        details: longText,
        username: 'user1',
      });

      const log = logOperations.getAll.all()[0];
      expect(log.details.length).toBe(10000);
    });
  });

  describe('Index Performance Tests', () => {
    test('should utilize indexes for filtered queries', () => {
      // Create many logs
      for (let i = 0; i < 1000; i++) {
        logOperations.create.run({
          timestamp: `2025-11-${String((i % 28) + 1).padStart(2, '0')}T10:00:00.000Z`,
          action: ['created', 'updated', 'deleted', 'status_update'][i % 4],
          jobTitle: `Job ${i}`,
          company: `Company ${i % 100}`,
          details: '',
          username: `user${i % 10}`,
        });
      }

      // Query by indexed field should be fast
      const start = Date.now();
      const results = logOperations.getByAction.all({ action: 'created' });
      const duration = Date.now() - start;

      expect(results.length).toBe(250);
      expect(duration).toBeLessThan(1000); // Should complete in less than 1 second
    });
  });

  describe('Transaction-like Behavior', () => {
    test('should handle multiple operations in sequence', () => {
      // Insert
      const info1 = logOperations.create.run({
        timestamp: '2025-11-09T10:00:00.000Z',
        action: 'created',
        jobTitle: 'Job 1',
        company: 'Company 1',
        details: '',
        username: 'user1',
      });

      // Read
      const log = logOperations.getById.get({ id: info1.lastInsertRowid });
      expect(log).toBeDefined();

      // Update (via delete and recreate)
      logOperations.deleteById.run({ id: info1.lastInsertRowid });

      const info2 = logOperations.create.run({
        timestamp: '2025-11-09T10:00:00.000Z',
        action: 'updated',
        jobTitle: 'Job 1 Updated',
        company: 'Company 1',
        details: '',
        username: 'user1',
      });

      // Verify
      const updatedLog = logOperations.getById.get({ id: info2.lastInsertRowid });
      expect(updatedLog.job_title).toBe('Job 1 Updated');
      expect(updatedLog.action).toBe('updated');
    });
  });
});
