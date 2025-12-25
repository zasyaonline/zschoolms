/**
 * API Service Configuration
 * Centralized API configuration with interceptors for auth and error handling
 */

// API Base URL - uses environment variable or defaults to localhost
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

/**
 * Create headers for API requests
 * @returns {Object} Headers object with Content-Type and Authorization
 */
const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };

  const token = localStorage.getItem('accessToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Handle API responses
 * @param {Response} response - Fetch API response
 * @returns {Promise} Parsed JSON response
 */
const handleResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    // Handle specific error codes
    if (response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    throw new Error(data.message || data.error?.message || 'An error occurred');
  }
  
  return data;
};

/**
 * Handle API errors
 * @param {Error} error - Error object
 * @returns {Object} Error response object
 */
const handleError = (error) => {
  console.error('API Error:', error);
  
  if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
    return {
      success: false,
      message: 'Unable to connect to server. Please try again later.',
      error: error
    };
  }
  
  return {
    success: false,
    message: error.message || 'An unexpected error occurred',
    error: error
  };
};

/**
 * Make API request
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {Object} options - Fetch options
 * @returns {Promise} API response
 */
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  };

  try {
    console.log(`[API] ${config.method || 'GET'} ${url}`);
    const response = await fetch(url, config);
    return await handleResponse(response);
  } catch (error) {
    throw handleError(error);
  }
};

/**
 * GET request
 * @param {string} endpoint - API endpoint
 * @returns {Promise} API response
 */
export const get = (endpoint) => {
  return apiRequest(endpoint, {
    method: 'GET',
  });
};

/**
 * POST request
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request body data
 * @returns {Promise} API response
 */
export const post = (endpoint, data) => {
  return apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * PUT request
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request body data
 * @returns {Promise} API response
 */
export const put = (endpoint, data) => {
  return apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * PATCH request
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request body data
 * @returns {Promise} API response
 */
export const patch = (endpoint, data) => {
  return apiRequest(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

/**
 * DELETE request
 * @param {string} endpoint - API endpoint
 * @returns {Promise} API response
 */
export const del = (endpoint) => {
  return apiRequest(endpoint, {
    method: 'DELETE',
  });
};

// Export default object with all methods
export default {
  get,
  post,
  put,
  patch,
  delete: del,
  apiRequest,
};
