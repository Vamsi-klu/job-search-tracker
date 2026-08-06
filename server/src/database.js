import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, '../logs.db'), {
  verbose: process.env.NODE_ENV === 'development' ? console.log : undefined
});

// Tune SQLite for low-latency writes
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');
db.pragma('temp_store = MEMORY');
db.pragma('cache_size = -64000'); // 64MB page cache

/**
 * Helper to run schema migrations making sure legacy installs upgrade automatically.
 */
function runMigrations() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      title TEXT,
      company TEXT,
      recruiter_name TEXT,
      hiring_manager TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    );

    CREATE TABLE IF NOT EXISTS log_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id TEXT,
      user_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      metadata TEXT,
      company_snapshot TEXT,
      job_title_snapshot TEXT,
      hiring_manager_snapshot TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_logs_created_desc ON log_entries(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_logs_user_time ON log_entries(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_logs_job_time ON log_entries(job_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_logs_action_time ON log_entries(action, created_at DESC);
  `);

  const ensureColumn = (table, column, definition) => {
    const columns = db.prepare(`PRAGMA table_info(${table})`).all();
    const exists = columns.some((col) => col.name === column);
    if (!exists) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  };

  ensureColumn('jobs', 'hiring_manager', 'TEXT');
  ensureColumn('log_entries', 'hiring_manager_snapshot', 'TEXT');

  // Add password_hash column for authentication
  ensureColumn('users', 'password_hash', 'TEXT');

  // Legacy table migration (pre multi-table schema)
  const hasLegacy = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='logs'")
    .get();

  const alreadyMigrated = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='log_entries'")
    .get();

  if (hasLegacy && alreadyMigrated) {
    const legacyRows = db.prepare('SELECT * FROM logs').all();
    if (legacyRows.length) {
      const insertLegacy = db.prepare(`
        INSERT INTO log_entries (
          job_id,
          user_id,
          action,
          details,
          metadata,
          company_snapshot,
          job_title_snapshot,
          hiring_manager_snapshot,
          created_at
        )
        VALUES (@jobId, @userId, @action, @details, NULL, @company, @jobTitle, NULL, @createdAt)
      `);

      const ensureUserStmt = db.prepare('SELECT id FROM users WHERE username = ?');
      const insertUserStmt = db.prepare(
        'INSERT INTO users (username, created_at) VALUES (@username, @createdAt)'
      );

      const migrate = db.transaction(() => {
        legacyRows.forEach((row) => {
          const now = Math.floor(Date.now() / 1000);
          let user = ensureUserStmt.get(row.username);
          if (!user) {
            const insertInfo = insertUserStmt.run({
              username: row.username,
              createdAt: now
            });
            user = { id: insertInfo.lastInsertRowid };
          }

          insertLegacy.run({
            jobId: null,
            userId: user.id,
            action: row.action,
            details: row.details,
            company: row.company,
            jobTitle: row.job_title,
            createdAt: Math.floor(new Date(row.timestamp).getTime() / 1000) || now
          });
        });
      });

      migrate();
    }
    db.exec('DROP TABLE IF EXISTS logs');
  }
}

runMigrations();

console.log('Database initialized with optimized schema');

export function initializeDatabase() {
  // Already initialized when module loads, but keeping the API for backwards compatibility
  console.log('Database already initialized');
}

const ensureUserStmt = db.prepare('SELECT id FROM users WHERE username = ?');
const insertUserStmt = db.prepare(
  'INSERT INTO users (username, created_at) VALUES (@username, @createdAt)'
);

const getJobStmt = db.prepare('SELECT id FROM jobs WHERE id = ?');
const insertJobStmt = db.prepare(`
  INSERT INTO jobs (id, title, company, recruiter_name, hiring_manager, created_at, updated_at)
  VALUES (@id, @title, @company, @recruiter, @hiringManager, @timestamp, @timestamp)
`);
const updateJobStmt = db.prepare(`
  UPDATE jobs
  SET title = COALESCE(@title, title),
      company = COALESCE(@company, company),
      recruiter_name = COALESCE(@recruiter, recruiter_name),
      hiring_manager = COALESCE(@hiringManager, hiring_manager),
      updated_at = @timestamp
  WHERE id = @id
`);

function ensureUser(username) {
  let user = ensureUserStmt.get(username);
  if (user) return user.id;

  const now = Math.floor(Date.now() / 1000);
  const info = insertUserStmt.run({ username, createdAt: now });
  return info.lastInsertRowid;
}

function ensureJob({ id, title, company, recruiterName, hiringManager }) {
  if (!id) return null;
  const timestamp = Math.floor(Date.now() / 1000);
  const existing = getJobStmt.get(id);
  if (!existing) {
    insertJobStmt.run({
      id,
      title: title || null,
      company: company || null,
      recruiter: recruiterName || null,
      hiringManager: hiringManager || null,
      timestamp
    });
    return id;
  }

  updateJobStmt.run({
    id,
    title: title || null,
    company: company || null,
    recruiter: recruiterName || null,
    hiringManager: hiringManager || null,
    timestamp
  });
  return id;
}

const insertLogStmt = db.prepare(`
  INSERT INTO log_entries (
    job_id,
    user_id,
    action,
    details,
    metadata,
    company_snapshot,
    job_title_snapshot,
    hiring_manager_snapshot,
    created_at
  )
  VALUES (@jobId, @userId, @action, @details, @metadata, @companySnapshot, @jobTitleSnapshot, @hiringManagerSnapshot, @createdAt)
`);

const deleteOlderThanStmt = db.prepare(
  'DELETE FROM log_entries WHERE created_at < strftime(\'%s\',\'now\', @window)'
);
const deleteByIdStmt = db.prepare('DELETE FROM log_entries WHERE id = ?');
const getStatsStmt = db.prepare(`
  SELECT action, COUNT(*) AS count
  FROM log_entries
  GROUP BY action
`);

const baseSelect = `
  SELECT
    le.id,
    datetime(le.created_at, 'unixepoch') AS timestamp,
    le.action,
    le.details,
    le.metadata,
    le.job_id AS jobId,
    u.username,
    COALESCE(j.title, le.job_title_snapshot) AS jobTitle,
    COALESCE(j.company, le.company_snapshot) AS company,
    COALESCE(j.hiring_manager, le.hiring_manager_snapshot) AS hiringManager
  FROM log_entries le
  JOIN users u ON u.id = le.user_id
  LEFT JOIN jobs j ON j.id = le.job_id
`;

function mapLogRow(row) {
  let metadata = null;
  if (row.metadata) {
    try {
      metadata = JSON.parse(row.metadata);
    } catch (err) {
      metadata = null;
    }
  }
  return {
    ...row,
    metadata
  };
}

function buildWhereClause(filters) {
  const clauses = [];
  const params = {};

  if (filters.action) {
    clauses.push('le.action = @action');
    params.action = filters.action;
  }
  if (filters.company) {
    clauses.push(
      '(COALESCE(j.company, le.company_snapshot) LIKE @company)'
    );
    params.company = `%${filters.company}%`;
  }
  if (filters.username) {
    clauses.push('u.username = @username');
    params.username = filters.username;
  }
  if (filters.startDate && filters.endDate) {
    clauses.push('le.created_at BETWEEN @startDate AND @endDate');
    params.startDate = Math.floor(new Date(filters.startDate).getTime() / 1000);
    params.endDate = Math.floor(new Date(filters.endDate).getTime() / 1000);
  }
  if (filters.search) {
    clauses.push(
      '(le.details LIKE @search OR COALESCE(j.title, le.job_title_snapshot) LIKE @search OR COALESCE(j.company, le.company_snapshot) LIKE @search)'
    );
    params.search = `%${filters.search}%`;
  }
  if (filters.days) {
    clauses.push('le.created_at >= strftime(\'%s\', \'now\', @days)');
    params.days = `-${parseInt(filters.days, 10)} days`;
  }
  if (filters.jobId) {
    clauses.push('le.job_id = @jobId');
    params.jobId = filters.jobId;
  }

  return {
    where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
    params
  };
}

function buildPagination(limit, offset) {
  if (!limit) return '';
  const safeLimit = Math.min(parseInt(limit, 10) || 50, 200);
  const safeOffset = parseInt(offset, 10) || 0;
  return ` LIMIT ${safeLimit} OFFSET ${safeOffset}`;
}

function persistLog(log) {
  const userId = ensureUser(log.username);
  const jobId = ensureJob({
    id: log.jobId,
    title: log.jobTitle,
    company: log.company,
    recruiterName: log.recruiterName,
    hiringManager: log.hiringManager
  });

  const createdAt =
    typeof log.timestamp === 'number'
      ? Math.floor(log.timestamp / 1000)
      : Math.floor(new Date(log.timestamp || Date.now()).getTime() / 1000);

  const info = insertLogStmt.run({
    jobId,
    userId,
    action: log.action,
    details: log.details || null,
    metadata: log.metadata ? JSON.stringify(log.metadata) : null,
    companySnapshot: log.company || null,
    jobTitleSnapshot: log.jobTitle || null,
    hiringManagerSnapshot: log.hiringManager || null,
    createdAt
  });

  return info.lastInsertRowid;
}

const createLogTx = db.transaction((log) => persistLog(log));

export const logStore = {
  createLog: (log) => createLogTx(log),

  queryLogs(filters = {}) {
    const { where, params } = buildWhereClause(filters);
    const pagination = buildPagination(filters.limit, filters.offset);
    const stmt = db.prepare(`${baseSelect} ${where} ORDER BY le.created_at DESC${pagination}`);
    return stmt.all(params).map(mapLogRow);
  },

  getById(id) {
    const stmt = db.prepare(`${baseSelect} WHERE le.id = @id`);
    const row = stmt.get({ id });
    return row ? mapLogRow(row) : null;
  },

  deleteById(id) {
    return deleteByIdStmt.run(id);
  },

  deleteOlderThan(days) {
    return deleteOlderThanStmt.run({ window: `-${parseInt(days, 10)} days` });
  },

  getStats() {
    return getStatsStmt.all();
  },

  bulkInsert: db.transaction((logs) => {
    let success = 0;
    logs.forEach((log) => {
      persistLog({
        ...log,
        timestamp: log.timestamp || log.createdAt
      });
      success++;
    });
    return success;
  })
};

export default db;
