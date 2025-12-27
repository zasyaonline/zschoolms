import * as Sentry from '@sentry/react';

/**
 * Sentry Configuration for Frontend (React)
 * 
 * Provides:
 * - Error tracking with React component stack traces
 * - Performance monitoring (page loads, API calls)
 * - User session context
 * - Breadcrumbs for debugging
 * 
 * Environment Variables (in .env):
 * - VITE_SENTRY_DSN: Your Sentry project DSN (required to enable)
 * - VITE_SENTRY_ENVIRONMENT: Environment name (default: development)
 */

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const IS_SENTRY_ENABLED = !!SENTRY_DSN;

/**
 * Initialize Sentry for the frontend application
 * Call this in main.jsx before rendering
 */
export const initSentry = () => {
  if (!IS_SENTRY_ENABLED) {
    console.log('ℹ️  Sentry: Disabled (no VITE_SENTRY_DSN configured)');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE || 'development',
    release: `zschool-frontend@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,
    
    // Integrations
    integrations: [
      // Browser tracing for performance
      Sentry.browserTracingIntegration(),
      // Replay for session recording (only on errors)
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    
    // Performance Monitoring
    tracesSampleRate: 0.1, // 10% of transactions
    
    // Session Replay - only capture on errors
    replaysSessionSampleRate: 0, // Don't record normal sessions
    replaysOnErrorSampleRate: 1.0, // Record 100% of sessions with errors
    
    // Filter out sensitive data
    beforeSend(event) {
      // Filter out auth tokens from URLs
      if (event.request?.url) {
        event.request.url = event.request.url.replace(/token=[^&]+/, 'token=[FILTERED]');
      }
      return event;
    },
    
    // Ignore common non-actionable errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'originalCreateNotification',
      'canvas.contentDocument',
      'MyApp_RemoveAllHighlights',
      'http://tt.telerik.com',
      'atomicFindClose',
      // Network errors
      'Network request failed',
      'Failed to fetch',
      'NetworkError',
      'ChunkLoadError',
      // User aborted
      'AbortError',
      'User rejected',
      // React development
      'ResizeObserver loop',
    ],
    
    // Don't send errors from these URLs
    denyUrls: [
      // Chrome extensions
      /extensions\//i,
      /^chrome:\/\//i,
      /^chrome-extension:\/\//i,
      // Firefox extensions
      /^moz-extension:\/\//i,
    ],
  });

  console.log('✅ Sentry: Initialized for error tracking');
};

/**
 * Capture an exception manually
 * @param {Error} error - The error to capture
 * @param {Object} context - Additional context
 */
export const captureException = (error, context = {}) => {
  if (!IS_SENTRY_ENABLED) {
    console.error('Sentry would capture:', error);
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
 * Call this after user login
 * @param {Object} user - User object with id, email, role
 */
export const setUser = (user) => {
  if (!IS_SENTRY_ENABLED) return;
  
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username || user.email,
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
 * Sentry Error Boundary component
 * Wrap your app or specific components to catch React errors
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;

/**
 * HOC to wrap components with Sentry error boundary
 */
export const withSentryErrorBoundary = (Component, options = {}) => {
  if (!IS_SENTRY_ENABLED) return Component;
  return Sentry.withErrorBoundary(Component, options);
};

/**
 * Profiler component for performance monitoring
 */
export const SentryProfiler = Sentry.Profiler;

/**
 * HOC to add profiling to a component
 */
export const withSentryProfiler = (Component, options = {}) => {
  if (!IS_SENTRY_ENABLED) return Component;
  return Sentry.withProfiler(Component, options);
};

export { IS_SENTRY_ENABLED };

export default {
  initSentry,
  captureException,
  captureMessage,
  setUser,
  clearUser,
  addBreadcrumb,
  SentryErrorBoundary,
  withSentryErrorBoundary,
  SentryProfiler,
  withSentryProfiler,
  IS_SENTRY_ENABLED,
};
