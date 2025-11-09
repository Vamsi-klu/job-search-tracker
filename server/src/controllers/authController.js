import bcrypt from 'bcrypt';
import { generateToken } from '../middleware/auth.js';
import logger from '../middleware/logger.js';

const users = new Map(); // In production, use a proper database

export const register = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (users.has(username)) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = Date.now().toString();
    
    users.set(username, {
      userId,
      username,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    });

    const token = generateToken(userId, username);
    
    logger.info(`User registered: ${username}`);
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { userId, username }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = users.get(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.userId, user.username);
    
    logger.info(`User logged in: ${username}`);
    
    res.json({
      message: 'Login successful',
      token,
      user: { userId: user.userId, username: user.username }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};
