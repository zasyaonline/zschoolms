import PropTypes from 'prop-types';
import './ErrorFallback.css';

const ErrorFallback = ({ error, errorInfo, onReset }) => {
  return (
    <div className="error-fallback" role="alert" aria-live="assertive">
      <div className="error-fallback__container">
        <div className="error-fallback__icon" aria-hidden="true">⚠️</div>
        <h1 className="error-fallback__title">Something went wrong</h1>
        <p className="error-fallback__message">
          We're sorry, but something unexpected happened. Please try refreshing the page or contact support if the problem persists.
        </p>
        
        {error && (
          <details className="error-fallback__details">
            <summary>Error Details</summary>
            <div className="error-fallback__error-info">
              <p><strong>Error:</strong> {error.toString()}</p>
              {errorInfo && (
                <pre className="error-fallback__stack">
                  {errorInfo.componentStack}
                </pre>
              )}
            </div>
          </details>
        )}

        <div className="error-fallback__actions">
          <button
            className="error-fallback__button error-fallback__button--primary"
            onClick={() => window.location.reload()}
            aria-label="Reload page"
          >
            Reload Page
          </button>
          <button
            className="error-fallback__button error-fallback__button--secondary"
            onClick={onReset}
            aria-label="Try again"
          >
            Try Again
          </button>
          <button
            className="error-fallback__button error-fallback__button--secondary"
            onClick={() => window.history.back()}
            aria-label="Go back to previous page"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

ErrorFallback.propTypes = {
  error: PropTypes.object,
  errorInfo: PropTypes.object,
  onReset: PropTypes.func.isRequired
};

ErrorFallback.defaultProps = {
  error: null,
  errorInfo: null
};

export default ErrorFallback;
