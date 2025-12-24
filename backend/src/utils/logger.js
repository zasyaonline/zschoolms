import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Winston Logger Configuration
 * - Console logging for development
 * - Daily rotating file logs for production
 * - Separate error log file
 */

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format (pretty print for development)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Log directory
const logDir = path.join(__dirname, '../../logs');

// Daily rotate transport for combined logs
const dailyRotateTransport = new DailyRotateFile({
  filename: path.join(logDir, 'application-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d', // Keep logs for 14 days
  level: process.env.LOG_LEVEL || 'info',
});

// Daily rotate transport for error logs
const errorRotateTransport = new DailyRotateFile({
  filename: path.join(logDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d', // Keep error logs for 30 days
  level: 'error',
});

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'zschool-backend' },
  transports: [
    dailyRotateTransport,
    errorRotateTransport,
  ],
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(logDir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
    }),
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join(logDir, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
    }),
  ],
});

// Add console logging in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

/**
 * Log HTTP request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {number} duration - Request duration in ms
 */
export const logRequest = (req, res, duration) => {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    status: res.statusCode,
    duration: `${duration}ms`,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    userId: req.user?.id || 'anonymous',
  };

  if (res.statusCode >= 500) {
    logger.error('HTTP Request Error', logData);
  } else if (res.statusCode >= 400) {
    logger.warn('HTTP Request Warning', logData);
  } else {
    logger.info('HTTP Request', logData);
  }
};

/**
 * Log authentication event
 * @param {string} event - Event type (login, logout, failed_login, etc.)
 * @param {Object} data - Event data
 */
export const logAuth = (event, data) => {
  logger.info('Authentication Event', {
    event,
    ...data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Log database operation
 * @param {string} operation - Operation type (create, update, delete, etc.)
 * @param {string} model - Model name
 * @param {Object} data - Operation data
 */
export const logDatabase = (operation, model, data) => {
  logger.info('Database Operation', {
    operation,
    model,
    ...data,
  });
};

/**
 * Log email sending
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {boolean} success - Whether email was sent successfully
 */
export const logEmail = (to, subject, success) => {
  const logData = {
    to,
    subject,
    success,
    timestamp: new Date().toISOString(),
  };

  if (success) {
    logger.info('Email Sent', logData);
  } else {
    logger.error('Email Failed', logData);
  }
};

/**
 * Log S3 operation
 * @param {string} operation - Operation type (upload, delete, etc.)
 * @param {string} key - S3 object key
 * @param {boolean} success - Whether operation was successful
 */
export const logS3 = (operation, key, success) => {
  const logData = {
    operation,
    key,
    success,
    timestamp: new Date().toISOString(),
  };

  if (success) {
    logger.info('S3 Operation', logData);
  } else {
    logger.error('S3 Operation Failed', logData);
  }
};

/**
 * Log security event
 * @param {string} event - Event type (mfa_enabled, password_changed, etc.)
 * @param {Object} data - Event data
 */
export const logSecurity = (event, data) => {
  logger.warn('Security Event', {
    event,
    ...data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Express middleware for request logging
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logRequest(req, res, duration);
  });

  next();
};

/**
 * Log error with stack trace
 * @param {Error} error - Error object
 * @param {Object} context - Additional context
 */
export const logError = (error, context = {}) => {
  logger.error('Error', {
    message: error.message,
    stack: error.stack,
    ...context,
  });
};

// Export logger instance
export default logger;
