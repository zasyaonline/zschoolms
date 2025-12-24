import express from 'express';
import {
  login,
  verifyMFA,
  refreshToken,
  logout,
  setupMFA,
  enableMFA,
  disableMFA,
  resendMFACode,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { loginLimiter, mfaLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     description: Login with email/username and password. Returns temp token if MFA is required, otherwise returns access and refresh tokens.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emailOrUsername
 *               - password
 *             properties:
 *               emailOrUsername:
 *                 type: string
 *                 example: admin@zasyaonline.com
 *               password:
 *                 type: string
 *                 example: admin123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     requiresMFA:
 *                       type: boolean
 *                       example: true
 *                     tempToken:
 *                       type: string
 *                       description: Temporary token for MFA verification (10 min expiry)
 *                     message:
 *                       type: string
 *                       example: Verification code sent to your email
 *                 - type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     accessToken:
 *                       type: string
 *                       description: JWT access token (15 min expiry)
 *                     refreshToken:
 *                       type: string
 *                       description: Refresh token (30 days expiry)
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many login attempts
 */
router.post('/login', loginLimiter, login);

/**
 * @swagger
 * /api/auth/mfa-verify:
 *   post:
 *     summary: Verify MFA code
 *     tags: [Authentication]
 *     description: Verify the 6-digit OTP code sent via email
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tempToken
 *               - code
 *             properties:
 *               tempToken:
 *                 type: string
 *                 description: Temporary token received from login
 *               code:
 *                 type: string
 *                 example: "123456"
 *                 description: 6-digit OTP code
 *     responses:
 *       200:
 *         description: MFA verification successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid or expired code
 */
router.post('/mfa-verify', mfaLimiter, verifyMFA);

/**
 * @swagger
 * /api/auth/mfa-resend:
 *   post:
 *     summary: Resend MFA code
 *     tags: [Authentication]
 *     description: Request a new OTP code via email
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tempToken
 *             properties:
 *               tempToken:
 *                 type: string
 *                 description: Temporary token from login
 *     responses:
 *       200:
 *         description: New code sent
 *       429:
 *         description: Too many resend attempts
 */
router.post('/mfa-resend', mfaLimiter, resendMFACode);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     description: Get a new access token using refresh token
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New access token generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                   description: New refresh token (if rotation enabled)
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post('/refresh', refreshToken);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     description: Revoke refresh token and logout
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout', logout);

/**
 * @swagger
 * /api/auth/mfa-setup:
 *   post:
 *     summary: Setup MFA for user
 *     tags: [Authentication]
 *     description: Send test MFA code to user's email
 *     responses:
 *       200:
 *         description: Test code sent
 */
router.post('/mfa-setup', authenticate, setupMFA);

/**
 * @swagger
 * /api/auth/mfa-enable:
 *   post:
 *     summary: Enable MFA
 *     tags: [Authentication]
 *     description: Enable MFA after verifying test code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: MFA enabled successfully
 */
router.post('/mfa-enable', authenticate, enableMFA);

/**
 * @swagger
 * /api/auth/mfa-disable:
 *   post:
 *     summary: Disable MFA
 *     tags: [Authentication]
 *     description: Disable MFA for the user
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
 *     responses:
 *       200:
 *         description: MFA disabled successfully
 */
router.post('/mfa-disable', authenticate, disableMFA);

export default router;
