import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as academicYearService from '../services/academicyear.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * Academic Year Management Routes
 * Base path: /api/academic-years
 */

// ============================================================================
// Academic Year CRUD
// ============================================================================

/**
 * @swagger
 * /api/academic-years:
 *   get:
 *     summary: Get all academic years
 *     tags: [Academic Years]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeStats
 *         schema:
 *           type: boolean
 *         description: Include enrollment counts
 *     responses:
 *       200:
 *         description: List of academic years
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { includeStats, schoolId } = req.query;
    const academicYears = await academicYearService.getAcademicYears({
      includeStats: includeStats === 'true',
      schoolId,
    });
    return successResponse(res, 'Academic years retrieved', academicYears);
  } catch (error) {
    logger.error('Error getting academic years:', error);
    return errorResponse(res, error.message, 500);
  }
});

/**
 * @swagger
 * /api/academic-years/current:
 *   get:
 *     summary: Get current academic year
 *     tags: [Academic Years]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current academic year
 */
router.get('/current', authenticate, async (req, res) => {
  try {
    const academicYear = await academicYearService.getCurrentAcademicYear();
    if (!academicYear) {
      return errorResponse(res, 'No current academic year set', 404);
    }
    return successResponse(res, 'Current academic year retrieved', academicYear);
  } catch (error) {
    logger.error('Error getting current academic year:', error);
    return errorResponse(res, error.message, 500);
  }
});

/**
 * @swagger
 * /api/academic-years/{id}:
 *   get:
 *     summary: Get academic year by ID
 *     tags: [Academic Years]
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
 *         description: Academic year details
 *       404:
 *         description: Academic year not found
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const academicYear = await academicYearService.getAcademicYearById(req.params.id);
    if (!academicYear) {
      return errorResponse(res, 'Academic year not found', 404);
    }
    return successResponse(res, 'Academic year retrieved', academicYear);
  } catch (error) {
    logger.error('Error getting academic year:', error);
    return errorResponse(res, error.message, 500);
  }
});

/**
 * @swagger
 * /api/academic-years:
 *   post:
 *     summary: Create new academic year
 *     description: Super Admin only - creates a new academic year
 *     tags: [Academic Years]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - year
 *               - startDate
 *               - endDate
 *             properties:
 *               year:
 *                 type: string
 *                 example: "2024-2025"
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-04-01"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-03-31"
 *               isCurrent:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Academic year created
 *       400:
 *         description: Validation error
 */
router.post('/', authenticate, authorize('super_admin', 'admin'), async (req, res) => {
  try {
    const { year, startDate, endDate, isCurrent } = req.body;

    if (!year || !startDate || !endDate) {
      return errorResponse(res, 'Year, start date, and end date are required', 400);
    }

    const academicYear = await academicYearService.createAcademicYear(
      { year, startDate, endDate, isCurrent },
      req.user.id
    );

    return successResponse(res, 'Academic year created', academicYear, 201);
  } catch (error) {
    logger.error('Error creating academic year:', error);
    return errorResponse(res, error.message, 400);
  }
});

/**
 * @swagger
 * /api/academic-years/{id}:
 *   put:
 *     summary: Update academic year
 *     description: Super Admin only
 *     tags: [Academic Years]
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
 *               year:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               isCurrent:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Academic year updated
 */
router.put('/:id', authenticate, authorize('super_admin', 'admin'), async (req, res) => {
  try {
    const academicYear = await academicYearService.updateAcademicYear(
      req.params.id,
      req.body,
      req.user.id
    );
    return successResponse(res, 'Academic year updated', academicYear);
  } catch (error) {
    logger.error('Error updating academic year:', error);
    return errorResponse(res, error.message, 400);
  }
});

/**
 * @swagger
 * /api/academic-years/{id}:
 *   delete:
 *     summary: Delete academic year
 *     description: Super Admin only - cannot delete if enrollments exist
 *     tags: [Academic Years]
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
 *         description: Academic year deleted
 */
router.delete('/:id', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    await academicYearService.deleteAcademicYear(req.params.id);
    return successResponse(res, 'Academic year deleted');
  } catch (error) {
    logger.error('Error deleting academic year:', error);
    return errorResponse(res, error.message, 400);
  }
});

/**
 * @swagger
 * /api/academic-years/{id}/set-current:
 *   post:
 *     summary: Set academic year as current
 *     description: Super Admin only
 *     tags: [Academic Years]
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
 *         description: Academic year set as current
 */
router.post('/:id/set-current', authenticate, authorize('super_admin', 'admin'), async (req, res) => {
  try {
    const academicYear = await academicYearService.setCurrentAcademicYear(
      req.params.id,
      req.user.id
    );
    return successResponse(res, 'Academic year set as current', academicYear);
  } catch (error) {
    logger.error('Error setting current academic year:', error);
    return errorResponse(res, error.message, 400);
  }
});

// ============================================================================
// Enrollment Management
// ============================================================================

/**
 * @swagger
 * /api/academic-years/{id}/enrollments:
 *   get:
 *     summary: Get enrollments for academic year
 *     tags: [Academic Years]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: grade
 *         schema:
 *           type: string
 *       - in: query
 *         name: section
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of enrollments
 */
router.get('/:id/enrollments', authenticate, async (req, res) => {
  try {
    const { grade, section, isActive } = req.query;
    const enrollments = await academicYearService.getEnrollments(req.params.id, {
      grade,
      section,
      isActive: isActive === 'false' ? false : isActive === 'true' ? true : null,
    });
    return successResponse(res, 'Enrollments retrieved', enrollments);
  } catch (error) {
    logger.error('Error getting enrollments:', error);
    return errorResponse(res, error.message, 500);
  }
});

/**
 * @swagger
 * /api/academic-years/{id}/enrollments:
 *   post:
 *     summary: Enroll student in academic year
 *     tags: [Academic Years]
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
 *             required:
 *               - studentId
 *             properties:
 *               studentId:
 *                 type: string
 *                 format: uuid
 *               grade:
 *                 type: string
 *               section:
 *                 type: string
 *               schoolId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Student enrolled
 */
router.post('/:id/enrollments', authenticate, authorize('super_admin', 'admin'), async (req, res) => {
  try {
    const { studentId, grade, section, schoolId } = req.body;

    if (!studentId) {
      return errorResponse(res, 'Student ID is required', 400);
    }

    const enrollment = await academicYearService.enrollStudent({
      studentId,
      academicYearId: req.params.id,
      grade,
      section,
      schoolId,
    }, req.user.id);

    return successResponse(res, 'Student enrolled', enrollment, 201);
  } catch (error) {
    logger.error('Error enrolling student:', error);
    return errorResponse(res, error.message, 400);
  }
});

/**
 * @swagger
 * /api/academic-years/{id}/enrollments/bulk:
 *   post:
 *     summary: Bulk enroll students in academic year
 *     tags: [Academic Years]
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
 *             required:
 *               - students
 *             properties:
 *               students:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     studentId:
 *                       type: string
 *                       format: uuid
 *                     grade:
 *                       type: string
 *                     section:
 *                       type: string
 *     responses:
 *       200:
 *         description: Bulk enrollment results
 */
router.post('/:id/enrollments/bulk', authenticate, authorize('super_admin', 'admin'), async (req, res) => {
  try {
    const { students } = req.body;

    if (!students || !Array.isArray(students) || students.length === 0) {
      return errorResponse(res, 'Students array is required', 400);
    }

    const results = await academicYearService.bulkEnrollStudents(
      req.params.id,
      students,
      req.user.id
    );

    return successResponse(res, 'Bulk enrollment completed', results);
  } catch (error) {
    logger.error('Error in bulk enrollment:', error);
    return errorResponse(res, error.message, 400);
  }
});

/**
 * @swagger
 * /api/academic-years/enrollments/{enrollmentId}:
 *   patch:
 *     summary: Update enrollment
 *     tags: [Academic Years]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: enrollmentId
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
 *               grade:
 *                 type: string
 *               section:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Enrollment updated
 */
router.patch('/enrollments/:enrollmentId', authenticate, authorize('super_admin', 'admin'), async (req, res) => {
  try {
    const enrollment = await academicYearService.updateEnrollment(
      req.params.enrollmentId,
      req.body,
      req.user.id
    );
    return successResponse(res, 'Enrollment updated', enrollment);
  } catch (error) {
    logger.error('Error updating enrollment:', error);
    return errorResponse(res, error.message, 400);
  }
});

export default router;
