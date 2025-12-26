/**
 * Report Card Service
 * API calls for report card management
 */
import { get, post } from './api';

/**
 * Generate report card for a student
 * @param {Object} data - Report card data
 * @param {string} data.studentId - Student UUID
 * @param {string} data.academicYearId - Academic Year UUID
 * @returns {Promise} API response
 */
export const generateReportCard = (data) => {
  return post('/report-cards/generate', data);
};

/**
 * Bulk generate report cards
 * @param {Object} data - Bulk generation data
 * @param {Array} data.studentIds - Array of student UUIDs
 * @param {string} data.academicYearId - Academic Year UUID
 * @returns {Promise} API response
 */
export const bulkGenerateReportCards = (data) => {
  return post('/report-cards/bulk-generate', data);
};

/**
 * Sign report card (Principal/Admin only)
 * @param {string} id - Report card UUID
 * @returns {Promise} API response
 */
export const signReportCard = (id) => {
  return post(`/report-cards/${id}/sign`);
};

/**
 * Distribute report card via email
 * @param {string} id - Report card UUID
 * @param {Object} data - Distribution data
 * @param {Array} data.recipientEmails - Array of email addresses
 * @param {Array} data.recipientTypes - Array of recipient types
 * @returns {Promise} API response
 */
export const distributeReportCard = (id, data) => {
  return post(`/report-cards/${id}/distribute`, data);
};

/**
 * Get all report cards for a student
 * @param {string} studentId - Student UUID
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 * @param {string} params.academicYearId - Filter by academic year
 * @param {string} params.status - Filter by status
 * @returns {Promise} API response
 */
export const getStudentReportCards = (studentId, params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return get(`/report-cards/student/${studentId}${queryString ? `?${queryString}` : ''}`);
};

/**
 * Get all report cards with filters
 * @param {Object} params - Query parameters
 * @param {string} params.status - Filter by status (Draft, Generated, Signed, Distributed)
 * @param {string} params.academicYearId - Filter by academic year
 * @param {string} params.schoolId - Filter by school
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 * @returns {Promise} API response
 */
export const getReportCards = (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return get(`/report-cards${queryString ? `?${queryString}` : ''}`);
};

/**
 * Get report card by ID
 * @param {string} id - Report card UUID
 * @returns {Promise} API response
 */
export const getReportCardById = (id) => {
  return get(`/report-cards/${id}`);
};

/**
 * Download report card PDF
 * @param {string} id - Report card UUID
 * @returns {Promise} API response with PDF URL
 */
export const downloadReportCard = (id) => {
  return get(`/report-cards/${id}/download`);
};

export default {
  generateReportCard,
  bulkGenerateReportCards,
  signReportCard,
  distributeReportCard,
  getStudentReportCards,
  getReportCards,
  getReportCardById,
  downloadReportCard,
};
