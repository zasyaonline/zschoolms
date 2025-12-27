import sponsorService from '../services/sponsor.service.js';
import logger from '../utils/logger.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * Create new sponsor
 */
export const createSponsor = async (req, res) => {
  try {
    const {
      name,
      email,
      phoneNumber,
      country,
      organization,
      sponsorshipType,
      status,
      notes,
      address,
      city,
      state,
      postalCode,
      sendWelcomeEmail,
    } = req.body;

    // Validation
    if (!name || !email) {
      return errorResponse(res, 'Name and email are required', 400);
    }

    const sponsorData = {
      name,
      email,
      phoneNumber,
      country,
      organization,
      sponsorshipType: sponsorshipType || 'individual',
      status: status || 'active',
      notes,
      address,
      city,
      state,
      postalCode,
    };

    const options = {
      sendWelcomeEmail: sendWelcomeEmail !== false, // Default to true
    };

    const result = await sponsorService.createSponsor(sponsorData, req.user.id, options);

    return successResponse(res, 'Sponsor created successfully', {
      sponsor: result.sponsor,
      emailSent: result.emailSent,
    }, 201);
  } catch (error) {
    logger.error('Error in createSponsor controller:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return errorResponse(res, 'Email already exists', 409);
    }
    return errorResponse(res, error.message || 'Failed to create sponsor', 500);
  }
};

/**
 * Get all sponsors
 */
export const getSponsors = async (req, res) => {
  try {
    const { page, limit, status, country, sponsorshipType, isActive, search } = req.query;

    // Validate limit
    const parsedLimit = parseInt(limit) || 10;
    if (parsedLimit > 100) {
      return errorResponse(res, 'Limit cannot exceed 100', 400);
    }

    const options = {
      page: parseInt(page) || 1,
      limit: parsedLimit,
      status,
      country,
      sponsorshipType,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      search,
    };

    const result = await sponsorService.getSponsors(options);

    return successResponse(res, 'Sponsors retrieved successfully', result);
  } catch (error) {
    logger.error('Error in getSponsors controller:', error);
    return errorResponse(res, error.message || 'Failed to retrieve sponsors', 500);
  }
};

/**
 * Get sponsor by ID
 */
export const getSponsorById = async (req, res) => {
  try {
    const { id } = req.params;

    const sponsor = await sponsorService.getSponsorById(id);

    return successResponse(res, 'Sponsor retrieved successfully', sponsor);
  } catch (error) {
    logger.error('Error in getSponsorById controller:', error);
    if (error.message === 'Sponsor not found') {
      return errorResponse(res, 'Sponsor not found', 404);
    }
    return errorResponse(res, error.message || 'Failed to retrieve sponsor', 500);
  }
};

/**
 * Update sponsor
 */
export const updateSponsor = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const sponsor = await sponsorService.updateSponsor(id, updates, req.user.id);

    return successResponse(res, 'Sponsor updated successfully', sponsor);
  } catch (error) {
    logger.error('Error in updateSponsor controller:', error);
    if (error.message === 'Sponsor not found') {
      return errorResponse(res, 'Sponsor not found', 404);
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
      return errorResponse(res, 'Email already exists', 409);
    }
    return errorResponse(res, error.message || 'Failed to update sponsor', 500);
  }
};

/**
 * Delete sponsor
 */
export const deleteSponsor = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await sponsorService.deleteSponsor(id, req.user.id);

    return successResponse(res, result.message);
  } catch (error) {
    logger.error('Error in deleteSponsor controller:', error);
    if (error.message === 'Sponsor not found') {
      return errorResponse(res, 'Sponsor not found', 404);
    }
    if (error.message.includes('Cannot delete sponsor with')) {
      return errorResponse(res, error.message, 409);
    }
    return errorResponse(res, error.message || 'Failed to delete sponsor', 500);
  }
};

/**
 * Map sponsor to student
 */
export const mapSponsorToStudent = async (req, res) => {
  try {
    const { sponsorId } = req.params;
    const { studentId, sponsorshipType, startDate, endDate, amount, currency, notes, sendNotificationEmail } = req.body;

    // Validation - startDate is now optional (defaults to today)
    if (!studentId) {
      return errorResponse(res, 'studentId is required', 400);
    }

    const mappingData = {
      studentId,
      sponsorId,
      sponsorshipType: sponsorshipType || 'full',
      startDate, // Optional - defaults to today
      endDate,   // Optional - defaults to startDate + 1 year
      amount,
      currency,
      notes,
    };

    const options = {
      sendNotificationEmail: sendNotificationEmail !== false, // Default to true
    };

    const result = await sponsorService.mapSponsorToStudent(mappingData, req.user.id, options);

    return successResponse(res, 'Sponsor mapped to student successfully', {
      mapping: result.mapping,
      emailSent: result.emailSent,
      renewalDateAutoCalculated: !endDate,
    }, 201);
  } catch (error) {
    logger.error('Error in mapSponsorToStudent controller:', error);
    if (error.message.includes('not found')) {
      return errorResponse(res, error.message, 404);
    }
    if (error.message.includes('not active')) {
      return errorResponse(res, error.message, 400);
    }
    if (error.message.includes('already exists')) {
      return errorResponse(res, error.message, 409);
    }
    return errorResponse(res, error.message || 'Failed to map sponsor to student', 500);
  }
};

/**
 * Get students mapped to sponsor
 */
export const getSponsorStudents = async (req, res) => {
  try {
    const { sponsorId } = req.params;
    const { status, page, limit } = req.query;

    const options = {
      status,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
    };

    const result = await sponsorService.getSponsorStudents(sponsorId, options);

    return successResponse(res, 'Sponsor students retrieved successfully', result);
  } catch (error) {
    logger.error('Error in getSponsorStudents controller:', error);
    if (error.message === 'Sponsor not found') {
      return errorResponse(res, 'Sponsor not found', 404);
    }
    return errorResponse(res, error.message || 'Failed to retrieve sponsor students', 500);
  }
};

/**
 * Update sponsorship mapping
 */
export const updateSponsorshipMapping = async (req, res) => {
  try {
    const { mappingId } = req.params;
    const updates = req.body;

    const mapping = await sponsorService.updateSponsorshipMapping(mappingId, updates, req.user.id);

    return successResponse(res, 'Sponsorship mapping updated successfully', mapping);
  } catch (error) {
    logger.error('Error in updateSponsorshipMapping controller:', error);
    if (error.message.includes('not found')) {
      return errorResponse(res, error.message, 404);
    }
    return errorResponse(res, error.message || 'Failed to update sponsorship mapping', 500);
  }
};

/**
 * Terminate sponsorship
 */
export const terminateSponsorship = async (req, res) => {
  try {
    const { mappingId } = req.params;
    const { reason } = req.body;

    const mapping = await sponsorService.terminateSponsorship(mappingId, req.user.id, reason);

    return successResponse(res, 'Sponsorship terminated successfully', mapping);
  } catch (error) {
    logger.error('Error in terminateSponsorship controller:', error);
    if (error.message.includes('not found')) {
      return errorResponse(res, error.message, 404);
    }
    return errorResponse(res, error.message || 'Failed to terminate sponsorship', 500);
  }
};

/**
 * Get sponsor statistics
 */
export const getSponsorStats = async (req, res) => {
  try {
    const stats = await sponsorService.getSponsorStats();

    return successResponse(res, 'Sponsor statistics retrieved successfully', stats);
  } catch (error) {
    logger.error('Error in getSponsorStats controller:', error);
    return errorResponse(res, error.message || 'Failed to retrieve sponsor statistics', 500);
  }
};

/**
 * Get students sponsored by the logged-in sponsor
 */
export const getMySponsoredStudents = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    const result = await sponsorService.getSponsoredStudentsByUserId(userId, { status, page, limit });

    return successResponse(res, 'Sponsored students retrieved successfully', result);
  } catch (error) {
    logger.error('Error in getMySponsoredStudents controller:', error);
    return errorResponse(res, error.message || 'Failed to retrieve sponsored students', 500);
  }
};

/**
 * Get sponsor dashboard data for logged-in sponsor
 */
export const getSponsorDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    const dashboardData = await sponsorService.getSponsorDashboardByUserId(userId);

    return successResponse(res, 'Sponsor dashboard retrieved successfully', dashboardData);
  } catch (error) {
    logger.error('Error in getSponsorDashboard controller:', error);
    return errorResponse(res, error.message || 'Failed to retrieve sponsor dashboard', 500);
  }
};

/**
 * Get students available for sponsorship
 */
export const getAvailableStudents = async (req, res) => {
  try {
    const { sponsorId, grade, search, page = 1, limit = 20 } = req.query;

    const options = {
      sponsorId,
      grade,
      search,
      page: parseInt(page),
      limit: Math.min(parseInt(limit) || 20, 100), // Cap at 100
    };

    const result = await sponsorService.getAvailableStudentsForSponsorship(options);

    return successResponse(res, 'Available students retrieved successfully', result);
  } catch (error) {
    logger.error('Error in getAvailableStudents controller:', error);
    return errorResponse(res, error.message || 'Failed to retrieve available students', 500);
  }
};

/**
 * Get sponsorship summary for admin dashboard
 */
export const getSponsorshipSummary = async (req, res) => {
  try {
    const summary = await sponsorService.getSponsorshipSummary();

    return successResponse(res, 'Sponsorship summary retrieved successfully', summary);
  } catch (error) {
    logger.error('Error in getSponsorshipSummary controller:', error);
    return errorResponse(res, error.message || 'Failed to retrieve sponsorship summary', 500);
  }
};

// All functions are already exported via 'export const' declarations above
