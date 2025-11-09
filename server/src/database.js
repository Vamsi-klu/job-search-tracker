import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create database connection
const db = new Database(path.join(__dirname, '../logs.db'), { verbose: console.log });

// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL');

// Initialize database schema (called immediately)
// Create logs table
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

// Create indexes for better query performance
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);
  CREATE INDEX IF NOT EXISTS idx_logs_action ON logs(action);
  CREATE INDEX IF NOT EXISTS idx_logs_company ON logs(company);
  CREATE INDEX IF NOT EXISTS idx_logs_username ON logs(username);
  CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at);
`);

console.log('Database initialized successfully');

// Export initialization function for explicit re-initialization if needed
export function initializeDatabase() {
  console.log('Database already initialized');
}

// Log operations
export const logOperations = {
  // Create a new log entry
  create: db.prepare(`
    INSERT INTO logs (timestamp, action, job_title, company, details, username)
    VALUES (@timestamp, @action, @jobTitle, @company, @details, @username)
  `),

  // Get all logs
  getAll: db.prepare('SELECT * FROM logs ORDER BY timestamp DESC'),

  // Get logs with pagination
  getPaginated: db.prepare(`
    SELECT * FROM logs
    ORDER BY timestamp DESC
    LIMIT @limit OFFSET @offset
  `),

  // Get logs by action type
  getByAction: db.prepare(`
    SELECT * FROM logs
    WHERE action = @action
    ORDER BY timestamp DESC
  `),

  // Get logs by company
  getByCompany: db.prepare(`
    SELECT * FROM logs
    WHERE company LIKE @company
    ORDER BY timestamp DESC
  `),

  // Get logs by username
  getByUsername: db.prepare(`
    SELECT * FROM logs
    WHERE username = @username
    ORDER BY timestamp DESC
  `),

  // Get logs within a date range
  getByDateRange: db.prepare(`
    SELECT * FROM logs
    WHERE timestamp BETWEEN @startDate AND @endDate
    ORDER BY timestamp DESC
  `),

  // Search logs by keyword in details
  search: db.prepare(`
    SELECT * FROM logs
    WHERE details LIKE @keyword
       OR job_title LIKE @keyword
       OR company LIKE @keyword
    ORDER BY timestamp DESC
  `),

  // Get log statistics
  getStats: db.prepare(`
    SELECT
      action,
      COUNT(*) as count
    FROM logs
    GROUP BY action
  `),

  // Get recent activity (last N days)
  getRecentActivity: db.prepare(`
    SELECT * FROM logs
    WHERE datetime(timestamp) >= datetime('now', @days || ' days')
    ORDER BY timestamp DESC
  `),

  // Delete old logs (cleanup)
  deleteOlderThan: db.prepare(`
    DELETE FROM logs
    WHERE datetime(timestamp) < datetime('now', @days || ' days')
  `),

  // Get log by ID
  getById: db.prepare('SELECT * FROM logs WHERE id = @id'),

  // Delete log by ID
  deleteById: db.prepare('DELETE FROM logs WHERE id = @id')
};

export default db;
