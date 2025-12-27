import express from 'express';
import * as batchJobController from '../controllers/batchjob.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Batch Jobs
 *   description: Batch job monitoring and management
 */

/**
 * @swagger
 * /api/batch-jobs/active:
 *   get:
 *     summary: Get active jobs for the current user
 *     description: Returns all pending and in-progress jobs initiated by the current user
 *     tags: [Batch Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active jobs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BatchJobStatus'
 */
router.get('/active',
  authenticate,
  batchJobController.getActiveJobs
);

/**
 * @swagger
 * /api/batch-jobs/history:
 *   get:
 *     summary: Get job history for the current user
 *     description: Returns paginated list of all jobs initiated by the current user
 *     tags: [Batch Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Maximum number of results
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset for pagination
 *     responses:
 *       200:
 *         description: Paginated job history
 */
router.get('/history',
  authenticate,
  batchJobController.getJobHistory
);

/**
 * @swagger
 * /api/batch-jobs/admin/active:
 *   get:
 *     summary: Get all active jobs (admin only)
 *     description: Returns all pending and in-progress jobs across all users
 *     tags: [Batch Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all active jobs
 */
router.get('/admin/active',
  authenticate,
  authorize(['admin', 'super_admin']),
  batchJobController.getAllActiveJobs
);

/**
 * @swagger
 * /api/batch-jobs/admin/cleanup:
 *   post:
 *     summary: Clean up old completed jobs (admin only)
 *     description: Removes completed, failed, and cancelled jobs older than 30 days
 *     tags: [Batch Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cleanup result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedCount:
 *                       type: integer
 */
router.post('/admin/cleanup',
  authenticate,
  authorize(['admin', 'super_admin']),
  batchJobController.cleanupOldJobs
);

/**
 * @swagger
 * /api/batch-jobs/{id}:
 *   get:
 *     summary: Get status of a specific job
 *     description: Returns detailed status and progress of a batch job
 *     tags: [Batch Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Batch Job UUID
 *     responses:
 *       200:
 *         description: Job status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/BatchJobStatus'
 *       404:
 *         description: Job not found
 */
router.get('/:id',
  authenticate,
  batchJobController.getJobStatus
);

/**
 * @swagger
 * /api/batch-jobs/{id}/cancel:
 *   post:
 *     summary: Cancel a batch job
 *     description: Cancels a pending or in-progress job. Only the initiator can cancel.
 *     tags: [Batch Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Batch Job UUID
 *     responses:
 *       200:
 *         description: Job cancelled successfully
 *       400:
 *         description: Cannot cancel completed or failed job
 *       403:
 *         description: Not authorized to cancel this job
 *       404:
 *         description: Job not found
 */
router.post('/:id/cancel',
  authenticate,
  batchJobController.cancelJob
);

/**
 * @swagger
 * components:
 *   schemas:
 *     BatchJobStatus:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         type:
 *           type: string
 *           enum: [report_card_generation, report_card_signing, marks_export, attendance_report]
 *         name:
 *           type: string
 *         status:
 *           type: string
 *           enum: [pending, in_progress, completed, failed, cancelled]
 *         progress:
 *           type: object
 *           properties:
 *             percent:
 *               type: number
 *             processed:
 *               type: integer
 *             total:
 *               type: integer
 *             successful:
 *               type: integer
 *             failed:
 *               type: integer
 *             skipped:
 *               type: integer
 *         timing:
 *           type: object
 *           properties:
 *             started:
 *               type: string
 *               format: date-time
 *             completed:
 *               type: string
 *               format: date-time
 *             estimated:
 *               type: string
 *               format: date-time
 *             duration:
 *               type: string
 *         errors:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               timestamp:
 *                 type: string
 *               message:
 *                 type: string
 *         results:
 *           type: object
 */

export default router;
