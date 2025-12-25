import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../../services/auth.service';
import './Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState('');

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setApiError('');
    
    try {
      const data = await login(formData.email, formData.password);
      
      if (data.success) {
        // Store tokens
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        
        if (formData.rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        }
        
        // Check if MFA is required
        if (data.data.requireMfa) {
          localStorage.setItem('tempToken', data.data.tempToken);
          navigate('/mfa-verify');
        } else {
          navigate('/users');
        }
      } else {
        setApiError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setApiError(error.message || 'Unable to connect to server. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

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
                <span>Manage Students & Staff</span>
              </div>
              <div className="auth__feature">
                <span className="auth__feature-icon">✓</span>
                <span>Track Attendance & Grades</span>
              </div>
              <div className="auth__feature">
                <span className="auth__feature-icon">✓</span>
                <span>Generate Report Cards</span>
              </div>
              <div className="auth__feature">
                <span className="auth__feature-icon">✓</span>
                <span>Analytics Dashboard</span>
              </div>
            </div>
          </div>
          <div className="auth__branding-footer">
            <p>© 2025 Zasya Online. All rights reserved.</p>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="auth__form-container">
          <div className="auth__form-wrapper">
            <div className="auth__form-header">
              <h2 className="auth__form-title">Welcome Back</h2>
              <p className="auth__form-subtitle">Sign in to continue to your dashboard</p>
            </div>

            {apiError && (
              <div className="auth__alert auth__alert--error">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2"/>
                  <path d="M10 6V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="10" cy="14" r="1" fill="currentColor"/>
                </svg>
                <span>{apiError}</span>
              </div>
            )}

            <form className="auth__form" onSubmit={handleSubmit}>
              <div className="auth__field">
                <label className="auth__label" htmlFor="email">
                  Email Address
                </label>
                <div className={`auth__input-wrapper ${errors.email ? 'auth__input-wrapper--error' : ''}`}>
                  <svg className="auth__input-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M3 5L10 11L17 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="auth__input"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                  />
                </div>
                {errors.email && <span className="auth__error">{errors.email}</span>}
              </div>

              <div className="auth__field">
                <label className="auth__label" htmlFor="password">
                  Password
                </label>
                <div className={`auth__input-wrapper ${errors.password ? 'auth__input-wrapper--error' : ''}`}>
                  <svg className="auth__input-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect x="4" y="8" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M7 8V6C7 4.34315 8.34315 3 10 3C11.6569 3 13 4.34315 13 6V8" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    className="auth__input"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="auth__password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M3 10C3 10 5.5 5 10 5C14.5 5 17 10 17 10C17 10 14.5 15 10 15C5.5 15 3 10 3 10Z" stroke="currentColor" strokeWidth="1.5"/>
                        <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M3 17L17 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M3 10C3 10 5.5 5 10 5C14.5 5 17 10 17 10C17 10 14.5 15 10 15C5.5 15 3 10 3 10Z" stroke="currentColor" strokeWidth="1.5"/>
                        <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && <span className="auth__error">{errors.password}</span>}
              </div>

              <div className="auth__options">
                <label className="auth__checkbox-label">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className="auth__checkbox"
                  />
                  <span className="auth__checkbox-custom"></span>
                  <span>Remember me</span>
                </label>
                <Link to="/forgot-password" className="auth__link">
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                className="auth__submit-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="auth__spinner"></span>
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="auth__divider">
              <span>or continue with</span>
            </div>

            <div className="auth__social-buttons">
              <button type="button" className="auth__social-btn" disabled>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M18.1713 8.36788H17.5V8.33329H10V11.6666H14.7096C14.0225 13.607 12.1763 15 10 15C7.23875 15 5 12.7612 5 9.99996C5 7.23871 7.23875 4.99996 10 4.99996C11.2746 4.99996 12.4342 5.48079 13.3171 6.26621L15.6742 3.90913C14.1858 2.52204 12.195 1.66663 10 1.66663C5.39792 1.66663 1.66667 5.39788 1.66667 9.99996C1.66667 14.602 5.39792 18.3333 10 18.3333C14.6021 18.3333 18.3333 14.602 18.3333 9.99996C18.3333 9.44121 18.2758 8.89579 18.1713 8.36788Z" fill="#FFC107"/>
                  <path d="M2.62744 6.12121L5.36536 8.12913C6.10619 6.29496 7.90036 4.99996 9.99994 4.99996C11.2745 4.99996 12.4341 5.48079 13.317 6.26621L15.6741 3.90913C14.1858 2.52204 12.1949 1.66663 9.99994 1.66663C6.79911 1.66663 4.02327 3.47371 2.62744 6.12121Z" fill="#FF3D00"/>
                  <path d="M10 18.3333C12.1525 18.3333 14.1083 17.5095 15.5871 16.17L13.008 13.9875C12.1431 14.6451 11.0864 15.0009 10 15C7.83249 15 5.99207 13.6179 5.29874 11.6891L2.58124 13.7829C3.96041 16.4816 6.76124 18.3333 10 18.3333Z" fill="#4CAF50"/>
                  <path d="M18.1713 8.36796H17.5V8.33337H10V11.6667H14.7096C14.3809 12.5902 13.7889 13.3972 13.0067 13.988L13.008 13.9871L15.587 16.1696C15.4046 16.3355 18.3333 14.1667 18.3333 10C18.3333 9.44129 18.2758 8.89587 18.1713 8.36796Z" fill="#1976D2"/>
                </svg>
                <span>Google</span>
              </button>
              <button type="button" className="auth__social-btn" disabled>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M15.545 6.558a5.037 5.037 0 0 1 1.455 3.608c0 5.032-3.648 6.148-7.118 6.463.553.463 1.055 1.39 1.055 2.798V20a.75.75 0 0 0 1.5 0v-.7c4.066-.52 7.188-4.058 7.188-8.3 0-2.304-.938-4.391-2.45-5.898l-.63.456zM10 .375C4.685.375.375 4.685.375 10S4.685 19.625 10 19.625c.39 0 .777-.023 1.159-.068a.75.75 0 0 0-.164-1.491A8.251 8.251 0 0 1 1.875 10 8.125 8.125 0 0 1 10 1.875a8.125 8.125 0 0 1 5.545 14.058v-.933c0-1.075-.37-2.064-.994-2.838.632-.292 1.198-.714 1.673-1.261a5.508 5.508 0 0 0 1.369-3.666A5.507 5.507 0 0 0 15.9 3.776 5.492 5.492 0 0 0 12.188 2.5c-1.524 0-2.907.617-3.909 1.613A5.496 5.496 0 0 0 6.688 8.25c0 1.438.553 2.747 1.457 3.732-.623.773-.992 1.76-.992 2.833V20a.75.75 0 0 0 1.5 0v-5.185c0-1.088.628-2.03 1.538-2.501a5.5 5.5 0 0 0 3.747 1.461h.062c.39 0 .75-.306.75-.75s-.312-.75-.703-.75h-.109a4.006 4.006 0 0 1-4-4c0-2.206 1.794-4 4-4s4 1.794 4 4c0 1.25-.58 2.363-1.482 3.104a.75.75 0 0 0 .945 1.166A5.47 5.47 0 0 0 17.687 8.25a5.507 5.507 0 0 0-5.5-5.5c-1.524 0-2.906.616-3.909 1.612A5.495 5.495 0 0 0 6.688 8.25c0 1.438.552 2.746 1.456 3.731-.622.773-.992 1.76-.992 2.833V20" fill="#333"/>
                </svg>
                <span>GitHub</span>
              </button>
            </div>

            <p className="auth__footer-text">
              Need help? Contact <a href="mailto:support@zasyaonline.com">support@zasyaonline.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
