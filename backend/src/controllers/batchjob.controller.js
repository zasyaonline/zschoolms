import batchJobService from '../services/batchjob.service.js';

/**
 * Batch Job Controller
 * Handles API endpoints for batch job monitoring
 */

/**
 * Get status of a specific job
 * GET /api/batch-jobs/:id
 */
export const getJobStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    const status = await batchJobService.getJobStatus(id);
    
    if (!status) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting job status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get job status',
      error: error.message
    });
  }
};

/**
 * Get active jobs for the current user
 * GET /api/batch-jobs/active
 */
export const getActiveJobs = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const jobs = await batchJobService.getActiveJobsForUser(userId);
    
    res.json({
      success: true,
      data: jobs
    });
  } catch (error) {
    console.error('Error getting active jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active jobs',
      error: error.message
    });
  }
};

/**
 * Get job history for the current user
 * GET /api/batch-jobs/history
 */
export const getJobHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;
    
    const { jobs, total } = await batchJobService.getJobHistoryForUser(userId, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      data: {
        jobs,
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error getting job history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get job history',
      error: error.message
    });
  }
};

/**
 * Get all active jobs (admin only)
 * GET /api/batch-jobs/admin/active
 */
export const getAllActiveJobs = async (req, res) => {
  try {
    const jobs = await batchJobService.getAllActiveJobs();
    
    res.json({
      success: true,
      data: jobs
    });
  } catch (error) {
    console.error('Error getting all active jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active jobs',
      error: error.message
    });
  }
};

/**
 * Cancel a job
 * POST /api/batch-jobs/:id/cancel
 */
export const cancelJob = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const job = await batchJobService.cancelJob(id, userId);
    
    res.json({
      success: true,
      message: 'Job cancelled successfully',
      data: job.getFormattedStatus()
    });
  } catch (error) {
    console.error('Error cancelling job:', error);
    
    if (error.message === 'Job not found') {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    if (error.message === 'Not authorized to cancel this job') {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.message === 'Cannot cancel a completed or failed job') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to cancel job',
      error: error.message
    });
  }
};

/**
 * Cleanup old jobs (admin only)
 * POST /api/batch-jobs/admin/cleanup
 */
export const cleanupOldJobs = async (req, res) => {
  try {
    const deletedCount = await batchJobService.cleanupOldJobs();
    
    res.json({
      success: true,
      message: `Cleaned up ${deletedCount} old jobs`,
      data: { deletedCount }
    });
  } catch (error) {
    console.error('Error cleaning up old jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup old jobs',
      error: error.message
    });
  }
};

export default {
  getJobStatus,
  getActiveJobs,
  getJobHistory,
  getAllActiveJobs,
  cancelJob,
  cleanupOldJobs
};
