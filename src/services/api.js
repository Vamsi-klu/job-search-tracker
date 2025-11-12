const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Helper function to handle API responses
async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  return response.json();
}

// Jobs API - NEW OPTIMIZED DATABASE ENDPOINTS
export const jobsAPI = {
  // Create a new job
  async create(jobData) {
    const response = await fetch(`${API_BASE_URL}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jobData),
    });
    return handleResponse(response);
  },

  // Get all jobs with optional filters
  async getAll(filters = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const url = `${API_BASE_URL}/jobs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url);
    return handleResponse(response);
  },

  // Get a single job by ID
  async getById(id, username) {
    const response = await fetch(`${API_BASE_URL}/jobs/${id}?username=${username}`);
    return handleResponse(response);
  },

  // Update a job
  async update(id, jobData) {
    const response = await fetch(`${API_BASE_URL}/jobs/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jobData),
    });
    return handleResponse(response);
  },

  // Delete a job
  async delete(id, username) {
    const response = await fetch(`${API_BASE_URL}/jobs/${id}?username=${username}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  // Get job statistics
  async getStats(username) {
    const response = await fetch(`${API_BASE_URL}/jobs/stats?username=${username}`);
    return handleResponse(response);
  },

  // Search jobs
  async search(query, username) {
    return this.getAll({ search: query, username });
  },

  // Get jobs by decision
  async getByDecision(decision, username) {
    return this.getAll({ decision, username });
  },

  // Get paginated jobs
  async getPaginated(username, limit, offset) {
    return this.getAll({ username, limit, offset });
  },
};

// Migration API - Migrate from localStorage to database
export const migrationAPI = {
  // Migrate jobs from localStorage
  async migrateJobs(jobs, username) {
    const response = await fetch(`${API_BASE_URL}/migrate/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ jobs, username }),
    });
    return handleResponse(response);
  },

  // Migrate logs from localStorage
  async migrateLogs(logs, username) {
    const response = await fetch(`${API_BASE_URL}/migrate/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ logs, username }),
    });
    return handleResponse(response);
  },
};

// Logs API
export const logsAPI = {
  // Create a new log entry
  async create(logData) {
    const response = await fetch(`${API_BASE_URL}/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(logData),
    });
    return handleResponse(response);
  },

  // Get all logs with optional filters
  async getAll(filters = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const url = `${API_BASE_URL}/logs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url);
    return handleResponse(response);
  },

  // Get log statistics
  async getStats() {
    const response = await fetch(`${API_BASE_URL}/logs/stats`);
    return handleResponse(response);
  },

  // Get a single log by ID
  async getById(id) {
    const response = await fetch(`${API_BASE_URL}/logs/${id}`);
    return handleResponse(response);
  },

  // Delete a log by ID
  async delete(id) {
    const response = await fetch(`${API_BASE_URL}/logs/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  // Bulk create logs (for migration)
  async bulkCreate(logs) {
    const response = await fetch(`${API_BASE_URL}/logs/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ logs }),
    });
    return handleResponse(response);
  },

  // Query logs with filters
  async query(filters) {
    return this.getAll(filters);
  },

  // Get recent activity (last N days)
  async getRecent(days = 7) {
    return this.getAll({ days });
  },

  // Search logs by keyword
  async search(keyword) {
    return this.getAll({ search: keyword });
  },

  // Get logs by action type
  async getByAction(action) {
    return this.getAll({ action });
  },

  // Get logs by company
  async getByCompany(company) {
    return this.getAll({ company });
  },

  // Get logs by username
  async getByUsername(username) {
    return this.getAll({ username });
  },

  // Get logs by date range
  async getByDateRange(startDate, endDate) {
    return this.getAll({ startDate, endDate });
  },
};

// Health check
export async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
    return handleResponse(response);
  } catch (error) {
    console.error('Health check failed:', error);
    return { status: 'unhealthy', error: error.message };
  }
}
