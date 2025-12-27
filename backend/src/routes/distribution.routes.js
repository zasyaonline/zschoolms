import express from 'express';
import * as distributionController from '../controllers/distribution.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Distribution
 *   description: Bulk report card distribution to sponsors
 */

/**
 * @swagger
 * /api/distribution/preview:
 *   get:
 *     summary: Get distribution preview for a class
 *     description: |
 *       Returns a preview of the distribution including:
 *       - Total students with report cards
 *       - Number of students with sponsors
 *       - Unique sponsor emails to be contacted
 *       - Grouped sponsor-student relationships
 *     tags: [Distribution]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: classSectionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Class Section UUID
 *       - in: query
 *         name: academicYearId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Academic Year UUID
 *     responses:
 *       200:
 *         description: Distribution preview
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 preview:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalStudents:
 *                           type: integer
 *                         studentsWithSponsors:
 *                           type: integer
 *                         uniqueSponsorEmails:
 *                           type: integer
 *                     sponsorGroups:
 *                       type: array
 *                     studentsWithoutSponsors:
 *                       type: array
 *       400:
 *         description: Missing required parameters
 */
router.get('/preview',
  authenticate,
  authorize(['admin', 'super_admin', 'principal']),
  distributionController.getDistributionPreview
);

/**
 * @swagger
 * /api/distribution/validate:
 *   get:
 *     summary: Validate class data for report card generation
 *     description: |
 *       Performs validation checks on class data including:
 *       - All subjects have approved marksheets
 *       - All students have complete marks
 *       - Attendance records exist (optional)
 *     tags: [Distribution]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: classSectionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: academicYearId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Validation results
 */
router.get('/validate',
  authenticate,
  authorize(['admin', 'super_admin', 'principal']),
  distributionController.validateClassForDistribution
);

/**
 * @swagger
 * /api/distribution/status:
 *   get:
 *     summary: Get distribution status for a class
 *     description: Returns the current status of email distribution for a class
 *     tags: [Distribution]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: classSectionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: academicYearId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Distribution status
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
 *                     totalEmails:
 *                       type: integer
 *                     sent:
 *                       type: integer
 *                     failed:
 *                       type: integer
 *                     pending:
 *                       type: integer
 */
router.get('/status',
  authenticate,
  authorize(['admin', 'super_admin', 'principal']),
  distributionController.getDistributionStatus
);

/**
 * @swagger
 * /api/distribution/send:
 *   post:
 *     summary: Initiate bulk distribution to sponsors
 *     description: |
 *       Sends report cards to all sponsors via email.
 *       - First call without confirmSend returns a preview
 *       - Second call with confirmSend=true initiates sending
 *       
 *       **This action cannot be undone!**
 *     tags: [Distribution]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - classSectionId
 *               - academicYearId
 *             properties:
 *               classSectionId:
 *                 type: string
 *                 format: uuid
 *               academicYearId:
 *                 type: string
 *                 format: uuid
 *               confirmSend:
 *                 type: boolean
 *                 description: Set to true to confirm and initiate sending
 *     responses:
 *       200:
 *         description: Distribution initiated or preview returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 requiresConfirmation:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     batchJobId:
 *                       type: string
 *                     emailsQueued:
 *                       type: integer
 */
router.post('/send',
  authenticate,
  authorize(['admin', 'super_admin']),
  distributionController.initiateBulkDistribution
);

/**
 * @swagger
 * /api/distribution/{jobId}/retry:
 *   post:
 *     summary: Retry failed emails for a batch job
 *     description: Re-queues failed emails that haven't exceeded max retries
 *     tags: [Distribution]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Batch Job UUID
 *     responses:
 *       200:
 *         description: Retry result
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
 *                     retried:
 *                       type: integer
 *                     message:
 *                       type: string
 */
router.post('/:jobId/retry',
  authenticate,
  authorize(['admin', 'super_admin']),
  distributionController.retryFailedEmails
);

/**
 * @swagger
 * /api/distribution/process:
 *   post:
 *     summary: Manually trigger email queue processing
 *     description: |
 *       Triggers the email queue processor to send pending emails.
 *       Normally this runs automatically, but can be triggered manually.
 *     tags: [Distribution]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               batchSize:
 *                 type: integer
 *                 default: 10
 *                 description: Number of emails to process in this batch
 *     responses:
 *       200:
 *         description: Processing result
 */
router.post('/process',
  authenticate,
  authorize(['admin', 'super_admin']),
  distributionController.processEmailQueue
);

export default router;
