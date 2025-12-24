import jwt from 'jsonwebtoken';
import { AuthenticationError, AuthorizationError } from '../utils/errors.js';
import User from '../models/User.js';

/**
 * Middleware to verify JWT token and authenticate user
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user
    const user = await User.findByPk(decoded.id);

    if (!user || !user.isActive) {
      throw new AuthenticationError('User not found or inactive');
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new AuthenticationError('Invalid token'));
    } else if (error.name === 'TokenExpiredError') {
      next(new AuthenticationError('Token expired'));
    } else {
      next(error);
    }
  }
};

/**
 * Middleware to check if user has required role(s)
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError('User not authenticated'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AuthorizationError(
          `Access denied. Required role(s): ${roles.join(', ')}`
        )
      );
    }

    next();
  };
};

/**
 * Optional authentication - attaches user if token is valid but doesn't fail if no token
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id);

      if (user && user.isActive) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Continue without user if token is invalid
    next();
  }
};

/**
 * Generate JWT token
 */
export const generateToken = (userId, expiresIn = process.env.JWT_EXPIRE || '7d') => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn,
  });
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d',
    }
  );
};
