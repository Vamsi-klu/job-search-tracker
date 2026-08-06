import { describe, it, expect, beforeEach, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { authenticateToken, generateToken } from '../middleware/auth.js';

describe('Auth Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      headers: {},
    };
    mockRes = {
      status: function (code) {
        this.statusCode = code;
        return this;
      },
      json: function (data) {
        this.data = data;
        return this;
      },
    };
    mockNext = vi.fn();
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken('user123', 'testuser');

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');

      const decoded = jwt.decode(token);
      expect(decoded.userId).toBe('user123');
      expect(decoded.username).toBe('testuser');
      expect(decoded).toHaveProperty('exp');
      expect(decoded).toHaveProperty('iat');
    });

    it('should generate tokens with 7-day expiration', () => {
      const token = generateToken('user123', 'testuser');
      const decoded = jwt.decode(token);

      const expirationTime = decoded.exp - decoded.iat;
      const sevenDaysInSeconds = 7 * 24 * 60 * 60;

      expect(expirationTime).toBe(sevenDaysInSeconds);
    });

    it('should generate different tokens for different users', () => {
      const token1 = generateToken('user1', 'testuser1');
      const token2 = generateToken('user2', 'testuser2');

      expect(token1).not.toBe(token2);

      const decoded1 = jwt.decode(token1);
      const decoded2 = jwt.decode(token2);

      expect(decoded1.userId).not.toBe(decoded2.userId);
      expect(decoded1.username).not.toBe(decoded2.username);
    });
  });

  describe('authenticateToken', () => {
    it('should authenticate valid token', () => {
      const token = generateToken('user123', 'testuser');
      mockReq.headers['authorization'] = `Bearer ${token}`;

      authenticateToken(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();
      expect(mockReq.user.userId).toBe('user123');
      expect(mockReq.user.username).toBe('testuser');
    });

    it('should reject request without token', () => {
      authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(401);
      expect(mockRes.data.error).toBe('Access token required');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token', () => {
      mockReq.headers['authorization'] = 'Bearer invalid-token';

      authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(403);
      expect(mockRes.data.error).toBe('Invalid or expired token');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject expired token', () => {
      const expiredToken = jwt.sign(
        { userId: 'user123', username: 'testuser' },
        process.env.JWT_SECRET || 'your-secret-key-change-in-production',
        { expiresIn: '-1s' }
      );

      mockReq.headers['authorization'] = `Bearer ${expiredToken}`;

      authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(403);
      expect(mockRes.data.error).toBe('Invalid or expired token');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle malformed authorization header', () => {
      mockReq.headers['authorization'] = 'InvalidFormat';

      authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(401);
      expect(mockRes.data.error).toBe('Access token required');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle authorization header without Bearer prefix', () => {
      const token = generateToken('user123', 'testuser');
      mockReq.headers['authorization'] = token;

      authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(401);
      expect(mockRes.data.error).toBe('Access token required');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle token with wrong secret', () => {
      const wrongToken = jwt.sign(
        { userId: 'user123', username: 'testuser' },
        'wrong-secret',
        { expiresIn: '7d' }
      );

      mockReq.headers['authorization'] = `Bearer ${wrongToken}`;

      authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(403);
      expect(mockRes.data.error).toBe('Invalid or expired token');
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
