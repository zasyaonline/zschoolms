import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { Teacher, ClassSubject, ClassSection, Class, Subject, AcademicYear, User, Student } from '../models/index.js';
import { Op } from 'sequelize';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Teachers
 *   description: Teacher-specific endpoints
 */

/**
 * @swagger
 * /api/teachers/me:
 *   get:
 *     summary: Get current teacher profile
 *     tags: [Teachers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Teacher profile retrieved
 *       403:
 *         description: Not a teacher
 *       404:
 *         description: Teacher record not found
 */
router.get('/me', authenticate, authorize('teacher'), async (req, res) => {
  try {
    const teacher = await Teacher.findByUserId(req.user.id);
    
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher record not found. Please contact administrator.'
      });
    }

    res.json({
      success: true,
      data: {
        id: teacher.id,
        user_id: teacher.user_id,
        school_id: teacher.school_id,
        user: {
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          email: req.user.email
        }
      }
    });
  } catch (error) {
    console.error('Error fetching teacher profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teacher profile',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/teachers/me/classes:
 *   get:
 *     summary: Get classes assigned to current teacher
 *     tags: [Teachers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: academicYearId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by academic year (optional, defaults to current)
 *     responses:
 *       200:
 *         description: List of assigned classes
 */
router.get('/me/classes', authenticate, authorize('teacher'), async (req, res) => {
  try {
    const teacher = await Teacher.findByUserId(req.user.id);
    
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher record not found'
      });
    }

    const { academicYearId } = req.query;

    // Get unique class sections the teacher is assigned to
    const classSections = await ClassSubject.getTeacherClassSections(teacher.id, academicYearId);

    // Format response
    const classes = classSections.map(section => ({
      id: section.id,
      className: section.class?.name || 'Unknown',
      section: section.section,
      displayName: `${section.class?.name || 'Unknown'} - Section ${section.section}`,
      classId: section.class_id,
      academicYearId: section.academic_year_id
    }));

    res.json({
      success: true,
      data: {
        classes,
        count: classes.length
      }
    });
  } catch (error) {
    console.error('Error fetching teacher classes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assigned classes',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/teachers/me/subjects:
 *   get:
 *     summary: Get subjects assigned to current teacher
 *     tags: [Teachers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: academicYearId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by academic year (optional)
 *       - in: query
 *         name: classSectionId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by class section (optional)
 *     responses:
 *       200:
 *         description: List of assigned subjects
 */
router.get('/me/subjects', authenticate, authorize('teacher'), async (req, res) => {
  try {
    const teacher = await Teacher.findByUserId(req.user.id);
    
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher record not found'
      });
    }

    const { academicYearId, classSectionId } = req.query;

    let classSubjects;
    
    if (classSectionId) {
      // Get subjects for a specific class section
      classSubjects = await ClassSubject.getTeacherSubjectsInSection(teacher.id, classSectionId, academicYearId);
    } else {
      // Get all subjects assigned to this teacher
      classSubjects = await ClassSubject.getByTeacher(teacher.id, academicYearId);
    }

    // Format response
    const subjects = classSubjects.map(cs => ({
      id: cs.id,
      subjectId: cs.subject_id,
      subjectName: cs.subject?.name || 'Unknown',
      subjectCode: cs.subject?.code || '',
      classSectionId: cs.class_section_id,
      className: cs.classSection?.class?.name || 'Unknown',
      section: cs.classSection?.section || '',
      displayName: `${cs.subject?.name || 'Unknown'} - ${cs.classSection?.class?.name || 'Unknown'} ${cs.classSection?.section || ''}`,
      academicYearId: cs.academic_year_id,
      academicYear: cs.academicYear?.name || ''
    }));

    res.json({
      success: true,
      data: {
        subjects,
        count: subjects.length
      }
    });
  } catch (error) {
    console.error('Error fetching teacher subjects:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assigned subjects',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/teachers/me/class-subjects:
 *   get:
 *     summary: Get all class-subject assignments for current teacher
 *     tags: [Teachers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: academicYearId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by academic year (optional)
 *     responses:
 *       200:
 *         description: List of class-subject assignments with details
 */
router.get('/me/class-subjects', authenticate, authorize('teacher'), async (req, res) => {
  try {
    const teacher = await Teacher.findByUserId(req.user.id);
    
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher record not found'
      });
    }

    const { academicYearId } = req.query;

    const classSubjects = await ClassSubject.getByTeacher(teacher.id, academicYearId);

    // Format response with full details
    const assignments = classSubjects.map(cs => ({
      id: cs.id,
      subject: {
        id: cs.subject?.id,
        name: cs.subject?.name,
        code: cs.subject?.code
      },
      classSection: {
        id: cs.classSection?.id,
        section: cs.classSection?.section,
        class: {
          id: cs.classSection?.class?.id,
          name: cs.classSection?.class?.name,
          level: cs.classSection?.class?.level
        }
      },
      academicYear: {
        id: cs.academicYear?.id,
        name: cs.academicYear?.name,
        isCurrent: cs.academicYear?.is_current
      }
    }));

    res.json({
      success: true,
      data: {
        assignments,
        count: assignments.length
      }
    });
  } catch (error) {
    console.error('Error fetching class-subject assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch class-subject assignments',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/teachers/me/students:
 *   get:
 *     summary: Get students from teacher's assigned classes (without sponsor data)
 *     tags: [Teachers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: classSectionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Class section ID
 *       - in: query
 *         name: academicYearId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Academic year ID (optional)
 *     responses:
 *       200:
 *         description: List of students (without sponsor data)
 *       403:
 *         description: Not assigned to this class
 */
router.get('/me/students', authenticate, authorize('teacher'), async (req, res) => {
  try {
    const { classSectionId, academicYearId } = req.query;

    if (!classSectionId) {
      return res.status(400).json({
        success: false,
        message: 'classSectionId is required'
      });
    }

    const teacher = await Teacher.findByUserId(req.user.id);
    
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher record not found'
      });
    }

    // Verify teacher is assigned to this class section
    const isAssigned = await Teacher.isAssignedToSection(teacher.id, classSectionId, academicYearId);
    
    if (!isAssigned) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to teach this class section'
      });
    }

    // Get students in this class section
    // Note: This assumes there's a student enrollment table linking students to class sections
    // For now, we'll query students and filter by class info
    const students = await Student.findAll({
      where: {
        class_section_id: classSectionId,
        ...(academicYearId && { academic_year_id: academicYearId })
      },
      attributes: [
        'id', 
        'admission_number',
        'roll_number',
        'date_of_birth',
        'gender',
        'enrollment_date'
        // Explicitly exclude sponsor_id and sponsor-related fields
      ],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ],
      order: [['roll_number', 'ASC']]
    });

    // Format response - explicitly exclude sponsor information
    const studentList = students.map(s => ({
      id: s.id,
      admissionNumber: s.admission_number,
      rollNumber: s.roll_number,
      firstName: s.user?.first_name,
      lastName: s.user?.last_name,
      fullName: `${s.user?.first_name || ''} ${s.user?.last_name || ''}`.trim(),
      email: s.user?.email,
      dateOfBirth: s.date_of_birth,
      gender: s.gender,
      enrollmentDate: s.enrollment_date
    }));

    res.json({
      success: true,
      data: {
        students: studentList,
        count: studentList.length,
        classSectionId
      }
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/teachers/me/dashboard:
 *   get:
 *     summary: Get teacher dashboard summary
 *     tags: [Teachers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary
 */
router.get('/me/dashboard', authenticate, authorize('teacher'), async (req, res) => {
  try {
    const teacher = await Teacher.findByUserId(req.user.id);
    
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher record not found'
      });
    }

    // Get current academic year
    const currentYear = await AcademicYear.findOne({
      where: { is_current: true }
    });

    // Get class-subject assignments
    const classSubjects = await ClassSubject.getByTeacher(
      teacher.id, 
      currentYear?.id
    );

    // Get unique class sections
    const uniqueSections = new Set(classSubjects.map(cs => cs.class_section_id));

    // Get unique subjects
    const uniqueSubjects = new Set(classSubjects.map(cs => cs.subject_id));

    // Check for pending marksheets (submitted by teacher, awaiting approval)
    const { Marksheet } = await import('../models/index.js');
    const pendingMarksheets = await Marksheet.count({
      where: {
        submitted_by: req.user.id,
        status: 'submitted'
      }
    });

    // Check for rejected marksheets
    const rejectedMarksheets = await Marksheet.count({
      where: {
        submitted_by: req.user.id,
        status: 'rejected'
      }
    });

    res.json({
      success: true,
      data: {
        teacher: {
          id: teacher.id,
          name: `${req.user.firstName} ${req.user.lastName}`
        },
        currentAcademicYear: currentYear ? {
          id: currentYear.id,
          name: currentYear.name
        } : null,
        stats: {
          totalClasses: uniqueSections.size,
          totalSubjects: uniqueSubjects.size,
          pendingApprovals: pendingMarksheets,
          rejectedMarksheets: rejectedMarksheets
        }
      }
    });
  } catch (error) {
    console.error('Error fetching teacher dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard',
      error: error.message
    });
  }
});

export default router;
