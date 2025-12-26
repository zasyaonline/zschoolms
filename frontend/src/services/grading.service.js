/**
 * Grading Service
 * API calls for grading scheme management
 */
import { get, post, put, del } from './api';

/**
 * Get all grading schemes
 * @param {Object} params - Query parameters
 * @returns {Promise} API response
 */
export const getGradingSchemes = (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return get(`/grading-schemes${queryString ? `?${queryString}` : ''}`);
};

/**
 * Get grading scheme by ID
 * @param {string} id - Grading scheme UUID
 * @returns {Promise} API response
 */
export const getGradingSchemeById = (id) => {
  return get(`/grading-schemes/${id}`);
};

/**
 * Create new grading scheme
 * @param {Object} schemeData - Grading scheme data
 * @param {string} schemeData.grade - Grade name (e.g., 'A+', 'A', 'B+')
 * @param {number} schemeData.minValue - Minimum percentage value
 * @param {number} schemeData.maxValue - Maximum percentage value
 * @param {number} schemeData.passingMarks - Passing marks threshold
 * @returns {Promise} API response
 */
export const createGradingScheme = (schemeData) => {
  return post('/grading-schemes', schemeData);
};

/**
 * Update grading scheme
 * @param {string} id - Grading scheme UUID
 * @param {Object} schemeData - Updated grading scheme data
 * @returns {Promise} API response
 */
export const updateGradingScheme = (id, schemeData) => {
  return put(`/grading-schemes/${id}`, schemeData);
};

/**
 * Delete grading scheme
 * @param {string} id - Grading scheme UUID
 * @returns {Promise} API response
 */
export const deleteGradingScheme = (id) => {
  return del(`/grading-schemes/${id}`);
};

export default {
  getGradingSchemes,
  getGradingSchemeById,
  createGradingScheme,
  updateGradingScheme,
  deleteGradingScheme,
};
