import * as Sentry from '@sentry/node';

/**
 * Sentry Configuration for Backend
 * 
 * Provides:
 * - Error tracking and alerting
 * - Performance monitoring (transactions, spans)
 * - Request context capture
 * - Release tracking
 * 
 * Environment Variables:
 * - SENTRY_DSN: Your Sentry project DSN (required to enable)
 * - SENTRY_ENVIRONMENT: Environment name (default: development)
 * - SENTRY_RELEASE: Release version (default: from package.json)
 * - SENTRY_TRACES_SAMPLE_RATE: Performance sampling rate 0-1 (default: 0.1)
 */

const SENTRY_DSN = process.env.SENTRY_DSN;
const IS_SENTRY_ENABLED = !!SENTRY_DSN;

/**
 * Initialize Sentry for the backend application
 * Call this at the very start of your application (before other imports if possible)
 */
export const initSentry = (app) => {
  if (!IS_SENTRY_ENABLED) {
    console.log('ℹ️  Sentry: Disabled (no SENTRY_DSN configured)');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    release: process.env.SENTRY_RELEASE || `zschool-backend@${process.env.npm_package_version || '1.0.0'}`,
    
    // Performance Monitoring
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0.1, // 10% of transactions
    
    // Profile a percentage of transactions for performance insights
    profilesSampleRate: 0.1,
    
    // Integrations
    integrations: [
      // HTTP integration for tracking outgoing requests
      Sentry.httpIntegration(),
      // Express integration
      Sentry.expressIntegration({ app }),
    ],
    
    // Filter out sensitive data
    beforeSend(event) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }
      
      // Remove sensitive body data
      if (event.request?.data) {
        const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard'];
        sensitiveFields.forEach(field => {
          if (typeof event.request.data === 'object' && event.request.data[field]) {
            event.request.data[field] = '[FILTERED]';
          }
        });
      }
      
      return event;
    },
    
    // Ignore certain errors
    ignoreErrors: [
      // Ignore common non-actionable errors
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      // Ignore validation errors (expected behavior)
      /ValidationError/,
    ],
  });

  console.log('✅ Sentry: Initialized for error tracking and performance monitoring');
  console.log(`   Environment: ${process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development'}`);
};

/**
 * Sentry request handler middleware
 * Must be the first middleware
 */
export const sentryRequestHandler = () => {
  if (!IS_SENTRY_ENABLED) {
    return (req, res, next) => next();
  }
  return Sentry.expressRequestHandler();
};

/**
 * Sentry tracing handler middleware
 * Must be after request handler but before routes
 */
export const sentryTracingHandler = () => {
  if (!IS_SENTRY_ENABLED) {
    return (req, res, next) => next();
  }
  return Sentry.expressTracingHandler();
};

/**
 * Sentry error handler middleware
 * Must be before any other error handling middleware
 */
export const sentryErrorHandler = () => {
  if (!IS_SENTRY_ENABLED) {
    return (err, req, res, next) => next(err);
  }
  return Sentry.expressErrorHandler();
};

/**
 * Capture an exception manually
 * @param {Error} error - The error to capture
 * @param {Object} context - Additional context
 */
export const captureException = (error, context = {}) => {
  if (!IS_SENTRY_ENABLED) {
    console.error('Sentry would capture:', error.message);
    return;
  }
  
  Sentry.withScope((scope) => {
    if (context.user) {
      scope.setUser(context.user);
    }
    if (context.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }
    if (context.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    Sentry.captureException(error);
  });
};

/**
 * Capture a message (for non-error events)
 * @param {string} message - The message to capture
 * @param {string} level - Severity level (info, warning, error)
 */
export const captureMessage = (message, level = 'info') => {
  if (!IS_SENTRY_ENABLED) {
    console.log(`Sentry would capture message [${level}]:`, message);
    return;
  }
  Sentry.captureMessage(message, level);
};

/**
 * Set user context for error tracking
 * Call this after user authentication
 * @param {Object} user - User object with id, email, role
 */
export const setUser = (user) => {
  if (!IS_SENTRY_ENABLED) return;
  
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
  });
};

/**
 * Clear user context (call on logout)
 */
export const clearUser = () => {
  if (!IS_SENTRY_ENABLED) return;
  Sentry.setUser(null);
};

/**
 * Add breadcrumb for debugging context
 * @param {Object} breadcrumb - Breadcrumb data
 */
export const addBreadcrumb = (breadcrumb) => {
  if (!IS_SENTRY_ENABLED) return;
  Sentry.addBreadcrumb(breadcrumb);
};

/**
 * Start a performance transaction
 * @param {string} name - Transaction name
 * @param {string} op - Operation type
 * @returns {Transaction|null}
 */
export const startTransaction = (name, op = 'task') => {
  if (!IS_SENTRY_ENABLED) return null;
  return Sentry.startInactiveSpan({ name, op });
};

export default {
  initSentry,
  sentryRequestHandler,
  sentryTracingHandler,
  sentryErrorHandler,
  captureException,
  captureMessage,
  setUser,
  clearUser,
  addBreadcrumb,
  startTransaction,
  IS_SENTRY_ENABLED,
};
