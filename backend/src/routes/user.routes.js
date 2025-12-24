import express from 'express';
import { body, param, query } from 'express-validator';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updatePassword,
  getUserStats,
} from '../controllers/user.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: User unique identifier
 *         username:
 *           type: string
 *           description: Username (3-50 alphanumeric characters)
 *           example: johndoe
 *         email:
 *           type: string
 *           format: email
 *           description: User email address
 *           example: john.doe@example.com
 *         firstName:
 *           type: string
 *           description: User first name
 *           example: John
 *         lastName:
 *           type: string
 *           description: User last name
 *           example: Doe
 *         role:
 *           type: string
 *           enum: [admin, teacher, student, parent, staff]
 *           description: User role
 *           example: teacher
 *         isActive:
 *           type: boolean
 *           description: Whether user account is active
 *           example: true
 *         mfaEnabled:
 *           type: boolean
 *           description: Whether MFA is enabled for this user
 *           example: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: User creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: User last update timestamp
 *     CreateUserRequest:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *         - firstName
 *         - lastName
 *       properties:
 *         username:
 *           type: string
 *           minLength: 3
 *           maxLength: 50
 *           description: Username (alphanumeric only)
 *           example: johndoe
 *         email:
 *           type: string
 *           format: email
 *           description: User email address
 *           example: john.doe@example.com
 *         password:
 *           type: string
 *           format: password
 *           minLength: 6
 *           description: User password (minimum 6 characters)
 *           example: securePassword123
 *         firstName:
 *           type: string
 *           maxLength: 50
 *           description: User first name
 *           example: John
 *         lastName:
 *           type: string
 *           maxLength: 50
 *           description: User last name
 *           example: Doe
 *         role:
 *           type: string
 *           enum: [admin, teacher, student, parent, staff]
 *           description: User role (defaults to 'staff')
 *           example: teacher
 *         isActive:
 *           type: boolean
 *           description: Whether user account is active (defaults to true)
 *           example: true
 *     UpdateUserRequest:
 *       type: object
 *       properties:
 *         username:
 *           type: string
 *           minLength: 3
 *           maxLength: 50
 *           description: Username (alphanumeric only)
 *           example: johndoe
 *         email:
 *           type: string
 *           format: email
 *           description: User email address
 *           example: john.doe@example.com
 *         firstName:
 *           type: string
 *           maxLength: 50
 *           description: User first name
 *           example: John
 *         lastName:
 *           type: string
 *           maxLength: 50
 *           description: User last name
 *           example: Doe
 *         role:
 *           type: string
 *           enum: [admin, teacher, student, parent, staff]
 *           description: User role
 *           example: teacher
 *         isActive:
 *           type: boolean
 *           description: Whether user account is active
 *           example: true
 *     UpdatePasswordRequest:
 *       type: object
 *       required:
 *         - currentPassword
 *         - newPassword
 *       properties:
 *         currentPassword:
 *           type: string
 *           format: password
 *           description: Current password for verification
 *         newPassword:
 *           type: string
 *           format: password
 *           minLength: 6
 *           description: New password (minimum 6 characters)
 *     UserStats:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             totalUsers:
 *               type: integer
 *               description: Total number of users
 *               example: 150
 *             activeUsers:
 *               type: integer
 *               description: Number of active users
 *               example: 142
 *             inactiveUsers:
 *               type: integer
 *               description: Number of inactive users
 *               example: 8
 *             byRole:
 *               type: object
 *               properties:
 *                 admin:
 *                   type: integer
 *                   example: 5
 *                 teacher:
 *                   type: integer
 *                   example: 45
 *                 student:
 *                   type: integer
 *                   example: 80
 *                 parent:
 *                   type: integer
 *                   example: 15
 *                 staff:
 *                   type: integer
 *                   example: 5
 *     UserListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             users:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *             pagination:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   example: 150
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 20
 *                 totalPages:
 *                   type: integer
 *                   example: 8
 */

// Validation rules
const createUserValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .isAlphanumeric()
    .withMessage('Username can only contain letters and numbers'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 50 })
    .withMessage('First name must not exceed 50 characters'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 50 })
    .withMessage('Last name must not exceed 50 characters'),
  body('role')
    .optional()
    .isIn(['admin', 'teacher', 'student', 'parent', 'staff'])
    .withMessage('Invalid role'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

const updateUserValidation = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .isAlphanumeric()
    .withMessage('Username can only contain letters and numbers'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('firstName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('First name cannot be empty')
    .isLength({ max: 50 })
    .withMessage('First name must not exceed 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Last name cannot be empty')
    .isLength({ max: 50 })
    .withMessage('Last name must not exceed 50 characters'),
  body('role')
    .optional()
    .isIn(['admin', 'teacher', 'student', 'parent', 'staff'])
    .withMessage('Invalid role'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

const updatePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters'),
];

const idValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid user ID format'),
];

const queryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('role')
    .optional()
    .isIn(['admin', 'teacher', 'student', 'parent', 'staff'])
    .withMessage('Invalid role'),
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'username', 'email', 'firstName', 'lastName'])
    .withMessage('Invalid sort field'),
  query('order')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('Order must be ASC or DESC'),
];

// Routes

/**
 * @swagger
 * /api/users/stats:
 *   get:
 *     summary: Get user statistics
 *     description: Retrieve statistics about users including total counts and breakdowns by role and status. Admin only.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserStats'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied - Admin privileges required
 */
router.get(
  '/stats',
  authenticate,
  authorize('admin'),
  getUserStats
);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a paginated list of users with optional filtering and sorting. Accessible by Admin and Teacher roles.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of users per page
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, teacher, student, parent, staff]
 *         description: Filter by user role
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, username, email, firstName, lastName]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort order
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for username, email, first name, or last name
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserListResponse'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied - Admin or Teacher privileges required
 */
router.get(
  '/',
  authenticate,
  authorize('admin', 'teacher'),
  queryValidation,
  validate,
  getAllUsers
);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve detailed information about a specific user by their ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid user ID format
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: User not found
 */
router.get(
  '/:id',
  authenticate,
  idValidation,
  validate,
  getUserById
);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create new user
 *     description: Create a new user account. Admin only. Password will be hashed automatically.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserRequest'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *                   example: User created successfully
 *       400:
 *         description: Validation error or duplicate username/email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Username already exists
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied - Admin privileges required
 */
router.post(
  '/',
  authenticate,
  authorize('admin'),
  createUserValidation,
  validate,
  createUser
);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user
 *     description: Update user information. Users can update their own profile. Admins can update any user.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserRequest'
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *                   example: User updated successfully
 *       400:
 *         description: Validation error or duplicate username/email
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied - Can only update own profile unless admin
 *       404:
 *         description: User not found
 */
router.put(
  '/:id',
  authenticate,
  idValidation,
  updateUserValidation,
  validate,
  updateUser
);

/**
 * @swagger
 * /api/users/{id}/password:
 *   put:
 *     summary: Update user password
 *     description: Update password for a user. Requires current password for verification. Users can update their own password. Admins can update any user's password.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePasswordRequest'
 *     responses:
 *       200:
 *         description: Password updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Password updated successfully
 *       400:
 *         description: Validation error or incorrect current password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Current password is incorrect
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied - Can only update own password unless admin
 *       404:
 *         description: User not found
 */
router.put(
  '/:id/password',
  authenticate,
  idValidation,
  updatePasswordValidation,
  validate,
  updatePassword
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user
 *     description: Permanently delete a user account. Admin only. This action cannot be undone.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User deleted successfully
 *       400:
 *         description: Invalid user ID or cannot delete own account
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied - Admin privileges required
 *       404:
 *         description: User not found
 */
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  idValidation,
  validate,
  deleteUser
);

export default router;
