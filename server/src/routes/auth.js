import express from 'express';
import { body } from 'express-validator';
import { register, login } from '../controllers/authController.js';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

const authValidation = [
  body('username').trim().isLength({ min: 3, max: 50 }).isAlphanumeric().escape(),
  body('password').isLength({ min: 6, max: 100 }),
  handleValidationErrors
];

router.post('/register', authValidation, register);
router.post('/login', authValidation, login);

export default router;
