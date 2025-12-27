import { DataTypes, Op } from 'sequelize';
import sequelize from '../config/database.js';

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: {
        args: [[
          'marks_submitted',      // Teacher submitted marks for approval
          'marks_approved',       // Marks were approved by principal
          'marks_rejected',       // Marks were rejected with comments
          'attendance_reminder',  // Reminder to mark attendance
          'report_generated',     // Report card generated
          'system_alert',         // System-level alerts
          'amendment_requested',  // Amendment requested by principal
          'amendment_approved',   // Amendment approved
          'general'               // General notifications
        ]],
        msg: 'Invalid notification type'
      }
    }
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  data: {
    type: DataTypes.JSONB,
    defaultValue: {},
    allowNull: true
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  read_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  reference_type: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  reference_id: {
    type: DataTypes.UUID,
    allowNull: true
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false, // No updated_at column
  indexes: [
    { fields: ['user_id'] },
    { fields: ['user_id', 'is_read'] },
    { fields: ['type'] },
    { fields: ['created_at'] },
    { fields: ['reference_type', 'reference_id'] }
  ]
});

// Notification types enum
Notification.TYPES = {
  MARKS_SUBMITTED: 'marks_submitted',
  MARKS_APPROVED: 'marks_approved',
  MARKS_REJECTED: 'marks_rejected',
  ATTENDANCE_REMINDER: 'attendance_reminder',
  REPORT_GENERATED: 'report_generated',
  SYSTEM_ALERT: 'system_alert',
  AMENDMENT_REQUESTED: 'amendment_requested',
  AMENDMENT_APPROVED: 'amendment_approved',
  GENERAL: 'general'
};

/**
 * Get unread notifications for a user
 * @param {string} userId - User ID
 * @param {number} limit - Max number of notifications
 * @returns {Promise<Array>}
 */
Notification.getUnread = async function(userId, limit = 20) {
  return this.findAll({
    where: {
      user_id: userId,
      is_read: false,
      [Op.or]: [
        { expires_at: null },
        { expires_at: { [Op.gt]: new Date() } }
      ]
    },
    order: [['created_at', 'DESC']],
    limit
  });
};

/**
 * Get all notifications for a user (with pagination)
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<{rows: Array, count: number}>}
 */
Notification.getForUser = async function(userId, options = {}) {
  const { page = 1, limit = 20, unreadOnly = false } = options;
  
  const where = {
    user_id: userId,
    [Op.or]: [
      { expires_at: null },
      { expires_at: { [Op.gt]: new Date() } }
    ]
  };
  
  if (unreadOnly) {
    where.is_read = false;
  }

  return this.findAndCountAll({
    where,
    order: [['created_at', 'DESC']],
    limit,
    offset: (page - 1) * limit
  });
};

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 * @param {string} userId - User ID (for security)
 * @returns {Promise<boolean>}
 */
Notification.markAsRead = async function(notificationId, userId) {
  const [updated] = await this.update(
    { is_read: true, read_at: new Date() },
    { where: { id: notificationId, user_id: userId } }
  );
  return updated > 0;
};

/**
 * Mark all notifications as read for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>}
 */
Notification.markAllAsRead = async function(userId) {
  const [updated] = await this.update(
    { is_read: true, read_at: new Date() },
    { where: { user_id: userId, is_read: false } }
  );
  return updated;
};

/**
 * Get unread count for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>}
 */
Notification.getUnreadCount = async function(userId) {
  return this.count({
    where: {
      user_id: userId,
      is_read: false,
      [Op.or]: [
        { expires_at: null },
        { expires_at: { [Op.gt]: new Date() } }
      ]
    }
  });
};

/**
 * Create a notification for marks submission (to principal)
 * @param {Object} params - Notification parameters
 * @returns {Promise<Notification>}
 */
Notification.notifyMarksSubmitted = async function({ principalUserId, teacherName, className, subjectName, marksheetId }) {
  return this.create({
    user_id: principalUserId,
    type: this.TYPES.MARKS_SUBMITTED,
    title: 'New Marks Submission',
    message: `${teacherName} has submitted marks for ${subjectName} in ${className} for approval.`,
    data: { teacherName, className, subjectName, marksheetId },
    reference_type: 'marksheet',
    reference_id: marksheetId
  });
};

/**
 * Create a notification for marks approval (to teacher)
 * @param {Object} params - Notification parameters
 * @returns {Promise<Notification>}
 */
Notification.notifyMarksApproved = async function({ teacherUserId, className, subjectName, marksheetId, approverName }) {
  return this.create({
    user_id: teacherUserId,
    type: this.TYPES.MARKS_APPROVED,
    title: 'Marks Approved',
    message: `Your marks submission for ${subjectName} in ${className} has been approved by ${approverName}.`,
    data: { className, subjectName, marksheetId, approverName },
    reference_type: 'marksheet',
    reference_id: marksheetId
  });
};

/**
 * Create a notification for marks rejection (to teacher)
 * @param {Object} params - Notification parameters
 * @returns {Promise<Notification>}
 */
Notification.notifyMarksRejected = async function({ teacherUserId, className, subjectName, marksheetId, rejectionComments, rejectorName }) {
  return this.create({
    user_id: teacherUserId,
    type: this.TYPES.MARKS_REJECTED,
    title: 'Marks Rejected',
    message: `Your marks submission for ${subjectName} in ${className} was rejected. Reason: ${rejectionComments}`,
    data: { className, subjectName, marksheetId, rejectionComments, rejectorName },
    reference_type: 'marksheet',
    reference_id: marksheetId
  });
};

/**
 * Delete old notifications (cleanup job)
 * @param {number} daysOld - Delete notifications older than this many days
 * @returns {Promise<number>}
 */
Notification.cleanupOld = async function(daysOld = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return this.destroy({
    where: {
      created_at: { [Op.lt]: cutoffDate },
      is_read: true
    }
  });
};

export default Notification;
