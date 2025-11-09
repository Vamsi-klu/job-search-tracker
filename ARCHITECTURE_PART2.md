# Job Search Tracker - Architecture Documentation (Part 2)

## Routes Layer: routes/logs.js

**Purpose**: Define HTTP endpoints for log operations

**Route Definitions**:

```javascript
import express from 'express';
import {
  createLog,
  getLogs,
  getLogStats,
  getLogById,
  deleteLog,
  cleanupOldLogs,
  bulkCreateLogs
} from '../controllers/logsController.js';

const router = express.Router();

// POST /api/logs - Create a new log entry
router.post('/', createLog);

// POST /api/logs/bulk - Bulk create logs (for migration)
router.post('/bulk', bulkCreateLogs);

// GET /api/logs - Get all logs (supports query parameters for filtering)
router.get('/', getLogs);

// GET /api/logs/stats - Get log statistics
router.get('/stats', getLogStats);

// GET /api/logs/:id - Get a specific log by ID
router.get('/:id', getLogById);

// DELETE /api/logs/:id - Delete a log by ID
router.delete('/:id', deleteLog);

// DELETE /api/logs/cleanup/:days - Cleanup old logs
router.delete('/cleanup/:days', cleanupOldLogs);

export default router;
```

**Route Order Importance**:
- Specific routes before parameterized routes
- `/stats` before `/:id` (otherwise "stats" would match as ID)
- `/bulk` before `/` for POST

**RESTful Design**:
- GET for retrieval
- POST for creation
- DELETE for removal
- Plural resource name (/logs)
- Nested resources where appropriate

---

## Controllers Layer: logsController.js

**Purpose**: Business logic and request/response handling

### createLog Controller

```javascript
export function createLog(req, res) {
  try {
    const {
      timestamp,
      action,
      jobTitle,
      company,
      details,
      username,
      jobId,
      recruiterName,
      metadata
    } = req.body;

    // Validation
    if (!timestamp || !action || !username) {
      return res.status(400).json({
        error: 'Missing required fields: timestamp, action, and username are required'
      });
    }

    const newLogId = logStore.createLog({
      timestamp,
      action,
      jobTitle,
      company,
      details,
      username,
      jobId,
      recruiterName,
      metadata
    });

    res.status(201).json({
      success: true,
      id: newLogId,
      message: 'Log entry created successfully'
    });
  } catch (error) {
    console.error('Error creating log:', error);
    res.status(500).json({ error: 'Failed to create log entry' });
  }
}
```

**Responsibilities**:
- Extract data from request body
- Validate required fields
- Call database layer
- Format response
- Handle errors

**Status Codes**:
- 201: Created successfully
- 400: Bad request (validation error)
- 500: Internal server error

### getLogs Controller

```javascript
export function getLogs(req, res) {
  try {
    const filters = {
      action: req.query.action,
      company: req.query.company,
      username: req.query.username,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      search: req.query.search,
      days: req.query.days,
      limit: req.query.limit,
      offset: req.query.offset,
      jobId: req.query.jobId
    };

    const logs = logStore.queryLogs(filters);

    res.json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
}
```

**Query Parameters**:
- `action`: Filter by action type
- `company`: Filter by company name (partial match)
- `username`: Filter by username
- `startDate`: Filter by start date
- `endDate`: Filter by end date
- `search`: Full-text search
- `days`: Recent activity (last N days)
- `limit`: Pagination limit
- `offset`: Pagination offset
- `jobId`: Filter by job ID

**Example Requests**:
```bash
# Get all logs
GET /api/logs

# Filter by action
GET /api/logs?action=created

# Search
GET /api/logs?search=Google

# Recent activity
GET /api/logs?days=7

# Pagination
GET /api/logs?limit=20&offset=40

# Combined filters
GET /api/logs?action=status_update&company=Google&days=30
```

