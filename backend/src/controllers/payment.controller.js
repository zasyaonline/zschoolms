import * as paymentService from '../services/payment.service.js';
import logger from '../utils/logger.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * Payment Controller
 * Handles sponsor payment recording and management
 */

/**
 * Record a new payment
 */
export const recordPayment = async (req, res) => {
  try {
    const {
      sponsorshipId,
      amount,
      currency,
      paymentDate,
      transactionReference,
      paymentMethod,
      notes,
      renewalMonths,
    } = req.body;

    // Validation
    if (!sponsorshipId || !amount || !paymentDate) {
      return errorResponse(res, 'sponsorshipId, amount, and paymentDate are required', 400);
    }

    if (amount <= 0) {
      return errorResponse(res, 'Amount must be greater than 0', 400);
    }

    const result = await paymentService.recordPayment({
      sponsorshipId,
      amount,
      currency,
      paymentDate,
      transactionReference,
      paymentMethod,
      notes,
      renewalMonths,
    }, req.user.id);

    return successResponse(res, 'Payment recorded successfully', {
      payment: result.payment,
      emailSent: result.emailSent,
      renewalInfo: result.renewalInfo,
    }, 201);
  } catch (error) {
    logger.error('Error in recordPayment controller:', error);
    if (error.message === 'Sponsorship not found') {
      return errorResponse(res, 'Sponsorship not found', 404);
    }
    return errorResponse(res, error.message || 'Failed to record payment', 500);
  }
};

/**
 * Get payment history for a sponsorship
 */
export const getPaymentHistory = async (req, res) => {
  try {
    const { sponsorshipId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const result = await paymentService.getPaymentHistory(sponsorshipId, { page, limit });

    return successResponse(res, 'Payment history retrieved successfully', result);
  } catch (error) {
    logger.error('Error in getPaymentHistory controller:', error);
    return errorResponse(res, error.message || 'Failed to retrieve payment history', 500);
  }
};

/**
 * Get payments for a sponsor
 */
export const getSponsorPayments = async (req, res) => {
  try {
    const { sponsorId } = req.params;
    const { page = 1, limit = 10, startDate, endDate } = req.query;

    const result = await paymentService.getSponsorPayments(sponsorId, { 
      page, 
      limit, 
      startDate, 
      endDate 
    });

    return successResponse(res, 'Sponsor payments retrieved successfully', result);
  } catch (error) {
    logger.error('Error in getSponsorPayments controller:', error);
    return errorResponse(res, error.message || 'Failed to retrieve sponsor payments', 500);
  }
};

/**
 * Get payment by ID
 */
export const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await paymentService.getPaymentById(id);

    return successResponse(res, 'Payment retrieved successfully', { payment });
  } catch (error) {
    logger.error('Error in getPaymentById controller:', error);
    if (error.message === 'Payment not found') {
      return errorResponse(res, 'Payment not found', 404);
    }
    return errorResponse(res, error.message || 'Failed to retrieve payment', 500);
  }
};

/**
 * Get payment statistics
 */
export const getPaymentStats = async (req, res) => {
  try {
    const { startDate, endDate, sponsorId } = req.query;

    const stats = await paymentService.getPaymentStats({ startDate, endDate, sponsorId });

    return successResponse(res, 'Payment statistics retrieved successfully', stats);
  } catch (error) {
    logger.error('Error in getPaymentStats controller:', error);
    return errorResponse(res, error.message || 'Failed to retrieve payment statistics', 500);
  }
};

// All functions are exported via 'export const' declarations above
