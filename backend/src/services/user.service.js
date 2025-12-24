import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';
import { User, AuditLog } from '../models/index.js';
import logger from '../utils/logger.js';
import { sendEmail } from './email.service.js';

/**
 * User Management Service
 * Handles user CRUD operations, bulk import, password management
 */

/**
 * Create a new user
 * @param {Object} userData - User data
 * @param {string} createdBy - ID of user creating this user
 * @returns {Promise<Object>} Created user
 */
export const createUser = async (userData, createdBy) => {
  try {
    // Hash password before creating
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    const user = await User.create({
      email: userData.email,
      password: hashedPassword,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      isActive: userData.isActive !== undefined ? userData.isActive : true,
    });

    // Log creation
    await AuditLog.logAction({
      userId: createdBy,
      action: 'USER_CREATED',
      entityType: 'user',
      entityId: user.id,
      newValues: {
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
      status: 'SUCCESS',
    });

    logger.info('User created', {
      userId: user.id,
      email: user.email,
      createdBy,
    });

    // Send welcome email
    try {
      await sendEmail(
        user.email,
        'Welcome to ZSchool Management System',
        `<h2>Welcome ${user.firstName}!</h2>
        <p>Your account has been created successfully.</p>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Temporary Password:</strong> ${userData.password}</p>
        <p>Please change your password after your first login.</p>`
      );
    } catch (emailError) {
      logger.error('Failed to send welcome email', { error: emailError.message });
    }

    return user.toJSON();
  } catch (error) {
    logger.error('Create user error:', error);
    throw error;
  }
};

/**
 * Get paginated list of users with filtering
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Users list with pagination
 */
export const getUsers = async (options = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      role,
      isActive,
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = options;

    const offset = (page - 1) * limit;
    const where = {};

    // Filter by role
    if (role) {
      where.role = role;
    }

    // Filter by active status
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Search by email, firstName, or lastName
    if (search) {
      where[Op.or] = [
        { email: { [Op.iLike]: `%${search}%` } },
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { rows: users, count: total } = await User.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [[sortBy, sortOrder]],
      attributes: { exclude: ['password', 'mfaSecret', 'mfaBackupCodes'] },
    });

    return {
      users: users.map(u => u.toJSON()),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Get users error:', error);
    throw error;
  }
};

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User object
 */
export const getUserById = async (userId) => {
  try {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password', 'mfaSecret', 'mfaBackupCodes'] },
    });

    if (!user) {
      return null;
    }

    return user.toJSON();
  } catch (error) {
    logger.error('Get user by ID error:', error);
    throw error;
  }
};

/**
 * Update user
 * @param {string} userId - User ID
 * @param {Object} updates - Fields to update
 * @param {string} updatedBy - ID of user performing update
 * @returns {Promise<Object>} Updated user
 */
export const updateUser = async (userId, updates, updatedBy) => {
  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return null;
    }

    // Store old values for audit log
    const oldValues = {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
    };

    // Update allowed fields
    const allowedFields = ['email', 'firstName', 'lastName', 'role', 'isActive'];
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        user[field] = updates[field];
      }
    });

    await user.save();

    // Log update
    await AuditLog.logAction({
      userId: updatedBy,
      action: 'USER_UPDATED',
      entityType: 'user',
      entityId: user.id,
      oldValues,
      newValues: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
      },
      status: 'SUCCESS',
    });

    logger.info('User updated', {
      userId: user.id,
      updatedBy,
    });

    return user.toJSON();
  } catch (error) {
    logger.error('Update user error:', error);
    throw error;
  }
};

/**
 * Delete user (soft delete by deactivating)
 * @param {string} userId - User ID
 * @param {string} deletedBy - ID of user performing deletion
 * @returns {Promise<boolean>} Success status
 */
export const deleteUser = async (userId, deletedBy) => {
  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return false;
    }

    // Soft delete by deactivating
    user.isActive = false;
    await user.save();

    // Log deletion
    await AuditLog.logAction({
      userId: deletedBy,
      action: 'USER_DELETED',
      entityType: 'user',
      entityId: user.id,
      oldValues: { isActive: true },
      newValues: { isActive: false },
      status: 'SUCCESS',
    });

    logger.info('User deleted (soft)', {
      userId: user.id,
      deletedBy,
    });

    return true;
  } catch (error) {
    logger.error('Delete user error:', error);
    throw error;
  }
};

/**
 * Change user password
 * @param {string} userId - User ID
 * @param {string} oldPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Result
 */
export const changePassword = async (userId, oldPassword, newPassword) => {
  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // Verify old password
    const isPasswordValid = await user.comparePassword(oldPassword);
    if (!isPasswordValid) {
      await AuditLog.logAction({
        userId,
        action: 'PASSWORD_CHANGE_FAILED',
        status: 'FAILURE',
        errorMessage: 'Invalid old password',
      });
      return { success: false, message: 'Current password is incorrect' };
    }

    // Hash and update new password
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    // Log password change
    await AuditLog.logAction({
      userId,
      action: 'PASSWORD_CHANGED',
      entityType: 'user',
      entityId: user.id,
      status: 'SUCCESS',
    });

    logger.info('Password changed', { userId });

    return { success: true, message: 'Password changed successfully' };
  } catch (error) {
    logger.error('Change password error:', error);
    throw error;
  }
};

/**
 * Reset user password (admin function)
 * @param {string} userId - User ID
 * @param {string} newPassword - New password
 * @param {string} resetBy - ID of admin resetting password
 * @returns {Promise<Object>} Result
 */
export const resetPassword = async (userId, newPassword, resetBy) => {
  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // Hash and update password
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    // Log password reset
    await AuditLog.logAction({
      userId: resetBy,
      action: 'PASSWORD_RESET',
      entityType: 'user',
      entityId: user.id,
      status: 'SUCCESS',
    });

    logger.info('Password reset by admin', {
      userId: user.id,
      resetBy,
    });

    // Send email notification
    try {
      await sendEmail(
        user.email,
        'Password Reset - ZSchool',
        `<h2>Password Reset</h2>
        <p>Your password has been reset by an administrator.</p>
        <p><strong>New Temporary Password:</strong> ${newPassword}</p>
        <p>Please change your password after logging in.</p>`
      );
    } catch (emailError) {
      logger.error('Failed to send password reset email', { error: emailError.message });
    }

    return { success: true, message: 'Password reset successfully' };
  } catch (error) {
    logger.error('Reset password error:', error);
    throw error;
  }
};

/**
 * Activate user
 * @param {string} userId - User ID
 * @param {string} activatedBy - ID of user activating
 * @returns {Promise<Object>} Result
 */
export const activateUser = async (userId, activatedBy) => {
  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    if (user.isActive) {
      return { success: false, message: 'User is already active' };
    }

    user.isActive = true;
    await user.save();

    await AuditLog.logAction({
      userId: activatedBy,
      action: 'USER_ACTIVATED',
      entityType: 'user',
      entityId: user.id,
      status: 'SUCCESS',
    });

    logger.info('User activated', { userId, activatedBy });

    return { success: true, message: 'User activated successfully' };
  } catch (error) {
    logger.error('Activate user error:', error);
    throw error;
  }
};

/**
 * Deactivate user
 * @param {string} userId - User ID
 * @param {string} deactivatedBy - ID of user deactivating
 * @returns {Promise<Object>} Result
 */
export const deactivateUser = async (userId, deactivatedBy) => {
  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    if (!user.isActive) {
      return { success: false, message: 'User is already inactive' };
    }

    user.isActive = false;
    await user.save();

    await AuditLog.logAction({
      userId: deactivatedBy,
      action: 'USER_DEACTIVATED',
      entityType: 'user',
      entityId: user.id,
      status: 'SUCCESS',
    });

    logger.info('User deactivated', { userId, deactivatedBy });

    return { success: true, message: 'User deactivated successfully' };
  } catch (error) {
    logger.error('Deactivate user error:', error);
    throw error;
  }
};

/**
 * Bulk import users from CSV data
 * @param {Array} usersData - Array of user objects from CSV
 * @param {string} importedBy - ID of user performing import
 * @returns {Promise<Object>} Import results
 */
export const bulkImportUsers = async (usersData, importedBy) => {
  try {
    const results = {
      success: [],
      failed: [],
      total: usersData.length,
    };

    for (const userData of usersData) {
      try {
        // Validate required fields
        if (!userData.email || !userData.password || !userData.firstName || !userData.lastName || !userData.role) {
          results.failed.push({
            email: userData.email || 'unknown',
            reason: 'Missing required fields',
          });
          continue;
        }

        // Check if user already exists
        const existingUser = await User.findOne({ where: { email: userData.email } });
        if (existingUser) {
          results.failed.push({
            email: userData.email,
            reason: 'Email already exists',
          });
          continue;
        }

        // Create user
        const user = await createUser(userData, importedBy);
        results.success.push({
          id: user.id,
          email: user.email,
        });
      } catch (error) {
        results.failed.push({
          email: userData.email || 'unknown',
          reason: error.message,
        });
      }
    }

    // Log bulk import
    await AuditLog.logAction({
      userId: importedBy,
      action: 'USERS_BULK_IMPORTED',
      status: 'SUCCESS',
      metadata: {
        total: results.total,
        success: results.success.length,
        failed: results.failed.length,
      },
    });

    logger.info('Bulk import completed', {
      total: results.total,
      success: results.success.length,
      failed: results.failed.length,
      importedBy,
    });

    return results;
  } catch (error) {
    logger.error('Bulk import error:', error);
    throw error;
  }
};

/**
 * Get user statistics
 * @returns {Promise<Object>} User statistics
 */
export const getUserStats = async () => {
  try {
    const total = await User.count();
    const active = await User.count({ where: { isActive: true } });
    const inactive = await User.count({ where: { isActive: false } });

    const byRole = await User.findAll({
      attributes: [
        'role',
        [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'count'],
      ],
      group: ['role'],
    });

    return {
      total,
      active,
      inactive,
      byRole: byRole.reduce((acc, r) => {
        acc[r.role] = parseInt(r.get('count'));
        return acc;
      }, {}),
    };
  } catch (error) {
    logger.error('Get user stats error:', error);
    throw error;
  }
};

export default {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  changePassword,
  resetPassword,
  activateUser,
  deactivateUser,
  bulkImportUsers,
  getUserStats,
};
