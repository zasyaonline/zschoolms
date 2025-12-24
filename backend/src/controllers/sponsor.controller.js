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

    const sponsor = await sponsorService.createSponsor(sponsorData, req.user.id);

    return successResponse(res, 'Sponsor created successfully', sponsor, 201);
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
    const { studentId, sponsorshipType, startDate, endDate, amount, currency, notes } = req.body;

    // Validation
    if (!studentId || !sponsorshipType || !startDate) {
      return errorResponse(res, 'studentId, sponsorshipType, and startDate are required', 400);
    }

    const mappingData = {
      studentId,
      sponsorId,
      sponsorshipType,
      startDate,
      endDate,
      amount,
      currency,
      notes,
    };

    const mapping = await sponsorService.mapSponsorToStudent(mappingData, req.user.id);

    return successResponse(res, 'Sponsor mapped to student successfully', mapping, 201);
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

export default {
  createSponsor,
  getSponsors,
  getSponsorById,
  updateSponsor,
  deleteSponsor,
  mapSponsorToStudent,
  getSponsorStudents,
  updateSponsorshipMapping,
  terminateSponsorship,
  getSponsorStats,
};
