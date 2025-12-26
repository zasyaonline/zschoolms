/**
 * School Service
 * API calls for school information management
 */
import { get, post, put, del } from './api';

/**
 * Get all schools
 * @param {Object} params - Query parameters
 * @param {string} params.search - Search term
 * @param {number} params.page - Page number
 * @param {number} params.limit - Records per page
 * @returns {Promise} API response
 */
export const getSchools = (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return get(`/schools${queryString ? `?${queryString}` : ''}`);
};

/**
 * Get school by ID
 * @param {string} id - School UUID
 * @returns {Promise} API response
 */
export const getSchoolById = (id) => {
  return get(`/schools/${id}`);
};

/**
 * Create new school
 * @param {Object} schoolData - School data
 * @param {string} schoolData.name - School name
 * @param {string} schoolData.address - School address
 * @param {string} schoolData.contactInfo - Contact information
 * @param {string} schoolData.academicYear - Academic year
 * @returns {Promise} API response
 */
export const createSchool = (schoolData) => {
  return post('/schools', schoolData);
};

/**
 * Update school
 * @param {string} id - School UUID
 * @param {Object} schoolData - Updated school data
 * @returns {Promise} API response
 */
export const updateSchool = (id, schoolData) => {
  return put(`/schools/${id}`, schoolData);
};

/**
 * Delete school
 * @param {string} id - School UUID
 * @returns {Promise} API response
 */
export const deleteSchool = (id) => {
  return del(`/schools/${id}`);
};

export default {
  getSchools,
  getSchoolById,
  createSchool,
  updateSchool,
  deleteSchool,
};
