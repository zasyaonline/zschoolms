import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/global.css'
import App from './App.jsx'

// Initialize Sentry for error tracking and performance monitoring
import { initSentry, SentryErrorBoundary } from './config/sentry.js'
initSentry()

// Error fallback component for Sentry Error Boundary
const ErrorFallback = ({ error, resetError }) => (
  <div style={{ 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center', 
    minHeight: '100vh',
    padding: '20px',
    textAlign: 'center'
  }}>
    <h1 style={{ color: '#dc2626', marginBottom: '16px' }}>Something went wrong</h1>
    <p style={{ color: '#666', marginBottom: '24px', maxWidth: '500px' }}>
      We apologize for the inconvenience. The error has been reported and we'll look into it.
    </p>
    <button 
      onClick={resetError}
      style={{
        padding: '12px 24px',
        backgroundColor: '#1F55A6',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '16px'
      }}
    >
      Try Again
    </button>
    {import.meta.env.DEV && (
      <pre style={{ 
        marginTop: '24px', 
        padding: '16px', 
        backgroundColor: '#f3f4f6', 
        borderRadius: '8px',
        textAlign: 'left',
        overflow: 'auto',
        maxWidth: '100%',
        fontSize: '12px'
      }}>
        {error.toString()}
      </pre>
    )}
  </div>
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SentryErrorBoundary fallback={ErrorFallback} showDialog>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </SentryErrorBoundary>
  </StrictMode>,
)
