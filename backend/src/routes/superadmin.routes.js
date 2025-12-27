import express from 'express';
import multer from 'multer';
import { authenticate, authorize } from '../middleware/auth.js';
import * as superAdminService from '../services/superadmin.service.js';
import * as securityService from '../services/security.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Configure multer for certificate uploads (in-memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pfx', '.p12', '.pem'];
    const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only .pfx, .p12, and .pem files are allowed'));
    }
  },
});

/**
 * Super Admin Routes
 * Base path: /api/super-admin
 * All routes require super_admin role
 */

// ============================================================================
// STEP 2: System Health Dashboard
// ============================================================================

/**
 * @swagger
 * /api/super-admin/system-health:
 *   get:
 *     summary: Get system health metrics
 *     description: Comprehensive system health including DB status, user counts, storage, and security metrics
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System health data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Super Admin only
 */
router.get('/system-health', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const health = await superAdminService.getSystemHealth();
    return successResponse(res, 'System health retrieved', health);
  } catch (error) {
    logger.error('Error getting system health:', error);
    return errorResponse(res, error.message, 500);
  }
});

// ============================================================================
// STEP 3: User Account Management
// ============================================================================

/**
 * @swagger
 * /api/super-admin/admin-users:
 *   get:
 *     summary: Get all admin-level users
 *     description: List all users with admin, principal, or super_admin roles
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of admin users
 */
router.get('/admin-users', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const users = await superAdminService.getAdminUsers();
    return successResponse(res, 'Admin users retrieved', users);
  } catch (error) {
    logger.error('Error getting admin users:', error);
    return errorResponse(res, error.message, 500);
  }
});

/**
 * @swagger
 * /api/super-admin/admin-users:
 *   post:
 *     summary: Create admin-level user
 *     description: Create a new admin or principal user
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - first_name
 *               - last_name
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, principal]
 *     responses:
 *       201:
 *         description: User created
 */
router.post('/admin-users', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const user = await superAdminService.createAdminUser(req.body, req.user.id);
    return successResponse(res, 'Admin user created', user, 201);
  } catch (error) {
    logger.error('Error creating admin user:', error);
    return errorResponse(res, error.message, 400);
  }
});

/**
 * @swagger
 * /api/super-admin/admin-users/{id}/status:
 *   patch:
 *     summary: Enable/disable admin user
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - is_active
 *             properties:
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User status updated
 */
router.patch('/admin-users/:id/status', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const { is_active } = req.body;
    if (typeof is_active !== 'boolean') {
      return errorResponse(res, 'is_active must be a boolean', 400);
    }
    const user = await superAdminService.toggleAdminUserStatus(req.params.id, is_active, req.user.id);
    return successResponse(res, `User ${is_active ? 'activated' : 'deactivated'}`, user);
  } catch (error) {
    logger.error('Error toggling user status:', error);
    return errorResponse(res, error.message, 400);
  }
});

/**
 * @swagger
 * /api/super-admin/admin-users/{id}/reset-password:
 *   post:
 *     summary: Reset admin user password
 *     description: Super Admin can reset passwords for admin/principal users
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - new_password
 *             properties:
 *               new_password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset
 */
router.post('/admin-users/:id/reset-password', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const { new_password } = req.body;
    if (!new_password || new_password.length < 8) {
      return errorResponse(res, 'Password must be at least 8 characters', 400);
    }
    const result = await superAdminService.resetAdminPassword(req.params.id, new_password, req.user.id);
    return successResponse(res, result.message, result);
  } catch (error) {
    logger.error('Error resetting password:', error);
    return errorResponse(res, error.message, 400);
  }
});

/**
 * @swagger
 * /api/super-admin/admin-users/{id}/role:
 *   patch:
 *     summary: Change user role
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, principal, teacher, staff]
 *     responses:
 *       200:
 *         description: Role changed
 */
router.patch('/admin-users/:id/role', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) {
      return errorResponse(res, 'Role is required', 400);
    }
    const user = await superAdminService.changeUserRole(req.params.id, role, req.user.id);
    return successResponse(res, 'User role changed', user);
  } catch (error) {
    logger.error('Error changing role:', error);
    return errorResponse(res, error.message, 400);
  }
});

// ============================================================================
// STEP 6: Audit Logs
// ============================================================================

/**
 * @swagger
 * /api/super-admin/audit-logs:
 *   get:
 *     summary: Get audit logs
 *     description: Retrieve system-wide audit logs with filtering
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter by action type
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *         description: Filter by entity type
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter to date
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [SUCCESS, FAILURE]
 *         description: Filter by status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Paginated audit logs
 */
router.get('/audit-logs', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const result = await superAdminService.getAuditLogs(req.query);
    return successResponse(res, 'Audit logs retrieved', result);
  } catch (error) {
    logger.error('Error getting audit logs:', error);
    return errorResponse(res, error.message, 500);
  }
});

/**
 * @swagger
 * /api/super-admin/audit-stats:
 *   get:
 *     summary: Get audit statistics
 *     description: Aggregated audit statistics for the last 30 days
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Audit statistics
 */
router.get('/audit-stats', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const stats = await superAdminService.getAuditStats();
    return successResponse(res, 'Audit stats retrieved', stats);
  } catch (error) {
    logger.error('Error getting audit stats:', error);
    return errorResponse(res, error.message, 500);
  }
});

// ============================================================================
// STEP 7: Exception Handling (Amendments)
// ============================================================================

/**
 * @swagger
 * /api/super-admin/amendments:
 *   post:
 *     summary: Create amendment for erroneous immutable record
 *     description: Official protocol to document and correct errors in locked/signed records
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - entityType
 *               - originalId
 *               - correctedData
 *               - justification
 *             properties:
 *               entityType:
 *                 type: string
 *                 enum: [Marksheet, Mark, ReportCard]
 *                 description: Type of record to amend
 *               originalId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the original erroneous record
 *               correctedData:
 *                 type: object
 *                 description: The corrected data
 *               justification:
 *                 type: string
 *                 description: Detailed justification for the amendment
 *     responses:
 *       200:
 *         description: Amendment created
 */
router.post('/amendments', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const { entityType, originalId, correctedData, justification } = req.body;
    
    if (!entityType || !originalId || !correctedData || !justification) {
      return errorResponse(res, 'Missing required fields: entityType, originalId, correctedData, justification', 400);
    }
    
    if (justification.length < 50) {
      return errorResponse(res, 'Justification must be at least 50 characters for audit purposes', 400);
    }
    
    const result = await superAdminService.createAmendment({
      entityType,
      originalId,
      correctedData,
      justification,
      amendedBy: req.user.id,
    });
    
    return successResponse(res, 'Amendment created', result);
  } catch (error) {
    logger.error('Error creating amendment:', error);
    return errorResponse(res, error.message, 400);
  }
});

/**
 * @swagger
 * /api/super-admin/amendments/{entityType}/{entityId}/history:
 *   get:
 *     summary: Get amendment history for a record
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Marksheet, Mark, ReportCard]
 *       - in: path
 *         name: entityId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Amendment history
 */
router.get('/amendments/:entityType/:entityId/history', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const history = await superAdminService.getAmendmentHistory(entityType, entityId);
    return successResponse(res, 'Amendment history retrieved', history);
  } catch (error) {
    logger.error('Error getting amendment history:', error);
    return errorResponse(res, error.message, 500);
  }
});

// ============================================================================
// STEP 4 & 6: Security Settings
// ============================================================================

/**
 * @swagger
 * /api/super-admin/security-settings:
 *   get:
 *     summary: Get security settings
 *     description: Get current system-wide security configuration
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Security settings
 */
router.get('/security-settings', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const settings = securityService.getSecuritySettings();
    return successResponse(res, 'Security settings retrieved', settings);
  } catch (error) {
    logger.error('Error getting security settings:', error);
    return errorResponse(res, error.message, 500);
  }
});

/**
 * @swagger
 * /api/super-admin/security-settings:
 *   put:
 *     summary: Update security settings
 *     description: Update system-wide security configuration
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sessionTimeoutMinutes:
 *                 type: integer
 *                 minimum: 5
 *                 maximum: 480
 *               passwordMinLength:
 *                 type: integer
 *                 minimum: 6
 *                 maximum: 32
 *               passwordRequireUppercase:
 *                 type: boolean
 *               passwordRequireLowercase:
 *                 type: boolean
 *               passwordRequireNumbers:
 *                 type: boolean
 *               passwordRequireSpecialChars:
 *                 type: boolean
 *               maxLoginAttempts:
 *                 type: integer
 *                 minimum: 3
 *                 maximum: 20
 *               lockoutDurationMinutes:
 *                 type: integer
 *               mfaRequired:
 *                 type: array
 *                 items:
 *                   type: string
 *               ipWhitelist:
 *                 type: array
 *                 items:
 *                   type: string
 *               ipWhitelistEnabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Settings updated
 */
router.put('/security-settings', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const settings = await securityService.updateSecuritySettings(req.body, req.user.id);
    return successResponse(res, 'Security settings updated', settings);
  } catch (error) {
    logger.error('Error updating security settings:', error);
    return errorResponse(res, error.message, 400);
  }
});

// ============================================================================
// STEP 5: Digital Signature / Certificate Management
// ============================================================================

/**
 * @swagger
 * /api/super-admin/certificates/{schoolId}:
 *   get:
 *     summary: Get certificate status for a school
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: schoolId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Certificate status
 */
router.get('/certificates/:schoolId', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const status = securityService.getCertificateStatus(req.params.schoolId);
    return successResponse(res, 'Certificate status retrieved', status);
  } catch (error) {
    logger.error('Error getting certificate status:', error);
    return errorResponse(res, error.message, 500);
  }
});

/**
 * @swagger
 * /api/super-admin/certificates/{schoolId}:
 *   post:
 *     summary: Upload digital signature certificate
 *     description: Upload PFX/P12 certificate for digital signatures
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: schoolId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - certificate
 *               - password
 *             properties:
 *               certificate:
 *                 type: string
 *                 format: binary
 *                 description: PFX/P12 certificate file
 *               password:
 *                 type: string
 *                 description: Certificate password
 *     responses:
 *       200:
 *         description: Certificate uploaded
 */
router.post('/certificates/:schoolId', authenticate, authorize('super_admin'), upload.single('certificate'), async (req, res) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'Certificate file is required', 400);
    }
    if (!req.body.password) {
      return errorResponse(res, 'Certificate password is required', 400);
    }

    const result = await securityService.uploadCertificate(
      req.file.buffer,
      req.body.password,
      req.params.schoolId,
      req.user.id
    );
    return successResponse(res, 'Certificate uploaded successfully', result);
  } catch (error) {
    logger.error('Error uploading certificate:', error);
    return errorResponse(res, error.message, 400);
  }
});

/**
 * @swagger
 * /api/super-admin/certificates/{schoolId}:
 *   delete:
 *     summary: Revoke/delete certificate
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: schoolId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Certificate revoked
 */
router.delete('/certificates/:schoolId', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const result = await securityService.revokeCertificate(req.params.schoolId, req.user.id);
    return successResponse(res, result.message, result);
  } catch (error) {
    logger.error('Error revoking certificate:', error);
    return errorResponse(res, error.message, 400);
  }
});

// ============================================================================
// EMAIL SETTINGS MANAGEMENT
// ============================================================================

import { getEmailStats } from '../services/email.service.js';

/**
 * @swagger
 * /api/super-admin/email-settings:
 *   get:
 *     summary: Get current email configuration and statistics
 *     description: Returns email sending status, daily limits, and usage statistics
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Email settings and statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 enabled:
 *                   type: boolean
 *                   description: Whether email sending is enabled
 *                 emailsSentToday:
 *                   type: integer
 *                   description: Number of emails sent today
 *                 dailyLimit:
 *                   type: integer
 *                   description: Maximum emails allowed per day
 *                 remainingToday:
 *                   type: integer
 *                   description: Remaining emails for today
 *                 configuration:
 *                   type: object
 *                   description: Current environment configuration
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Super Admin only
 */
router.get('/email-settings', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const stats = getEmailStats();
    const configuration = {
      ENABLE_EMAIL_SENDING: process.env.ENABLE_EMAIL_SENDING || 'false',
      DAILY_EMAIL_LIMIT: process.env.DAILY_EMAIL_LIMIT || '50',
      EMAIL_QUEUE_CRON_SCHEDULE: process.env.EMAIL_QUEUE_CRON_SCHEDULE || '0 6 * * *',
      RENEWAL_CRON_SCHEDULE: process.env.RENEWAL_CRON_SCHEDULE || '0 8 * * *',
      SMTP_HOST: process.env.SMTP_HOST || 'smtp.zeptomail.in',
      SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL || '(not set)',
      SMTP_FROM_NAME: process.env.SMTP_FROM_NAME || 'ZSchool Management System'
    };
    
    return successResponse(res, 'Email settings retrieved', {
      ...stats,
      configuration,
      instructions: {
        toEnableEmails: 'Set ENABLE_EMAIL_SENDING=true in .env file and restart server',
        toChangeDailyLimit: 'Set DAILY_EMAIL_LIMIT=<number> in .env file',
        toChangeQueueSchedule: 'Set EMAIL_QUEUE_CRON_SCHEDULE=<cron> in .env file (default: 0 6 * * * = 6 AM daily)',
        toChangeRenewalSchedule: 'Set RENEWAL_CRON_SCHEDULE=<cron> in .env file (default: 0 8 * * * = 8 AM daily)'
      }
    });
  } catch (error) {
    logger.error('Error getting email settings:', error);
    return errorResponse(res, error.message, 500);
  }
});

/**
 * @swagger
 * /api/super-admin/email-settings/test:
 *   post:
 *     summary: Send a test email
 *     description: Send a test email to verify configuration (counts towards daily limit)
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *             properties:
 *               to:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Test email result
 *       400:
 *         description: Email sending failed or disabled
 */
router.post('/email-settings/test', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const { to } = req.body;
    if (!to) {
      return errorResponse(res, 'Recipient email (to) is required', 400);
    }
    
    const { sendEmail } = await import('../services/email.service.js');
    const result = await sendEmail({
      to,
      subject: 'ZSchool Email Test',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>✅ Email Configuration Test</h2>
          <p>This is a test email from ZSchool Management System.</p>
          <p>If you received this email, your email configuration is working correctly.</p>
          <p><strong>Sent at:</strong> ${new Date().toISOString()}</p>
          <p><strong>Sent by:</strong> ${req.user.email}</p>
        </div>
      `,
      text: `ZSchool Email Test - Sent at ${new Date().toISOString()}`,
      bypassDedup: true // Allow multiple test emails
    });
    
    return successResponse(res, result.blocked ? 'Email blocked (disabled or limit reached)' : 'Test email sent', result);
  } catch (error) {
    logger.error('Error sending test email:', error);
    return errorResponse(res, error.message, 500);
  }
});

export default router;
