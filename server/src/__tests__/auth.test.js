import { describe, it, expect, beforeEach } from 'vitest';
import { register, login } from '../controllers/authController.js';

describe('Authentication Controller', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    mockReq = {
      body: {}
    };
    mockRes = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.data = data;
        return this;
      }
    };
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      mockReq.body = {
        username: 'testuser',
        password: 'password123'
      };

      await register(mockReq, mockRes);

      expect(mockRes.statusCode).toBe(201);
      expect(mockRes.data).toHaveProperty('token');
      expect(mockRes.data).toHaveProperty('user');
      expect(mockRes.data.user.username).toBe('testuser');
    });

    it('should reject duplicate username', async () => {
      mockReq.body = {
        username: 'testuser',
        password: 'password123'
      };

      await register(mockReq, mockRes);
      
      // Try to register again
      const mockRes2 = {
        status: function(code) {
          this.statusCode = code;
          return this;
        },
        json: function(data) {
          this.data = data;
          return this;
        }
      };

      await register(mockReq, mockRes2);

      expect(mockRes2.statusCode).toBe(409);
      expect(mockRes2.data.error).toBe('Username already exists');
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      // Register a user first
      mockReq.body = {
        username: 'logintest',
        password: 'password123'
      };
      await register(mockReq, mockRes);
    });

    it('should login with correct credentials', async () => {
      const loginReq = {
        body: {
          username: 'logintest',
          password: 'password123'
        }
      };
      const loginRes = {
        status: function(code) {
          this.statusCode = code;
          return this;
        },
        json: function(data) {
          this.data = data;
          return this;
        }
      };

      await login(loginReq, loginRes);

      expect(loginRes.data).toHaveProperty('token');
      expect(loginRes.data.user.username).toBe('logintest');
    });

    it('should reject incorrect password', async () => {
      const loginReq = {
        body: {
          username: 'logintest',
          password: 'wrongpassword'
        }
      };
      const loginRes = {
        status: function(code) {
          this.statusCode = code;
          return this;
        },
        json: function(data) {
          this.data = data;
          return this;
        }
      };

      await login(loginReq, loginRes);

      expect(loginRes.statusCode).toBe(401);
      expect(loginRes.data.error).toBe('Invalid credentials');
    });

    it('should reject non-existent user', async () => {
      const loginReq = {
        body: {
          username: 'nonexistent',
          password: 'password123'
        }
      };
      const loginRes = {
        status: function(code) {
          this.statusCode = code;
          return this;
        },
        json: function(data) {
          this.data = data;
          return this;
        }
      };

      await login(loginReq, loginRes);

      expect(loginRes.statusCode).toBe(401);
      expect(loginRes.data.error).toBe('Invalid credentials');
    });
  });
});
