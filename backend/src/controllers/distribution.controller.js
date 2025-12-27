import * as distributionService from '../services/distribution.service.js';
import * as validationService from '../services/validation.service.js';
import logger from '../utils/logger.js';

/**
 * Distribution Controller
 * Handles API endpoints for bulk report card distribution
 */

/**
 * Get distribution preview for a class
 * GET /api/distribution/preview
 */
export const getDistributionPreview = async (req, res) => {
  try {
    const { classSectionId, academicYearId } = req.query;

    if (!classSectionId || !academicYearId) {
      return res.status(400).json({
        success: false,
        error: 'classSectionId and academicYearId are required'
      });
    }

    const preview = await distributionService.getDistributionPreview(classSectionId, academicYearId);

    return res.json(preview);

  } catch (error) {
    logger.error('Error getting distribution preview:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get distribution preview'
    });
  }
};

/**
 * Validate class data before distribution
 * GET /api/distribution/validate
 */
export const validateClassForDistribution = async (req, res) => {
  try {
    const { classSectionId, academicYearId } = req.query;

    if (!classSectionId || !academicYearId) {
      return res.status(400).json({
        success: false,
        error: 'classSectionId and academicYearId are required'
      });
    }

    const validation = await validationService.validateClassForReportCards(classSectionId, academicYearId);

    return res.json({
      success: true,
      data: validation
    });

  } catch (error) {
    logger.error('Error validating class for distribution:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to validate class data'
    });
  }
};

/**
 * Initiate bulk distribution to sponsors
 * POST /api/distribution/send
 */
export const initiateBulkDistribution = async (req, res) => {
  try {
    const { classSectionId, academicYearId, confirmSend } = req.body;
    const initiatedBy = req.user.id;

    if (!classSectionId || !academicYearId) {
      return res.status(400).json({
        success: false,
        error: 'classSectionId and academicYearId are required'
      });
    }

    // Require confirmation flag to prevent accidental sends
    if (!confirmSend) {
      // Return preview for confirmation
      const preview = await distributionService.getDistributionPreview(classSectionId, academicYearId);
      return res.status(200).json({
        success: true,
        requiresConfirmation: true,
        message: `You are about to send ${preview.preview.summary.uniqueSponsorEmails} emails. Set confirmSend=true to proceed.`,
        preview: preview.preview.summary
      });
    }

    // Initiate the distribution
    const result = await distributionService.initiateBulkDistribution(
      classSectionId,
      academicYearId,
      initiatedBy
    );

    return res.status(200).json({
      success: true,
      message: `Distribution initiated: ${result.emailsQueued} emails queued for sending`,
      data: {
        batchJobId: result.batchJobId,
        emailsQueued: result.emailsQueued,
        summary: result.preview.summary
      }
    });

  } catch (error) {
    logger.error('Error initiating bulk distribution:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to initiate distribution'
    });
  }
};

/**
 * Get distribution status for a class
 * GET /api/distribution/status
 */
export const getDistributionStatus = async (req, res) => {
  try {
    const { classSectionId, academicYearId } = req.query;

    if (!classSectionId || !academicYearId) {
      return res.status(400).json({
        success: false,
        error: 'classSectionId and academicYearId are required'
      });
    }

    const status = await distributionService.getDistributionStatus(classSectionId, academicYearId);

    return res.json({
      success: true,
      data: status
    });

  } catch (error) {
    logger.error('Error getting distribution status:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get distribution status'
    });
  }
};

/**
 * Retry failed emails for a batch job
 * POST /api/distribution/:jobId/retry
 */
export const retryFailedEmails = async (req, res) => {
  try {
    const { jobId } = req.params;

    const result = await distributionService.retryFailedEmails(jobId);

    return res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Error retrying failed emails:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to retry emails'
    });
  }
};

/**
 * Manually process email queue (admin trigger)
 * POST /api/distribution/process
 */
export const processEmailQueue = async (req, res) => {
  try {
    const { batchSize = 10 } = req.body;

    const result = await distributionService.processEmailQueue(batchSize);

    return res.json({
      success: true,
      message: `Processed ${result.processed} emails: ${result.sent} sent, ${result.failed} failed`,
      data: result
    });

  } catch (error) {
    logger.error('Error processing email queue:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process email queue'
    });
  }
};

export default {
  getDistributionPreview,
  validateClassForDistribution,
  initiateBulkDistribution,
  getDistributionStatus,
  retryFailedEmails,
  processEmailQueue
};
