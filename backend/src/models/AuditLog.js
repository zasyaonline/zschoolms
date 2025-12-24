import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * AuditLog Model
 * Tracks all critical actions in the system
 * Related to User model (many-to-one)
 */
class AuditLog extends Model {}

AuditLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true, // Nullable for system actions
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    action: {
      type: DataTypes.ENUM(
        'CREATE',
        'UPDATE',
        'DELETE',
        'LOGIN',
        'LOGOUT',
        'LOGIN_FAILED',
        'PASSWORD_RESET',
        'PASSWORD_CHANGED',
        'MFA_ENABLED',
        'MFA_DISABLED',
        'MARKS_APPROVED',
        'MARKS_REJECTED',
        'REPORT_GENERATED',
        'FILE_UPLOADED',
        'FILE_DELETED',
        'USER_ACTIVATED',
        'USER_DEACTIVATED',
        'ROLE_CHANGED'
      ),
      allowNull: false,
    },
    entity_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Model/Entity affected (User, Student, Marks, etc.)',
    },
    entity_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'ID of the affected record',
    },
    old_values: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Previous state (for UPDATE/DELETE)',
    },
    new_values: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'New state (for CREATE/UPDATE)',
    },
    ip_address: {
      type: DataTypes.STRING(45), // IPv6 support
      allowNull: true,
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('SUCCESS', 'FAILURE'),
      defaultValue: 'SUCCESS',
      allowNull: false,
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
      comment: 'Additional context data',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'AuditLog',
    tableName: 'audit_logs',
    timestamps: false, // Only need created_at, no updated_at
    underscored: true,
    indexes: [
      {
        fields: ['user_id'],
      },
      {
        fields: ['action'],
      },
      {
        fields: ['entity_type', 'entity_id'],
      },
      {
        fields: ['created_at'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['ip_address'],
      },
    ],
  }
);

/**
 * Static method to log action
 * @param {Object} data - Audit log data
 * @returns {Promise<AuditLog>}
 */
AuditLog.logAction = async function (data) {
  return await AuditLog.create({
    user_id: data.userId || null,
    action: data.action,
    entity_type: data.entityType || null,
    entity_id: data.entityId || null,
    old_values: data.oldValues || null,
    new_values: data.newValues || null,
    ip_address: data.ipAddress || null,
    user_agent: data.userAgent || null,
    status: data.status || 'SUCCESS',
    error_message: data.errorMessage || null,
    metadata: data.metadata || {},
  });
};

/**
 * Static method to get user activity
 * @param {string} userId - User UUID
 * @param {number} limit - Number of records to fetch
 * @returns {Promise<Array>}
 */
AuditLog.getUserActivity = async function (userId, limit = 50) {
  return await AuditLog.findAll({
    where: { user_id: userId },
    order: [['created_at', 'DESC']],
    limit,
  });
};

/**
 * Static method to get entity history
 * @param {string} entityType - Entity type (e.g., 'Student')
 * @param {string} entityId - Entity UUID
 * @returns {Promise<Array>}
 */
AuditLog.getEntityHistory = async function (entityType, entityId) {
  return await AuditLog.findAll({
    where: {
      entity_type: entityType,
      entity_id: entityId,
    },
    order: [['created_at', 'DESC']],
  });
};

/**
 * Static method to get failed login attempts
 * @param {string} ipAddress - IP address
 * @param {number} minutes - Time window in minutes
 * @returns {Promise<number>}
 */
AuditLog.getFailedLoginAttempts = async function (ipAddress, minutes = 15) {
  const timeThreshold = new Date(Date.now() - minutes * 60 * 1000);
  
  return await AuditLog.count({
    where: {
      action: 'LOGIN_FAILED',
      ip_address: ipAddress,
      created_at: {
        [sequelize.Sequelize.Op.gte]: timeThreshold,
      },
    },
  });
};

/**
 * Static method to get recent activity by action
 * @param {string} action - Action type
 * @param {number} hours - Time window in hours
 * @returns {Promise<Array>}
 */
AuditLog.getRecentByAction = async function (action, hours = 24) {
  const timeThreshold = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  return await AuditLog.findAll({
    where: {
      action,
      created_at: {
        [sequelize.Sequelize.Op.gte]: timeThreshold,
      },
    },
    order: [['created_at', 'DESC']],
  });
};

/**
 * Static method to clean up old logs
 * @param {number} days - Keep logs for this many days
 * @returns {Promise<number>} Number of deleted logs
 */
AuditLog.cleanupOldLogs = async function (days = 90) {
  const threshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return await AuditLog.destroy({
    where: {
      created_at: {
        [sequelize.Sequelize.Op.lt]: threshold,
      },
    },
  });
};

export default AuditLog;
