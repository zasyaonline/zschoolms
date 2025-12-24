import * as analyticsService from '../services/analytics.service.js';
import logger from '../utils/logger.js';

/**
 * Analytics Controller
 * HTTP handlers for analytics endpoints
 */

/**
 * Get student performance analytics
 * GET /api/analytics/student-performance
 */
export const getStudentPerformance = async (req, res) => {
  try {
    const filters = {
      studentId: req.query.studentId,
      academicYearId: req.query.academicYearId,
      schoolId: req.query.schoolId,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => 
      filters[key] === undefined && delete filters[key]
    );

    // Authorization: Students can only view their own analytics
    if (req.user.role === 'student') {
      if (filters.studentId && filters.studentId !== req.user.studentId) {
        return res.status(403).json({
          success: false,
          error: 'You can only view your own performance analytics'
        });
      }
      filters.studentId = req.user.studentId;
    }

    const analytics = await analyticsService.getStudentPerformanceAnalytics(filters);

    return res.status(200).json({
      success: true,
      message: 'Student performance analytics retrieved successfully',
      data: analytics
    });

  } catch (error) {
    logger.error('Error in getStudentPerformance controller:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve student performance analytics'
    });
  }
};

/**
 * Get school dashboard analytics
 * GET /api/analytics/school-dashboard
 */
export const getSchoolDashboard = async (req, res) => {
  try {
    const filters = {
      schoolId: req.query.schoolId,
      academicYearId: req.query.academicYearId,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => 
      filters[key] === undefined && delete filters[key]
    );

    // Authorization: Only admin, super_admin, and principal can view school-wide analytics
    if (!['admin', 'super_admin', 'principal'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view school-wide analytics'
      });
    }

    const analytics = await analyticsService.getSchoolDashboardAnalytics(filters);

    return res.status(200).json({
      success: true,
      message: 'School dashboard analytics retrieved successfully',
      data: analytics
    });

  } catch (error) {
    logger.error('Error in getSchoolDashboard controller:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve school dashboard analytics'
    });
  }
};

export default {
  getStudentPerformance,
  getSchoolDashboard
};
