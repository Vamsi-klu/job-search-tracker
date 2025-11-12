import { jest } from '@jest/globals';
import { generateToken, verifyToken, authenticate, optionalAuth } from '../../middleware/auth.js';

describe('Auth Middleware', () => {
  const JWT_SECRET = 'test-secret';
  const JWT_EXPIRES_IN = '1h';

  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
    process.env.JWT_EXPIRES_IN = JWT_EXPIRES_IN;
  });

  describe('generateToken', () => {
    test('should generate a JWT token with userId and username', () => {
      const token = generateToken(1, 'testuser');

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    test('should generate different tokens for different users', () => {
      const token1 = generateToken(1, 'user1');
      const token2 = generateToken(2, 'user2');

      expect(token1).not.toBe(token2);
    });

    test('should include userId and username in token payload', () => {
      const token = generateToken(123, 'testuser');
      const decoded = verifyToken(token);

      expect(decoded.userId).toBe(123);
      expect(decoded.username).toBe('testuser');
    });
  });

  describe('verifyToken', () => {
    test('should verify a valid token and return decoded payload', () => {
      const token = generateToken(1, 'testuser');
      const result = verifyToken(token);

      expect(result).toBeDefined();
      expect(result.userId).toBe(1);
      expect(result.username).toBe('testuser');
    });

    test('should return null for invalid token', () => {
      const result = verifyToken('invalid.token.here');
      expect(result).toBeNull();
    });

    test('should return null for malformed token', () => {
      const result = verifyToken('not-even-a-token');
      expect(result).toBeNull();
    });

    test('should return null for empty token', () => {
      const result = verifyToken('');
      expect(result).toBeNull();
    });
  });

  describe('authenticate middleware', () => {
    let req, res, next;

    beforeEach(() => {
      req = {
        headers: {}
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      next = jest.fn();
    });

    test('should authenticate user with valid Bearer token', () => {
      const token = generateToken(1, 'testuser');
      req.headers.authorization = `Bearer ${token}`;

      authenticate(req, res, next);

      expect(req.user).toEqual({
        userId: 1,
        username: 'testuser'
      });
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should reject request without Authorization header', () => {
      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        message: 'Please provide a valid authentication token'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject request with empty Authorization header', () => {
      req.headers.authorization = '';

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        message: 'Please provide a valid authentication token'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject request without Bearer prefix', () => {
      req.headers.authorization = 'token123';

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        message: 'Please provide a valid authentication token'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject request with invalid token', () => {
      req.headers.authorization = 'Bearer invalid.token';

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid or expired token',
        message: 'Please log in again'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should extract token correctly from Bearer scheme', () => {
      const token = generateToken(42, 'anotheruser');
      req.headers.authorization = `Bearer ${token}`;

      authenticate(req, res, next);

      expect(req.user.userId).toBe(42);
      expect(req.user.username).toBe('anotheruser');
      expect(next).toHaveBeenCalled();
    });

    test('should not modify request when authentication fails', () => {
      req.headers.authorization = 'Bearer invalid.token';

      authenticate(req, res, next);

      expect(req.user).toBeUndefined();
    });
  });

  describe('optionalAuth middleware', () => {
    let req, res, next;

    beforeEach(() => {
      req = {
        headers: {}
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      next = jest.fn();
    });

    test('should attach user info when valid token is provided', () => {
      const token = generateToken(1, 'testuser');
      req.headers.authorization = `Bearer ${token}`;

      optionalAuth(req, res, next);

      expect(req.user).toEqual({
        userId: 1,
        username: 'testuser'
      });
      expect(next).toHaveBeenCalled();
    });

    test('should proceed without user info when no token is provided', () => {
      optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    test('should proceed without user info when token is invalid', () => {
      req.headers.authorization = 'Bearer invalid.token';

      optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should proceed without user info when Authorization header is malformed', () => {
      req.headers.authorization = 'InvalidFormat token123';

      optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });

    test('should handle empty Authorization header gracefully', () => {
      req.headers.authorization = '';

      optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
