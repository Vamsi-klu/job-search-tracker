import bcrypt from 'bcrypt';
import { logStore } from '../database.js';
import { generateToken } from '../middleware/auth.js';
import db from '../database.js';

const SALT_ROUNDS = 10;

// Rate limiting tracking (in-memory - use Redis in production)
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

/**
 * Check if user is locked out due to too many failed attempts
 */
function isLockedOut(username) {
  const attempts = loginAttempts.get(username);
  if (!attempts) return false;

  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
    if (timeSinceLastAttempt < LOCKOUT_TIME) {
      return true;
    } else {
      // Reset after lockout period
      loginAttempts.delete(username);
      return false;
    }
  }

  return false;
}

/**
 * Record failed login attempt
 */
function recordFailedAttempt(username) {
  const attempts = loginAttempts.get(username) || { count: 0, lastAttempt: 0 };
  attempts.count++;
  attempts.lastAttempt = Date.now();
  loginAttempts.set(username, attempts);
}

/**
 * Clear failed login attempts on successful login
 */
function clearFailedAttempts(username) {
  loginAttempts.delete(username);
}

/**
 * Register new user
 */
export async function register(req, res) {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Username and password are required'
      });
    }

    // Username validation
    if (username.length < 3 || username.length > 50) {
      return res.status(400).json({
        error: 'Invalid username',
        message: 'Username must be between 3 and 50 characters'
      });
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return res.status(400).json({
        error: 'Invalid username',
        message: 'Username can only contain letters, numbers, underscores, and hyphens'
      });
    }

    // Password validation
    if (password.length < 8) {
      return res.status(400).json({
        error: 'Weak password',
        message: 'Password must be at least 8 characters long'
      });
    }

    // Check if user already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);

    if (existingUser) {
      return res.status(409).json({
        error: 'Username already exists',
        message: 'Please choose a different username'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user with hashed password
    const now = Math.floor(Date.now() / 1000);
    const insertUser = db.prepare(`
      INSERT INTO users (username, password_hash, created_at)
      VALUES (?, ?, ?)
    `);

    const result = insertUser.run(username, hashedPassword, now);
    const userId = result.lastInsertRowid;

    // Generate JWT token
    const token = generateToken(userId, username);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: userId,
        username
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: 'An error occurred during registration'
    });
  }
}

/**
 * Login existing user
 */
export async function login(req, res) {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Username and password are required'
      });
    }

    // Check if locked out
    if (isLockedOut(username)) {
      return res.status(429).json({
        error: 'Too many failed attempts',
        message: 'Account is temporarily locked. Please try again in 15 minutes.'
      });
    }

    // Find user
    const user = db.prepare('SELECT id, username, password_hash FROM users WHERE username = ?').get(username);

    if (!user) {
      recordFailedAttempt(username);
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Username or password is incorrect'
      });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      recordFailedAttempt(username);
      const attempts = loginAttempts.get(username);
      const remainingAttempts = MAX_LOGIN_ATTEMPTS - (attempts?.count || 0);

      return res.status(401).json({
        error: 'Invalid credentials',
        message: `Username or password is incorrect. ${remainingAttempts} attempts remaining.`
      });
    }

    // Clear failed attempts on successful login
    clearFailedAttempts(username);

    // Generate JWT token
    const token = generateToken(user.id, user.username);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: 'An error occurred during login'
    });
  }
}

/**
 * Get current user info
 */
export function getCurrentUser(req, res) {
  // User info is attached by auth middleware
  res.json({
    success: true,
    user: {
      id: req.user.userId,
      username: req.user.username
    }
  });
}

/**
 * Logout (client-side token removal, but we can blacklist tokens here if needed)
 */
export function logout(req, res) {
  // In a production app, you might want to blacklist the token
  // For now, client just needs to remove the token
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}

/**
 * Change password
 */
export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: 'Weak password',
        message: 'New password must be at least 8 characters long'
      });
    }

    // Get user
    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(userId);

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Verify current password
    const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        error: 'Invalid password',
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashedPassword, userId);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      error: 'Failed to change password',
      message: 'An error occurred while changing password'
    });
  }
}
