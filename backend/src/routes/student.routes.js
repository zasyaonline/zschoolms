import express from 'express';
import multer from 'multer';
import {
  createStudent,
  getStudents,
  getStudentById,
  getStudentByEnrollment,
  updateStudent,
  deleteStudent,
  mapParent,
  mapSponsor,
  bulkImportStudents,
  getStudentStats,
} from '../controllers/student.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for CSV file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

// Authorization middleware
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }
    next();
  };
};

/**
 * @swagger
 * /api/students:
 *   post:
 *     summary: Create new student
 *     tags: [Students]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - dateOfBirth
 *               - gender
 *               - admissionDate
 *               - currentClass
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *               enrollmentNumber:
 *                 type: string
 *                 description: Auto-generated if not provided
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *               bloodGroup:
 *                 type: string
 *               admissionDate:
 *                 type: string
 *                 format: date
 *               currentClass:
 *                 type: string
 *               section:
 *                 type: string
 *               rollNumber:
 *                 type: string
 *               parentId:
 *                 type: string
 *                 format: uuid
 *               sponsorId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Student created successfully
 *       400:
 *         description: Missing required fields
 *       409:
 *         description: Enrollment number already exists
 */
router.post('/', authenticate, authorizeRoles('admin', 'teacher'), createStudent);

/**
 * @swagger
 * /api/students:
 *   get:
 *     summary: Get list of students
 *     tags: [Students]
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
 *         name: currentClass
 *         schema:
 *           type: string
 *       - in: query
 *         name: section
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by enrollment or roll number
 *     responses:
 *       200:
 *         description: Students list with pagination
 */
router.get('/', authenticate, authorizeRoles('admin', 'teacher'), getStudents);

/**
 * @swagger
 * /api/students/stats:
 *   get:
 *     summary: Get student statistics
 *     tags: [Students]
 *     responses:
 *       200:
 *         description: Student statistics
 */
router.get('/stats', authenticate, authorizeRoles('admin'), getStudentStats);

/**
 * @swagger
 * /api/students/enrollment/{enrollmentNumber}:
 *   get:
 *     summary: Get student by enrollment number
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: enrollmentNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student details
 *       404:
 *         description: Student not found
 */
router.get('/enrollment/:enrollmentNumber', authenticate, getStudentByEnrollment);

/**
 * @swagger
 * /api/students/{id}:
 *   get:
 *     summary: Get student by ID
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Student details
 *       404:
 *         description: Student not found
 */
router.get('/:id', authenticate, getStudentById);

/**
 * @swagger
 * /api/students/{id}:
 *   put:
 *     summary: Update student
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Student updated successfully
 */
router.put('/:id', authenticate, authorizeRoles('admin', 'teacher'), updateStudent);

/**
 * @swagger
 * /api/students/{id}:
 *   delete:
 *     summary: Delete student (soft delete)
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Student deleted successfully
 */
router.delete('/:id', authenticate, authorizeRoles('admin'), deleteStudent);

/**
 * @swagger
 * /api/students/{id}/map-parent:
 *   post:
 *     summary: Map parent to student
 *     tags: [Students]
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
 *               - parentId
 *             properties:
 *               parentId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Parent mapped successfully
 */
router.post('/:id/map-parent', authenticate, authorizeRoles('admin', 'teacher'), mapParent);

/**
 * @swagger
 * /api/students/{id}/map-sponsor:
 *   post:
 *     summary: Map sponsor to student
 *     tags: [Students]
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
 *               - sponsorId
 *             properties:
 *               sponsorId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Sponsor mapped successfully
 */
router.post('/:id/map-sponsor', authenticate, authorizeRoles('admin'), mapSponsor);

/**
 * @swagger
 * /api/students/import:
 *   post:
 *     summary: Bulk import students from CSV
 *     tags: [Students]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Bulk import completed
 */
router.post(
  '/import',
  authenticate,
  authorizeRoles('admin'),
  upload.single('file'),
  bulkImportStudents
);

export default router;
