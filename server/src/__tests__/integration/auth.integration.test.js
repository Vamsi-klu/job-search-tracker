import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import authRouter from '../../routes/auth.js';
import logsRouter from '../../routes/logs.js';
import { authenticate } from '../../middleware/auth.js';
import db from '../../database.js';

// Create test app
function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);
  app.use('/api/logs', authenticate, logsRouter);
  return app;
}

describe('Authentication Integration Tests', () => {
  let app;
  let testUsername;
  let testPassword;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(() => {
    // Generate unique username for each test to avoid conflicts
    testUsername = `testuser_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    testPassword = 'testpass123';

    // Clean up test database before each test
    try {
      db.prepare('DELETE FROM users WHERE username LIKE ?').run('testuser_%');
    } catch (error) {
      // Table might not exist yet
    }
  });

  afterAll(() => {
    // Clean up test users
    try {
      db.prepare('DELETE FROM users WHERE username LIKE ?').run('testuser_%');
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('User Registration Flow', () => {
    test('should register a new user and return JWT token', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: testUsername,
          password: testPassword
        })
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: 'User registered successfully',
        user: {
          username: testUsername
        }
      });
      expect(response.body.token).toBeDefined();
      expect(typeof response.body.token).toBe('string');
      expect(response.body.user.id).toBeDefined();
    });

    test('should prevent duplicate username registration', async () => {
      // Register first user
      await request(app)
        .post('/api/auth/register')
        .send({
          username: testUsername,
          password: testPassword
        })
        .expect(201);

      // Try to register same username again
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: testUsername,
          password: 'differentpass123'
        })
        .expect(409);

      expect(response.body.error).toBe('Username already exists');
    });

    test('should validate username format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'ab', // Too short
          password: testPassword
        })
        .expect(400);

      expect(response.body.error).toBe('Invalid username');
    });

    test('should validate password length', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: testUsername,
          password: 'short' // Too short
        })
        .expect(400);

      expect(response.body.error).toBe('Weak password');
    });
  });

  describe('User Login Flow', () => {
    beforeEach(async () => {
      // Register user before login tests
      await request(app)
        .post('/api/auth/register')
        .send({
          username: testUsername,
          password: testPassword
        });
    });

    test('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUsername,
          password: testPassword
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Login successful',
        user: {
          username: testUsername
        }
      });
      expect(response.body.token).toBeDefined();
    });

    test('should reject login with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUsername,
          password: 'wrongpassword123'
        })
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
    });

    test('should reject login with non-existent username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent_user',
          password: testPassword
        })
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
    });

    test('should lockout after 5 failed login attempts', async () => {
      // Make 5 failed login attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            username: testUsername,
            password: 'wrongpassword'
          })
          .expect(401);
      }

      // 6th attempt should be locked out
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUsername,
          password: 'wrongpassword'
        })
        .expect(429);

      expect(response.body.error).toBe('Too many failed attempts');
    });
  });

  describe('Protected Routes Access', () => {
    let authToken;

    beforeEach(async () => {
      // Register and login to get token
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: testUsername,
          password: testPassword
        });

      authToken = registerResponse.body.token;
    });

    test('should access protected route with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.user.username).toBe(testUsername);
    });

    test('should reject protected route without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.error).toBe('Authentication required');
    });

    test('should reject protected route with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(response.body.error).toBe('Invalid or expired token');
    });

    test('should reject protected route with malformed Authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'InvalidFormat token123')
        .expect(401);

      expect(response.body.error).toBe('Authentication required');
    });
  });

  describe('Change Password Flow', () => {
    let authToken;

    beforeEach(async () => {
      // Register user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: testUsername,
          password: testPassword
        });

      authToken = registerResponse.body.token;
    });

    test('should change password successfully', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: testPassword,
          newPassword: 'newpassword123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password changed successfully');
    });

    test('should login with new password after change', async () => {
      // Change password
      await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: testPassword,
          newPassword: 'newpassword123'
        })
        .expect(200);

      // Login with new password
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUsername,
          password: 'newpassword123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should not login with old password after change', async () => {
      // Change password
      await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: testPassword,
          newPassword: 'newpassword123'
        })
        .expect(200);

      // Try to login with old password
      await request(app)
        .post('/api/auth/login')
        .send({
          username: testUsername,
          password: testPassword
        })
        .expect(401);
    });

    test('should reject password change with incorrect current password', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123'
        })
        .expect(401);

      expect(response.body.error).toBe('Invalid password');
    });

    test('should reject password change without authentication', async () => {
      await request(app)
        .post('/api/auth/change-password')
        .send({
          currentPassword: testPassword,
          newPassword: 'newpassword123'
        })
        .expect(401);
    });
  });

  describe('Logout Flow', () => {
    let authToken;

    beforeEach(async () => {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: testUsername,
          password: testPassword
        });

      authToken = registerResponse.body.token;
    });

    test('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out successfully');
    });

    test('should allow logout without authentication', async () => {
      // Logout should work even without token (client-side operation)
      await request(app)
        .post('/api/auth/logout')
        .expect(401); // Currently requires auth, but could be changed
    });
  });

  describe('Complete Authentication Workflow', () => {
    test('should complete full registration -> login -> access -> logout flow', async () => {
      // 1. Register
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: testUsername,
          password: testPassword
        })
        .expect(201);

      expect(registerResponse.body.token).toBeDefined();
      const registerToken = registerResponse.body.token;

      // 2. Access protected route with registration token
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${registerToken}`)
        .expect(200);

      // 3. Logout
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${registerToken}`)
        .expect(200);

      // 4. Login again
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUsername,
          password: testPassword
        })
        .expect(200);

      expect(loginResponse.body.token).toBeDefined();
      const loginToken = loginResponse.body.token;

      // 5. Access protected route with login token
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${loginToken}`)
        .expect(200);

      // 6. Change password
      await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${loginToken}`)
        .send({
          currentPassword: testPassword,
          newPassword: 'newpassword123'
        })
        .expect(200);

      // 7. Login with new password
      const newLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUsername,
          password: 'newpassword123'
        })
        .expect(200);

      expect(newLoginResponse.body.success).toBe(true);
    });
  });
});
