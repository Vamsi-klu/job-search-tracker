const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Validate API URL is configured
if (!API_BASE_URL) {
  console.error('VITE_API_URL not configured');
}

/**
 * Fetch with timeout
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

/**
 * Fetch with retry logic
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} retries - Number of retries
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Response>}
 */
async function fetchWithRetry(url, options = {}, retries = 3, timeout = 10000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetchWithTimeout(url, options, timeout);
    } catch (error) {
      const isLastAttempt = i === retries - 1;

      // Don't retry on 4xx errors (client errors)
      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        throw error;
      }

      if (isLastAttempt) {
        throw error;
      }

      // Exponential backoff
      const backoffDelay = Math.min(1000 * Math.pow(2, i), 10000);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));

      console.warn(`Retry attempt ${i + 1}/${retries} for ${url}`);
    }
  }
}

/**
 * Helper function to handle API responses
 * @param {Response} response - Fetch response
 * @returns {Promise<Object>}
 */
async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: 'Request failed',
      status: response.status
    }));

    const errorMessage = error.error || error.message || 'Request failed';
    const err = new Error(errorMessage);
    err.status = response.status;
    err.response = error;
    throw err;
  }

  return response.json();
}

// Logs API
export const logsAPI = {
  /**
   * Create a new log entry
   * @param {Object} logData - Log entry data
   * @returns {Promise<Object>}
   */
  async create(logData) {
    const response = await fetchWithRetry(
      `${API_BASE_URL}/logs`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logData),
      },
      2 // 2 retries for POST
    );
    return handleResponse(response);
  },

  /**
   * Get all logs with optional filters
   * @param {Object} filters - Query filters
   * @returns {Promise<Object>}
   */
  async getAll(filters = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const url = `${API_BASE_URL}/logs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetchWithRetry(url, {}, 3);
    return handleResponse(response);
  },

  /**
   * Get log statistics
   * @returns {Promise<Object>}
   */
  async getStats() {
    const response = await fetchWithRetry(`${API_BASE_URL}/logs/stats`);
    return handleResponse(response);
  },

  /**
   * Get a single log by ID
   * @param {number} id - Log ID
   * @returns {Promise<Object>}
   */
  async getById(id) {
    const response = await fetchWithRetry(`${API_BASE_URL}/logs/${id}`);
    return handleResponse(response);
  },

  /**
   * Delete a log by ID
   * @param {number} id - Log ID
   * @returns {Promise<Object>}
   */
  async delete(id) {
    const response = await fetchWithRetry(
      `${API_BASE_URL}/logs/${id}`,
      {
        method: 'DELETE',
      },
      2
    );
    return handleResponse(response);
  },

  /**
   * Bulk create logs (for migration)
   * @param {Array} logs - Array of log entries
   * @returns {Promise<Object>}
   */
  async bulkCreate(logs) {
    const response = await fetchWithRetry(
      `${API_BASE_URL}/logs/bulk`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs }),
      },
      2
    );
    return handleResponse(response);
  },

  /**
   * Query logs with filters
   * @param {Object} filters - Query filters
   * @returns {Promise<Object>}
   */
  async query(filters) {
    return this.getAll(filters);
  },

  /**
   * Get recent activity (last N days)
   * @param {number} days - Number of days
   * @returns {Promise<Object>}
   */
  async getRecent(days = 7) {
    return this.getAll({ days });
  },

  /**
   * Search logs by keyword
   * @param {string} keyword - Search keyword
   * @returns {Promise<Object>}
   */
  async search(keyword) {
    return this.getAll({ search: keyword });
  },

  /**
   * Get logs by action type
   * @param {string} action - Action type
   * @returns {Promise<Object>}
   */
  async getByAction(action) {
    return this.getAll({ action });
  },

  /**
   * Get logs by company
   * @param {string} company - Company name
   * @returns {Promise<Object>}
   */
  async getByCompany(company) {
    return this.getAll({ company });
  },

  /**
   * Get logs by username
   * @param {string} username - Username
   * @returns {Promise<Object>}
   */
  async getByUsername(username) {
    return this.getAll({ username });
  },

  /**
   * Get logs by date range
   * @param {string} startDate - Start date (ISO 8601)
   * @param {string} endDate - End date (ISO 8601)
   * @returns {Promise<Object>}
   */
  async getByDateRange(startDate, endDate) {
    return this.getAll({ startDate, endDate });
  },
};

/**
 * Health check
 * @returns {Promise<Object>}
 */
export async function checkHealth() {
  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL.replace('/api', '')}/health`,
      {},
      5000
    );
    return handleResponse(response);
  } catch (error) {
    console.error('Health check failed:', error);
    return { status: 'unhealthy', error: error.message };
  }
}

export default logsAPI;
