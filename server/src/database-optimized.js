import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create database connection with optimized settings
const db = new Database(path.join(__dirname, '../jobs-tracker.db'), {
  verbose: process.env.NODE_ENV === 'development' ? console.log : null
});

// CRITICAL PERFORMANCE OPTIMIZATIONS
// Enable WAL mode for better concurrent access (5-10x improvement)
db.pragma('journal_mode = WAL');
// NORMAL synchronous mode (faster writes, still safe with WAL)
db.pragma('synchronous = NORMAL');
// 64MB cache size for better performance
db.pragma('cache_size = -64000');
// Store temp tables in memory
db.pragma('temp_store = MEMORY');
// Memory-mapped I/O for faster reads (30GB limit)
db.pragma('mmap_size = 30000000000');
// 8KB page size for better performance
db.pragma('page_size = 8192');
// Enable foreign keys
db.pragma('foreign_keys = ON');

/**
 * NORMALIZED SCHEMA DESIGN
 *
 * Benefits:
 * - Eliminates data duplication
 * - Referential integrity with foreign keys
 * - Smaller database size
 * - Faster queries with proper indexes
 */

// Users table - normalized user data
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
  )
`);

// Companies table - normalized company data (eliminates duplication)
db.exec(`
  CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    created_at INTEGER DEFAULT (unixepoch())
  )
`);

// Jobs table - main entity with proper foreign keys
db.exec(`
  CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    recruiter_name TEXT NOT NULL,
    position TEXT NOT NULL,
    recruiter_screen TEXT DEFAULT 'Not Started',
    technical_screen TEXT DEFAULT 'Not Started',
    onsite_round1 TEXT DEFAULT 'Not Started',
    onsite_round2 TEXT DEFAULT 'Not Started',
    onsite_round3 TEXT DEFAULT 'Not Started',
    onsite_round4 TEXT DEFAULT 'Not Started',
    decision TEXT DEFAULT 'Pending',
    notes TEXT,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

// Activity logs with proper foreign keys (no more text-based references!)
db.exec(`
  CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    field_changed TEXT,
    old_value TEXT,
    new_value TEXT,
    details TEXT,
    created_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

// Materialized stats cache for instant queries
db.exec(`
  CREATE TABLE IF NOT EXISTS job_stats_cache (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    total_jobs INTEGER DEFAULT 0,
    total_logs INTEGER DEFAULT 0,
    by_decision TEXT,
    by_stage TEXT,
    last_updated INTEGER DEFAULT (unixepoch())
  )
`);

// Initialize stats cache
db.exec(`INSERT OR IGNORE INTO job_stats_cache (id) VALUES (1)`);

/**
 * STRATEGIC INDEXES FOR PERFORMANCE
 *
 * - Single-column indexes for common filters
 * - Composite indexes for common query patterns
 * - Covering indexes where possible
 */

// Jobs indexes
db.exec(`CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company_id)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_jobs_user ON jobs(user_id)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_jobs_created ON jobs(created_at DESC)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_jobs_updated ON jobs(updated_at DESC)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_jobs_decision ON jobs(decision)`);

// Composite indexes for common query patterns
db.exec(`CREATE INDEX IF NOT EXISTS idx_jobs_user_created ON jobs(user_id, created_at DESC)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_jobs_company_decision ON jobs(company_id, decision)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_jobs_user_decision ON jobs(user_id, decision)`);

// Activity logs indexes
db.exec(`CREATE INDEX IF NOT EXISTS idx_logs_job ON activity_logs(job_id)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_logs_user ON activity_logs(user_id)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_logs_created ON activity_logs(created_at DESC)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_logs_action ON activity_logs(action)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_logs_job_created ON activity_logs(job_id, created_at DESC)`);

/**
 * FULL-TEXT SEARCH (FTS5) FOR LIGHTNING-FAST SEARCH
 *
 * 100-1000x faster than LIKE queries
 * Supports: ranking, phrase queries, boolean operators
 */
db.exec(`
  CREATE VIRTUAL TABLE IF NOT EXISTS jobs_fts USING fts5(
    position,
    recruiter_name,
    notes,
    content=jobs,
    content_rowid=id,
    tokenize='porter'
  )
`);

// Triggers to keep FTS index in sync
db.exec(`
  CREATE TRIGGER IF NOT EXISTS jobs_fts_insert AFTER INSERT ON jobs BEGIN
    INSERT INTO jobs_fts(rowid, position, recruiter_name, notes)
    VALUES (new.id, new.position, new.recruiter_name, new.notes);
  END
`);

db.exec(`
  CREATE TRIGGER IF NOT EXISTS jobs_fts_update AFTER UPDATE ON jobs BEGIN
    UPDATE jobs_fts
    SET position = new.position,
        recruiter_name = new.recruiter_name,
        notes = new.notes
    WHERE rowid = new.id;
  END
`);

db.exec(`
  CREATE TRIGGER IF NOT EXISTS jobs_fts_delete AFTER DELETE ON jobs BEGIN
    DELETE FROM jobs_fts WHERE rowid = old.id;
  END
`);

// Trigger to update jobs.updated_at automatically
db.exec(`
  CREATE TRIGGER IF NOT EXISTS jobs_updated_at AFTER UPDATE ON jobs BEGIN
    UPDATE jobs SET updated_at = unixepoch() WHERE id = new.id;
  END
`);

// Trigger to update stats cache when jobs change
db.exec(`
  CREATE TRIGGER IF NOT EXISTS jobs_stats_update AFTER INSERT ON jobs BEGIN
    UPDATE job_stats_cache SET
      total_jobs = total_jobs + 1,
      last_updated = unixepoch()
    WHERE id = 1;
  END
`);

db.exec(`
  CREATE TRIGGER IF NOT EXISTS jobs_stats_delete AFTER DELETE ON jobs BEGIN
    UPDATE job_stats_cache SET
      total_jobs = total_jobs - 1,
      last_updated = unixepoch()
    WHERE id = 1;
  END
`);

db.exec(`
  CREATE TRIGGER IF NOT EXISTS logs_stats_update AFTER INSERT ON activity_logs BEGIN
    UPDATE job_stats_cache SET
      total_logs = total_logs + 1,
      last_updated = unixepoch()
    WHERE id = 1;
  END
`);

console.log('✅ Optimized database schema initialized');

/**
 * DATABASE OPERATIONS WITH PREPARED STATEMENTS
 *
 * Benefits:
 * - SQL injection prevention
 * - Better performance (compiled once, reused)
 * - Cleaner code
 */

export const userOps = {
  // Get or create user
  upsert: db.prepare(`
    INSERT INTO users (username) VALUES (@username)
    ON CONFLICT(username) DO UPDATE SET updated_at = unixepoch()
    RETURNING *
  `),

  getByUsername: db.prepare(`
    SELECT * FROM users WHERE username = @username
  `),

  getById: db.prepare(`
    SELECT * FROM users WHERE id = @id
  `)
};

export const companyOps = {
  // Get or create company
  upsert: db.prepare(`
    INSERT INTO companies (name) VALUES (@name)
    ON CONFLICT(name) DO UPDATE SET name = name
    RETURNING *
  `),

  getByName: db.prepare(`
    SELECT * FROM companies WHERE name = @name
  `),

  getById: db.prepare(`
    SELECT * FROM companies WHERE id = @id
  `),

  getAll: db.prepare(`
    SELECT * FROM companies ORDER BY name ASC
  `)
};

export const jobOps = {
  // Create job
  create: db.prepare(`
    INSERT INTO jobs (
      company_id, user_id, recruiter_name, position,
      recruiter_screen, technical_screen,
      onsite_round1, onsite_round2, onsite_round3, onsite_round4,
      decision, notes
    ) VALUES (
      @company_id, @user_id, @recruiter_name, @position,
      @recruiter_screen, @technical_screen,
      @onsite_round1, @onsite_round2, @onsite_round3, @onsite_round4,
      @decision, @notes
    )
  `),

  // Update job
  update: db.prepare(`
    UPDATE jobs SET
      company_id = @company_id,
      recruiter_name = @recruiter_name,
      position = @position,
      recruiter_screen = @recruiter_screen,
      technical_screen = @technical_screen,
      onsite_round1 = @onsite_round1,
      onsite_round2 = @onsite_round2,
      onsite_round3 = @onsite_round3,
      onsite_round4 = @onsite_round4,
      decision = @decision,
      notes = @notes
    WHERE id = @id AND user_id = @user_id
  `),

  // Get all jobs for user with company names (JOIN)
  getAllByUser: db.prepare(`
    SELECT
      j.*,
      c.name as company_name
    FROM jobs j
    INNER JOIN companies c ON j.company_id = c.id
    WHERE j.user_id = @user_id
    ORDER BY j.updated_at DESC
  `),

  // Get job by ID with company name
  getById: db.prepare(`
    SELECT
      j.*,
      c.name as company_name
    FROM jobs j
    INNER JOIN companies c ON j.company_id = c.id
    WHERE j.id = @id
  `),

  // Delete job
  delete: db.prepare(`
    DELETE FROM jobs WHERE id = @id AND user_id = @user_id
  `),

  // Full-text search (10-100x faster than LIKE)
  search: db.prepare(`
    SELECT
      j.*,
      c.name as company_name,
      jobs_fts.rank
    FROM jobs_fts
    INNER JOIN jobs j ON jobs_fts.rowid = j.id
    INNER JOIN companies c ON j.company_id = c.id
    WHERE jobs_fts MATCH @query AND j.user_id = @user_id
    ORDER BY jobs_fts.rank
  `),

  // Get jobs by decision
  getByDecision: db.prepare(`
    SELECT
      j.*,
      c.name as company_name
    FROM jobs j
    INNER JOIN companies c ON j.company_id = c.id
    WHERE j.user_id = @user_id AND j.decision = @decision
    ORDER BY j.updated_at DESC
  `),

  // Pagination
  getPaginated: db.prepare(`
    SELECT
      j.*,
      c.name as company_name
    FROM jobs j
    INNER JOIN companies c ON j.company_id = c.id
    WHERE j.user_id = @user_id
    ORDER BY j.updated_at DESC
    LIMIT @limit OFFSET @offset
  `),

  // Count total jobs for user
  countByUser: db.prepare(`
    SELECT COUNT(*) as count FROM jobs WHERE user_id = @user_id
  `)
};

export const activityLogOps = {
  // Create log
  create: db.prepare(`
    INSERT INTO activity_logs (
      job_id, user_id, action, field_changed, old_value, new_value, details
    ) VALUES (
      @job_id, @user_id, @action, @field_changed, @old_value, @new_value, @details
    )
  `),

  // Get all logs for user
  getAllByUser: db.prepare(`
    SELECT
      al.*,
      j.position as job_title,
      c.name as company_name
    FROM activity_logs al
    INNER JOIN jobs j ON al.job_id = j.id
    INNER JOIN companies c ON j.company_id = c.id
    WHERE al.user_id = @user_id
    ORDER BY al.created_at DESC
  `),

  // Get logs for specific job
  getByJob: db.prepare(`
    SELECT * FROM activity_logs
    WHERE job_id = @job_id
    ORDER BY created_at DESC
  `),

  // Get logs by action
  getByAction: db.prepare(`
    SELECT
      al.*,
      j.position as job_title,
      c.name as company_name
    FROM activity_logs al
    INNER JOIN jobs j ON al.job_id = j.id
    INNER JOIN companies c ON j.company_id = c.id
    WHERE al.user_id = @user_id AND al.action = @action
    ORDER BY al.created_at DESC
  `),

  // Get recent logs (last N days)
  getRecent: db.prepare(`
    SELECT
      al.*,
      j.position as job_title,
      c.name as company_name
    FROM activity_logs al
    INNER JOIN jobs j ON al.job_id = j.id
    INNER JOIN companies c ON j.company_id = c.id
    WHERE al.user_id = @user_id
      AND al.created_at >= unixepoch('now', @days || ' days')
    ORDER BY al.created_at DESC
  `)
};

export const statsOps = {
  // Get cached stats (instant!)
  getCache: db.prepare(`
    SELECT * FROM job_stats_cache WHERE id = 1
  `),

  // Refresh stats cache
  refresh: db.prepare(`
    UPDATE job_stats_cache SET
      total_jobs = (SELECT COUNT(*) FROM jobs),
      total_logs = (SELECT COUNT(*) FROM activity_logs),
      by_decision = (
        SELECT json_group_object(decision, cnt)
        FROM (SELECT decision, COUNT(*) as cnt FROM jobs GROUP BY decision)
      ),
      last_updated = unixepoch()
    WHERE id = 1
  `),

  // Get stats by decision for user
  getByDecision: db.prepare(`
    SELECT decision, COUNT(*) as count
    FROM jobs
    WHERE user_id = @user_id
    GROUP BY decision
  `),

  // Get activity stats by action
  getByAction: db.prepare(`
    SELECT
      al.action,
      COUNT(*) as count
    FROM activity_logs al
    INNER JOIN jobs j ON al.job_id = j.id
    WHERE j.user_id = @user_id
    GROUP BY al.action
  `)
};

/**
 * TRANSACTION HELPERS FOR BATCH OPERATIONS
 *
 * Wrapping multiple operations in a transaction:
 * - Much faster (100x+ for bulk inserts)
 * - Atomic (all or nothing)
 * - Consistent
 */

export function transaction(fn) {
  return db.transaction(fn);
}

// Optimize database (run periodically)
export function optimize() {
  db.pragma('optimize');
  console.log('✅ Database optimized');
}

// Close database connection
export function close() {
  db.close();
}

export default db;
