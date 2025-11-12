import express from 'express';
import {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  getJobStats
} from '../controllers/jobsController.js';

const router = express.Router();

// Create a new job
router.post('/', createJob);

// Get all jobs (with optional filters)
router.get('/', getJobs);

// Get job statistics
router.get('/stats', getJobStats);

// Get a specific job by ID
router.get('/:id', getJobById);

// Update a job
router.put('/:id', updateJob);

// Delete a job
router.delete('/:id', deleteJob);

export default router;
