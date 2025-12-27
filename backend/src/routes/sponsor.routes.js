import express from 'express';
import * as sponsorController from '../controllers/sponsor.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

/**
 * Sponsor Management Routes
 * Base path: /api/sponsors
 * All routes require authentication
 */

/**
 * @swagger
 * /api/sponsors:
 *   post:
 *     summary: Create new sponsor
 *     tags: [Sponsors]
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
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe Foundation"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@foundation.org"
 *               phoneNumber:
 *                 type: string
 *                 example: "+1234567890"
 *               country:
 *                 type: string
 *                 example: "USA"
 *               organization:
 *                 type: string
 *                 example: "John Doe Foundation"
 *               sponsorshipType:
 *                 type: string
 *                 enum: [individual, organization]
 *                 example: "organization"
 *               status:
 *                 type: string
 *                 enum: [active, inactive, suspended]
 *                 example: "active"
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               postalCode:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Sponsor created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already exists
 */
router.post('/', authenticate, authorize('admin', 'super_admin'), sponsorController.createSponsor);

/**
 * @swagger
 * /api/sponsors:
 *   get:
 *     summary: Get all sponsors with pagination and filters
 *     tags: [Sponsors]
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
 *           maximum: 100
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, suspended]
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *       - in: query
 *         name: sponsorshipType
 *         schema:
 *           type: string
 *           enum: [individual, organization]
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, email, or organization
 *     responses:
 *       200:
 *         description: Sponsors retrieved successfully
 */
router.get('/', authenticate, authorize('admin', 'super_admin'), sponsorController.getSponsors);

/**
 * @swagger
 * /api/sponsors/stats:
 *   get:
 *     summary: Get sponsor statistics
 *     tags: [Sponsors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalSponsors:
 *                   type: integer
 *                 activeSponsors:
 *                   type: integer
 *                 inactiveSponsors:
 *                   type: integer
 *                 byType:
 *                   type: object
 *                   properties:
 *                     individual:
 *                       type: integer
 *                     organization:
 *                       type: integer
 *                 sponsorships:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     active:
 *                       type: integer
 *                     expiringSoon:
 *                       type: integer
 */
router.get('/stats', authenticate, authorize('admin', 'super_admin'), sponsorController.getSponsorStats);

/**
 * @swagger
 * /api/sponsors/summary:
 *   get:
 *     summary: Get sponsorship summary for admin dashboard
 *     tags: [Sponsors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sponsorship summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sponsors:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     active:
 *                       type: integer
 *                     inactive:
 *                       type: integer
 *                 sponsorships:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     active:
 *                       type: integer
 *                     expired:
 *                       type: integer
 *                     terminated:
 *                       type: integer
 *                     expiringSoon:
 *                       type: integer
 */
router.get('/summary', authenticate, authorize('admin', 'super_admin'), sponsorController.getSponsorshipSummary);

/**
 * @swagger
 * /api/sponsors/available-students:
 *   get:
 *     summary: Get students available for sponsorship (not currently sponsored)
 *     tags: [Sponsors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sponsorId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Optional. If provided, excludes students already sponsored by this sponsor only
 *       - in: query
 *         name: grade
 *         schema:
 *           type: string
 *         description: Filter by grade
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by student name
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *     responses:
 *       200:
 *         description: Available students retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 students:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       currentGrade:
 *                         type: string
 *                       admissionNumber:
 *                         type: string
 *                 pagination:
 *                   type: object
 */
router.get('/available-students', authenticate, authorize('admin', 'super_admin'), sponsorController.getAvailableStudents);

/**
 * @swagger
 * /api/sponsors/{id}:
 *   get:
 *     summary: Get sponsor by ID with mapped students
 *     tags: [Sponsors]
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
 *         description: Sponsor retrieved successfully
 *       404:
 *         description: Sponsor not found
 */
router.get('/:id', authenticate, authorize('admin', 'super_admin'), sponsorController.getSponsorById);

/**
 * @swagger
 * /api/sponsors/{id}:
 *   put:
 *     summary: Update sponsor details
 *     tags: [Sponsors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               country:
 *                 type: string
 *               organization:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive, suspended]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sponsor updated successfully
 *       404:
 *         description: Sponsor not found
 *       409:
 *         description: Email already exists
 */
router.put('/:id', authenticate, authorize('admin', 'super_admin'), sponsorController.updateSponsor);

/**
 * @swagger
 * /api/sponsors/{id}:
 *   delete:
 *     summary: Delete sponsor (soft delete)
 *     tags: [Sponsors]
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
 *         description: Sponsor deleted successfully
 *       404:
 *         description: Sponsor not found
 *       409:
 *         description: Cannot delete sponsor with active sponsorships
 */
router.delete('/:id', authenticate, authorize('super_admin'), sponsorController.deleteSponsor);

/**
 * @swagger
 * /api/sponsors/{sponsorId}/map-student:
 *   post:
 *     summary: Map sponsor to student (create sponsorship)
 *     tags: [Sponsors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sponsorId
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
 *               - studentId
 *               - sponsorshipType
 *               - startDate
 *             properties:
 *               studentId:
 *                 type: string
 *                 format: uuid
 *               sponsorshipType:
 *                 type: string
 *                 enum: [full, partial, one-time]
 *                 example: "full"
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-01-01"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *               amount:
 *                 type: number
 *                 format: decimal
 *                 example: 500.00
 *               currency:
 *                 type: string
 *                 default: "USD"
 *                 example: "USD"
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Sponsor mapped to student successfully
 *       400:
 *         description: Validation error or sponsor not active
 *       404:
 *         description: Student or sponsor not found
 *       409:
 *         description: Active sponsorship already exists
 */
router.post('/:sponsorId/map-student', authenticate, authorize('admin', 'super_admin'), sponsorController.mapSponsorToStudent);

/**
 * @swagger
 * /api/sponsors/{sponsorId}/students:
 *   get:
 *     summary: Get all students mapped to a sponsor
 *     tags: [Sponsors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sponsorId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, expired, terminated]
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
 *     responses:
 *       200:
 *         description: Sponsor students retrieved successfully
 *       404:
 *         description: Sponsor not found
 */
router.get('/:sponsorId/students', authenticate, authorize('admin', 'super_admin'), sponsorController.getSponsorStudents);

/**
 * @swagger
 * /api/sponsors/mapping/{mappingId}:
 *   put:
 *     summary: Update sponsorship mapping
 *     tags: [Sponsors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mappingId
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
 *             properties:
 *               sponsorshipType:
 *                 type: string
 *                 enum: [full, partial, one-time]
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               amount:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [active, expired, terminated]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Mapping updated successfully
 *       404:
 *         description: Mapping not found
 */
router.put('/mapping/:mappingId', authenticate, authorize('admin', 'super_admin'), sponsorController.updateSponsorshipMapping);

/**
 * @swagger
 * /api/sponsors/mapping/{mappingId}/terminate:
 *   post:
 *     summary: Terminate sponsorship
 *     tags: [Sponsors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mappingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "Student graduated"
 *     responses:
 *       200:
 *         description: Sponsorship terminated successfully
 *       404:
 *         description: Mapping not found
 */
router.post('/mapping/:mappingId/terminate', authenticate, authorize('admin', 'super_admin'), sponsorController.terminateSponsorship);

/**
 * @swagger
 * /api/sponsors/me/students:
 *   get:
 *     summary: Get students sponsored by the logged-in sponsor
 *     description: Returns all students mapped to the currently authenticated sponsor user
 *     tags: [Sponsors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, expired, terminated]
 *         description: Filter by sponsorship status
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
 *     responses:
 *       200:
 *         description: Sponsored students retrieved successfully
 *       403:
 *         description: User is not a sponsor
 *       404:
 *         description: Sponsor profile not found
 */
router.get('/me/students', authenticate, authorize('sponsor'), sponsorController.getMySponsoredStudents);

/**
 * @swagger
 * /api/sponsors/me/dashboard:
 *   get:
 *     summary: Get sponsor dashboard data
 *     description: Returns dashboard metrics for the currently authenticated sponsor
 *     tags: [Sponsors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *       403:
 *         description: User is not a sponsor
 *       404:
 *         description: Sponsor profile not found
 */
router.get('/me/dashboard', authenticate, authorize('sponsor'), sponsorController.getSponsorDashboard);

export default router;
