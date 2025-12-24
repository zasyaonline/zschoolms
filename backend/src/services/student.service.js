import { Op } from 'sequelize';
import Student from '../models/Student.js';
import { User } from '../models/index.js';
import logger from '../utils/logger.js';
import { AuditLog } from '../models/index.js';

/**
 * Student Management Service
 * Handles student CRUD, bulk operations, and relationship management
 */

/**
 * Create a new student
 * @param {Object} studentData - Student data
 * @param {string} createdBy - ID of user creating the student
 * @returns {Promise<Object>} Created student
 */
export const createStudent = async (studentData, createdBy) => {
  try {
    // Generate enrollment number if not provided
    if (!studentData.enrollmentNumber) {
      studentData.enrollmentNumber = await Student.generateEnrollmentNumber();
    }

    const student = await Student.create(studentData);

    // Log creation
    await AuditLog.logAction({
      userId: createdBy,
      action: 'CREATE',
      entityType: 'student',
      entityId: student.id,
      newValues: {
        enrollmentNumber: student.enrollmentNumber,
        class: student.currentClass,
        section: student.section,
      },
      status: 'SUCCESS',
    });

    logger.info('Student created', {
      studentId: student.id,
      enrollmentNumber: student.enrollmentNumber,
      createdBy,
    });

    return await student.getFullDetails();
  } catch (error) {
    logger.error('Create student error:', error);
    throw error;
  }
};

/**
 * Get paginated list of students with filtering
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Students list with pagination
 */
export const getStudents = async (options = {}) => {
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
    } = options;

    const offset = (page - 1) * limit;
    const where = {};

    // Filter by class
    if (currentClass) {
      where.currentClass = currentClass;
    }

    // Filter by section
    if (section) {
      where.section = section;
    }

    // Filter by active status
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Filter by parent
    if (parentId) {
      where.parentId = parentId;
    }

    // Filter by sponsor
    if (sponsorId) {
      where.sponsorId = sponsorId;
    }

    // Search by enrollment number or roll number
    if (search) {
      where[Op.or] = [
        { enrollmentNumber: { [Op.iLike]: `%${search}%` } },
        { rollNumber: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { rows: students, count: total } = await Student.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [[sortBy, sortOrder]],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'firstName', 'lastName', 'isActive'],
        },
      ],
    });

    // Get full details for each student
    const studentsWithDetails = await Promise.all(
      students.map(s => s.getFullDetails())
    );

    return {
      students: studentsWithDetails,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Get students error:', error);
    throw error;
  }
};

/**
 * Get student by ID
 * @param {string} studentId - Student ID
 * @returns {Promise<Object>} Student object with full details
 */
export const getStudentById = async (studentId) => {
  try {
    const student = await Student.findByPk(studentId);

    if (!student) {
      return null;
    }

    return await student.getFullDetails();
  } catch (error) {
    logger.error('Get student by ID error:', error);
    throw error;
  }
};

/**
 * Get student by enrollment number
 * @param {string} enrollmentNumber - Enrollment number
 * @returns {Promise<Object>} Student object
 */
export const getStudentByEnrollment = async (enrollmentNumber) => {
  try {
    const student = await Student.findOne({
      where: { enrollmentNumber },
    });

    if (!student) {
      return null;
    }

    return await student.getFullDetails();
  } catch (error) {
    logger.error('Get student by enrollment error:', error);
    throw error;
  }
};

/**
 * Update student
 * @param {string} studentId - Student ID
 * @param {Object} updates - Fields to update
 * @param {string} updatedBy - ID of user performing update
 * @returns {Promise<Object>} Updated student
 */
export const updateStudent = async (studentId, updates, updatedBy) => {
  try {
    const student = await Student.findByPk(studentId);

    if (!student) {
      return null;
    }

    // Store old values for audit
    const oldValues = {
      currentClass: student.currentClass,
      section: student.section,
      rollNumber: student.rollNumber,
      parentId: student.parentId,
      sponsorId: student.sponsorId,
      isActive: student.isActive,
    };

    // Update allowed fields
    const allowedFields = [
      'dateOfBirth', 'gender', 'bloodGroup', 'currentClass', 'section',
      'rollNumber', 'parentId', 'sponsorId', 'address', 'city', 'state',
      'pincode', 'emergencyContact', 'emergencyContactName', 'medicalInfo',
      'previousSchool', 'isActive', 'remarks', 'photo',
    ];

    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        student[field] = updates[field];
      }
    });

    await student.save();

    // Log update
    await AuditLog.logAction({
      userId: updatedBy,
      action: 'UPDATE',
      entityType: 'student',
      entityId: student.id,
      oldValues,
      newValues: {
        currentClass: student.currentClass,
        section: student.section,
        rollNumber: student.rollNumber,
        parentId: student.parentId,
        sponsorId: student.sponsorId,
        isActive: student.isActive,
      },
      status: 'SUCCESS',
    });

    logger.info('Student updated', {
      studentId: student.id,
      updatedBy,
    });

    return await student.getFullDetails();
  } catch (error) {
    logger.error('Update student error:', error);
    throw error;
  }
};

/**
 * Delete student (soft delete)
 * @param {string} studentId - Student ID
 * @param {string} deletedBy - ID of user performing deletion
 * @returns {Promise<boolean>} Success status
 */
export const deleteStudent = async (studentId, deletedBy) => {
  try {
    const student = await Student.findByPk(studentId);

    if (!student) {
      return false;
    }

    // Soft delete
    student.isActive = false;
    await student.save();

    // Log deletion
    await AuditLog.logAction({
      userId: deletedBy,
      action: 'DELETE',
      entityType: 'student',
      entityId: student.id,
      oldValues: { isActive: true },
      newValues: { isActive: false },
      status: 'SUCCESS',
    });

    logger.info('Student deleted (soft)', {
      studentId: student.id,
      deletedBy,
    });

    return true;
  } catch (error) {
    logger.error('Delete student error:', error);
    throw error;
  }
};

/**
 * Map parent to student
 * @param {string} studentId - Student ID
 * @param {string} parentId - Parent user ID
 * @param {string} mappedBy - ID of user performing mapping
 * @returns {Promise<Object>} Result
 */
export const mapParentToStudent = async (studentId, parentId, mappedBy) => {
  try {
    const student = await Student.findByPk(studentId);
    if (!student) {
      return { success: false, message: 'Student not found' };
    }

    // Verify parent exists and has parent role
    const parent = await User.findByPk(parentId);
    if (!parent || parent.role !== 'parent') {
      return { success: false, message: 'Invalid parent user' };
    }

    const oldParentId = student.parentId;
    student.parentId = parentId;
    await student.save();

    await AuditLog.logAction({
      userId: mappedBy,
      action: 'UPDATE',
      entityType: 'student',
      entityId: student.id,
      oldValues: { parentId: oldParentId },
      newValues: { parentId },
      status: 'SUCCESS',
      metadata: { action: 'parent_mapped' },
    });

    logger.info('Parent mapped to student', {
      studentId,
      parentId,
      mappedBy,
    });

    return { success: true, message: 'Parent mapped successfully' };
  } catch (error) {
    logger.error('Map parent error:', error);
    throw error;
  }
};

/**
 * Map sponsor to student
 * @param {string} studentId - Student ID
 * @param {string} sponsorId - Sponsor user ID
 * @param {string} mappedBy - ID of user performing mapping
 * @returns {Promise<Object>} Result
 */
export const mapSponsorToStudent = async (studentId, sponsorId, mappedBy) => {
  try {
    const student = await Student.findByPk(studentId);
    if (!student) {
      return { success: false, message: 'Student not found' };
    }

    // Verify sponsor exists and has sponsor role
    const sponsor = await User.findByPk(sponsorId);
    if (!sponsor || sponsor.role !== 'sponsor') {
      return { success: false, message: 'Invalid sponsor user' };
    }

    const oldSponsorId = student.sponsorId;
    student.sponsorId = sponsorId;
    await student.save();

    await AuditLog.logAction({
      userId: mappedBy,
      action: 'UPDATE',
      entityType: 'student',
      entityId: student.id,
      oldValues: { sponsorId: oldSponsorId },
      newValues: { sponsorId },
      status: 'SUCCESS',
      metadata: { action: 'sponsor_mapped' },
    });

    logger.info('Sponsor mapped to student', {
      studentId,
      sponsorId,
      mappedBy,
    });

    return { success: true, message: 'Sponsor mapped successfully' };
  } catch (error) {
    logger.error('Map sponsor error:', error);
    throw error;
  }
};

/**
 * Bulk import students from CSV data
 * @param {Array} studentsData - Array of student objects
 * @param {string} importedBy - ID of user performing import
 * @returns {Promise<Object>} Import results
 */
export const bulkImportStudents = async (studentsData, importedBy) => {
  try {
    const results = {
      success: [],
      failed: [],
      total: studentsData.length,
    };

    for (const studentData of studentsData) {
      try {
        // Validate required fields
        if (!studentData.userId || !studentData.dateOfBirth || !studentData.gender || !studentData.admissionDate || !studentData.currentClass) {
          results.failed.push({
            enrollmentNumber: studentData.enrollmentNumber || 'unknown',
            reason: 'Missing required fields',
          });
          continue;
        }

        // Check if enrollment number already exists
        if (studentData.enrollmentNumber) {
          const existing = await Student.findOne({
            where: { enrollmentNumber: studentData.enrollmentNumber },
          });
          if (existing) {
            results.failed.push({
              enrollmentNumber: studentData.enrollmentNumber,
              reason: 'Enrollment number already exists',
            });
            continue;
          }
        }

        // Create student
        const student = await createStudent(studentData, importedBy);
        results.success.push({
          id: student.id,
          enrollmentNumber: student.enrollmentNumber,
        });
      } catch (error) {
        results.failed.push({
          enrollmentNumber: studentData.enrollmentNumber || 'unknown',
          reason: error.message,
        });
      }
    }

    // Log bulk import
    await AuditLog.logAction({
      userId: importedBy,
      action: 'CREATE',
      entityType: 'student',
      status: 'SUCCESS',
      metadata: {
        type: 'bulk_import',
        total: results.total,
        success: results.success.length,
        failed: results.failed.length,
      },
    });

    logger.info('Bulk student import completed', {
      total: results.total,
      success: results.success.length,
      failed: results.failed.length,
      importedBy,
    });

    return results;
  } catch (error) {
    logger.error('Bulk import students error:', error);
    throw error;
  }
};

/**
 * Get student statistics
 * @returns {Promise<Object>} Student statistics
 */
export const getStudentStats = async () => {
  try {
    const total = await Student.count();
    const active = await Student.count({ where: { isActive: true } });
    const inactive = await Student.count({ where: { isActive: false } });

    const byClass = await Student.findAll({
      attributes: [
        'currentClass',
        [Student.sequelize.fn('COUNT', Student.sequelize.col('id')), 'count'],
      ],
      where: { isActive: true },
      group: ['currentClass'],
      order: [['currentClass', 'ASC']],
    });

    const byGender = await Student.findAll({
      attributes: [
        'gender',
        [Student.sequelize.fn('COUNT', Student.sequelize.col('id')), 'count'],
      ],
      where: { isActive: true },
      group: ['gender'],
    });

    return {
      total,
      active,
      inactive,
      byClass: byClass.map(c => ({
        class: c.currentClass,
        count: parseInt(c.get('count')),
      })),
      byGender: byGender.reduce((acc, g) => {
        acc[g.gender] = parseInt(g.get('count'));
        return acc;
      }, {}),
    };
  } catch (error) {
    logger.error('Get student stats error:', error);
    throw error;
  }
};

export default {
  createStudent,
  getStudents,
  getStudentById,
  getStudentByEnrollment,
  updateStudent,
  deleteStudent,
  mapParentToStudent,
  mapSponsorToStudent,
  bulkImportStudents,
  getStudentStats,
};
