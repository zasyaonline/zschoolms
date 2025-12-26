/**
 * Student Service
 * API calls for student management
 */
import { get, post, put, del } from './api';

/**
 * Get all students with filters
 * @param {Object} params - Query parameters
 * @param {string} params.class - Filter by class/grade
 * @param {string} params.section - Filter by section
 * @param {string} params.status - Filter by status
 * @param {string} params.search - Search term
 * @param {number} params.page - Page number
 * @param {number} params.limit - Records per page
 * @returns {Promise} API response
 */
export const getStudents = (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return get(`/students${queryString ? `?${queryString}` : ''}`);
};

/**
 * Get student by ID
 * @param {string} id - Student UUID
 * @returns {Promise} API response
 */
export const getStudentById = (id) => {
  return get(`/students/${id}`);
};

/**
 * Get current logged-in student's profile
 * @returns {Promise} API response
 */
export const getMyProfile = () => {
  return get('/students/me');
};

/**
 * Get student by enrollment number
 * @param {string} enrollmentNumber - Enrollment number
 * @returns {Promise} API response
 */
export const getStudentByEnrollment = (enrollmentNumber) => {
  return get(`/students/enrollment/${enrollmentNumber}`);
};

/**
 * Create new student
 * @param {Object} studentData - Student data
 * @returns {Promise} API response
 */
export const createStudent = (studentData) => {
  return post('/students', studentData);
};

/**
 * Update student
 * @param {string} id - Student UUID
 * @param {Object} studentData - Updated student data
 * @returns {Promise} API response
 */
export const updateStudent = (id, studentData) => {
  return put(`/students/${id}`, studentData);
};

/**
 * Delete student
 * @param {string} id - Student UUID
 * @returns {Promise} API response
 */
export const deleteStudent = (id) => {
  return del(`/students/${id}`);
};

/**
 * Get student statistics
 * @returns {Promise} API response
 */
export const getStudentStats = () => {
  return get('/students/stats');
};

/**
 * Map parent to student
 * @param {string} studentId - Student UUID
 * @param {string} parentId - Parent UUID
 * @returns {Promise} API response
 */
export const mapParent = (studentId, parentId) => {
  return post(`/students/${studentId}/parent`, { parentId });
};

/**
 * Map sponsor to student
 * @param {string} studentId - Student UUID
 * @param {string} sponsorId - Sponsor UUID
 * @returns {Promise} API response
 */
export const mapSponsor = (studentId, sponsorId) => {
  return post(`/students/${studentId}/sponsor`, { sponsorId });
};

export default {
  getStudents,
  getStudentById,
  getMyProfile,
  getStudentByEnrollment,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentStats,
  mapParent,
  mapSponsor,
};
