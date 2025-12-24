import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../utils/logger.js';
import * as userService from '../services/user.service.js';
import csv from 'csv-parser';
import { Readable } from 'stream';

/**
 * Phase 2: User Management Controllers
 * Complete CRUD operations with bulk import and password management
 */

/**
 * Get user profile
 */
export const getProfile = async (req, res) => {
  try {
    const user = req.user;

    successResponse(res, {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        mfaEnabled: user.mfaEnabled,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    errorResponse(res, 'Failed to fetch profile', 500);
  }
};

/**
 * Create new user (Admin only)
 */
export const createUser = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, isActive } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !role) {
      return errorResponse(res, 'Missing required fields', 400);
    }

    // Validate role
    const validRoles = ['admin', 'teacher', 'student', 'parent', 'sponsor'];
    if (!validRoles.includes(role)) {
      return errorResponse(res, 'Invalid role', 400);
    }

    // Prevent non-admin from creating admin users
    if (role === 'admin' && req.user.role !== 'admin') {
      return errorResponse(res, 'Only admins can create admin users', 403);
    }

    const user = await userService.createUser(
      { email, password, firstName, lastName, role, isActive },
      req.user.id
    );

    successResponse(res, { user }, 'User created successfully', 201);
  } catch (error) {
    logger.error('Create user error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return errorResponse(res, 'Email already exists', 409);
    }
    errorResponse(res, 'Failed to create user', 500);
  }
};

/**
 * Get list of users with pagination and filtering
 */
export const getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      role,
      isActive,
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = req.query;

    // Validate limit
    if (limit > 100) {
      return errorResponse(res, 'Maximum limit is 100', 400);
    }

    const result = await userService.getUsers({
      page,
      limit,
      role,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      search,
      sortBy,
      sortOrder,
    });

    successResponse(res, result);
  } catch (error) {
    logger.error('Get users error:', error);
    errorResponse(res, 'Failed to fetch users', 500);
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await userService.getUserById(id);

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    successResponse(res, { user });
  } catch (error) {
    logger.error('Get user by ID error:', error);
    errorResponse(res, 'Failed to fetch user', 500);
  }
};

/**
 * Update user
 */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, firstName, lastName, role, isActive } = req.body;

    // Prevent role escalation (non-admin cannot set role to admin)
    if (role === 'admin' && req.user.role !== 'admin') {
      return errorResponse(res, 'Only admins can set admin role', 403);
    }

    // Prevent users from modifying their own role (except admins)
    if (id === req.user.id && role && role !== req.user.role && req.user.role !== 'admin') {
      return errorResponse(res, 'Cannot modify your own role', 403);
    }

    const user = await userService.updateUser(
      id,
      { email, firstName, lastName, role, isActive },
      req.user.id
    );

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    successResponse(res, { user }, 'User updated successfully');
  } catch (error) {
    logger.error('Update user error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return errorResponse(res, 'Email already exists', 409);
    }
    errorResponse(res, 'Failed to update user', 500);
  }
};

/**
 * Delete user (soft delete)
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (id === req.user.id) {
      return errorResponse(res, 'Cannot delete your own account', 403);
    }

    const success = await userService.deleteUser(id, req.user.id);

    if (!success) {
      return errorResponse(res, 'User not found', 404);
    }

    successResponse(res, null, 'User deleted successfully');
  } catch (error) {
    logger.error('Delete user error:', error);
    errorResponse(res, 'Failed to delete user', 500);
  }
};

/**
 * Change password
 */
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return errorResponse(res, 'Old password and new password are required', 400);
    }

    if (newPassword.length < 8) {
      return errorResponse(res, 'New password must be at least 8 characters', 400);
    }

    const result = await userService.changePassword(
      req.user.id,
      oldPassword,
      newPassword
    );

    if (!result.success) {
      return errorResponse(res, result.message, 400);
    }

    successResponse(res, null, result.message);
  } catch (error) {
    logger.error('Change password error:', error);
    errorResponse(res, 'Failed to change password', 500);
  }
};

/**
 * Reset password (Admin only)
 */
export const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return errorResponse(res, 'New password is required', 400);
    }

    if (newPassword.length < 8) {
      return errorResponse(res, 'Password must be at least 8 characters', 400);
    }

    const result = await userService.resetPassword(id, newPassword, req.user.id);

    if (!result.success) {
      return errorResponse(res, result.message, 404);
    }

    successResponse(res, null, result.message);
  } catch (error) {
    logger.error('Reset password error:', error);
    errorResponse(res, 'Failed to reset password', 500);
  }
};

/**
 * Activate user
 */
export const activateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await userService.activateUser(id, req.user.id);

    if (!result.success) {
      return errorResponse(res, result.message, result.message.includes('not found') ? 404 : 400);
    }

    successResponse(res, null, result.message);
  } catch (error) {
    logger.error('Activate user error:', error);
    errorResponse(res, 'Failed to activate user', 500);
  }
};

/**
 * Deactivate user
 */
export const deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deactivation
    if (id === req.user.id) {
      return errorResponse(res, 'Cannot deactivate your own account', 403);
    }

    const result = await userService.deactivateUser(id, req.user.id);

    if (!result.success) {
      return errorResponse(res, result.message, result.message.includes('not found') ? 404 : 400);
    }

    successResponse(res, null, result.message);
  } catch (error) {
    logger.error('Deactivate user error:', error);
    errorResponse(res, 'Failed to deactivate user', 500);
  }
};

/**
 * Bulk import users from CSV
 */
export const bulkImportUsers = async (req, res) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'CSV file is required', 400);
    }

    const usersData = [];
    const fileBuffer = req.file.buffer;

    // Parse CSV
    const stream = Readable.from(fileBuffer.toString());
    
    stream
      .pipe(csv())
      .on('data', (row) => {
        usersData.push(row);
      })
      .on('end', async () => {
        try {
          const results = await userService.bulkImportUsers(usersData, req.user.id);
          successResponse(res, results, 'Bulk import completed');
        } catch (error) {
          logger.error('Bulk import processing error:', error);
          errorResponse(res, 'Failed to import users', 500);
        }
      })
      .on('error', (error) => {
        logger.error('CSV parsing error:', error);
        errorResponse(res, 'Invalid CSV file', 400);
      });
  } catch (error) {
    logger.error('Bulk import error:', error);
    errorResponse(res, 'Failed to import users', 500);
  }
};

/**
 * Get user statistics
 */
export const getUserStats = async (req, res) => {
  try {
    const stats = await userService.getUserStats();
    successResponse(res, { stats });
  } catch (error) {
    logger.error('Get user stats error:', error);
    errorResponse(res, 'Failed to fetch statistics', 500);
  }
};
