/**
 * Marks Service
 * API calls for marks and grading management
 */
import { get, post } from './api';

/**
 * Enter or update marks for a marksheet
 * @param {Object} marksData - Marks data
 * @returns {Promise} API response
 */
export const enterMarks = (marksData) => {
  return post('/marks/entry', marksData);
};

/**
 * Get pending marksheets for approval
 * @param {Object} params - Query parameters
 * @returns {Promise} API response
 */
export const getPendingMarksheets = (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return get(`/marks/pending${queryString ? `?${queryString}` : ''}`);
};

/**
 * Get marksheets by filters
 * @param {Object} params - Query parameters
 * @param {string} params.academicYearId - Academic year ID
 * @param {string} params.subjectId - Subject ID
 * @param {string} params.schoolId - School ID
 * @param {string} params.status - Status filter (Draft, submitted, approved, rejected)
 * @param {string} params.enrollmentId - Enrollment ID
 * @param {number} params.page - Page number
 * @param {number} params.limit - Records per page
 * @returns {Promise} API response
 */
export const getMarksheets = (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return get(`/marks/marksheets${queryString ? `?${queryString}` : ''}`);
};

/**
 * Get marksheet by ID
 * @param {string} id - Marksheet UUID
 * @returns {Promise} API response
 */
export const getMarksheetById = (id) => {
  return get(`/marks/marksheets/${id}`);
};

/**
 * Submit marksheet for approval
 * @param {string} id - Marksheet UUID
 * @returns {Promise} API response
 */
export const submitMarksheet = (id) => {
  return post(`/marks/marksheets/${id}/submit`);
};

/**
 * Approve marksheet (Principal/Admin only)
 * @param {string} marksheetId - Marksheet UUID
 * @returns {Promise} API response
 */
export const approveMarksheet = (marksheetId) => {
  return post(`/marks/approve/${marksheetId}`);
};

/**
 * Reject marksheet with reason (Principal/Admin only)
 * @param {string} marksheetId - Marksheet UUID
 * @param {string} reason - Rejection reason
 * @returns {Promise} API response
 */
export const rejectMarksheet = (marksheetId, reason) => {
  return post(`/marks/reject/${marksheetId}`, { reason });
};

/**
 * Get student marks history
 * @param {string} studentId - Student UUID
 * @param {Object} params - Query parameters
 * @returns {Promise} API response
 */
export const getStudentMarks = (studentId, params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return get(`/marks/student/${studentId}${queryString ? `?${queryString}` : ''}`);
};

export default {
  enterMarks,
  getPendingMarksheets,
  getMarksheets,
  getMarksheetById,
  submitMarksheet,
  approveMarksheet,
  rejectMarksheet,
  getStudentMarks,
};
