import express from 'express';
import * as reportCardController from '../controllers/reportcard.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Report Cards
 *   description: Student report card management (generation, signing, distribution)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ReportCard:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Report card unique identifier
 *         studentId:
 *           type: string
 *           format: uuid
 *           description: Student ID
 *         academicYearId:
 *           type: string
 *           format: uuid
 *           description: Academic year ID
 *         schoolId:
 *           type: string
 *           format: uuid
 *           description: School ID
 *         totalMarksObtained:
 *           type: number
 *           format: decimal
 *           description: Total marks obtained
 *           example: 450.00
 *         totalMaxMarks:
 *           type: number
 *           format: decimal
 *           description: Total maximum marks
 *           example: 500.00
 *         percentage:
 *           type: number
 *           format: decimal
 *           description: Percentage score
 *           example: 90.00
 *         finalGrade:
 *           type: string
 *           description: Final grade (A+, A, B+, B, C, D, F)
 *           enum: [A+, A, B+, B, C, D, F]
 *           example: A+
 *         status:
 *           type: string
 *           description: Report card status
 *           enum: [Draft, Generated, Signed, Distributed]
 *           example: Generated
 *         signedBy:
 *           type: string
 *           format: uuid
 *           description: Principal/Admin who signed the report card
 *           nullable: true
 *         pdfUrl:
 *           type: string
 *           description: URL to download PDF report card
 *           example: /uploads/report-cards/report-card-123.pdf
 *         createdAt:
 *           type: string
 *           format: date-time
 *         modifiedAt:
 *           type: string
 *           format: date-time
 *     
 *     ReportCardDistributionLog:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         reportCardId:
 *           type: string
 *           format: uuid
 *         recipientEmail:
 *           type: string
 *           format: email
 *           example: parent@example.com
 *         recipientType:
 *           type: string
 *           enum: [parent, sponsor, guardian, student, other]
 *           example: parent
 *         distributedBy:
 *           type: string
 *           format: uuid
 *         distributedAt:
 *           type: string
 *           format: date-time
 *         emailStatus:
 *           type: string
 *           enum: [sent, delivered, opened, bounced, failed]
 *           example: sent
 *         openedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         errorMessage:
 *           type: string
 *           nullable: true
 */

/**
 * @swagger
 * /api/report-cards/generate:
 *   post:
 *     summary: Generate report card for a student
 *     description: Calculates totals from approved marksheets and generates a report card with PDF
 *     tags: [Report Cards]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentId
 *               - academicYearId
 *             properties:
 *               studentId:
 *                 type: string
 *                 format: uuid
 *                 description: Student UUID
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *               academicYearId:
 *                 type: string
 *                 format: uuid
 *                 description: Academic Year UUID
 *                 example: 223e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       201:
 *         description: Report card generated successfully
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
 *                   example: Report card generated successfully
 *                 data:
 *                   $ref: '#/components/schemas/ReportCard'
 *       400:
 *         description: Invalid request (missing required fields)
 *       404:
 *         description: Student not found or no approved marksheets
 *       409:
 *         description: Report card already exists
 *       500:
 *         description: Server error
 */
router.post('/generate',
  authenticate,
  authorize(['teacher', 'admin', 'super_admin', 'principal']),
  reportCardController.generateReportCard
);

/**
 * @swagger
 * /api/report-cards/{id}/sign:
 *   post:
 *     summary: Sign report card (Principal/Admin only)
 *     description: Updates report card with principal signature and changes status to Signed
 *     tags: [Report Cards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Report card UUID
 *         example: 323e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       200:
 *         description: Report card signed successfully
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
 *                   example: Report card signed successfully
 *                 data:
 *                   $ref: '#/components/schemas/ReportCard'
 *       400:
 *         description: Invalid report card ID
 *       403:
 *         description: Unauthorized - Only principals and admins can sign
 *       404:
 *         description: Report card not found
 *       500:
 *         description: Server error
 */
router.post('/:id/sign',
  authenticate,
  authorize(['principal', 'admin', 'super_admin']),
  reportCardController.signReportCard
);

/**
 * @swagger
 * /api/report-cards/{id}/distribute:
 *   post:
 *     summary: Distribute report card via email
 *     description: Sends report card to specified email addresses (parents, sponsors, guardians)
 *     tags: [Report Cards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Report card UUID
 *         example: 323e4567-e89b-12d3-a456-426614174000
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientEmails
 *             properties:
 *               recipientEmails:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: email
 *                 description: Array of recipient email addresses
 *                 example: ["parent1@example.com", "sponsor1@example.com"]
 *               recipientTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [parent, sponsor, guardian, student, other]
 *                 description: Array of recipient types (same order as emails)
 *                 example: ["parent", "sponsor"]
 *     responses:
 *       200:
 *         description: Report card distribution initiated
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
 *                   example: Report card distribution initiated
 *                 data:
 *                   type: object
 *                   properties:
 *                     reportCard:
 *                       $ref: '#/components/schemas/ReportCard'
 *                     distributionLogs:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ReportCardDistributionLog'
 *                     emailResults:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           email:
 *                             type: string
 *                           status:
 *                             type: string
 *                           success:
 *                             type: boolean
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         sent:
 *                           type: integer
 *                         failed:
 *                           type: integer
 *       400:
 *         description: Invalid request (missing emails or invalid format)
 *       403:
 *         description: Report card cannot be distributed (not signed)
 *       404:
 *         description: Report card not found
 *       500:
 *         description: Server error
 */
router.post('/:id/distribute',
  authenticate,
  authorize(['admin', 'super_admin', 'principal']),
  reportCardController.distributeReportCard
);

/**
 * @swagger
 * /api/report-cards/student/{studentId}:
 *   get:
 *     summary: Get all report cards for a student
 *     description: Retrieves paginated list of report cards for specified student (students can only view their own)
 *     tags: [Report Cards]
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
 *         example: 123e4567-e89b-12d3-a456-426614174000
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
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: academicYearId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by academic year
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Draft, Generated, Signed, Distributed]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Report cards retrieved successfully
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
 *                   example: Report cards retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ReportCard'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       400:
 *         description: Invalid student ID
 *       403:
 *         description: Unauthorized - Students can only view their own reports
 *       500:
 *         description: Server error
 */
router.get('/student/:studentId',
  authenticate,
  reportCardController.getStudentReportCards
);

/**
 * @swagger
 * /api/report-cards/{id}:
 *   get:
 *     summary: Get report card by ID
 *     description: Retrieves detailed report card information including attachments and distribution logs
 *     tags: [Report Cards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Report card UUID
 *         example: 323e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       200:
 *         description: Report card retrieved successfully
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
 *                   example: Report card retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/ReportCard'
 *       400:
 *         description: Invalid report card ID
 *       403:
 *         description: Unauthorized - Students can only view their own reports
 *       404:
 *         description: Report card not found
 *       500:
 *         description: Server error
 */
router.get('/:id',
  authenticate,
  reportCardController.getReportCardById
);

/**
 * @swagger
 * /api/report-cards/{id}:
 *   delete:
 *     summary: Delete report card (Draft only)
 *     description: Deletes a report card (only allowed for Draft status)
 *     tags: [Report Cards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Report card UUID
 *         example: 323e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       200:
 *         description: Report card deleted successfully
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
 *                   example: Report card deleted successfully
 *       400:
 *         description: Invalid report card ID
 *       403:
 *         description: Only draft report cards can be deleted
 *       404:
 *         description: Report card not found
 *       500:
 *         description: Server error
 */
router.delete('/:id',
  authenticate,
  authorize(['admin', 'super_admin', 'principal', 'teacher']),
  reportCardController.deleteReportCard
);

/**
 * @swagger
 * /api/report-cards:
 *   get:
 *     summary: Get all report cards (Admin/Principal)
 *     description: Retrieves paginated list of all report cards with filters
 *     tags: [Report Cards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *           default: 20
 *         description: Items per page
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Draft, Generated, Signed, Distributed]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Report cards retrieved successfully
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
 *                   example: Report cards retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ReportCard'
 *       500:
 *         description: Server error
 */
router.get('/',
  authenticate,
  authorize(['admin', 'super_admin', 'principal']),
  reportCardController.getAllReportCards
);

export default router;
