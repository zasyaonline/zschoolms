import express from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

/**
 * Dashboard Routes
 * Base path: /api/dashboard
 * All routes require authentication
 */

/**
 * @swagger
 * /api/dashboard/metrics:
 *   get:
 *     summary: Get dashboard metrics
 *     description: Retrieve aggregated statistics for students, sponsors, attendance, and pending approvals
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     students:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 150
 *                         active:
 *                           type: integer
 *                           example: 145
 *                         inactive:
 *                           type: integer
 *                           example: 5
 *                         newThisMonth:
 *                           type: integer
 *                           example: 12
 *                         byClass:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               class:
 *                                 type: string
 *                               count:
 *                                 type: integer
 *                     sponsors:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 45
 *                         active:
 *                           type: integer
 *                           example: 42
 *                         inactive:
 *                           type: integer
 *                           example: 3
 *                         totalSponsoredStudents:
 *                           type: integer
 *                           example: 142
 *                         averageStudentsPerSponsor:
 *                           type: number
 *                           example: 3.2
 *                         expiringSoon:
 *                           type: integer
 *                           example: 8
 *                         byCountry:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               country:
 *                                 type: string
 *                               count:
 *                                 type: integer
 *                     attendance:
 *                       type: object
 *                       properties:
 *                         todayPresent:
 *                           type: integer
 *                           example: 138
 *                         todayAbsent:
 *                           type: integer
 *                           example: 7
 *                         attendanceRate:
 *                           type: string
 *                           example: "95.2%"
 *                     pendingApprovals:
 *                       type: object
 *                       properties:
 *                         marksheets:
 *                           type: integer
 *                           example: 8
 *                         reportCards:
 *                           type: integer
 *                           example: 3
 *                     generatedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/metrics', authenticate, authorize('admin', 'super_admin', 'principal', 'teacher'), dashboardController.getDashboardMetrics);

/**
 * @swagger
 * /api/dashboard/activity:
 *   get:
 *     summary: Get recent activity
 *     description: Retrieve recent activities and updates
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recent activity retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/activity', authenticate, authorize('admin', 'super_admin', 'principal', 'teacher'), dashboardController.getRecentActivity);

export default router;
