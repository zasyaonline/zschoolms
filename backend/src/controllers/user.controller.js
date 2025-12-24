import User from '../models/User.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response.js';
import { asyncHandler } from '../middleware/validation.js';
import sequelize from '../config/database.js';
import { Op } from 'sequelize';

/**
 * @desc    Get all users with pagination and filtering
 * @route   GET /api/users
 * @access  Private (Admin, Teacher)
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    role,
    isActive,
    search,
    sortBy = 'createdAt',
    order = 'DESC',
  } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const where = {};

  // Apply filters
  if (role) {
    where.role = role;
  }

  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }

  // Search in username, email, firstName, lastName
  if (search) {
    where[Op.or] = [
      { username: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
      { firstName: { [Op.iLike]: `%${search}%` } },
      { lastName: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const { count, rows: users } = await User.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset,
    order: [[sortBy, order.toUpperCase()]],
    attributes: { exclude: ['password'] },
  });

  const totalPages = Math.ceil(count / parseInt(limit));

  sendSuccess(res, {
    users,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalUsers: count,
      limit: parseInt(limit),
      hasNextPage: parseInt(page) < totalPages,
      hasPrevPage: parseInt(page) > 1,
    },
  }, 'Users retrieved successfully');
});

/**
 * @desc    Get single user by ID
 * @route   GET /api/users/:id
 * @access  Private
 */
export const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findByPk(id, {
    attributes: { exclude: ['password'] },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  sendSuccess(res, { user }, 'User retrieved successfully');
});

/**
 * @desc    Create new user
 * @route   POST /api/users
 * @access  Private (Admin)
 */
export const createUser = asyncHandler(async (req, res) => {
  const {
    username,
    email,
    password,
    firstName,
    lastName,
    role = 'student',
    isActive = true,
  } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({
    where: {
      [Op.or]: [{ username }, { email }],
    },
  });

  if (existingUser) {
    if (existingUser.username === username) {
      throw new ConflictError('Username already exists');
    }
    if (existingUser.email === email) {
      throw new ConflictError('Email already exists');
    }
  }

  // Create new user
  const user = await User.create({
    username,
    email,
    password,
    firstName,
    lastName,
    role,
    isActive,
  });

  sendCreated(res, { user }, 'User created successfully');
});

/**
 * @desc    Update user
 * @route   PUT /api/users/:id
 * @access  Private
 */
export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    username,
    email,
    firstName,
    lastName,
    role,
    isActive,
    profilePicture,
  } = req.body;

  const user = await User.findByPk(id);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Check if username or email is being changed and already exists
  if (username && username !== user.username) {
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      throw new ConflictError('Username already exists');
    }
  }

  if (email && email !== user.email) {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictError('Email already exists');
    }
  }

  // Update user fields
  const updateData = {};
  if (username !== undefined) updateData.username = username;
  if (email !== undefined) updateData.email = email;
  if (firstName !== undefined) updateData.firstName = firstName;
  if (lastName !== undefined) updateData.lastName = lastName;
  if (role !== undefined) updateData.role = role;
  if (isActive !== undefined) updateData.isActive = isActive;
  if (profilePicture !== undefined) updateData.profilePicture = profilePicture;

  await user.update(updateData);

  sendSuccess(res, { user }, 'User updated successfully');
});

/**
 * @desc    Delete user (soft delete by setting isActive to false)
 * @route   DELETE /api/users/:id
 * @access  Private (Admin)
 */
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { permanent = false } = req.query;

  const user = await User.findByPk(id);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Prevent deleting yourself
  if (req.user && req.user.id === id) {
    throw new ConflictError('You cannot delete your own account');
  }

  if (permanent === 'true') {
    // Permanent delete
    await user.destroy();
    sendSuccess(res, null, 'User permanently deleted');
  } else {
    // Soft delete
    await user.update({ isActive: false });
    sendSuccess(res, { user }, 'User deactivated successfully');
  }
});

/**
 * @desc    Update user password
 * @route   PUT /api/users/:id/password
 * @access  Private
 */
export const updatePassword = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;

  const user = await User.findByPk(id);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Verify current password
  const isPasswordValid = await user.comparePassword(currentPassword);
  if (!isPasswordValid) {
    throw new ConflictError('Current password is incorrect');
  }

  // Update password (will be hashed by beforeUpdate hook)
  await user.update({ password: newPassword });

  sendSuccess(res, null, 'Password updated successfully');
});

/**
 * @desc    Get user statistics
 * @route   GET /api/users/stats
 * @access  Private (Admin)
 */
export const getUserStats = asyncHandler(async (req, res) => {
  const stats = await User.findAll({
    attributes: [
      'role',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
    ],
    group: ['role'],
    raw: true,
  });

  const activeUsers = await User.count({ where: { isActive: true } });
  const inactiveUsers = await User.count({ where: { isActive: false } });
  const totalUsers = await User.count();

  sendSuccess(res, {
    byRole: stats,
    byStatus: {
      active: activeUsers,
      inactive: inactiveUsers,
      total: totalUsers,
    },
  }, 'User statistics retrieved successfully');
});
