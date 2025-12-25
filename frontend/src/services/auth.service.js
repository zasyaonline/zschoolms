/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

import { post } from './api';

/**
 * Login user
 * @param {string} emailOrUsername - User's email or username
 * @param {string} password - User's password
 * @returns {Promise} Login response with tokens and user data
 */
export const login = async (emailOrUsername, password) => {
  try {
    const response = await post('/auth/login', {
      emailOrUsername,
      password,
    });
    
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Logout user
 * @returns {Promise} Logout response
 */
export const logout = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    const response = await post('/auth/logout', { refreshToken });
    
    // Clear local storage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
    
    return response;
  } catch (error) {
    // Clear local storage even if API call fails
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
    throw error;
  }
};

/**
 * Request password reset
 * @param {string} email - User's email
 * @returns {Promise} Password reset response
 */
export const forgotPassword = async (email) => {
  try {
    const response = await post('/auth/forgot-password', { email });
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Reset password with token
 * @param {string} token - Reset token from email
 * @param {string} newPassword - New password
 * @returns {Promise} Reset password response
 */
export const resetPassword = async (token, newPassword) => {
  try {
    const response = await post('/auth/reset-password', {
      token,
      newPassword,
    });
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Refresh access token
 * @returns {Promise} New access token
 */
export const refreshToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    const response = await post('/auth/refresh-token', { refreshToken });
    
    if (response.success && response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
    }
    
    return response;
  } catch (error) {
    // If refresh fails, clear tokens and redirect to login
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw error;
  }
};

/**
 * Verify MFA code
 * @param {string} code - MFA verification code
 * @returns {Promise} MFA verification response
 */
export const verifyMfa = async (code) => {
  try {
    const tempToken = localStorage.getItem('tempToken');
    const response = await post('/auth/verify-mfa', {
      tempToken,
      code,
    });
    
    if (response.success) {
      localStorage.removeItem('tempToken');
    }
    
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Get current user profile
 * @returns {Promise} User profile data
 */
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

/**
 * Check if user is authenticated
 * @returns {boolean} Authentication status
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('accessToken');
};

export default {
  login,
  logout,
  forgotPassword,
  resetPassword,
  refreshToken,
  verifyMfa,
  getCurrentUser,
  isAuthenticated,
};
