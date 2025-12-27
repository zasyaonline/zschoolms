import { BatchJob, User, ClassSection, AcademicYear } from '../models/index.js';
import notificationService from './notification.service.js';

/**
 * Batch Job Service
 * Manages tracking and monitoring of long-running batch operations
 */
const batchJobService = {
  /**
   * Create a new batch job
   * @param {Object} params - Job parameters
   * @returns {Promise<BatchJob>}
   */
  async createJob(params) {
    const job = await BatchJob.createJob(params);
    return job;
  },

  /**
   * Get job by ID
   * @param {string} jobId - Job UUID
   * @returns {Promise<BatchJob|null>}
   */
  async getJobById(jobId) {
    return BatchJob.findByPk(jobId, {
      include: [
        { model: User, as: 'initiator', attributes: ['id', 'first_name', 'last_name', 'email'] },
        { model: ClassSection, as: 'classSection', attributes: ['id', 'section_name'] },
        { model: AcademicYear, as: 'academicYear', attributes: ['id', 'year_name'] }
      ]
    });
  },

  /**
   * Get job status formatted for API response
   * @param {string} jobId - Job UUID
   * @returns {Promise<Object|null>}
   */
  async getJobStatus(jobId) {
    const job = await this.getJobById(jobId);
    if (!job) return null;
    return job.getFormattedStatus();
  },

  /**
   * Get active jobs for a user
   * @param {string} userId - User UUID
   * @returns {Promise<BatchJob[]>}
   */
  async getActiveJobsForUser(userId) {
    const jobs = await BatchJob.getActiveJobs(userId);
    return jobs.map(job => job.getFormattedStatus());
  },

  /**
   * Get job history for a user
   * @param {string} userId - User UUID
   * @param {Object} options - Pagination options
   * @returns {Promise<{jobs: Object[], total: number}>}
   */
  async getJobHistoryForUser(userId, options = {}) {
    const { jobs, total } = await BatchJob.getJobHistory(userId, options);
    return {
      jobs: jobs.map(job => job.getFormattedStatus()),
      total
    };
  },

  /**
   * Start a job
   * @param {string} jobId - Job UUID
   * @returns {Promise<BatchJob>}
   */
  async startJob(jobId) {
    const job = await BatchJob.findByPk(jobId);
    if (!job) throw new Error('Job not found');
    return job.start();
  },

  /**
   * Update job progress
   * @param {string} jobId - Job UUID
   * @param {Object} update - Progress update
   * @returns {Promise<BatchJob>}
   */
  async updateJobProgress(jobId, update) {
    const job = await BatchJob.findByPk(jobId);
    if (!job) throw new Error('Job not found');
    return job.updateProgress(update);
  },

  /**
   * Complete a job and send notification
   * @param {string} jobId - Job UUID
   * @param {Object} resultSummary - Summary of results
   * @returns {Promise<BatchJob>}
   */
  async completeJob(jobId, resultSummary = {}) {
    const job = await BatchJob.findByPk(jobId);
    if (!job) throw new Error('Job not found');
    
    await job.complete(resultSummary);
    
    // Send completion notification
    try {
      await notificationService.createNotification({
        userId: job.initiated_by,
        type: 'report_generated',
        title: `${job.job_name} - Completed`,
        message: `Batch operation completed: ${job.successful_items} successful, ${job.failed_items} failed out of ${job.total_items} total.`,
        data: {
          jobId: job.id,
          jobType: job.job_type,
          results: resultSummary
        }
      });
    } catch (notificationError) {
      console.error('Failed to send job completion notification:', notificationError);
    }
    
    return job;
  },

  /**
   * Fail a job and send notification
   * @param {string} jobId - Job UUID
   * @param {string} errorMessage - Error that caused failure
   * @returns {Promise<BatchJob>}
   */
  async failJob(jobId, errorMessage) {
    const job = await BatchJob.findByPk(jobId);
    if (!job) throw new Error('Job not found');
    
    await job.fail(errorMessage);
    
    // Send failure notification
    try {
      await notificationService.createNotification({
        userId: job.initiated_by,
        type: 'system_alert',
        title: `${job.job_name} - Failed`,
        message: `Batch operation failed: ${errorMessage}`,
        data: {
          jobId: job.id,
          jobType: job.job_type,
          error: errorMessage
        }
      });
    } catch (notificationError) {
      console.error('Failed to send job failure notification:', notificationError);
    }
    
    return job;
  },

  /**
   * Cancel a job
   * @param {string} jobId - Job UUID
   * @param {string} userId - User attempting to cancel
   * @returns {Promise<BatchJob>}
   */
  async cancelJob(jobId, userId) {
    const job = await BatchJob.findByPk(jobId);
    if (!job) throw new Error('Job not found');
    
    // Only the initiator or admin can cancel
    if (job.initiated_by !== userId) {
      throw new Error('Not authorized to cancel this job');
    }
    
    // Can only cancel pending or in-progress jobs
    if (!['pending', 'in_progress'].includes(job.status)) {
      throw new Error('Cannot cancel a completed or failed job');
    }
    
    return job.cancel();
  },

  /**
   * Get all active jobs (for admin monitoring)
   * @returns {Promise<Object[]>}
   */
  async getAllActiveJobs() {
    const jobs = await BatchJob.findAll({
      where: {
        status: ['pending', 'in_progress']
      },
      include: [
        { model: User, as: 'initiator', attributes: ['id', 'first_name', 'last_name', 'email'] },
        { model: ClassSection, as: 'classSection', attributes: ['id', 'section_name'] },
        { model: AcademicYear, as: 'academicYear', attributes: ['id', 'year_name'] }
      ],
      order: [['created_at', 'DESC']]
    });
    
    return jobs.map(job => ({
      ...job.getFormattedStatus(),
      initiator: job.initiator ? {
        id: job.initiator.id,
        name: `${job.initiator.first_name} ${job.initiator.last_name}`,
        email: job.initiator.email
      } : null,
      classSection: job.classSection?.section_name,
      academicYear: job.academicYear?.year_name
    }));
  },

  /**
   * Clean up old completed jobs
   * @returns {Promise<number>}
   */
  async cleanupOldJobs() {
    return BatchJob.cleanupOldJobs();
  }
};

export default batchJobService;
