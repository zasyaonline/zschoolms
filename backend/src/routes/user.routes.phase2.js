import express from 'express';
import multer from 'multer';
import {
  getProfile,
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
} from '../controllers/user.controller.phase2.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for CSV file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

// Authorization middleware
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }
    next();
  };
};

// User profile routes
router.get('/me', authenticate, getProfile);
router.put('/me/password', authenticate, changePassword);

// User management routes (Admin only)
router.post('/', authenticate, authorizeRoles('admin'), createUser);
router.get('/', authenticate, authorizeRoles('admin', 'teacher'), getUsers);
router.get('/stats', authenticate, authorizeRoles('admin'), getUserStats);
router.get('/:id', authenticate, authorizeRoles('admin', 'teacher'), getUserById);
router.put('/:id', authenticate, authorizeRoles('admin'), updateUser);
router.delete('/:id', authenticate, authorizeRoles('admin'), deleteUser);

// Password management (Admin only)
router.post('/:id/reset-password', authenticate, authorizeRoles('admin'), resetPassword);

// User activation/deactivation (Admin only)
router.put('/:id/activate', authenticate, authorizeRoles('admin'), activateUser);
router.put('/:id/deactivate', authenticate, authorizeRoles('admin'), deactivateUser);

// Bulk import (Admin only)
router.post(
  '/import',
  authenticate,
  authorizeRoles('admin'),
  upload.single('file'),
  bulkImportUsers
);

export default router;
