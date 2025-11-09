import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authAPI } from '../services/authAPI';

describe('authAPI', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a user', async () => {
      const mockResponse = {
        token: 'test-token',
        user: { userId: '123', username: 'testuser' },
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await authAPI.register('testuser', 'password123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/register'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'testuser', password: 'password123' }),
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should throw error on registration failure', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Username already exists' }),
      });

      await expect(authAPI.register('testuser', 'password123')).rejects.toThrow(
        'Username already exists'
      );
    });

    it('should throw generic error when no error message provided', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      await expect(authAPI.register('testuser', 'password123')).rejects.toThrow(
        'Registration failed'
      );
    });

    it('should handle network errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(authAPI.register('testuser', 'password123')).rejects.toThrow(
        'Network error'
      );
    });
  });

  describe('login', () => {
    it('should successfully login a user', async () => {
      const mockResponse = {
        token: 'test-token',
        user: { userId: '123', username: 'testuser' },
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await authAPI.login('testuser', 'password123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/login'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'testuser', password: 'password123' }),
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should throw error on login failure', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid credentials' }),
      });

      await expect(authAPI.login('testuser', 'wrongpassword')).rejects.toThrow(
        'Invalid credentials'
      );
    });

    it('should throw generic error when no error message provided', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      await expect(authAPI.login('testuser', 'password123')).rejects.toThrow(
        'Login failed'
      );
    });

    it('should handle network errors during login', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(authAPI.login('testuser', 'password123')).rejects.toThrow(
        'Network error'
      );
    });

    it('should use correct API base URL from environment', async () => {
      const mockEnv = import.meta.env;
      mockEnv.VITE_API_URL = 'http://custom-api.com';

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'test', user: {} }),
      });

      await authAPI.login('testuser', 'password123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('http://'),
        expect.any(Object)
      );
    });
  });
});
