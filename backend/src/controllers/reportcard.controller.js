import * as reportCardService from '../services/reportcard.service.js';
import logger from '../utils/logger.js';

/**
 * Report Card Controller
 * HTTP handlers for report card endpoints
 */

/**
 * Generate report card for a student
 * POST /api/report-cards/generate
 */
export const generateReportCard = async (req, res) => {
  try {
    const { studentId, academicYearId } = req.body;
    const generatedBy = req.user.id;

    // Validation
    if (!studentId || !academicYearId) {
      return res.status(400).json({
        success: false,
        error: 'studentId and academicYearId are required'
      });
    }

    const reportCard = await reportCardService.generateReportCard(
      studentId,
      academicYearId,
      generatedBy
    );

    return res.status(201).json({
      success: true,
      message: 'Report card generated successfully',
      data: reportCard
    });

  } catch (error) {
    logger.error('Error in generateReportCard controller:', error);
    return res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      error: error.message || 'Failed to generate report card'
    });
  }
};

/**
 * Sign report card (principal/admin only)
 * POST /api/report-cards/:id/sign
 */
export const signReportCard = async (req, res) => {
  try {
    const { id } = req.params;
    const principalId = req.user.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Report card ID is required'
      });
    }

    const reportCard = await reportCardService.signReportCard(id, principalId);

    return res.status(200).json({
      success: true,
      message: 'Report card signed successfully',
      data: reportCard
    });

  } catch (error) {
    logger.error('Error in signReportCard controller:', error);
    
    let statusCode = 500;
    if (error.message.includes('not found')) statusCode = 404;
    if (error.message.includes('cannot be signed') || error.message.includes('Only principals')) {
      statusCode = 403;
    }

    return res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to sign report card'
    });
  }
};

/**
 * Distribute report card via email
 * POST /api/report-cards/:id/distribute
 */
export const distributeReportCard = async (req, res) => {
  try {
    const { id } = req.params;
    const { recipientEmails, recipientTypes } = req.body;
    const distributedBy = req.user.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Report card ID is required'
      });
    }

    if (!recipientEmails || !Array.isArray(recipientEmails) || recipientEmails.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'recipientEmails array is required and must contain at least one email'
      });
    }

    // Validate email formats
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = recipientEmails.filter(email => !emailRegex.test(email));
    
    if (invalidEmails.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Invalid email addresses: ${invalidEmails.join(', ')}`
      });
    }

    const result = await reportCardService.distributeReportCard(
      id,
      distributedBy,
      recipientEmails,
      recipientTypes
    );

    return res.status(200).json({
      success: true,
      message: 'Report card distribution initiated',
      data: result
    });

  } catch (error) {
    logger.error('Error in distributeReportCard controller:', error);
    
    let statusCode = 500;
    if (error.message.includes('not found')) statusCode = 404;
    if (error.message.includes('cannot be distributed')) statusCode = 403;

    return res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to distribute report card'
    });
  }
};

/**
 * Get student report cards
 * GET /api/report-cards/student/:studentId
 */
export const getStudentReportCards = async (req, res) => {
  try {
    const { studentId } = req.params;
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      academicYearId: req.query.academicYearId,
      status: req.query.status
    };

    if (!studentId) {
      return res.status(400).json({
        success: false,
        error: 'Student ID is required'
      });
    }

    // Authorization: Students can only view their own report cards
    if (req.user.role === 'student' && req.user.studentId !== studentId) {
      return res.status(403).json({
        success: false,
        error: 'You can only view your own report cards'
      });
    }

    const result = await reportCardService.getStudentReportCards(studentId, filters);

    return res.status(200).json({
      success: true,
      message: 'Report cards retrieved successfully',
      data: result.reportCards,
      pagination: result.pagination
    });

  } catch (error) {
    logger.error('Error in getStudentReportCards controller:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve report cards'
    });
  }
};

/**
 * Get report card by ID
 * GET /api/report-cards/:id
 */
export const getReportCardById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Report card ID is required'
      });
    }

    const reportCard = await reportCardService.getReportCardById(id);

    // Authorization: Students can only view their own report cards
    if (req.user.role === 'student' && req.user.studentId !== reportCard.studentId) {
      return res.status(403).json({
        success: false,
        error: 'You can only view your own report cards'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Report card retrieved successfully',
      data: reportCard
    });

  } catch (error) {
    logger.error('Error in getReportCardById controller:', error);
    return res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      error: error.message || 'Failed to retrieve report card'
    });
  }
};

/**
 * Delete report card (only Draft status)
 * DELETE /api/report-cards/:id
 */
export const deleteReportCard = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Report card ID is required'
      });
    }

    await reportCardService.deleteReportCard(id, userId);

    return res.status(200).json({
      success: true,
      message: 'Report card deleted successfully'
    });

  } catch (error) {
    logger.error('Error in deleteReportCard controller:', error);
    
    let statusCode = 500;
    if (error.message.includes('not found')) statusCode = 404;
    if (error.message.includes('Only draft')) statusCode = 403;

    return res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to delete report card'
    });
  }
};

/**
 * Get all report cards with filters (admin/principal)
 * GET /api/report-cards
 */
export const getAllReportCards = async (req, res) => {
  try {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      academicYearId: req.query.academicYearId,
      schoolId: req.query.schoolId,
      status: req.query.status
    };

    // Use the same service as getStudentReportCards but without studentId filter
    // This would require a new service method, but for now we'll return a simple implementation
    return res.status(200).json({
      success: true,
      message: 'Feature coming soon - use /api/report-cards/student/:studentId instead',
      data: []
    });

  } catch (error) {
    logger.error('Error in getAllReportCards controller:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve report cards'
    });
  }
};

export default {
  generateReportCard,
  signReportCard,
  distributeReportCard,
  getStudentReportCards,
  getReportCardById,
  deleteReportCard,
  getAllReportCards
};
