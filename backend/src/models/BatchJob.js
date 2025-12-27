import { DataTypes, Op } from 'sequelize';
import sequelize from '../config/database.js';

const BatchJob = sequelize.define('BatchJob', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  job_type: {
    type: DataTypes.ENUM('report_card_generation', 'report_card_signing', 'marks_export', 'attendance_report'),
    allowNull: false
  },
  job_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  class_section_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'class_sections',
      key: 'id'
    }
  },
  academic_year_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'academic_years',
      key: 'id'
    }
  },
  initiated_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'failed', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending'
  },
  total_items: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  processed_items: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  successful_items: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  failed_items: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  skipped_items: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  progress_percent: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  started_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  estimated_completion: {
    type: DataTypes.DATE,
    allowNull: true
  },
  result_summary: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  error_log: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'batch_jobs',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Static methods

/**
 * Create a new batch job
 * @param {Object} params - Job parameters
 * @param {string} params.jobType - Type of job
 * @param {string} params.jobName - Human-readable name
 * @param {string} params.initiatedBy - User ID who started the job
 * @param {string} [params.classSectionId] - Class section ID if applicable
 * @param {string} [params.academicYearId] - Academic year ID if applicable
 * @param {number} params.totalItems - Total items to process
 * @param {Object} [params.metadata] - Additional metadata
 * @returns {Promise<BatchJob>}
 */
BatchJob.createJob = async function({
  jobType,
  jobName,
  initiatedBy,
  classSectionId = null,
  academicYearId = null,
  totalItems,
  metadata = {}
}) {
  return this.create({
    job_type: jobType,
    job_name: jobName,
    initiated_by: initiatedBy,
    class_section_id: classSectionId,
    academic_year_id: academicYearId,
    total_items: totalItems,
    status: 'pending',
    metadata
  });
};

/**
 * Start processing a job
 * @returns {Promise<BatchJob>}
 */
BatchJob.prototype.start = async function() {
  this.status = 'in_progress';
  this.started_at = new Date();
  return this.save();
};

/**
 * Update progress of a job
 * @param {Object} update - Progress update
 * @param {number} [update.processed] - Items processed so far
 * @param {number} [update.successful] - Successful items
 * @param {number} [update.failed] - Failed items
 * @param {number} [update.skipped] - Skipped items
 * @param {string} [update.error] - Error message to add to log
 * @returns {Promise<BatchJob>}
 */
BatchJob.prototype.updateProgress = async function({ processed, successful, failed, skipped, error }) {
  if (processed !== undefined) this.processed_items = processed;
  if (successful !== undefined) this.successful_items = successful;
  if (failed !== undefined) this.failed_items = failed;
  if (skipped !== undefined) this.skipped_items = skipped;
  
  // Calculate progress percentage
  if (this.total_items > 0) {
    this.progress_percent = Math.round((this.processed_items / this.total_items) * 10000) / 100;
  }
  
  // Add error to log if provided
  if (error) {
    const errorLog = this.error_log || [];
    errorLog.push({
      timestamp: new Date().toISOString(),
      message: error
    });
    this.error_log = errorLog;
  }
  
  // Estimate completion time based on current pace
  if (this.processed_items > 0 && this.started_at) {
    const elapsedMs = Date.now() - new Date(this.started_at).getTime();
    const msPerItem = elapsedMs / this.processed_items;
    const remainingItems = this.total_items - this.processed_items;
    const estimatedRemainingMs = msPerItem * remainingItems;
    this.estimated_completion = new Date(Date.now() + estimatedRemainingMs);
  }
  
  return this.save();
};

/**
 * Mark job as completed
 * @param {Object} [resultSummary] - Summary of results
 * @returns {Promise<BatchJob>}
 */
BatchJob.prototype.complete = async function(resultSummary = {}) {
  this.status = 'completed';
  this.completed_at = new Date();
  this.progress_percent = 100;
  this.result_summary = resultSummary;
  return this.save();
};

/**
 * Mark job as failed
 * @param {string} errorMessage - Error that caused failure
 * @returns {Promise<BatchJob>}
 */
BatchJob.prototype.fail = async function(errorMessage) {
  this.status = 'failed';
  this.completed_at = new Date();
  
  const errorLog = this.error_log || [];
  errorLog.push({
    timestamp: new Date().toISOString(),
    message: errorMessage,
    fatal: true
  });
  this.error_log = errorLog;
  
  return this.save();
};

/**
 * Cancel a job
 * @returns {Promise<BatchJob>}
 */
BatchJob.prototype.cancel = async function() {
  this.status = 'cancelled';
  this.completed_at = new Date();
  return this.save();
};

/**
 * Get active jobs for a user
 * @param {string} userId - User ID
 * @returns {Promise<BatchJob[]>}
 */
BatchJob.getActiveJobs = async function(userId) {
  return this.findAll({
    where: {
      initiated_by: userId,
      status: {
        [Op.in]: ['pending', 'in_progress']
      }
    },
    order: [['created_at', 'DESC']]
  });
};

/**
 * Get job history for a user
 * @param {string} userId - User ID
 * @param {Object} [options] - Query options
 * @param {number} [options.limit=20] - Max results
 * @param {number} [options.offset=0] - Offset for pagination
 * @returns {Promise<{jobs: BatchJob[], total: number}>}
 */
BatchJob.getJobHistory = async function(userId, { limit = 20, offset = 0 } = {}) {
  const { count, rows } = await this.findAndCountAll({
    where: { initiated_by: userId },
    order: [['created_at', 'DESC']],
    limit,
    offset
  });
  
  return { jobs: rows, total: count };
};

/**
 * Clean up old completed jobs (older than 30 days)
 * @returns {Promise<number>} Number of deleted jobs
 */
BatchJob.cleanupOldJobs = async function() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const result = await this.destroy({
    where: {
      status: {
        [Op.in]: ['completed', 'failed', 'cancelled']
      },
      completed_at: {
        [Op.lt]: thirtyDaysAgo
      }
    }
  });
  
  return result;
};

/**
 * Get formatted status for UI display
 * @returns {Object}
 */
BatchJob.prototype.getFormattedStatus = function() {
  const duration = this.started_at 
    ? (this.completed_at || new Date()) - new Date(this.started_at)
    : null;
    
  const durationFormatted = duration 
    ? `${Math.floor(duration / 60000)}m ${Math.floor((duration % 60000) / 1000)}s`
    : null;
    
  return {
    id: this.id,
    type: this.job_type,
    name: this.job_name,
    status: this.status,
    progress: {
      percent: parseFloat(this.progress_percent),
      processed: this.processed_items,
      total: this.total_items,
      successful: this.successful_items,
      failed: this.failed_items,
      skipped: this.skipped_items
    },
    timing: {
      started: this.started_at,
      completed: this.completed_at,
      estimated: this.estimated_completion,
      duration: durationFormatted
    },
    errors: this.error_log,
    results: this.result_summary
  };
};

export default BatchJob;
