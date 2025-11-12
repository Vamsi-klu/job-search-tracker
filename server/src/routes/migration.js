import express from 'express';
import { migrateJobs, migrateLogs } from '../controllers/migrationController.js';

const router = express.Router();

// Migrate jobs from localStorage
router.post('/jobs', migrateJobs);

// Migrate logs from localStorage
router.post('/logs', migrateLogs);

export default router;
