import { DataTypes, Op } from 'sequelize';
import sequelize from '../config/database.js';

const EmailQueue = sequelize.define('EmailQueue', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  batch_job_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'batch_jobs',
      key: 'id'
    }
  },
  recipient_email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  recipient_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  recipient_type: {
    type: DataTypes.STRING(50),
    defaultValue: 'sponsor'
  },
  sponsor_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'sponsors',
      key: 'id'
    }
  },
  subject: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  html_body: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  text_body: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  attachments: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  student_ids: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  report_card_ids: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  academic_year_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'academic_years',
      key: 'id'
    }
  },
  class_section_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'class_sections',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'queued', 'processing', 'sent', 'failed', 'bounced', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending'
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  },
  retry_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  max_retries: {
    type: DataTypes.INTEGER,
    defaultValue: 3
  },
  last_retry_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  next_retry_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  sent_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  delivered_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  opened_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  message_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  provider_response: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  initiated_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'email_queue',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Static methods

/**
 * Create a new email queue entry
 * @param {Object} params - Email parameters
 * @returns {Promise<EmailQueue>}
 */
EmailQueue.createEmail = async function(params) {
  return this.create(params);
};

/**
 * Get pending emails for processing
 * @param {number} limit - Max emails to fetch
 * @returns {Promise<EmailQueue[]>}
 */
EmailQueue.getPendingEmails = async function(limit = 50) {
  return this.findAll({
    where: {
      status: {
        [Op.in]: ['pending', 'queued']
      }
    },
    order: [
      ['priority', 'ASC'],
      ['created_at', 'ASC']
    ],
    limit
  });
};

/**
 * Get emails that need retry
 * @param {number} limit - Max emails to fetch
 * @returns {Promise<EmailQueue[]>}
 */
EmailQueue.getRetryableEmails = async function(limit = 20) {
  return this.findAll({
    where: {
      status: 'failed',
      retry_count: { [Op.lt]: sequelize.col('max_retries') },
      [Op.or]: [
        { next_retry_at: null },
        { next_retry_at: { [Op.lte]: new Date() } }
      ]
    },
    order: [
      ['priority', 'ASC'],
      ['next_retry_at', 'ASC']
    ],
    limit
  });
};

/**
 * Get email queue summary for a batch job
 * @param {string} batchJobId - Batch job UUID
 * @returns {Promise<Object>}
 */
EmailQueue.getJobSummary = async function(batchJobId) {
  const emails = await this.findAll({
    where: { batch_job_id: batchJobId },
    attributes: ['status']
  });
  
  const summary = {
    total: emails.length,
    pending: 0,
    queued: 0,
    processing: 0,
    sent: 0,
    failed: 0,
    bounced: 0,
    cancelled: 0
  };
  
  emails.forEach(email => {
    summary[email.status]++;
  });
  
  return summary;
};

/**
 * Mark email as processing
 */
EmailQueue.prototype.markProcessing = async function() {
  this.status = 'processing';
  return this.save();
};

/**
 * Mark email as sent
 * @param {string} messageId - Provider message ID
 * @param {Object} response - Provider response
 */
EmailQueue.prototype.markSent = async function(messageId, response = {}) {
  this.status = 'sent';
  this.sent_at = new Date();
  this.message_id = messageId;
  this.provider_response = response;
  return this.save();
};

/**
 * Mark email as failed and schedule retry
 * @param {string} errorMessage - Error message
 */
EmailQueue.prototype.markFailed = async function(errorMessage) {
  this.status = 'failed';
  this.error_message = errorMessage;
  this.retry_count++;
  this.last_retry_at = new Date();
  
  // Calculate next retry with exponential backoff (1min, 5min, 15min)
  if (this.retry_count < this.max_retries) {
    const delayMinutes = Math.pow(this.retry_count, 2) * 5;
    this.next_retry_at = new Date(Date.now() + delayMinutes * 60 * 1000);
  }
  
  return this.save();
};

/**
 * Mark email as bounced (permanent failure)
 * @param {string} reason - Bounce reason
 */
EmailQueue.prototype.markBounced = async function(reason) {
  this.status = 'bounced';
  this.error_message = reason;
  return this.save();
};

/**
 * Cancel email
 */
EmailQueue.prototype.cancel = async function() {
  if (['pending', 'queued'].includes(this.status)) {
    this.status = 'cancelled';
    return this.save();
  }
  throw new Error('Can only cancel pending or queued emails');
};

/**
 * Get distribution stats for a class/academic year
 * @param {string} classSectionId - Class section UUID
 * @param {string} academicYearId - Academic year UUID
 * @returns {Promise<Object>}
 */
EmailQueue.getDistributionStats = async function(classSectionId, academicYearId) {
  const emails = await this.findAll({
    where: { 
      class_section_id: classSectionId,
      academic_year_id: academicYearId
    },
    attributes: ['status', 'recipient_email', 'sent_at', 'error_message']
  });
  
  const uniqueRecipients = new Set(emails.map(e => e.recipient_email));
  
  return {
    totalEmails: emails.length,
    uniqueRecipients: uniqueRecipients.size,
    sent: emails.filter(e => e.status === 'sent').length,
    failed: emails.filter(e => e.status === 'failed').length,
    bounced: emails.filter(e => e.status === 'bounced').length,
    pending: emails.filter(e => ['pending', 'queued', 'processing'].includes(e.status)).length,
    lastSentAt: emails.filter(e => e.sent_at).sort((a, b) => b.sent_at - a.sent_at)[0]?.sent_at
  };
};

export default EmailQueue;
