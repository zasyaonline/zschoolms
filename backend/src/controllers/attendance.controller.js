import * as attendanceService from '../services/attendance.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../utils/logger.js';

/**
 * Mark attendance for students
 * POST /api/attendance
 */
export const markAttendance = async (req, res) => {
  try {
    const { attendanceData } = req.body;
    const markedBy = req.user.id;

    // Validate input
    if (!attendanceData || !Array.isArray(attendanceData) || attendanceData.length === 0) {
      return errorResponse(res, 'attendanceData array is required', 400);
    }

    // Validate each record has required fields
    for (const record of attendanceData) {
      if (!record.studentId || !record.date || !record.class || !record.status) {
        return errorResponse(
          res,
          'Each attendance record must have studentId, date, class, and status',
          400
        );
      }

      // Validate status
      if (!['present', 'absent', 'late', 'excused'].includes(record.status)) {
        return errorResponse(
          res,
          'Status must be one of: present, absent, late, excused',
          400
        );
      }
    }

    const result = await attendanceService.markAttendance(attendanceData, markedBy);

    if (result.failed.length > 0) {
      return res.status(207).json({
        success: true,
        message: 'Attendance marked with some errors',
        data: result,
      });
    }

    return successResponse(res, result, 'Attendance marked successfully', 201);
  } catch (error) {
    logger.error('Mark attendance controller error:', error);
    return errorResponse(res, 'Failed to mark attendance', 500);
  }
};

/**
 * Get attendance records
 * GET /api/attendance
 */
export const getAttendance = async (req, res) => {
  try {
    const filters = {
      date: req.query.date,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      studentId: req.query.studentId,
      class: req.query.class,
      section: req.query.section,
      status: req.query.status,
      page: req.query.page || 1,
      limit: Math.min(parseInt(req.query.limit) || 50, 100),
    };

    const result = await attendanceService.getAttendance(filters);

    return successResponse(res, result, 'Attendance records fetched successfully');
  } catch (error) {
    logger.error('Get attendance controller error:', error);
    return errorResponse(res, 'Failed to fetch attendance records', 500);
  }
};

/**
 * Get class attendance for a specific date
 * GET /api/attendance/class/:date
 */
export const getClassAttendance = async (req, res) => {
  try {
    const { date } = req.params;
    const { class: classValue, section } = req.query;

    if (!classValue) {
      return errorResponse(res, 'class query parameter is required', 400);
    }

    const result = await attendanceService.getClassAttendanceByDate(
      date,
      classValue,
      section
    );

    return successResponse(res, result, 'Class attendance fetched successfully');
  } catch (error) {
    logger.error('Get class attendance controller error:', error);
    return errorResponse(res, 'Failed to fetch class attendance', 500);
  }
};

/**
 * Get student attendance history
 * GET /api/attendance/student/:studentId
 */
export const getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const options = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      page: req.query.page || 1,
      limit: Math.min(parseInt(req.query.limit) || 30, 100),
    };

    const result = await attendanceService.getStudentAttendanceHistory(
      studentId,
      options
    );

    return successResponse(res, result, 'Student attendance history fetched successfully');
  } catch (error) {
    if (error.message === 'Student not found') {
      return errorResponse(res, error.message, 404);
    }
    logger.error('Get student attendance controller error:', error);
    return errorResponse(res, 'Failed to fetch student attendance history', 500);
  }
};

/**
 * Delete attendance record
 * DELETE /api/attendance/:id
 */
export const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedBy = req.user.id;

    await attendanceService.deleteAttendance(id, deletedBy);

    return successResponse(res, null, 'Attendance record deleted successfully');
  } catch (error) {
    if (error.message === 'Attendance record not found') {
      return errorResponse(res, error.message, 404);
    }
    logger.error('Delete attendance controller error:', error);
    return errorResponse(res, 'Failed to delete attendance record', 500);
  }
};
