/**
 * Attendance Service
 * API calls for attendance management
 */
import { get, post, del } from './api';

/**
 * Mark attendance for students
 * @param {Array} attendanceData - Array of attendance records
 * @returns {Promise} API response
 */
export const markAttendance = (attendanceData) => {
  return post('/attendance', { attendanceData });
};

/**
 * Get attendance records with filters
 * @param {Object} params - Query parameters
 * @param {string} params.date - Specific date (YYYY-MM-DD)
 * @param {string} params.startDate - Start date for range
 * @param {string} params.endDate - End date for range
 * @param {string} params.studentId - Filter by student ID
 * @param {string} params.class - Filter by class/grade
 * @param {string} params.section - Filter by section
 * @param {string} params.status - Filter by status (present, absent, late, excused)
 * @param {number} params.page - Page number
 * @param {number} params.limit - Records per page
 * @returns {Promise} API response
 */
export const getAttendance = (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return get(`/attendance${queryString ? `?${queryString}` : ''}`);
};

/**
 * Get class attendance for a specific date
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} className - Class/grade
 * @param {string} section - Section (optional)
 * @returns {Promise} API response
 */
export const getClassAttendance = (date, className, section = '') => {
  const params = new URLSearchParams({ class: className });
  if (section) params.append('section', section);
  return get(`/attendance/class/${date}?${params.toString()}`);
};

/**
 * Get student attendance history
 * @param {string} studentId - Student UUID
 * @param {Object} params - Query parameters
 * @param {string} params.startDate - Start date
 * @param {string} params.endDate - End date
 * @param {number} params.page - Page number
 * @param {number} params.limit - Records per page
 * @returns {Promise} API response
 */
export const getStudentAttendance = (studentId, params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return get(`/attendance/student/${studentId}${queryString ? `?${queryString}` : ''}`);
};

/**
 * Delete attendance record
 * @param {string} id - Attendance record UUID
 * @returns {Promise} API response
 */
export const deleteAttendance = (id) => {
  return del(`/attendance/${id}`);
};

export default {
  markAttendance,
  getAttendance,
  getClassAttendance,
  getStudentAttendance,
  deleteAttendance,
};
