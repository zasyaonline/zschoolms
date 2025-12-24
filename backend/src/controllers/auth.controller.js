import authService from '../services/auth.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../utils/logger.js';

/**
 * Authentication Controller
 * Handles HTTP requests for authentication endpoints
 */

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    // Validate input
    if (!emailOrUsername || !password) {
      return errorResponse(res, 'Email/username and password are required', 400);
    }

    // Get client info
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    // Perform login
    const result = await authService.login(emailOrUsername, password, ipAddress, userAgent);

    if (!result.success) {
      return errorResponse(res, result.message, 401);
    }

    // If MFA is required
    if (result.requiresMFA) {
      return res.status(200).json({
        success: true,
        requiresMFA: true,
        tempToken: result.tempToken,
        message: result.message,
      });
    }

    // Successful login without MFA
    return successResponse(res, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    }, 'Login successful');
  } catch (error) {
    logger.error('Login controller error:', error);
    return errorResponse(res, 'An error occurred during login', 500);
  }
};

/**
 * Verify MFA
 * POST /api/auth/mfa-verify
 */
export const verifyMFA = async (req, res) => {
  try {
    const { tempToken, code } = req.body;

    // Validate input
    if (!tempToken || !code) {
      return errorResponse(res, 'Temporary token and code are required', 400);
    }

    // Get client info
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    // Verify MFA
    const result = await authService.verifyMFA(tempToken, code, ipAddress, userAgent);

    if (!result.success) {
      return errorResponse(res, result.message, 401);
    }

    return successResponse(res, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    }, 'MFA verification successful');
  } catch (error) {
    logger.error('MFA verification controller error:', error);
    return errorResponse(res, 'An error occurred during MFA verification', 500);
  }
};

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // Validate input
    if (!refreshToken) {
      return errorResponse(res, 'Refresh token is required', 400);
    }

    // Get client info
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    // Refresh token
    const result = await authService.refreshAccessToken(refreshToken, ipAddress, userAgent);

    if (!result.success) {
      return errorResponse(res, result.message, 401);
    }

    return successResponse(res, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    }, 'Token refreshed successfully');
  } catch (error) {
    logger.error('Token refresh controller error:', error);
    return errorResponse(res, 'An error occurred during token refresh', 500);
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const userId = req.user?.id;

    // Get client info
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    // Logout
    await authService.logout(refreshToken, userId, ipAddress, userAgent);

    return successResponse(res, null, 'Logged out successfully');
  } catch (error) {
    logger.error('Logout controller error:', error);
    return errorResponse(res, 'An error occurred during logout', 500);
  }
};

/**
 * Setup MFA
 * POST /api/auth/mfa-setup
 */
export const setupMFA = async (req, res) => {
  try {
    const userId = req.user.id;

    // Setup MFA
    const result = await authService.setupMFA(userId);

    if (!result.success) {
      return errorResponse(res, result.message, 400);
    }

    return successResponse(res, {
      secret: result.secret,
      qrCode: result.qrCode,
      backupCodes: result.backupCodes,
    }, 'MFA setup initiated. Scan the QR code with your authenticator app.');
  } catch (error) {
    logger.error('MFA setup controller error:', error);
    return errorResponse(res, 'An error occurred during MFA setup', 500);
  }
};

/**
 * Enable MFA
 * POST /api/auth/mfa-enable
 */
export const enableMFA = async (req, res) => {
  try {
    const userId = req.user.id;
    const { totpCode } = req.body;

    // Validate input
    if (!totpCode) {
      return errorResponse(res, 'TOTP code is required', 400);
    }

    // Enable MFA
    const result = await authService.enableMFA(userId, totpCode);

    if (!result.success) {
      return errorResponse(res, result.message, 400);
    }

    return successResponse(res, null, result.message);
  } catch (error) {
    logger.error('MFA enable controller error:', error);
    return errorResponse(res, 'An error occurred during MFA activation', 500);
  }
};

/**
 * Disable MFA
 * POST /api/auth/mfa-disable
 */
export const disableMFA = async (req, res) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;

    // Validate input
    if (!password) {
      return errorResponse(res, 'Password is required', 400);
    }

    // Disable MFA
    const result = await authService.disableMFA(userId, password);

    if (!result.success) {
      return errorResponse(res, result.message, 400);
    }

    return successResponse(res, null, result.message);
  } catch (error) {
    logger.error('MFA disable controller error:', error);
    return errorResponse(res, 'An error occurred during MFA deactivation', 500);
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
export const getCurrentUser = async (req, res) => {
  try {
    return successResponse(res, req.user, 'User profile retrieved successfully');
  } catch (error) {
    logger.error('Get current user controller error:', error);
    return errorResponse(res, 'An error occurred while fetching user profile', 500);
  }
};

export default {
  login,
  verifyMFA,
  refresh,
  logout,
  setupMFA,
  enableMFA,
  disableMFA,
  getCurrentUser,
};
