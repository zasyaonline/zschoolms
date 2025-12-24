import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, RefreshToken, AuditLog } from '../models/index.js';
import { sendMFACode, verifyMFACode } from './mfa.service.js';
import logger, { logAuth, logSecurity } from '../utils/logger.js';

/**
 * Generate JWT access token
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
};

/**
 * Generate refresh token
 * @param {string} userId - User ID
 * @param {string} ipAddress - Client IP
 * @param {string} userAgent - Client user agent
 * @returns {Promise<Object>} Refresh token object
 */
export const generateRefreshToken = async (userId, ipAddress, userAgent) => {
  const token = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry

  return await RefreshToken.create({
    user_id: userId,
    token,
    expires_at: expiresAt,
    ip_address: ipAddress,
    user_agent: userAgent,
  });
};

/**
 * Verify JWT access token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Verify refresh token
 * @param {string} token - Refresh token
 * @returns {Promise<Object>} Refresh token object with user
 */
export const verifyRefreshToken = async (token) => {
  const refreshToken = await RefreshToken.findOne({
    where: { token, is_revoked: false },
    include: [{ model: User, as: 'user' }],
  });

  if (!refreshToken) {
    return null;
  }

  // Check if expired
  if (new Date() > refreshToken.expires_at) {
    return null;
  }

  return refreshToken;
};

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} ipAddress - Client IP
 * @param {string} userAgent - Client user agent
 * @returns {Promise<Object>} Login result
 */
export const login = async (email, password, ipAddress, userAgent) => {
  try {
    // Find user by email
    const user = await User.findByCredentials(email, password);

    if (!user) {
      await AuditLog.logAction({
        action: 'LOGIN_FAILED',
        ipAddress,
        userAgent,
        status: 'FAILURE',
        errorMessage: 'Invalid credentials',
        metadata: { email },
      });

      return {
        success: false,
        message: 'Invalid credentials',
      };
    }

    // Check if MFA is required for admin/principal
    const requiresMFA = user.requiresMFA();

    if (requiresMFA) {
      // Send MFA code via email
      await sendMFACode(user);
      
      // Generate temporary token for MFA verification (10 minutes)
      const tempToken = jwt.sign(
        { id: user.id, mfaPending: true },
        process.env.JWT_SECRET,
        { expiresIn: '10m' }
      );

      logAuth('login_mfa_pending', {
        userId: user.id,
        ipAddress,
      });

      return {
        success: true,
        requiresMFA: true,
        tempToken,
        message: 'Verification code sent to your email',
      };
    }

    // Generate tokens for non-MFA users
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user.id, ipAddress, userAgent);

    // Update last login
    user.last_login_at = new Date();
    await user.save();

    // Log successful login
    await AuditLog.logAction({
      userId: user.id,
      action: 'LOGIN',
      ipAddress,
      userAgent,
      status: 'SUCCESS',
    });

    logAuth('login_success', {
      userId: user.id,
      email: user.email,
      ipAddress,
    });

    return {
      success: true,
      requiresMFA: false,
      accessToken,
      refreshToken: refreshToken.token,
      user: user.toJSON(),
    };
  } catch (error) {
    logger.error('Login error:', error);
    throw error;
  }
};

/**
 * Verify MFA email code
 * @param {string} tempToken - Temporary JWT token
 * @param {string} code - 6-digit email code
 * @param {string} ipAddress - Client IP
 * @param {string} userAgent - Client user agent
 * @returns {Promise<Object>} MFA verification result
 */
export const verifyMFA = async (tempToken, code, ipAddress, userAgent) => {
  try {
    // Verify temp token
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);

    if (!decoded.mfaPending) {
      return {
        success: false,
        message: 'Invalid verification token',
      };
    }

    // Verify email code
    const result = await verifyMFACode(decoded.id, code);
    
    if (!result.success) {
      await AuditLog.logAction({
        userId: decoded.id,
        action: 'LOGIN_FAILED',
        ipAddress,
        userAgent,
        status: 'FAILURE',
        errorMessage: result.message,
      });

      logSecurity('mfa_verification_failed', {
        userId: decoded.id,
        ipAddress,
        reason: result.message,
      });

      return {
        success: false,
        message: result.message,
      };
    }

    const user = result.user;

    if (!user || !user.is_active) {
      return {
        success: false,
        message: 'User account is inactive',
      };
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user.id, ipAddress, userAgent);

    // Update last login
    user.last_login_at = new Date();
    await user.save();

    // Log successful login
    await AuditLog.logAction({
      userId: user.id,
      action: 'LOGIN',
      ipAddress,
      userAgent,
      status: 'SUCCESS',
      metadata: { mfaVerified: true },
    });

    logAuth('login_success_mfa', {
      userId: user.id,
      email: user.email,
      ipAddress,
    });

    return {
      success: true,
      accessToken,
      refreshToken: refreshToken.token,
      user: user.toJSON(),
    };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return {
        success: false,
        message: 'MFA verification timeout. Please login again.',
      };
    }
    logger.error('MFA verification error:', error);
    throw error;
  }
};

/**
 * Refresh access token
 * @param {string} refreshTokenString - Refresh token
 * @param {string} ipAddress - Client IP
 * @param {string} userAgent - Client user agent
 * @returns {Promise<Object>} Refresh result
 */
export const refreshAccessToken = async (refreshTokenString, ipAddress, userAgent) => {
  try {
    const refreshToken = await verifyRefreshToken(refreshTokenString);

    if (!refreshToken) {
      return {
        success: false,
        message: 'Invalid or expired refresh token',
      };
    }

    const user = refreshToken.user;

    if (!user || !user.is_active) {
      return {
        success: false,
        message: 'User not found or deactivated',
      };
    }

    // Generate new access token
    const accessToken = generateAccessToken(user);

    // Optionally rotate refresh token (recommended for security)
    if (process.env.ROTATE_REFRESH_TOKENS === 'true') {
      // Revoke old token
      await refreshToken.update({ is_revoked: true });

      // Generate new refresh token
      const newRefreshToken = await generateRefreshToken(user.id, ipAddress, userAgent);

      logAuth('token_refresh_rotated', {
        userId: user.id,
        ipAddress,
      });

      return {
        success: true,
        accessToken,
        refreshToken: newRefreshToken.token,
      };
    }

    logAuth('token_refresh', {
      userId: user.id,
      ipAddress,
    });

    return {
      success: true,
      accessToken,
      refreshToken: refreshTokenString,
    };
  } catch (error) {
    logger.error('Token refresh error:', error);
    throw error;
  }
};

/**
 * Logout user
 * @param {string} refreshTokenString - Refresh token to revoke
 * @param {string} userId - User ID
 * @param {string} ipAddress - Client IP
 * @param {string} userAgent - Client user agent
 * @returns {Promise<Object>} Logout result
 */
export const logout = async (refreshTokenString, userId, ipAddress, userAgent) => {
  try {
    // Revoke refresh token if provided
    if (refreshTokenString) {
      await RefreshToken.update(
        { is_revoked: true },
        { where: { token: refreshTokenString } }
      );
    }

    // Log logout
    await AuditLog.logAction({
      userId,
      action: 'LOGOUT',
      ipAddress,
      userAgent,
      status: 'SUCCESS',
    });

    logAuth('logout', {
      userId,
      ipAddress,
    });

    return {
      success: true,
      message: 'Logged out successfully',
    };
  } catch (error) {
    logger.error('Logout error:', error);
    throw error;
  }
};

/**
 * Setup MFA for a user (send test code)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Setup MFA result
 */
export const setupMFA = async (userId) => {
  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    }

    // Check if user role requires MFA
    if (!user.requiresMFA()) {
      return {
        success: false,
        message: 'MFA is only available for admin and principal roles',
      };
    }

    // Send a test MFA code
    await sendMFACode(user);

    logAuth('mfa_setup_initiated', {
      userId: user.id,
    });

    return {
      success: true,
      message: 'Test verification code sent to your email. Please verify to complete setup.',
    };
  } catch (error) {
    logger.error('Setup MFA error:', error);
    throw error;
  }
};

/**
 * Enable MFA for a user
 * @param {string} userId - User ID
 * @param {string} code - 6-digit verification code
 * @returns {Promise<Object>} Enable MFA result
 */
export const enableMFA = async (userId, code) => {
  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    }

    // Check if user role requires MFA
    if (!user.requiresMFA()) {
      return {
        success: false,
        message: 'MFA is only available for admin and principal roles',
      };
    }

    // Verify the code
    const result = await verifyMFACode(userId, code);
    
    if (!result.success) {
      return {
        success: false,
        message: result.message,
      };
    }

    // Enable MFA
    user.mfa_enabled = true;
    await user.save();

    await AuditLog.logAction({
      userId: user.id,
      action: 'MFA_ENABLED',
      entityType: 'user',
      entityId: user.id,
      status: 'SUCCESS',
    });

    logSecurity('mfa_enabled', {
      userId: user.id,
    });

    return {
      success: true,
      message: 'MFA enabled successfully',
    };
  } catch (error) {
    logger.error('Enable MFA error:', error);
    throw error;
  }
};

/**
 * Disable MFA for a user
 * @param {string} userId - User ID
 * @param {string} password - User password for verification
 * @returns {Promise<Object>} Disable MFA result
 */
export const disableMFA = async (userId, password) => {
  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return {
        success: false,
        message: 'Invalid password',
      };
    }

    // Clear MFA settings
    user.mfa_enabled = false;
    user.mfa_secret = null;
    user.mfa_backup_codes = null;
    user.mfa_code = null;
    user.mfa_expires_at = null;
    await user.save();

    // Log MFA disabled
    await AuditLog.logAction({
      userId: user.id,
      action: 'MFA_DISABLED',
      entityType: 'user',
      entityId: user.id,
      status: 'SUCCESS',
    });

    logSecurity('mfa_disabled', {
      userId: user.id,
    });

    return {
      success: true,
      message: 'MFA disabled successfully',
    };
  } catch (error) {
    logger.error('MFA disable error:', error);
    throw error;
  }
};

export default {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  login,
  verifyMFA,
  refreshAccessToken,
  logout,
  setupMFA,
  enableMFA,
  disableMFA,
};
