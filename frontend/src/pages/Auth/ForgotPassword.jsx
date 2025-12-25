import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../../services/auth.service';
import './Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateEmail = () => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateEmail()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      await forgotPassword(email);
      // Always show success for security (don't reveal if email exists)
      setIsSuccess(true);
    } catch (error) {
      console.error('Forgot password error:', error);
      // Show success anyway for security (don't reveal if email exists)
      setIsSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="auth">
        <div className="auth__container">
          {/* Left Side - Branding */}
          <div className="auth__branding">
            <div className="auth__branding-content">
              <div className="auth__logo">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="48" height="48" rx="12" fill="white" fillOpacity="0.2"/>
                  <path d="M24 12L36 18V30L24 36L12 30V18L24 12Z" stroke="white" strokeWidth="2" fill="none"/>
                  <path d="M24 12V36" stroke="white" strokeWidth="2"/>
                  <path d="M12 18L24 24L36 18" stroke="white" strokeWidth="2"/>
                </svg>
              </div>
              <h1 className="auth__brand-title">ZSchool</h1>
              <p className="auth__brand-subtitle">School Management System</p>
            </div>
            <div className="auth__branding-footer">
              <p>© 2025 Zasya Online. All rights reserved.</p>
            </div>
          </div>

          {/* Right Side - Success Message */}
          <div className="auth__form-container">
            <div className="auth__form-wrapper">
              <div className="auth__success-icon">
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                  <circle cx="40" cy="40" r="38" stroke="#22C55E" strokeWidth="4"/>
                  <path d="M25 40L35 50L55 30" stroke="#22C55E" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="auth__form-title auth__form-title--center">Check Your Email</h2>
              <p className="auth__form-subtitle auth__form-subtitle--center">
                We've sent password reset instructions to <strong>{email}</strong>. 
                Please check your inbox and follow the link to reset your password.
              </p>
              <div className="auth__success-info">
                <p>Didn't receive the email?</p>
                <ul>
                  <li>Check your spam or junk folder</li>
                  <li>Verify you entered the correct email</li>
                  <li>Wait a few minutes and try again</li>
                </ul>
              </div>
              <button
                type="button"
                className="auth__submit-btn auth__submit-btn--secondary"
                onClick={() => setIsSuccess(false)}
              >
                Try Another Email
              </button>
              <Link to="/login" className="auth__back-link">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth">
      <div className="auth__container">
        {/* Left Side - Branding */}
        <div className="auth__branding">
          <div className="auth__branding-content">
            <div className="auth__logo">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="48" height="48" rx="12" fill="white" fillOpacity="0.2"/>
                <path d="M24 12L36 18V30L24 36L12 30V18L24 12Z" stroke="white" strokeWidth="2" fill="none"/>
                <path d="M24 12V36" stroke="white" strokeWidth="2"/>
                <path d="M12 18L24 24L36 18" stroke="white" strokeWidth="2"/>
              </svg>
            </div>
            <h1 className="auth__brand-title">ZSchool</h1>
            <p className="auth__brand-subtitle">School Management System</p>
            <div className="auth__brand-features">
              <div className="auth__feature">
                <span className="auth__feature-icon">✓</span>
                <span>Secure Password Recovery</span>
              </div>
              <div className="auth__feature">
                <span className="auth__feature-icon">✓</span>
                <span>Email Verification</span>
              </div>
              <div className="auth__feature">
                <span className="auth__feature-icon">✓</span>
                <span>24/7 Support Available</span>
              </div>
            </div>
          </div>
          <div className="auth__branding-footer">
            <p>© 2025 Zasya Online. All rights reserved.</p>
          </div>
        </div>

        {/* Right Side - Forgot Password Form */}
        <div className="auth__form-container">
          <div className="auth__form-wrapper">
            <Link to="/login" className="auth__back-link auth__back-link--top">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back to Sign In
            </Link>

            <div className="auth__form-header">
              <div className="auth__form-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <rect width="48" height="48" rx="12" fill="#EFF6FF"/>
                  <path d="M16 20L24 26L32 20" stroke="#1F55A6" strokeWidth="2" strokeLinecap="round"/>
                  <rect x="14" y="18" width="20" height="14" rx="2" stroke="#1F55A6" strokeWidth="2"/>
                </svg>
              </div>
              <h2 className="auth__form-title">Forgot Password?</h2>
              <p className="auth__form-subtitle">
                No worries! Enter your email address and we'll send you instructions to reset your password.
              </p>
            </div>

            <form className="auth__form" onSubmit={handleSubmit}>
              <div className="auth__field">
                <label className="auth__label" htmlFor="email">
                  Email Address
                </label>
                <div className={`auth__input-wrapper ${error ? 'auth__input-wrapper--error' : ''}`}>
                  <svg className="auth__input-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M3 5L10 11L17 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="auth__input"
                    placeholder="Enter your registered email"
                    value={email}
                    onChange={handleChange}
                    autoComplete="email"
                    autoFocus
                  />
                </div>
                {error && <span className="auth__error">{error}</span>}
              </div>

              <button
                type="submit"
                className="auth__submit-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="auth__spinner"></span>
                    Sending...
                  </>
                ) : (
                  'Send Reset Instructions'
                )}
              </button>
            </form>

            <p className="auth__footer-text">
              Remember your password? <Link to="/login">Sign in here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
