import * as marksService from '../services/marks.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../utils/logger.js';

/**
 * Marks Controller
 * HTTP handlers for marks/grading endpoints
 */

/**
 * Enter or update marks
 * POST /api/marks/entry
 */
export const enterMarks = async (req, res) => {
  try {
    const userId = req.user.id;
    const marksData = req.body;
    
    // Validation
    if (!marksData.subjectId) {
      return errorResponse(res, 'Subject ID is required', 400);
    }
    
    if (!marksData.schoolId) {
      return errorResponse(res, 'School ID is required', 400);
    }
    
    if (!marksData.academicYearId) {
      return errorResponse(res, 'Academic year ID is required', 400);
    }
    
    const marksheet = await marksService.enterMarks(marksData, userId);
    
    return successResponse(
      res,
      marksheet,
      marksData.marksheetId ? 'Marks updated successfully' : 'Marks entered successfully',
      marksData.marksheetId ? 200 : 201
    );
  } catch (error) {
    logger.error('Error in enterMarks controller:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get pending marksheets for approval
 * GET /api/marks/pending
 */
export const getPendingMarksheets = async (req, res) => {
  try {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: Math.min(parseInt(req.query.limit) || 50, 100),
      academicYearId: req.query.academicYearId,
      subjectId: req.query.subjectId,
      schoolId: req.query.schoolId,
      search: req.query.search
    };
    
    const result = await marksService.getPendingMarksheets(filters);
    
    return successResponse(res, result, 'Pending marksheets retrieved successfully');
  } catch (error) {
    logger.error('Error in getPendingMarksheets controller:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get marksheets by filters
 * GET /api/marks/marksheets
 */
export const getMarksheets = async (req, res) => {
  try {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: Math.min(parseInt(req.query.limit) || 50, 100),
      academicYearId: req.query.academicYearId,
      subjectId: req.query.subjectId,
      schoolId: req.query.schoolId,
      status: req.query.status,
      enrollmentId: req.query.enrollmentId
    };
    
    const result = await marksService.getMarksheets(filters);
    
    return successResponse(res, result, 'Marksheets retrieved successfully');
  } catch (error) {
    logger.error('Error in getMarksheets controller:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get marksheet by ID
 * GET /api/marks/marksheets/:id
 */
export const getMarksheetById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const marksheet = await marksService.getMarksheetById(id);
    
    return successResponse(res, marksheet, 'Marksheet retrieved successfully');
  } catch (error) {
    logger.error('Error in getMarksheetById controller:', error);
    
    if (error.message === 'Marksheet not found') {
      return errorResponse(res, error.message, 404);
    }
    
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Submit marksheet for approval
 * POST /api/marks/marksheets/:id/submit
 */
export const submitMarksheet = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const marksheet = await marksService.submitMarksheet(id, userId);
    
    return successResponse(res, marksheet, 'Marksheet submitted for approval successfully');
  } catch (error) {
    logger.error('Error in submitMarksheet controller:', error);
    
    if (error.message === 'Marksheet not found') {
      return errorResponse(res, error.message, 404);
    }
    
    if (error.message.includes('Cannot submit') || error.message.includes('without any marks')) {
      return errorResponse(res, error.message, 400);
    }
    
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Approve marksheet
 * POST /api/marks/approve/:marksheetId
 */
export const approveMarksheet = async (req, res) => {
  try {
    const { marksheetId } = req.params;
    const reviewerId = req.user.id;
    
    // Verify user has permission (principal/admin/super_admin)
    if (!['principal', 'admin', 'super_admin'].includes(req.user.role)) {
      return errorResponse(res, 'Only principals and administrators can approve marksheets', 403);
    }
    
    // Get IP address for audit logging
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.connection?.remoteAddress;
    
    const marksheet = await marksService.approveMarksheet(marksheetId, reviewerId, { ipAddress });
    
    return successResponse(res, marksheet, 'Marksheet approved successfully');
  } catch (error) {
    logger.error('Error in approveMarksheet controller:', error);
    
    if (error.message === 'Marksheet not found') {
      return errorResponse(res, error.message, 404);
    }
    
    if (error.message.includes('Cannot approve')) {
      return errorResponse(res, error.message, 400);
    }
    
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Reject marksheet
 * POST /api/marks/reject/:marksheetId
 */
export const rejectMarksheet = async (req, res) => {
  try {
    const { marksheetId } = req.params;
    const { reason } = req.body;
    const reviewerId = req.user.id;
    
    // Verify user has permission (principal/admin/super_admin)
    if (!['principal', 'admin', 'super_admin'].includes(req.user.role)) {
      return errorResponse(res, 'Only principals and administrators can reject marksheets', 403);
    }
    
    // Validation
    if (!reason || reason.trim().length === 0) {
      return errorResponse(res, 'Rejection reason is required', 400);
    }
    
    if (reason.trim().length < 10) {
      return errorResponse(res, 'Rejection reason must be at least 10 characters', 400);
    }
    
    // Get IP address for audit logging
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.connection?.remoteAddress;
    
    const marksheet = await marksService.rejectMarksheet(marksheetId, reviewerId, reason, { ipAddress });
    
    return successResponse(res, marksheet, 'Marksheet rejected successfully');
  } catch (error) {
    logger.error('Error in rejectMarksheet controller:', error);
    
    if (error.message === 'Marksheet not found') {
      return errorResponse(res, error.message, 404);
    }
    
    if (error.message.includes('Cannot reject')) {
      return errorResponse(res, error.message, 400);
    }
    
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Delete marksheet
 * DELETE /api/marks/marksheets/:id
 */
export const deleteMarksheet = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    await marksService.deleteMarksheet(id, userId);
    
    return successResponse(res, null, 'Marksheet deleted successfully');
  } catch (error) {
    logger.error('Error in deleteMarksheet controller:', error);
    
    if (error.message === 'Marksheet not found') {
      return errorResponse(res, error.message, 404);
    }
    
    if (error.message.includes('Cannot delete')) {
      return errorResponse(res, error.message, 400);
    }
    
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get subject statistics
 * GET /api/marks/subjects/:subjectId/statistics
 */
export const getSubjectStatistics = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const filters = {
      academicYearId: req.query.academicYearId,
      term: req.query.term
    };
    
    const statistics = await marksService.getSubjectStatistics(subjectId, filters);
    
    return successResponse(res, statistics, 'Subject statistics retrieved successfully');
  } catch (error) {
    logger.error('Error in getSubjectStatistics controller:', error);
    
    if (error.message === 'Subject not found') {
      return errorResponse(res, error.message, 404);
    }
    
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get student's marksheets
 * GET /api/marks/students/:enrollmentId/marksheets
 */
export const getStudentMarksheets = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    
    // If user is a student, verify they can only access their own marksheets
    if (req.user.role === 'student') {
      // TODO: Add validation to ensure enrollmentId belongs to the requesting student
      // This would require joining with student enrollment data
    }
    
    const marksheets = await marksService.getStudentMarksheets(enrollmentId);
    
    return successResponse(res, marksheets, 'Student marksheets retrieved successfully');
  } catch (error) {
    logger.error('Error in getStudentMarksheets controller:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Auto-save draft marks (for periodic auto-save)
 * POST /api/marks/draft
 */
export const autoSaveDraft = async (req, res) => {
  try {
    const userId = req.user.id;
    const draftData = req.body;
    
    // For new drafts, require key fields
    if (!draftData.marksheetId) {
      if (!draftData.subjectId) {
        return errorResponse(res, 'Subject ID is required for new draft', 400);
      }
      if (!draftData.schoolId) {
        return errorResponse(res, 'School ID is required for new draft', 400);
      }
      if (!draftData.academicYearId) {
        return errorResponse(res, 'Academic year ID is required for new draft', 400);
      }
    }
    
    const result = await marksService.autoSaveDraft(draftData, userId);
    
    return successResponse(res, result, 'Draft saved successfully');
  } catch (error) {
    logger.error('Error in autoSaveDraft controller:', error);
    
    // Return specific error for locked marksheets
    if (error.message.includes('locked')) {
      return errorResponse(res, error.message, 403);
    }
    
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Validate marks before submission
 * POST /api/marks/validate
 */
export const validateMarks = async (req, res) => {
  try {
    const validationData = req.body;
    
    const result = await marksService.validateMarks(validationData);
    
    return successResponse(res, result, 'Validation completed');
  } catch (error) {
    logger.error('Error in validateMarks controller:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get detailed marksheet statistics for principal review
 * GET /api/marks/marksheets/:id/statistics
 */
export const getMarksheetStatistics = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return errorResponse(res, 'Marksheet ID is required', 400);
    }
    
    const statistics = await marksService.getMarksheetStatistics(id);
    
    return successResponse(res, statistics, 'Marksheet statistics retrieved');
  } catch (error) {
    logger.error('Error in getMarksheetStatistics controller:', error);
    
    if (error.message.includes('not found')) {
      return errorResponse(res, error.message, 404);
    }
    
    return errorResponse(res, error.message, 500);
  }
};

export default {
  enterMarks,
  getPendingMarksheets,
  getMarksheets,
  getMarksheetById,
  submitMarksheet,
  approveMarksheet,
  rejectMarksheet,
  deleteMarksheet,
  getSubjectStatistics,
  getStudentMarksheets,
  autoSaveDraft,
  validateMarks,
  getMarksheetStatistics
};
