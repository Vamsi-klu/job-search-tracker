import express from 'express';
import {
  register,
  login,
  logout,
  getCurrentUser,
  changePassword
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes (require authentication)
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getCurrentUser);
router.post('/change-password', authenticate, changePassword);

export default router;
