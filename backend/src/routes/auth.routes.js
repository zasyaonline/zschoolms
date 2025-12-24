import express from 'express';
import authController from '../controllers/auth.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { 
  loginRateLimiter, 
  mfaRateLimiter 
} from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * Authentication Routes
 * Base path: /api/auth
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - emailOrUsername
 *         - password
 *       properties:
 *         emailOrUsername:
 *           type: string
 *           description: User email or username
 *           example: admin@zasyaonline.com
 *         password:
 *           type: string
 *           format: password
 *           description: User password
 *           example: admin123
 *     LoginResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *                 role:
 *                   type: string
 *                 mfaEnabled:
 *                   type: boolean
 *             accessToken:
 *               type: string
 *               description: JWT access token (only if MFA not required)
 *             refreshToken:
 *               type: string
 *               description: JWT refresh token (only if MFA not required)
 *             tempToken:
 *               type: string
 *               description: Temporary token for MFA verification (only if MFA required)
 *             requireMfa:
 *               type: boolean
 *               description: Whether MFA verification is required
 *         message:
 *           type: string
 *     MfaVerifyRequest:
 *       type: object
 *       required:
 *         - tempToken
 *         - totpCode
 *       properties:
 *         tempToken:
 *           type: string
 *           description: Temporary token from login response
 *         totpCode:
 *           type: string
 *           description: 6-digit TOTP code from authenticator app
 *           example: "123456"
 *     RefreshTokenRequest:
 *       type: object
 *       required:
 *         - refreshToken
 *       properties:
 *         refreshToken:
 *           type: string
 *           description: Refresh token obtained from login
 *     TokenResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *           properties:
 *             accessToken:
 *               type: string
 *             refreshToken:
 *               type: string
 *     MfaSetupResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *           properties:
 *             secret:
 *               type: string
 *               description: MFA secret key
 *             qrCode:
 *               type: string
 *               description: Base64 encoded QR code image
 *     UserProfile:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             username:
 *               type: string
 *             email:
 *               type: string
 *             firstName:
 *               type: string
 *             lastName:
 *               type: string
 *             role:
 *               type: string
 *             mfaEnabled:
 *               type: boolean
 *             isActive:
 *               type: boolean
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user with email/username and password. Returns tokens if MFA is not enabled, or temporary token if MFA is required.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Invalid credentials
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
 *                       example: Invalid credentials
 *       429:
 *         description: Too many login attempts
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
 *                       example: Too many requests, please try again later
 */
router.post('/login', loginRateLimiter, authController.login);

/**
 * @swagger
 * /api/auth/mfa-verify:
 *   post:
 *     summary: Verify MFA code
 *     description: Verify TOTP code after login when MFA is enabled. Returns access and refresh tokens upon successful verification.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MfaVerifyRequest'
 *     responses:
 *       200:
 *         description: MFA verification successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenResponse'
 *       400:
 *         description: Invalid MFA code or temporary token
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
 *                       example: Invalid MFA code
 *       429:
 *         description: Too many verification attempts
 */
router.post('/mfa-verify', mfaRateLimiter, authController.verifyMFA);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Get a new access token using a valid refresh token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenResponse'
 *       400:
 *         description: Invalid or expired refresh token
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
 *                       example: Invalid refresh token
 */
router.post('/refresh', authController.refresh);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Revoke refresh token and logout user. Can be called with or without authentication.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       200:
 *         description: Logout successful
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
 *                   example: Logged out successfully
 */
router.post('/logout', optionalAuth, authController.logout);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     description: Retrieve the profile information of the currently authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Not authenticated
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
 *                       example: No token provided
 */
router.get('/me', authenticate, authController.getCurrentUser);

/**
 * @swagger
 * /api/auth/mfa-setup:
 *   post:
 *     summary: Setup MFA for user
 *     description: Generate MFA secret and QR code for the authenticated user. User must scan QR code with authenticator app.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: MFA setup initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MfaSetupResponse'
 *       401:
 *         description: Not authenticated
 */
router.post('/mfa-setup', authenticate, authController.setupMFA);

/**
 * @swagger
 * /api/auth/mfa-enable:
 *   post:
 *     summary: Enable MFA after setup
 *     description: Enable MFA for the user after verifying the TOTP code from authenticator app
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - totpCode
 *             properties:
 *               totpCode:
 *                 type: string
 *                 description: 6-digit TOTP code from authenticator app
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: MFA enabled successfully
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
 *                   example: MFA enabled successfully
 *       400:
 *         description: Invalid TOTP code or MFA not setup
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
 *                       example: Invalid TOTP code
 *       401:
 *         description: Not authenticated
 */
router.post('/mfa-enable', authenticate, authController.enableMFA);

/**
 * @swagger
 * /api/auth/mfa-disable:
 *   post:
 *     summary: Disable MFA for user
 *     description: Disable MFA for the authenticated user. Requires password confirmation.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User password for confirmation
 *     responses:
 *       200:
 *         description: MFA disabled successfully
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
 *                   example: MFA disabled successfully
 *       400:
 *         description: Invalid password or MFA not enabled
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
 *                       example: Invalid password
 *       401:
 *         description: Not authenticated
 */
router.post('/mfa-disable', authenticate, authController.disableMFA);

export default router;
