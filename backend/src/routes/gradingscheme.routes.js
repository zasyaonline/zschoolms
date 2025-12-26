import express from 'express';
import * as gradingSchemeController from '../controllers/gradingscheme.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Grading Schemes
 *   description: Grading scheme management endpoints
 */

/**
 * @swagger
 * /api/grading-schemes:
 *   get:
 *     summary: Get all grading schemes
 *     tags: [Grading Schemes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: schoolId
 *         schema:
 *           type: string
 *         description: Filter by school ID
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of grading schemes
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticate, gradingSchemeController.getGradingSchemes);

/**
 * @swagger
 * /api/grading-schemes/calculate/{percentage}:
 *   get:
 *     summary: Calculate grade for a given percentage
 *     tags: [Grading Schemes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: percentage
 *         required: true
 *         schema:
 *           type: number
 *         description: Percentage value (0-100)
 *       - in: query
 *         name: schoolId
 *         schema:
 *           type: string
 *         description: Optional school ID for school-specific grading
 *     responses:
 *       200:
 *         description: Calculated grade information
 *       400:
 *         description: Invalid percentage
 *       404:
 *         description: No matching grade found
 */
router.get('/calculate/:percentage', authenticate, gradingSchemeController.getGradeForPercentage);

/**
 * @swagger
 * /api/grading-schemes/{id}:
 *   get:
 *     summary: Get grading scheme by ID
 *     tags: [Grading Schemes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Grading scheme ID
 *     responses:
 *       200:
 *         description: Grading scheme details
 *       404:
 *         description: Grading scheme not found
 */
router.get('/:id', authenticate, gradingSchemeController.getGradingSchemeById);

/**
 * @swagger
 * /api/grading-schemes:
 *   post:
 *     summary: Create a new grading scheme
 *     tags: [Grading Schemes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - grade
 *               - minPercentage
 *               - maxPercentage
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Grade A+"
 *               grade:
 *                 type: string
 *                 example: "A+"
 *               minPercentage:
 *                 type: number
 *                 example: 90
 *               maxPercentage:
 *                 type: number
 *                 example: 100
 *               gradePoint:
 *                 type: number
 *                 example: 4.0
 *               passingMarks:
 *                 type: integer
 *                 example: 40
 *               description:
 *                 type: string
 *                 example: "Excellent"
 *               schoolId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Grading scheme created
 *       400:
 *         description: Validation error or overlapping range
 */
router.post('/', authenticate, authorize(['admin']), gradingSchemeController.createGradingScheme);

/**
 * @swagger
 * /api/grading-schemes/seed:
 *   post:
 *     summary: Seed default grading schemes
 *     tags: [Grading Schemes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               schoolId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Default grading schemes created
 *       400:
 *         description: Schemes already exist
 */
router.post('/seed', authenticate, authorize(['admin']), gradingSchemeController.seedGradingSchemes);

/**
 * @swagger
 * /api/grading-schemes/{id}:
 *   put:
 *     summary: Update a grading scheme
 *     tags: [Grading Schemes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               grade:
 *                 type: string
 *               minPercentage:
 *                 type: number
 *               maxPercentage:
 *                 type: number
 *               gradePoint:
 *                 type: number
 *               passingMarks:
 *                 type: integer
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Grading scheme updated
 *       404:
 *         description: Grading scheme not found
 */
router.put('/:id', authenticate, authorize(['admin']), gradingSchemeController.updateGradingScheme);

/**
 * @swagger
 * /api/grading-schemes/{id}:
 *   delete:
 *     summary: Delete a grading scheme (soft delete)
 *     tags: [Grading Schemes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Grading scheme deleted
 *       404:
 *         description: Grading scheme not found
 */
router.delete('/:id', authenticate, authorize(['admin']), gradingSchemeController.deleteGradingScheme);

export default router;
