import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Database Operations - Unit Tests', () => {
  let db;
  let logOperations;
  const testDbPath = path.join(__dirname, '../test-logs.db');

  beforeEach(() => {
    // Create a fresh test database for each test
    db = new Database(testDbPath);
    db.pragma('journal_mode = WAL');

    // Create schema
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

    // Create prepared statements
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
    // Close database and clean up
    db.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    const walPath = `${testDbPath}-wal`;
    const shmPath = `${testDbPath}-shm`;
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
    if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
  });

  describe('Create Operations', () => {
    test('should create a log entry successfully', () => {
      const logData = {
        timestamp: '2025-11-09T10:30:00.000Z',
        action: 'created',
        jobTitle: 'Software Engineer',
        company: 'Tech Corp',
        details: 'New job application',
        username: 'test_user',
      };

      const result = logOperations.create.run(logData);
      expect(result.changes).toBe(1);
      expect(result.lastInsertRowid).toBe(1);
    });

    test('should create multiple log entries', () => {
      const logs = [
        {
          timestamp: '2025-11-09T10:30:00.000Z',
          action: 'created',
          jobTitle: 'Software Engineer',
          company: 'Tech Corp',
          details: 'New job application',
          username: 'test_user',
        },
        {
          timestamp: '2025-11-09T11:30:00.000Z',
          action: 'updated',
          jobTitle: 'Senior Developer',
          company: 'Acme Inc',
          details: 'Updated status',
          username: 'test_user',
        },
      ];

      logs.forEach((log) => {
        const result = logOperations.create.run(log);
        expect(result.changes).toBe(1);
      });

      const allLogs = logOperations.getAll.all();
      expect(allLogs).toHaveLength(2);
    });

    test('should handle null values in optional fields', () => {
      const logData = {
        timestamp: '2025-11-09T10:30:00.000Z',
        action: 'deleted',
        jobTitle: null,
        company: null,
        details: null,
        username: 'test_user',
      };

      const result = logOperations.create.run(logData);
      expect(result.changes).toBe(1);

      const log = logOperations.getById.get({ id: result.lastInsertRowid });
      expect(log.job_title).toBeNull();
      expect(log.company).toBeNull();
      expect(log.details).toBeNull();
    });
  });

  describe('Read Operations', () => {
    beforeEach(() => {
      // Insert test data
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

      testLogs.forEach((log) => logOperations.create.run(log));
    });

    test('should get all logs ordered by timestamp descending', () => {
      const logs = logOperations.getAll.all();
      expect(logs).toHaveLength(3);
      expect(logs[0].timestamp).toBe('2025-11-09T12:00:00.000Z');
      expect(logs[1].timestamp).toBe('2025-11-09T11:00:00.000Z');
      expect(logs[2].timestamp).toBe('2025-11-09T10:00:00.000Z');
    });

    test('should get logs with pagination', () => {
      const page1 = logOperations.getPaginated.all({ limit: 2, offset: 0 });
      expect(page1).toHaveLength(2);
      expect(page1[0].timestamp).toBe('2025-11-09T12:00:00.000Z');

      const page2 = logOperations.getPaginated.all({ limit: 2, offset: 2 });
      expect(page2).toHaveLength(1);
      expect(page2[0].timestamp).toBe('2025-11-09T10:00:00.000Z');
    });

    test('should filter logs by action type', () => {
      const createdLogs = logOperations.getByAction.all({ action: 'created' });
      expect(createdLogs).toHaveLength(1);
      expect(createdLogs[0].action).toBe('created');

      const updatedLogs = logOperations.getByAction.all({ action: 'updated' });
      expect(updatedLogs).toHaveLength(1);
      expect(updatedLogs[0].action).toBe('updated');
    });

    test('should filter logs by company (LIKE query)', () => {
      const logs = logOperations.getByCompany.all({ company: '%Tech%' });
      expect(logs).toHaveLength(1);
      expect(logs[0].company).toBe('Tech Corp');
    });

    test('should filter logs by username', () => {
      const user1Logs = logOperations.getByUsername.all({ username: 'user1' });
      expect(user1Logs).toHaveLength(2);

      const user2Logs = logOperations.getByUsername.all({ username: 'user2' });
      expect(user2Logs).toHaveLength(1);
    });

    test('should filter logs by date range', () => {
      const logs = logOperations.getByDateRange.all({
        startDate: '2025-11-09T10:30:00.000Z',
        endDate: '2025-11-09T11:30:00.000Z',
      });
      expect(logs).toHaveLength(1);
      expect(logs[0].timestamp).toBe('2025-11-09T11:00:00.000Z');
    });

    test('should search logs by keyword', () => {
      const logs = logOperations.search.all({ keyword: '%interview%' });
      expect(logs).toHaveLength(1);
      expect(logs[0].details).toContain('interview');
    });

    test('should get log by ID', () => {
      const log = logOperations.getById.get({ id: 1 });
      expect(log).toBeDefined();
      expect(log.id).toBe(1);
      expect(log.action).toBe('created');
    });

    test('should return undefined for non-existent ID', () => {
      const log = logOperations.getById.get({ id: 999 });
      expect(log).toBeUndefined();
    });
  });

  describe('Statistics Operations', () => {
    beforeEach(() => {
      const testLogs = [
        { timestamp: '2025-11-09T10:00:00.000Z', action: 'created', jobTitle: 'Dev1', company: 'A', details: '', username: 'user1' },
        { timestamp: '2025-11-09T11:00:00.000Z', action: 'created', jobTitle: 'Dev2', company: 'B', details: '', username: 'user1' },
        { timestamp: '2025-11-09T12:00:00.000Z', action: 'updated', jobTitle: 'Dev3', company: 'C', details: '', username: 'user1' },
        { timestamp: '2025-11-09T13:00:00.000Z', action: 'deleted', jobTitle: 'Dev4', company: 'D', details: '', username: 'user1' },
      ];
      testLogs.forEach((log) => logOperations.create.run(log));
    });

    test('should get statistics grouped by action', () => {
      const stats = logOperations.getStats.all();
      expect(stats).toHaveLength(3);

      const createdStat = stats.find((s) => s.action === 'created');
      expect(createdStat.count).toBe(2);

      const updatedStat = stats.find((s) => s.action === 'updated');
      expect(updatedStat.count).toBe(1);

      const deletedStat = stats.find((s) => s.action === 'deleted');
      expect(deletedStat.count).toBe(1);
    });
  });

  describe('Delete Operations', () => {
    beforeEach(() => {
      const testLogs = [
        { timestamp: '2025-11-09T10:00:00.000Z', action: 'created', jobTitle: 'Dev', company: 'A', details: '', username: 'user1' },
        { timestamp: '2025-11-09T11:00:00.000Z', action: 'updated', jobTitle: 'Dev', company: 'B', details: '', username: 'user1' },
      ];
      testLogs.forEach((log) => logOperations.create.run(log));
    });

    test('should delete log by ID', () => {
      const result = logOperations.deleteById.run({ id: 1 });
      expect(result.changes).toBe(1);

      const log = logOperations.getById.get({ id: 1 });
      expect(log).toBeUndefined();
    });

    test('should return 0 changes when deleting non-existent ID', () => {
      const result = logOperations.deleteById.run({ id: 999 });
      expect(result.changes).toBe(0);
    });
  });

  describe('Database Schema', () => {
    test('should have correct table structure', () => {
      const tableInfo = db.prepare("PRAGMA table_info(logs)").all();
      const columnNames = tableInfo.map((col) => col.name);

      expect(columnNames).toContain('id');
      expect(columnNames).toContain('timestamp');
      expect(columnNames).toContain('action');
      expect(columnNames).toContain('job_title');
      expect(columnNames).toContain('company');
      expect(columnNames).toContain('details');
      expect(columnNames).toContain('username');
      expect(columnNames).toContain('created_at');
    });

    test('should have correct indexes', () => {
      const indexes = db.prepare("PRAGMA index_list(logs)").all();
      const indexNames = indexes.map((idx) => idx.name);

      expect(indexNames).toContain('idx_logs_timestamp');
      expect(indexNames).toContain('idx_logs_action');
      expect(indexNames).toContain('idx_logs_company');
      expect(indexNames).toContain('idx_logs_username');
      expect(indexNames).toContain('idx_logs_created_at');
    });

    test('should auto-increment ID', () => {
      const log1 = logOperations.create.run({
        timestamp: '2025-11-09T10:00:00.000Z',
        action: 'created',
        jobTitle: 'Dev',
        company: 'A',
        details: '',
        username: 'user1',
      });

      const log2 = logOperations.create.run({
        timestamp: '2025-11-09T11:00:00.000Z',
        action: 'updated',
        jobTitle: 'Dev',
        company: 'B',
        details: '',
        username: 'user1',
      });

      expect(log2.lastInsertRowid).toBe(log1.lastInsertRowid + 1);
    });
  });
});
