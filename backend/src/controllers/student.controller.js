import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../utils/logger.js';
import * as studentService from '../services/student.service.js';
import csv from 'csv-parser';
import { Readable } from 'stream';

/**
 * Phase 3: Student Management Controllers
 */

/**
 * Create new student
 */
export const createStudent = async (req, res) => {
  try {
    const {
      userId,
      enrollmentNumber,
      dateOfBirth,
      gender,
      bloodGroup,
      admissionDate,
      currentClass,
      section,
      rollNumber,
      parentId,
      sponsorId,
      address,
      city,
      state,
      pincode,
      emergencyContact,
      emergencyContactName,
      medicalInfo,
      previousSchool,
      remarks,
    } = req.body;

    // Validate required fields
    if (!userId || !dateOfBirth || !gender || !admissionDate || !currentClass) {
      return errorResponse(res, 'Missing required fields', 400);
    }

    const student = await studentService.createStudent(
      {
        userId,
        enrollmentNumber,
        dateOfBirth,
        gender,
        bloodGroup,
        admissionDate,
        currentClass,
        section,
        rollNumber,
        parentId,
        sponsorId,
        address,
        city,
        state,
        pincode,
        emergencyContact,
        emergencyContactName,
        medicalInfo,
        previousSchool,
        remarks,
      },
      req.user.id
    );

    successResponse(res, { student }, 'Student created successfully', 201);
  } catch (error) {
    logger.error('Create student error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return errorResponse(res, 'Enrollment number already exists', 409);
    }
    errorResponse(res, 'Failed to create student', 500);
  }
};

/**
 * Get list of students with pagination and filtering
 * Note: Sponsor data is hidden from teachers for privacy
 */
export const getStudents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      currentClass,
      section,
      isActive,
      search,
      parentId,
      sponsorId,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = req.query;

    // Validate limit
    if (limit > 100) {
      return errorResponse(res, 'Maximum limit is 100', 400);
    }

    // Teachers should not be able to filter by sponsor
    const userRole = req.user?.role;
    const isTeacher = userRole === 'teacher';
    
    const result = await studentService.getStudents({
      page,
      limit,
      currentClass,
      section,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      search,
      parentId,
      sponsorId: isTeacher ? undefined : sponsorId, // Teachers can't filter by sponsor
      sortBy,
      sortOrder,
    });

    // Remove sponsor data from response for teachers
    if (isTeacher && result.students) {
      result.students = result.students.map(student => {
        const { sponsor, sponsorId, sponsor_id, ...studentWithoutSponsor } = student;
        return studentWithoutSponsor;
      });
    }

    successResponse(res, result);
  } catch (error) {
    logger.error('Get students error:', error);
    errorResponse(res, 'Failed to fetch students', 500);
  }
};

/**
 * Get student by ID
 * Note: Sponsor data is hidden from teachers for privacy
 */
export const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    let student = await studentService.getStudentById(id);

    if (!student) {
      return errorResponse(res, 'Student not found', 404);
    }

    // Remove sponsor data for teachers
    const userRole = req.user?.role;
    if (userRole === 'teacher') {
      const { sponsor, sponsorId, sponsor_id, ...studentWithoutSponsor } = student;
      student = studentWithoutSponsor;
    }

    successResponse(res, { student });
  } catch (error) {
    logger.error('Get student by ID error:', error);
    errorResponse(res, 'Failed to fetch student', 500);
  }
};

/**
 * Get student by enrollment number
 * Note: Sponsor data is hidden from teachers for privacy
 */
export const getStudentByEnrollment = async (req, res) => {
  try {
    const { enrollmentNumber } = req.params;

    let student = await studentService.getStudentByEnrollment(enrollmentNumber);

    if (!student) {
      return errorResponse(res, 'Student not found', 404);
    }

    // Remove sponsor data for teachers
    const userRole = req.user?.role;
    if (userRole === 'teacher') {
      const { sponsor, sponsorId, sponsor_id, ...studentWithoutSponsor } = student;
      student = studentWithoutSponsor;
    }

    successResponse(res, { student });
  } catch (error) {
    logger.error('Get student by enrollment error:', error);
    errorResponse(res, 'Failed to fetch student', 500);
  }
};

/**
 * Update student
 */
export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const student = await studentService.updateStudent(id, updates, req.user.id);

    if (!student) {
      return errorResponse(res, 'Student not found', 404);
    }

    successResponse(res, { student }, 'Student updated successfully');
  } catch (error) {
    logger.error('Update student error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return errorResponse(res, 'Enrollment number already exists', 409);
    }
    errorResponse(res, 'Failed to update student', 500);
  }
};

/**
 * Delete student (soft delete)
 */
export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const success = await studentService.deleteStudent(id, req.user.id);

    if (!success) {
      return errorResponse(res, 'Student not found', 404);
    }

    successResponse(res, null, 'Student deleted successfully');
  } catch (error) {
    logger.error('Delete student error:', error);
    errorResponse(res, 'Failed to delete student', 500);
  }
};

/**
 * Map parent to student
 */
export const mapParent = async (req, res) => {
  try {
    const { id } = req.params;
    const { parentId } = req.body;

    if (!parentId) {
      return errorResponse(res, 'Parent ID is required', 400);
    }

    const result = await studentService.mapParentToStudent(id, parentId, req.user.id);

    if (!result.success) {
      return errorResponse(res, result.message, 400);
    }

    successResponse(res, null, result.message);
  } catch (error) {
    logger.error('Map parent error:', error);
    errorResponse(res, 'Failed to map parent', 500);
  }
};

/**
 * Map sponsor to student
 */
export const mapSponsor = async (req, res) => {
  try {
    const { id } = req.params;
    const { sponsorId } = req.body;

    if (!sponsorId) {
      return errorResponse(res, 'Sponsor ID is required', 400);
    }

    const result = await studentService.mapSponsorToStudent(id, sponsorId, req.user.id);

    if (!result.success) {
      return errorResponse(res, result.message, 400);
    }

    successResponse(res, null, result.message);
  } catch (error) {
    logger.error('Map sponsor error:', error);
    errorResponse(res, 'Failed to map sponsor', 500);
  }
};

/**
 * Bulk import students from CSV
 */
export const bulkImportStudents = async (req, res) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'CSV file is required', 400);
    }

    const studentsData = [];
    const fileBuffer = req.file.buffer;

    // Parse CSV
    const stream = Readable.from(fileBuffer.toString());
    
    stream
      .pipe(csv())
      .on('data', (row) => {
        studentsData.push(row);
      })
      .on('end', async () => {
        try {
          const results = await studentService.bulkImportStudents(studentsData, req.user.id);
          successResponse(res, results, 'Bulk import completed');
        } catch (error) {
          logger.error('Bulk import processing error:', error);
          errorResponse(res, 'Failed to import students', 500);
        }
      })
      .on('error', (error) => {
        logger.error('CSV parsing error:', error);
        errorResponse(res, 'Invalid CSV file', 400);
      });
  } catch (error) {
    logger.error('Bulk import error:', error);
    errorResponse(res, 'Failed to import students', 500);
  }
};

/**
 * Get student statistics
 */
export const getStudentStats = async (req, res) => {
  try {
    const stats = await studentService.getStudentStats();
    successResponse(res, { stats });
  } catch (error) {
    logger.error('Get student stats error:', error);
    errorResponse(res, 'Failed to fetch statistics', 500);
  }
};

/**
 * Upload student profile photo
 */
export const uploadStudentPhoto = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if file was uploaded
    if (!req.file) {
      return errorResponse(res, 'No photo file uploaded', 400);
    }

    // Get student to verify existence
    const student = await studentService.getStudentById(id);
    if (!student) {
      return errorResponse(res, 'Student not found', 404);
    }

    // Construct the photo URL
    const photoUrl = `/uploads/photos/${req.file.filename}`;

    // Update student record with photo URL
    await studentService.updateStudent(id, { photo: photoUrl }, req.user.id);

    logger.info(`Photo uploaded for student ${id}: ${photoUrl}`);

    successResponse(res, { 
      photoUrl,
      message: 'Photo uploaded successfully'
    });
  } catch (error) {
    logger.error('Upload student photo error:', error);
    
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      const fs = await import('fs');
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        logger.error('Failed to clean up uploaded file:', unlinkError);
      }
    }
    
    errorResponse(res, error.message || 'Failed to upload photo', 500);
  }
};
