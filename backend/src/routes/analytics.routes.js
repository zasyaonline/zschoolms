import express from 'express';
import * as analyticsController from '../controllers/analytics.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Analytics and statistics for students, attendance, and school performance
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     StudentPerformanceAnalytics:
 *       type: object
 *       properties:
 *         overview:
 *           type: object
 *           properties:
 *             totalStudents:
 *               type: integer
 *               example: 150
 *             totalSubjects:
 *               type: integer
 *               example: 8
 *             averagePercentage:
 *               type: number
 *               format: float
 *               example: 85.50
 *             totalMarksObtained:
 *               type: number
 *               example: 4275
 *             totalMaxMarks:
 *               type: number
 *               example: 5000
 *         attendance:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *               example: 1200
 *             present:
 *               type: integer
 *               example: 1080
 *             absent:
 *               type: integer
 *               example: 80
 *             late:
 *               type: integer
 *               example: 30
 *             excused:
 *               type: integer
 *               example: 10
 *             attendanceRate:
 *               type: number
 *               format: float
 *               example: 90.00
 *         gradeDistribution:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               grade:
 *                 type: string
 *                 example: A+
 *               count:
 *                 type: integer
 *                 example: 25
 *         topPerformers:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               studentId:
 *                 type: string
 *                 format: uuid
 *               studentName:
 *                 type: string
 *                 example: John Doe
 *               studentNumber:
 *                 type: string
 *                 example: STU001
 *               percentage:
 *                 type: number
 *                 format: float
 *                 example: 95.50
 *               grade:
 *                 type: string
 *                 example: A+
 *               totalMarks:
 *                 type: number
 *                 example: 477.5
 *               maxMarks:
 *                 type: number
 *                 example: 500
 *         subjectPerformance:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               subjectName:
 *                 type: string
 *                 example: Mathematics
 *               averageMarks:
 *                 type: number
 *                 format: float
 *                 example: 85.5
 *               averageMaxMarks:
 *                 type: number
 *                 format: float
 *                 example: 100
 *               averagePercentage:
 *                 type: number
 *                 format: float
 *                 example: 85.50
 *               totalStudents:
 *                 type: integer
 *                 example: 120
 *     
 *     SchoolDashboardAnalytics:
 *       type: object
 *       properties:
 *         overview:
 *           type: object
 *           properties:
 *             totalStudents:
 *               type: integer
 *               example: 500
 *             activeStudents:
 *               type: integer
 *               example: 475
 *             totalSponsors:
 *               type: integer
 *               example: 120
 *             averagePerformance:
 *               type: number
 *               format: float
 *               example: 82.50
 *             totalReportCards:
 *               type: integer
 *               example: 450
 *         attendanceToday:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *               example: 450
 *             present:
 *               type: integer
 *               example: 420
 *             absent:
 *               type: integer
 *               example: 25
 *             late:
 *               type: integer
 *               example: 5
 *         gradeDistribution:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               grade:
 *                 type: string
 *                 example: A+
 *               count:
 *                 type: integer
 *                 example: 75
 *               percentage:
 *                 type: number
 *                 format: float
 *                 example: 16.67
 *         performanceTrend:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               month:
 *                 type: string
 *                 format: date
 *                 example: 2025-11-01
 *               averagePercentage:
 *                 type: number
 *                 format: float
 *                 example: 82.50
 *               reportCount:
 *                 type: integer
 *                 example: 150
 *         attendanceTrend:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 example: 2025-12-20
 *               total:
 *                 type: integer
 *                 example: 450
 *               present:
 *                 type: integer
 *                 example: 420
 *               attendanceRate:
 *                 type: number
 *                 format: float
 *                 example: 93.33
 *         topSubjects:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               subjectName:
 *                 type: string
 *                 example: Mathematics
 *               enrollmentCount:
 *                 type: integer
 *                 example: 450
 */

/**
 * @swagger
 * /api/analytics/student-performance:
 *   get:
 *     summary: Get student performance analytics
 *     description: Retrieves comprehensive analytics including attendance, grades, subject performance, and top performers. Students can only view their own analytics.
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by specific student (optional, students can only view their own)
 *       - in: query
 *         name: academicYearId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by academic year
 *       - in: query
 *         name: schoolId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by school
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering attendance data
 *         example: 2025-01-01
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering attendance data
 *         example: 2025-12-31
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Student performance analytics retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/StudentPerformanceAnalytics'
 *       403:
 *         description: Unauthorized - Students can only view their own analytics
 *       500:
 *         description: Server error
 */
router.get('/student-performance',
  authenticate,
  analyticsController.getStudentPerformance
);

/**
 * @swagger
 * /api/analytics/school-dashboard:
 *   get:
 *     summary: Get school-wide dashboard analytics
 *     description: Retrieves comprehensive school analytics including student overview, attendance trends, grade distribution, performance trends, and top subjects. Only accessible by admin, super_admin, and principal roles.
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: schoolId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by specific school
 *       - in: query
 *         name: academicYearId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by academic year
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering data
 *         example: 2025-01-01
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering data
 *         example: 2025-12-31
 *     responses:
 *       200:
 *         description: School dashboard analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: School dashboard analytics retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/SchoolDashboardAnalytics'
 *       403:
 *         description: Unauthorized - Only admin, super_admin, and principal can access
 *       500:
 *         description: Server error
 */
router.get('/school-dashboard',
  authenticate,
  authorize(['admin', 'super_admin', 'principal']),
  analyticsController.getSchoolDashboard
);

export default router;
