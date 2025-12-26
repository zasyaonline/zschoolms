import express from 'express';
import * as schoolController from '../controllers/school.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Schools
 *   description: School management endpoints
 */

/**
 * @swagger
 * /api/schools:
 *   get:
 *     summary: Get all schools
 *     tags: [Schools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, address, or city
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
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
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of schools
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticate, schoolController.getSchools);

/**
 * @swagger
 * /api/schools/{id}:
 *   get:
 *     summary: Get school by ID
 *     tags: [Schools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: School ID
 *     responses:
 *       200:
 *         description: School details
 *       404:
 *         description: School not found
 */
router.get('/:id', authenticate, schoolController.getSchoolById);

/**
 * @swagger
 * /api/schools/{id}/stats:
 *   get:
 *     summary: Get school statistics
 *     tags: [Schools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: School ID
 *     responses:
 *       200:
 *         description: School statistics
 *       404:
 *         description: School not found
 */
router.get('/:id/stats', authenticate, schoolController.getSchoolStats);

/**
 * @swagger
 * /api/schools:
 *   post:
 *     summary: Create a new school
 *     tags: [Schools]
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
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Vision Academy"
 *               code:
 *                 type: string
 *                 example: "VA001"
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               country:
 *                 type: string
 *                 default: "USA"
 *               postalCode:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               website:
 *                 type: string
 *               principalName:
 *                 type: string
 *               establishedYear:
 *                 type: integer
 *               schoolType:
 *                 type: string
 *                 enum: [public, private, charter, religious, other]
 *               logoUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: School created
 *       400:
 *         description: Validation error
 */
router.post('/', authenticate, authorize(['admin']), schoolController.createSchool);

/**
 * @swagger
 * /api/schools/{id}:
 *   put:
 *     summary: Update a school
 *     tags: [Schools]
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
 *               code:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               country:
 *                 type: string
 *               postalCode:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               website:
 *                 type: string
 *               principalName:
 *                 type: string
 *               establishedYear:
 *                 type: integer
 *               schoolType:
 *                 type: string
 *               logoUrl:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: School updated
 *       404:
 *         description: School not found
 */
router.put('/:id', authenticate, authorize(['admin']), schoolController.updateSchool);

/**
 * @swagger
 * /api/schools/{id}:
 *   delete:
 *     summary: Delete a school (soft delete)
 *     tags: [Schools]
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
 *         description: School deleted
 *       404:
 *         description: School not found
 */
router.delete('/:id', authenticate, authorize(['admin']), schoolController.deleteSchool);

export default router;
