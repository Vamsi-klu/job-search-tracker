const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Token management
let authToken = localStorage.getItem('auth_token');

export function setAuthToken(token) {
  authToken = token;
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
}

export function getAuthToken() {
  return authToken;
}

export function clearAuthToken() {
  authToken = null;
  localStorage.removeItem('auth_token');
  localStorage.removeItem('jobTracker_user');
}

// Helper function to handle API responses
async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));

    // Handle authentication errors
    if (response.status === 401) {
      clearAuthToken();
      // Trigger re-authentication
      window.dispatchEvent(new Event('auth:required'));
    }

    throw new Error(error.error || error.message || 'Request failed');
  }
  return response.json();
}

// Helper to add auth header
function getHeaders() {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  return headers;
}

// Auth API
export const authAPI = {
  async register(username, password) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await handleResponse(response);

    // Save token and username
    if (data.token) {
      setAuthToken(data.token);
      localStorage.setItem('jobTracker_user', data.user.username);
    }

    return data;
  },

  async login(username, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await handleResponse(response);

    // Save token and username
    if (data.token) {
      setAuthToken(data.token);
      localStorage.setItem('jobTracker_user', data.user.username);
    }

    return data;
  },

  async logout() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: getHeaders(),
      });
      await handleResponse(response);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthToken();
    }
  },

  async getCurrentUser() {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async changePassword(currentPassword, newPassword) {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return handleResponse(response);
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!authToken;
  }
};

// Logs API (UPDATED with auth headers)
export const logsAPI = {
  // Create a new log entry
  async create(logData) {
    const response = await fetch(`${API_BASE_URL}/logs`, {
      method: 'POST',
      headers: getHeaders(),
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
    const response = await fetch(url, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Get log statistics
  async getStats() {
    const response = await fetch(`${API_BASE_URL}/logs/stats`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Get a single log by ID
  async getById(id) {
    const response = await fetch(`${API_BASE_URL}/logs/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Delete a log by ID
  async delete(id) {
    const response = await fetch(`${API_BASE_URL}/logs/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Bulk create logs (for migration)
  async bulkCreate(logs) {
    const response = await fetch(`${API_BASE_URL}/logs/bulk`, {
      method: 'POST',
      headers: getHeaders(),
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

  // Get logs for a single job
  async getByJob(jobId) {
    return this.getAll({ jobId });
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
