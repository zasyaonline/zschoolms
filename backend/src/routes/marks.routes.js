import express from 'express';
import * as marksController from '../controllers/marks.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Marks
 *   description: Marks and grading management endpoints
 */

/**
 * @swagger
 * /api/marks/entry:
 *   post:
 *     summary: Enter or update marks for a marksheet
 *     tags: [Marks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subjectId
 *               - schoolId
 *               - academicYearId
 *             properties:
 *               marksheetId:
 *                 type: string
 *                 format: uuid
 *                 description: Marksheet ID (if updating existing)
 *               coursePartId:
 *                 type: string
 *                 format: uuid
 *               academicYearId:
 *                 type: string
 *                 format: uuid
 *               academicYearEnrollmentId:
 *                 type: string
 *                 format: uuid
 *               studentSubjectEnrollmentId:
 *                 type: string
 *                 format: uuid
 *               subjectId:
 *                 type: string
 *                 format: uuid
 *               schoolId:
 *                 type: string
 *                 format: uuid
 *               marksObtained:
 *                 type: number
 *                 format: decimal
 *               remarks:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Draft, submitted, approved, rejected]
 *               marks:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     subjectId:
 *                       type: string
 *                       format: uuid
 *                     marksObtained:
 *                       type: number
 *                     maxMarks:
 *                       type: integer
 *                     remarks:
 *                       type: string
 *           example:
 *             subjectId: "123e4567-e89b-12d3-a456-426614174000"
 *             schoolId: "123e4567-e89b-12d3-a456-426614174001"
 *             academicYearId: "123e4567-e89b-12d3-a456-426614174002"
 *             academicYearEnrollmentId: "123e4567-e89b-12d3-a456-426614174003"
 *             studentSubjectEnrollmentId: "123e4567-e89b-12d3-a456-426614174004"
 *             coursePartId: "123e4567-e89b-12d3-a456-426614174005"
 *             status: "Draft"
 *             remarks: "Mid-term marks"
 *             marks:
 *               - subjectId: "123e4567-e89b-12d3-a456-426614174006"
 *                 marksObtained: 85
 *                 maxMarks: 100
 *                 remarks: "Good performance"
 *     responses:
 *       201:
 *         description: Marks entered successfully
 *       200:
 *         description: Marks updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/entry',
  authenticate,
  authorize(['teacher', 'admin', 'super_admin', 'principal']),
  marksController.enterMarks
);

/**
 * @swagger
 * /api/marks/pending:
 *   get:
 *     summary: Get pending marksheets for approval
 *     tags: [Marks]
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
 *           default: 50
 *           maximum: 100
 *       - in: query
 *         name: academicYearId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: subjectId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: schoolId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Pending marksheets retrieved successfully
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
 *                     marksheets:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/pending',
  authenticate,
  authorize(['admin', 'super_admin', 'principal']),
  marksController.getPendingMarksheets
);

/**
 * @swagger
 * /api/marks/marksheets:
 *   get:
 *     summary: Get marksheets by filters
 *     tags: [Marks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: academicYearId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: subjectId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: schoolId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Draft, submitted, approved, rejected]
 *       - in: query
 *         name: enrollmentId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Marksheets retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/marksheets',
  authenticate,
  authorize(['teacher', 'admin', 'super_admin', 'principal']),
  marksController.getMarksheets
);

/**
 * @swagger
 * /api/marks/marksheets/{id}:
 *   get:
 *     summary: Get marksheet by ID
 *     tags: [Marks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Marksheet retrieved successfully
 *       404:
 *         description: Marksheet not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/marksheets/:id',
  authenticate,
  authorize(['teacher', 'admin', 'super_admin', 'principal', 'student']),
  marksController.getMarksheetById
);

/**
 * @swagger
 * /api/marks/marksheets/{id}/submit:
 *   post:
 *     summary: Submit marksheet for approval
 *     tags: [Marks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Marksheet submitted successfully
 *       400:
 *         description: Validation error (no marks, already submitted, etc.)
 *       404:
 *         description: Marksheet not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/marksheets/:id/submit',
  authenticate,
  authorize(['teacher', 'admin', 'super_admin', 'principal']),
  marksController.submitMarksheet
);

/**
 * @swagger
 * /api/marks/approve/{marksheetId}:
 *   post:
 *     summary: Approve marksheet (Principal/Admin only)
 *     tags: [Marks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: marksheetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Marksheet ID to approve
 *     responses:
 *       200:
 *         description: Marksheet approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *       400:
 *         description: Cannot approve (wrong status)
 *       403:
 *         description: Forbidden (insufficient permissions)
 *       404:
 *         description: Marksheet not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/approve/:marksheetId',
  authenticate,
  authorize(['admin', 'super_admin', 'principal']),
  marksController.approveMarksheet
);

/**
 * @swagger
 * /api/marks/reject/{marksheetId}:
 *   post:
 *     summary: Reject marksheet with reason (Principal/Admin only)
 *     tags: [Marks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: marksheetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 minLength: 10
 *                 description: Rejection reason (minimum 10 characters)
 *           example:
 *             reason: "Marks do not match attendance records. Please verify and resubmit."
 *     responses:
 *       200:
 *         description: Marksheet rejected successfully
 *       400:
 *         description: Validation error (reason required, wrong status)
 *       403:
 *         description: Forbidden (insufficient permissions)
 *       404:
 *         description: Marksheet not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/reject/:marksheetId',
  authenticate,
  authorize(['admin', 'super_admin', 'principal']),
  marksController.rejectMarksheet
);

/**
 * @swagger
 * /api/marks/marksheets/{id}:
 *   delete:
 *     summary: Delete marksheet (draft/rejected only)
 *     tags: [Marks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Marksheet deleted successfully
 *       400:
 *         description: Cannot delete (wrong status)
 *       404:
 *         description: Marksheet not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.delete('/marksheets/:id',
  authenticate,
  authorize(['teacher', 'admin', 'super_admin', 'principal']),
  marksController.deleteMarksheet
);

/**
 * @swagger
 * /api/marks/subjects/{subjectId}/statistics:
 *   get:
 *     summary: Get subject statistics
 *     tags: [Marks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subjectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: academicYearId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: term
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
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
 *                     subject:
 *                       type: object
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         totalStudents:
 *                           type: integer
 *                         averageMarks:
 *                           type: string
 *                         averagePercentage:
 *                           type: string
 *                         highestMarks:
 *                           type: string
 *                         lowestMarks:
 *                           type: string
 *                         passedStudents:
 *                           type: integer
 *                         failedStudents:
 *                           type: integer
 *                         passRate:
 *                           type: string
 *       404:
 *         description: Subject not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/subjects/:subjectId/statistics',
  authenticate,
  authorize(['teacher', 'admin', 'super_admin', 'principal']),
  marksController.getSubjectStatistics
);

/**
 * @swagger
 * /api/marks/students/{enrollmentId}/marksheets:
 *   get:
 *     summary: Get student's marksheets
 *     tags: [Marks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: enrollmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Academic year enrollment ID
 *     responses:
 *       200:
 *         description: Student marksheets retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/students/:enrollmentId/marksheets',
  authenticate,
  authorize(['teacher', 'admin', 'super_admin', 'principal', 'student']),
  marksController.getStudentMarksheets
);

export default router;
