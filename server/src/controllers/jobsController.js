import { userOps, companyOps, jobOps, activityLogOps, transaction } from '../database-optimized.js';

/**
 * JOBS CONTROLLER
 *
 * Handles all job-related API operations with the optimized database.
 * All operations are user-scoped for security.
 */

/**
 * Create a new job
 * POST /api/jobs
 */
export function createJob(req, res) {
  try {
    const { company, recruiterName, position, recruiterScreen, technicalScreen,
            onsiteRound1, onsiteRound2, onsiteRound3, onsiteRound4,
            decision, notes, username } = req.body;

    // Validation
    if (!company || !position || !username) {
      return res.status(400).json({
        error: 'Missing required fields: company, position, and username are required'
      });
    }

    // Use transaction for atomicity
    const createJobTransaction = transaction((jobData) => {
      // Get or create user
      const user = userOps.upsert.get({ username: jobData.username });

      // Get or create company
      const companyRecord = companyOps.upsert.get({ name: jobData.company });

      // Create job
      const result = jobOps.create.run({
        company_id: companyRecord.id,
        user_id: user.id,
        recruiter_name: jobData.recruiterName || 'Unknown',
        position: jobData.position,
        recruiter_screen: jobData.recruiterScreen || 'Not Started',
        technical_screen: jobData.technicalScreen || 'Not Started',
        onsite_round1: jobData.onsiteRound1 || 'Not Started',
        onsite_round2: jobData.onsiteRound2 || 'Not Started',
        onsite_round3: jobData.onsiteRound3 || 'Not Started',
        onsite_round4: jobData.onsiteRound4 || 'Not Started',
        decision: jobData.decision || 'Pending',
        notes: jobData.notes || null
      });

      // Create activity log
      activityLogOps.create.run({
        job_id: result.lastInsertRowid,
        user_id: user.id,
        action: 'created',
        field_changed: null,
        old_value: null,
        new_value: null,
        details: `Job application created for ${jobData.position} at ${jobData.company}`
      });

      return { jobId: result.lastInsertRowid, userId: user.id };
    });

    const { jobId, userId } = createJobTransaction(req.body);

    // Get the created job with company name
    const job = jobOps.getById.get({ id: jobId });

    res.status(201).json({
      success: true,
      data: job,
      message: 'Job created successfully'
    });

  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({
      error: 'Failed to create job',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Get all jobs for a user
 * GET /api/jobs?username=xxx
 */
export function getJobs(req, res) {
  try {
    const { username, search, decision, limit, offset } = req.query;

    if (!username) {
      return res.status(400).json({
        error: 'Missing required parameter: username'
      });
    }

    // Get user
    const user = userOps.getByUsername.get({ username });
    if (!user) {
      return res.json({
        success: true,
        data: [],
        count: 0,
        message: 'No jobs found'
      });
    }

    let jobs;
    let totalCount;

    // Full-text search
    if (search) {
      jobs = jobOps.search.all({
        query: search,
        user_id: user.id
      });
      totalCount = jobs.length;
    }
    // Filter by decision
    else if (decision) {
      jobs = jobOps.getByDecision.all({
        user_id: user.id,
        decision
      });
      totalCount = jobs.length;
    }
    // Pagination
    else if (limit) {
      const limitNum = parseInt(limit);
      const offsetNum = parseInt(offset) || 0;

      jobs = jobOps.getPaginated.all({
        user_id: user.id,
        limit: limitNum,
        offset: offsetNum
      });

      const countResult = jobOps.countByUser.get({ user_id: user.id });
      totalCount = countResult.count;
    }
    // Get all
    else {
      jobs = jobOps.getAllByUser.all({ user_id: user.id });
      totalCount = jobs.length;
    }

    res.json({
      success: true,
      data: jobs,
      count: jobs.length,
      totalCount,
      message: `Retrieved ${jobs.length} jobs`
    });

  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({
      error: 'Failed to fetch jobs',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Get a single job by ID
 * GET /api/jobs/:id
 */
export function getJobById(req, res) {
  try {
    const { id } = req.params;
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({
        error: 'Missing required parameter: username'
      });
    }

    const job = jobOps.getById.get({ id: parseInt(id) });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Verify user owns this job
    const user = userOps.getByUsername.get({ username });
    if (!user || job.user_id !== user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json({
      success: true,
      data: job
    });

  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({
      error: 'Failed to fetch job',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Update a job
 * PUT /api/jobs/:id
 */
export function updateJob(req, res) {
  try {
    const { id } = req.params;
    const { company, recruiterName, position, recruiterScreen, technicalScreen,
            onsiteRound1, onsiteRound2, onsiteRound3, onsiteRound4,
            decision, notes, username } = req.body;

    if (!username) {
      return res.status(400).json({
        error: 'Missing required field: username'
      });
    }

    // Get user
    const user = userOps.getByUsername.get({ username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get existing job to track changes
    const existingJob = jobOps.getById.get({ id: parseInt(id) });
    if (!existingJob) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Verify ownership
    if (existingJob.user_id !== user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Use transaction for atomicity
    const updateJobTransaction = transaction((jobData) => {
      // Get or create company if changed
      let companyId = existingJob.company_id;
      if (jobData.company && jobData.company !== existingJob.company_name) {
        const companyRecord = companyOps.upsert.get({ name: jobData.company });
        companyId = companyRecord.id;
      }

      // Update job
      jobOps.update.run({
        id: parseInt(id),
        user_id: user.id,
        company_id: companyId,
        recruiter_name: jobData.recruiterName || existingJob.recruiter_name,
        position: jobData.position || existingJob.position,
        recruiter_screen: jobData.recruiterScreen || existingJob.recruiter_screen,
        technical_screen: jobData.technicalScreen || existingJob.technical_screen,
        onsite_round1: jobData.onsiteRound1 || existingJob.onsite_round1,
        onsite_round2: jobData.onsiteRound2 || existingJob.onsite_round2,
        onsite_round3: jobData.onsiteRound3 || existingJob.onsite_round3,
        onsite_round4: jobData.onsiteRound4 || existingJob.onsite_round4,
        decision: jobData.decision || existingJob.decision,
        notes: jobData.notes !== undefined ? jobData.notes : existingJob.notes
      });

      // Track which fields changed
      const changes = [];
      if (jobData.recruiterScreen && jobData.recruiterScreen !== existingJob.recruiter_screen) {
        changes.push(`recruiterScreen: ${existingJob.recruiter_screen} → ${jobData.recruiterScreen}`);
      }
      if (jobData.technicalScreen && jobData.technicalScreen !== existingJob.technical_screen) {
        changes.push(`technicalScreen: ${existingJob.technical_screen} → ${jobData.technicalScreen}`);
      }
      if (jobData.decision && jobData.decision !== existingJob.decision) {
        changes.push(`decision: ${existingJob.decision} → ${jobData.decision}`);
      }

      // Create activity log
      activityLogOps.create.run({
        job_id: parseInt(id),
        user_id: user.id,
        action: 'updated',
        field_changed: changes.length > 0 ? changes.join(', ') : 'Job details',
        old_value: null,
        new_value: null,
        details: `Job updated: ${changes.length > 0 ? changes.join('; ') : 'details modified'}`
      });
    });

    updateJobTransaction(req.body);

    // Get updated job
    const updatedJob = jobOps.getById.get({ id: parseInt(id) });

    res.json({
      success: true,
      data: updatedJob,
      message: 'Job updated successfully'
    });

  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({
      error: 'Failed to update job',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Delete a job
 * DELETE /api/jobs/:id
 */
export function deleteJob(req, res) {
  try {
    const { id } = req.params;
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({
        error: 'Missing required parameter: username'
      });
    }

    // Get user
    const user = userOps.getByUsername.get({ username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get job to verify ownership and get details for log
    const job = jobOps.getById.get({ id: parseInt(id) });
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Verify ownership
    if (job.user_id !== user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Delete (cascades to activity logs automatically)
    const result = jobOps.delete.run({
      id: parseInt(id),
      user_id: user.id
    });

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Job not found or already deleted' });
    }

    res.json({
      success: true,
      message: `Job deleted: ${job.position} at ${job.company_name}`
    });

  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({
      error: 'Failed to delete job',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Get job statistics
 * GET /api/jobs/stats
 */
export function getJobStats(req, res) {
  try {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({
        error: 'Missing required parameter: username'
      });
    }

    // Get user
    const user = userOps.getByUsername.get({ username });
    if (!user) {
      return res.json({
        success: true,
        data: {
          byDecision: [],
          byAction: [],
          totalJobs: 0,
          totalLogs: 0
        }
      });
    }

    // Get stats
    const byDecision = jobOps.getByDecision.all({ user_id: user.id });
    const totalJobs = jobOps.countByUser.get({ user_id: user.id });

    res.json({
      success: true,
      data: {
        byDecision,
        totalJobs: totalJobs.count
      }
    });

  } catch (error) {
    console.error('Error fetching job stats:', error);
    res.status(500).json({
      error: 'Failed to fetch job statistics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
