import rateLimit from 'express-rate-limit';
import { AuditLog } from '../models/index.js';
import logger from '../utils/logger.js';

/**
 * Rate limiting middleware for login attempts
 * 5 attempts per 15 minutes per IP
 */
export const loginRateLimiter = rateLimit({
  windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX) || 5, // 5 requests per window
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
    });

    res.status(429).json({
      success: false,
      message: 'Too many login attempts. Please try again after 15 minutes.',
    });
  },
});

/**
 * Rate limiting middleware for MFA verification
 * 10 attempts per 15 minutes per IP
 */
export const mfaRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: {
    success: false,
    message: 'Too many MFA verification attempts. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('MFA rate limit exceeded', {
      ip: req.ip,
      path: req.path,
    });

    res.status(429).json({
      success: false,
      message: 'Too many MFA verification attempts. Please try again later.',
    });
  },
});

/**
 * Rate limiting middleware for API endpoints
 * 100 requests per 15 minutes per IP
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.API_RATE_LIMIT_MAX) || 100, // 100 requests per window
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('API rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      userId: req.user?.id,
    });

    res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
    });
  },
});

/**
 * Rate limiting middleware for password reset
 * 3 attempts per hour per IP
 */
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  message: {
    success: false,
    message: 'Too many password reset attempts. Please try again after 1 hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Password reset rate limit exceeded', {
      ip: req.ip,
      email: req.body.email,
    });

    res.status(429).json({
      success: false,
      message: 'Too many password reset attempts. Please try again after 1 hour.',
    });
  },
});

/**
 * Check for failed login attempts from IP
 * Block if more than configured attempts in time window
 */
export const checkFailedLoginAttempts = async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const maxAttempts = parseInt(process.env.MAX_FAILED_LOGIN_ATTEMPTS) || 5;
    const windowMinutes = parseInt(process.env.FAILED_LOGIN_WINDOW_MINUTES) || 15;

    const failedAttempts = await AuditLog.getFailedLoginAttempts(ipAddress, windowMinutes);

    if (failedAttempts >= maxAttempts) {
      logger.warn('IP blocked due to failed login attempts', {
        ip: ipAddress,
        attempts: failedAttempts,
      });

      return res.status(429).json({
        success: false,
        message: `Too many failed login attempts. Please try again after ${windowMinutes} minutes.`,
      });
    }

    next();
  } catch (error) {
    logger.error('Error checking failed login attempts:', error);
    next(); // Continue even if check fails
  }
};

export default {
  loginRateLimiter,
  mfaRateLimiter,
  apiRateLimiter,
  passwordResetRateLimiter,
  checkFailedLoginAttempts,
};
