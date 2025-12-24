import * as dashboardService from '../services/dashboard.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../utils/logger.js';

/**
 * Get dashboard metrics
 * GET /api/dashboard/metrics
 */
export const getDashboardMetrics = async (req, res) => {
  try {
    const metrics = await dashboardService.getDashboardMetrics();

    return successResponse(
      res,
      metrics,
      'Dashboard metrics fetched successfully'
    );
  } catch (error) {
    logger.error('Dashboard metrics controller error:', error);
    return errorResponse(
      res,
      'Failed to fetch dashboard metrics',
      500
    );
  }
};

/**
 * Get recent activity
 * GET /api/dashboard/activity
 */
export const getRecentActivity = async (req, res) => {
  try {
    const activity = await dashboardService.getRecentActivity();

    return successResponse(
      res,
      activity,
      'Recent activity fetched successfully'
    );
  } catch (error) {
    logger.error('Recent activity controller error:', error);
    return errorResponse(
      res,
      'Failed to fetch recent activity',
      500
    );
  }
};
