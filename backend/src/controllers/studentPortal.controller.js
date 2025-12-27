import * as studentPortalService from '../services/studentPortal.service.js';
import { getSignedUrl } from '../services/s3.service.js';
import logger from '../utils/logger.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * Student Portal Controller
 * Provides read-only access to student's own academic information
 * All endpoints are sandboxed - students can only access their own data
 */

/**
 * Get student dashboard
 */
export const getDashboard = async (req, res) => {
  try {
    // User must be a student - their userId is used to find their profile
    const userId = req.user.id;

    const dashboardData = await studentPortalService.getStudentDashboard(userId);

    return successResponse(res, 'Dashboard retrieved successfully', dashboardData);
  } catch (error) {
    logger.error('Error in getDashboard controller:', error);
    if (error.message === 'Student profile not found') {
      return errorResponse(res, 'Student profile not found. Please contact administrator.', 404);
    }
    return errorResponse(res, error.message || 'Failed to retrieve dashboard', 500);
  }
};

/**
 * Get student's report cards
 */
export const getMyReportCards = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, academicYearId } = req.query;

    const result = await studentPortalService.getStudentReportCards(userId, {
      page,
      limit,
      academicYearId,
    });

    return successResponse(res, 'Report cards retrieved successfully', result);
  } catch (error) {
    logger.error('Error in getMyReportCards controller:', error);
    if (error.message === 'Student profile not found') {
      return errorResponse(res, 'Student profile not found', 404);
    }
    return errorResponse(res, error.message || 'Failed to retrieve report cards', 500);
  }
};

/**
 * Download a specific report card
 */
export const downloadReportCard = async (req, res) => {
  try {
    const userId = req.user.id;
    const { reportCardId } = req.params;

    const reportCard = await studentPortalService.getReportCardForDownload(userId, reportCardId);

    if (!reportCard.s3Key) {
      return errorResponse(res, 'Report card PDF not available', 404);
    }

    // Generate signed URL for download
    const signedUrl = await getSignedUrl(reportCard.s3Key, 3600); // 1 hour expiry

    return successResponse(res, 'Download URL generated', {
      downloadUrl: signedUrl,
      filename: reportCard.filename,
      examType: reportCard.examType,
      term: reportCard.term,
      academicYear: reportCard.academicYear,
    });
  } catch (error) {
    logger.error('Error in downloadReportCard controller:', error);
    if (error.message.includes('not found') || error.message.includes('not available')) {
      return errorResponse(res, error.message, 404);
    }
    return errorResponse(res, error.message || 'Failed to generate download link', 500);
  }
};

/**
 * Get student's attendance
 */
export const getMyAttendance = async (req, res) => {
  try {
    const userId = req.user.id;
    const { month, year, startDate, endDate, page = 1, limit = 31 } = req.query;

    const result = await studentPortalService.getStudentAttendance(userId, {
      month: month ? parseInt(month) : undefined,
      year: year ? parseInt(year) : undefined,
      startDate,
      endDate,
      page,
      limit,
    });

    return successResponse(res, 'Attendance retrieved successfully', result);
  } catch (error) {
    logger.error('Error in getMyAttendance controller:', error);
    if (error.message === 'Student profile not found') {
      return errorResponse(res, 'Student profile not found', 404);
    }
    return errorResponse(res, error.message || 'Failed to retrieve attendance', 500);
  }
};

/**
 * Get student's profile (read-only)
 */
export const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const profile = await studentPortalService.getStudentProfile(userId);

    return successResponse(res, 'Profile retrieved successfully', profile);
  } catch (error) {
    logger.error('Error in getMyProfile controller:', error);
    if (error.message === 'Student profile not found') {
      return errorResponse(res, 'Student profile not found', 404);
    }
    return errorResponse(res, error.message || 'Failed to retrieve profile', 500);
  }
};

// All functions are exported via 'export const' declarations above
