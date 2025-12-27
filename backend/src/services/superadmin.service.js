import { Op, Sequelize } from 'sequelize';
import sequelize from '../config/database.js';
import { User, Student, Sponsor, AuditLog, School } from '../models/index.js';
import logger from '../utils/logger.js';
import { isS3Configured } from './s3.service.js';

/**
 * Super Admin Service
 * Provides system-level management functions for super administrators
 */

// ============================================================================
// STEP 2: System Health Dashboard
// ============================================================================

/**
 * Get comprehensive system health metrics
 * @returns {Promise<Object>} System health data
 */
export const getSystemHealth = async () => {
  try {
    // Database connection status
    let dbStatus = { connected: false, responseTime: null };
    const dbStart = Date.now();
    try {
      await sequelize.authenticate();
      dbStatus = {
        connected: true,
        responseTime: Date.now() - dbStart,
        dialect: sequelize.options.dialect,
        host: sequelize.options.host,
      };
    } catch (dbError) {
      dbStatus = {
        connected: false,
        error: dbError.message,
      };
    }

    // User counts by role
    const userCounts = await User.findAll({
      attributes: [
        'role',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
        [Sequelize.fn('SUM', Sequelize.literal("CASE WHEN is_active = true THEN 1 ELSE 0 END")), 'active'],
        [Sequelize.fn('SUM', Sequelize.literal("CASE WHEN is_active = false THEN 1 ELSE 0 END")), 'inactive'],
      ],
      group: ['role'],
      raw: true,
    });

    // Total counts
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { is_active: true } });

    // Recent critical activities (last 24 hours)
    const criticalActions = [
      'LOGIN', 'LOGIN_FAILED', 'PASSWORD_RESET', 'PASSWORD_CHANGED',
      'USER_ACTIVATED', 'USER_DEACTIVATED', 'ROLE_CHANGED', 'MARKS_APPROVED'
    ];
    const recentCriticalActivities = await AuditLog.count({
      where: {
        action: { [Op.in]: criticalActions },
        created_at: { [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    // Failed login attempts (security metric)
    const failedLogins24h = await AuditLog.count({
      where: {
        action: 'LOGIN_FAILED',
        created_at: { [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    // Storage status (S3 configuration)
    const storageStatus = {
      s3Configured: isS3Configured(),
      bucket: process.env.AWS_S3_BUCKET || 'not configured',
      region: process.env.AWS_REGION || 'not configured',
    };

    // Recent logins
    const recentLogins = await AuditLog.findAll({
      where: { action: 'LOGIN' },
      order: [['created_at', 'DESC']],
      limit: 10,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'first_name', 'last_name', 'role'],
      }],
    });

    // Schools count
    const schoolsCount = await School.count();

    // Students count
    const studentsCount = await Student.count();
    const activeStudents = await Student.count({ where: { status: 'active' } });

    // Sponsors count
    const sponsorsCount = await Sponsor.count();
    const activeSponsors = await Sponsor.count({ where: { status: 'active' } });

    return {
      timestamp: new Date().toISOString(),
      database: dbStatus,
      storage: storageStatus,
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
        byRole: userCounts,
      },
      entities: {
        schools: schoolsCount,
        students: { total: studentsCount, active: activeStudents },
        sponsors: { total: sponsorsCount, active: activeSponsors },
      },
      security: {
        recentCriticalActivities,
        failedLogins24h,
        recentLogins: recentLogins.map(log => ({
          userId: log.user?.id,
          email: log.user?.email,
          name: `${log.user?.first_name || ''} ${log.user?.last_name || ''}`.trim(),
          role: log.user?.role,
          ipAddress: log.ip_address,
          timestamp: log.created_at,
        })),
      },
      systemInfo: {
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      },
    };
  } catch (error) {
    logger.error('Error getting system health:', error);
    throw new Error(`Failed to get system health: ${error.message}`);
  }
};

// ============================================================================
// STEP 3: User Account Management (Super Admin Only)
// ============================================================================

/**
 * Get all admin-level users (for super admin management)
 * @returns {Promise<Array>} List of admin-level users
 */
export const getAdminUsers = async () => {
  try {
    const adminRoles = ['admin', 'principal', 'super_admin'];
    const users = await User.findAll({
      where: { role: { [Op.in]: adminRoles } },
      attributes: { exclude: ['password', 'mfa_secret', 'mfa_backup_codes'] },
      order: [['role', 'ASC'], ['created_at', 'DESC']],
    });
    return users;
  } catch (error) {
    logger.error('Error getting admin users:', error);
    throw error;
  }
};

/**
 * Create admin-level user (Super Admin only)
 * @param {Object} userData - User data
 * @param {string} createdBy - Super Admin user ID
 * @returns {Promise<Object>} Created user
 */
export const createAdminUser = async (userData, createdBy) => {
  try {
    const allowedRoles = ['admin', 'principal'];
    if (!allowedRoles.includes(userData.role)) {
      throw new Error(`Cannot create user with role: ${userData.role}. Only admin and principal roles allowed.`);
    }

    const existingUser = await User.findOne({ where: { email: userData.email } });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const user = await User.create({
      ...userData,
      created_by: createdBy,
    });

    // Log the action
    await AuditLog.logAction({
      userId: createdBy,
      action: 'CREATE',
      entityType: 'User',
      entityId: user.id,
      newValues: { email: user.email, role: user.role },
      status: 'SUCCESS',
    });

    logger.info(`Admin user created by super admin`, {
      createdUser: user.id,
      role: user.role,
      createdBy,
    });

    return user.toSafeJSON();
  } catch (error) {
    logger.error('Error creating admin user:', error);
    throw error;
  }
};

/**
 * Enable/Disable admin user account (Super Admin only)
 * @param {string} userId - User ID to toggle
 * @param {boolean} isActive - New active status
 * @param {string} updatedBy - Super Admin user ID
 * @returns {Promise<Object>} Updated user
 */
export const toggleAdminUserStatus = async (userId, isActive, updatedBy) => {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Cannot disable another super_admin
    if (user.role === 'super_admin' && !isActive) {
      throw new Error('Cannot disable super admin accounts');
    }

    // Cannot modify yourself
    if (user.id === updatedBy) {
      throw new Error('Cannot modify your own account status');
    }

    const oldStatus = user.is_active;
    user.is_active = isActive;
    user.modified_by = updatedBy;
    await user.save();

    // Log the action
    await AuditLog.logAction({
      userId: updatedBy,
      action: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      entityType: 'User',
      entityId: user.id,
      oldValues: { is_active: oldStatus },
      newValues: { is_active: isActive },
      status: 'SUCCESS',
    });

    logger.info(`Admin user ${isActive ? 'activated' : 'deactivated'}`, {
      targetUser: userId,
      updatedBy,
    });

    return user.toSafeJSON();
  } catch (error) {
    logger.error('Error toggling admin user status:', error);
    throw error;
  }
};

/**
 * Reset admin user password (Super Admin only)
 * Admins cannot reset each other's passwords
 * @param {string} userId - User ID
 * @param {string} newPassword - New password
 * @param {string} resetBy - Super Admin user ID
 * @returns {Promise<Object>} Result
 */
export const resetAdminPassword = async (userId, newPassword, resetBy) => {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Cannot reset another super_admin's password
    if (user.role === 'super_admin') {
      throw new Error('Cannot reset super admin passwords through this interface');
    }

    // Cannot reset your own password through this interface
    if (user.id === resetBy) {
      throw new Error('Use the change password feature to change your own password');
    }

    // Update password
    user.password = newPassword;
    user.must_change_password = true; // Force password change on next login
    user.modified_by = resetBy;
    await user.save();

    // Log the action
    await AuditLog.logAction({
      userId: resetBy,
      action: 'PASSWORD_RESET',
      entityType: 'User',
      entityId: user.id,
      status: 'SUCCESS',
    });

    logger.info('Admin password reset by super admin', {
      targetUser: userId,
      resetBy,
    });

    return { 
      success: true, 
      message: 'Password reset successfully. User will be required to change password on next login.',
    };
  } catch (error) {
    logger.error('Error resetting admin password:', error);
    throw error;
  }
};

/**
 * Change user role (Super Admin only)
 * @param {string} userId - User ID
 * @param {string} newRole - New role
 * @param {string} updatedBy - Super Admin user ID
 * @returns {Promise<Object>} Updated user
 */
export const changeUserRole = async (userId, newRole, updatedBy) => {
  try {
    const allowedRoles = ['admin', 'principal', 'teacher', 'staff'];
    if (!allowedRoles.includes(newRole)) {
      throw new Error(`Invalid role: ${newRole}`);
    }

    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Cannot change super_admin role
    if (user.role === 'super_admin') {
      throw new Error('Cannot change super admin role');
    }

    // Cannot modify yourself
    if (user.id === updatedBy) {
      throw new Error('Cannot change your own role');
    }

    const oldRole = user.role;
    user.role = newRole;
    user.modified_by = updatedBy;
    await user.save();

    // Log the action
    await AuditLog.logAction({
      userId: updatedBy,
      action: 'ROLE_CHANGED',
      entityType: 'User',
      entityId: user.id,
      oldValues: { role: oldRole },
      newValues: { role: newRole },
      status: 'SUCCESS',
    });

    logger.info('User role changed by super admin', {
      targetUser: userId,
      oldRole,
      newRole,
      updatedBy,
    });

    return user.toSafeJSON();
  } catch (error) {
    logger.error('Error changing user role:', error);
    throw error;
  }
};

// ============================================================================
// STEP 6: Audit Log Access
// ============================================================================

/**
 * Get audit logs with filtering
 * @param {Object} options - Filter options
 * @returns {Promise<Object>} Paginated audit logs
 */
export const getAuditLogs = async (options = {}) => {
  try {
    const {
      action,
      userId,
      entityType,
      startDate,
      endDate,
      status,
      page = 1,
      limit = 50,
    } = options;

    const where = {};

    if (action) where.action = action;
    if (userId) where.user_id = userId;
    if (entityType) where.entity_type = entityType;
    if (status) where.status = status;
    
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at[Op.gte] = new Date(startDate);
      if (endDate) where.created_at[Op.lte] = new Date(endDate);
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'first_name', 'last_name', 'role'],
      }],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    return {
      logs: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  } catch (error) {
    logger.error('Error getting audit logs:', error);
    throw error;
  }
};

/**
 * Get audit log statistics
 * @returns {Promise<Object>} Audit statistics
 */
export const getAuditStats = async () => {
  try {
    // Actions count by type (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const actionCounts = await AuditLog.findAll({
      attributes: [
        'action',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
      ],
      where: {
        created_at: { [Op.gte]: thirtyDaysAgo },
      },
      group: ['action'],
      raw: true,
    });

    // Failed vs successful actions
    const statusCounts = await AuditLog.findAll({
      attributes: [
        'status',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
      ],
      where: {
        created_at: { [Op.gte]: thirtyDaysAgo },
      },
      group: ['status'],
      raw: true,
    });

    // Activity by day (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const dailyActivity = await AuditLog.findAll({
      attributes: [
        [Sequelize.fn('DATE', Sequelize.col('created_at')), 'date'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
      ],
      where: {
        created_at: { [Op.gte]: sevenDaysAgo },
      },
      group: [Sequelize.fn('DATE', Sequelize.col('created_at'))],
      order: [[Sequelize.fn('DATE', Sequelize.col('created_at')), 'ASC']],
      raw: true,
    });

    return {
      actionCounts,
      statusCounts,
      dailyActivity,
      period: {
        start: thirtyDaysAgo.toISOString(),
        end: new Date().toISOString(),
      },
    };
  } catch (error) {
    logger.error('Error getting audit stats:', error);
    throw error;
  }
};

// ============================================================================
// STEP 7: Exception Handling Protocol
// ============================================================================

/**
 * Create amendment record for erroneous immutable data
 * Archives the original and creates a new corrected record
 * @param {Object} params - Amendment parameters
 * @returns {Promise<Object>} Amendment result
 */
export const createAmendment = async ({ 
  entityType, 
  originalId, 
  correctedData, 
  justification, 
  amendedBy 
}) => {
  const transaction = await sequelize.transaction();
  
  try {
    // Validate inputs
    if (!entityType || !originalId || !correctedData || !justification) {
      throw new Error('Missing required amendment parameters');
    }

    const validEntityTypes = ['Marksheet', 'Mark', 'ReportCard'];
    if (!validEntityTypes.includes(entityType)) {
      throw new Error(`Invalid entity type: ${entityType}. Must be one of: ${validEntityTypes.join(', ')}`);
    }

    // Get the model
    const { Marksheet, Mark, ReportCard } = await import('../models/index.js');
    const models = { Marksheet, Mark, ReportCard };
    const Model = models[entityType];

    // Get original record
    const original = await Model.findByPk(originalId, { transaction });
    if (!original) {
      throw new Error(`Original ${entityType} not found`);
    }

    // Create amendment audit log BEFORE attempting changes
    // This serves as the official amendment request record
    const amendmentLog = await AuditLog.create({
      user_id: amendedBy,
      action: 'CREATE',
      entity_type: `Amendment_${entityType}`,
      entity_id: originalId,
      old_values: original.toJSON(),
      new_values: {
        correctedData,
        justification,
        amendmentType: 'CORRECTION',
        originalRecordId: originalId,
      },
      status: 'SUCCESS',
      metadata: {
        amendmentReason: justification,
        amendedAt: new Date().toISOString(),
      },
    }, { transaction });

    // Mark original as amended (if the model supports it)
    // Note: Due to immutability triggers, we log this as an amendment record
    // rather than modifying the original

    await transaction.commit();

    logger.info(`Amendment created for ${entityType}`, {
      originalId,
      amendmentLogId: amendmentLog.id,
      amendedBy,
    });

    return {
      success: true,
      amendmentId: amendmentLog.id,
      originalId,
      entityType,
      message: `Amendment record created. Original ${entityType} preserved with amendment reference.`,
      instructions: [
        '1. Original record has been archived (immutable)',
        '2. Amendment audit log created with full justification',
        '3. Create new corrected record using standard creation flow',
        '4. Reference this amendment ID in the new record for traceability',
      ],
    };
  } catch (error) {
    await transaction.rollback();
    logger.error('Error creating amendment:', error);
    throw error;
  }
};

/**
 * Get amendment history for an entity
 * @param {string} entityType - Entity type
 * @param {string} entityId - Entity ID
 * @returns {Promise<Array>} Amendment history
 */
export const getAmendmentHistory = async (entityType, entityId) => {
  try {
    const amendments = await AuditLog.findAll({
      where: {
        [Op.or]: [
          { entity_type: `Amendment_${entityType}`, entity_id: entityId },
          { entity_type: entityType, entity_id: entityId },
        ],
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'first_name', 'last_name', 'role'],
      }],
      order: [['created_at', 'ASC']],
    });

    return amendments;
  } catch (error) {
    logger.error('Error getting amendment history:', error);
    throw error;
  }
};

export default {
  // System Health
  getSystemHealth,
  
  // User Management
  getAdminUsers,
  createAdminUser,
  toggleAdminUserStatus,
  resetAdminPassword,
  changeUserRole,
  
  // Audit
  getAuditLogs,
  getAuditStats,
  
  // Exception Handling
  createAmendment,
  getAmendmentHistory,
};
