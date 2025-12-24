import express from 'express';
import * as attendanceController from '../controllers/attendance.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

/**
 * Attendance Routes
 * Base path: /api/attendance
 * All routes require authentication
 */

/**
 * @swagger
 * /api/attendance:
 *   post:
 *     summary: Mark attendance for students
 *     description: Mark attendance for one or multiple students. Can create new records or update existing ones for the same date.
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - attendanceData
 *             properties:
 *               attendanceData:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - studentId
 *                     - date
 *                     - class
 *                     - status
 *                   properties:
 *                     studentId:
 *                       type: string
 *                       format: uuid
 *                       description: Student UUID
 *                     date:
 *                       type: string
 *                       format: date
 *                       description: Date in YYYY-MM-DD format
 *                       example: "2025-12-22"
 *                     class:
 *                       type: string
 *                       example: "10"
 *                     section:
 *                       type: string
 *                       example: "A"
 *                     status:
 *                       type: string
 *                       enum: [present, absent, late, excused]
 *                       example: "present"
 *                     remarks:
 *                       type: string
 *                       example: "Arrived 10 minutes late"
 *           example:
 *             attendanceData:
 *               - studentId: "uuid-1"
 *                 date: "2025-12-22"
 *                 class: "10"
 *                 section: "A"
 *                 status: "present"
 *               - studentId: "uuid-2"
 *                 date: "2025-12-22"
 *                 class: "10"
 *                 section: "A"
 *                 status: "absent"
 *                 remarks: "Sick leave"
 *     responses:
 *       201:
 *         description: Attendance marked successfully
 *       207:
 *         description: Attendance marked with some errors
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/', authenticate, authorize('teacher', 'admin', 'super_admin', 'principal'), attendanceController.markAttendance);

/**
 * @swagger
 * /api/attendance:
 *   get:
 *     summary: Get attendance records
 *     description: Retrieve attendance records with filtering and pagination
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Specific date (YYYY-MM-DD)
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for date range
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for date range
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by student ID
 *       - in: query
 *         name: class
 *         schema:
 *           type: string
 *         description: Filter by class/grade
 *       - in: query
 *         name: section
 *         schema:
 *           type: string
 *         description: Filter by section
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [present, absent, late, excused]
 *         description: Filter by attendance status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *         description: Records per page
 *     responses:
 *       200:
 *         description: Attendance records retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     records:
 *                       type: array
 *                       items:
 *                         type: object
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         present:
 *                           type: integer
 *                         absent:
 *                           type: integer
 *                         late:
 *                           type: integer
 *                         excused:
 *                           type: integer
 *                         attendanceRate:
 *                           type: string
 *                     pagination:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/', authenticate, authorize('teacher', 'admin', 'super_admin', 'principal'), attendanceController.getAttendance);

/**
 * @swagger
 * /api/attendance/class/{date}:
 *   get:
 *     summary: Get class attendance for a specific date
 *     description: Retrieve attendance records for a class on a specific date
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date in YYYY-MM-DD format
 *       - in: query
 *         name: class
 *         required: true
 *         schema:
 *           type: string
 *         description: Class/grade
 *       - in: query
 *         name: section
 *         schema:
 *           type: string
 *         description: Section (optional)
 *     responses:
 *       200:
 *         description: Class attendance retrieved successfully
 *       400:
 *         description: Validation error - class parameter required
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/class/:date', authenticate, authorize('teacher', 'admin', 'super_admin', 'principal'), attendanceController.getClassAttendance);

/**
 * @swagger
 * /api/attendance/student/{studentId}:
 *   get:
 *     summary: Get student attendance history
 *     description: Retrieve attendance history for a specific student
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Student UUID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for date range
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for date range
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 30
 *           maximum: 100
 *         description: Records per page
 *     responses:
 *       200:
 *         description: Student attendance history retrieved successfully
 *       404:
 *         description: Student not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/student/:studentId', authenticate, authorize('teacher', 'admin', 'super_admin', 'principal', 'student'), attendanceController.getStudentAttendance);

/**
 * @swagger
 * /api/attendance/{id}:
 *   delete:
 *     summary: Delete attendance record
 *     description: Delete a specific attendance record (admin only)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Attendance record UUID
 *     responses:
 *       200:
 *         description: Attendance record deleted successfully
 *       404:
 *         description: Attendance record not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', authenticate, authorize('admin', 'super_admin', 'principal'), attendanceController.deleteAttendance);

export default router;
