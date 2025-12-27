import express from 'express';
import * as studentPortalController from '../controllers/studentPortal.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

/**
 * Student Portal Routes
 * Base path: /api/student-portal
 * 
 * All routes require authentication and student role
 * This is a completely sandboxed environment - students can only access their own data
 * No visibility into other students, sponsors, or administrative functions
 */

/**
 * @swagger
 * /api/student-portal/dashboard:
 *   get:
 *     summary: Get student dashboard
 *     description: Returns the student's personal dashboard with academic summary, attendance stats, and recent performance
 *     tags: [Student Portal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 student:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     admissionNumber:
 *                       type: string
 *                     currentClass:
 *                       type: string
 *                     section:
 *                       type: string
 *                 academicYear:
 *                   type: object
 *                 attendance:
 *                   type: object
 *                   properties:
 *                     currentMonth:
 *                       type: object
 *                     term:
 *                       type: object
 *                 reportCards:
 *                   type: object
 *                 recentPerformance:
 *                   type: object
 *       404:
 *         description: Student profile not found
 */
router.get('/dashboard', authenticate, authorize('student'), studentPortalController.getDashboard);

/**
 * @swagger
 * /api/student-portal/report-cards:
 *   get:
 *     summary: Get student's report cards
 *     description: Returns a list of all report cards available for the logged-in student
 *     tags: [Student Portal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: academicYearId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by academic year
 *     responses:
 *       200:
 *         description: Report cards retrieved successfully
 */
router.get('/report-cards', authenticate, authorize('student'), studentPortalController.getMyReportCards);

/**
 * @swagger
 * /api/student-portal/report-cards/{reportCardId}/download:
 *   get:
 *     summary: Download a specific report card
 *     description: Returns a signed URL to download the PDF report card
 *     tags: [Student Portal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportCardId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Download URL generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 downloadUrl:
 *                   type: string
 *                 filename:
 *                   type: string
 *       404:
 *         description: Report card not found or not available
 */
router.get('/report-cards/:reportCardId/download', authenticate, authorize('student'), studentPortalController.downloadReportCard);

/**
 * @swagger
 * /api/student-portal/attendance:
 *   get:
 *     summary: Get student's attendance records
 *     description: Returns attendance records with calendar view and summary statistics
 *     tags: [Student Portal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Month number (1-12)
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Year (e.g., 2025)
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 31
 *     responses:
 *       200:
 *         description: Attendance retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 attendance:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [present, absent, late, excused]
 *                 summary:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     present:
 *                       type: integer
 *                     absent:
 *                       type: integer
 *                     percentage:
 *                       type: string
 */
router.get('/attendance', authenticate, authorize('student'), studentPortalController.getMyAttendance);

/**
 * @swagger
 * /api/student-portal/profile:
 *   get:
 *     summary: Get student's profile (read-only)
 *     description: Returns the student's personal profile information. This is strictly read-only and cannot be edited by the student.
 *     tags: [Student Portal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 personalInfo:
 *                   type: object
 *                   properties:
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     dateOfBirth:
 *                       type: string
 *                     gender:
 *                       type: string
 *                 academicInfo:
 *                   type: object
 *                   properties:
 *                     admissionNumber:
 *                       type: string
 *                     currentClass:
 *                       type: string
 *                     section:
 *                       type: string
 *                 contactInfo:
 *                   type: object
 */
router.get('/profile', authenticate, authorize('student'), studentPortalController.getMyProfile);

export default router;
