import { Op } from 'sequelize';
import { AcademicYear, AcademicYearEnrollment, Student, School } from '../models/index.js';
import logger from '../utils/logger.js';

/**
 * Academic Year Service
 * Manages academic year and enrollment operations
 */

// ============================================================================
// Academic Year CRUD
// ============================================================================

/**
 * Get all academic years
 * @param {Object} options - Query options
 * @returns {Promise<Array>}
 */
export const getAcademicYears = async (options = {}) => {
  try {
    const { schoolId, includeCurrent = false, includeStats = false } = options;
    
    const where = {};
    if (schoolId) {
      where.schoolId = schoolId;
    }
    
    const academicYears = await AcademicYear.findAll({
      where,
      order: [['startDate', 'DESC']],
    });

    if (includeStats) {
      // Add enrollment counts
      const results = await Promise.all(academicYears.map(async (ay) => {
        const enrollmentCount = await AcademicYearEnrollment.count({
          where: { academicYearId: ay.id },
        });
        return {
          ...ay.toJSON(),
          enrollmentCount,
        };
      }));
      return results;
    }

    return academicYears;
  } catch (error) {
    logger.error('Error getting academic years:', error);
    throw error;
  }
};

/**
 * Get current academic year
 * @returns {Promise<Object|null>}
 */
export const getCurrentAcademicYear = async () => {
  try {
    return await AcademicYear.findOne({
      where: { isCurrent: true },
    });
  } catch (error) {
    logger.error('Error getting current academic year:', error);
    throw error;
  }
};

/**
 * Get academic year by ID
 * @param {string} id - Academic year UUID
 * @returns {Promise<Object|null>}
 */
export const getAcademicYearById = async (id) => {
  try {
    const academicYear = await AcademicYear.findByPk(id);
    
    if (academicYear) {
      // Get enrollment stats
      const enrollmentCount = await AcademicYearEnrollment.count({
        where: { academicYearId: id },
      });
      
      return {
        ...academicYear.toJSON(),
        enrollmentCount,
      };
    }
    
    return null;
  } catch (error) {
    logger.error('Error getting academic year by ID:', error);
    throw error;
  }
};

/**
 * Create new academic year
 * @param {Object} data - Academic year data
 * @param {string} createdBy - User ID
 * @returns {Promise<Object>}
 */
export const createAcademicYear = async (data, createdBy) => {
  try {
    const { year, startDate, endDate, isCurrent = false } = data;

    // Validate dates
    if (new Date(endDate) <= new Date(startDate)) {
      throw new Error('End date must be after start date');
    }

    // Check for overlapping academic years
    const overlapping = await AcademicYear.findOne({
      where: {
        [Op.or]: [
          {
            startDate: { [Op.between]: [startDate, endDate] },
          },
          {
            endDate: { [Op.between]: [startDate, endDate] },
          },
          {
            [Op.and]: [
              { startDate: { [Op.lte]: startDate } },
              { endDate: { [Op.gte]: endDate } },
            ],
          },
        ],
      },
    });

    if (overlapping) {
      throw new Error(`Academic year overlaps with existing year: ${overlapping.year}`);
    }

    // If setting as current, unset other current years
    if (isCurrent) {
      await AcademicYear.update(
        { isCurrent: false },
        { where: { isCurrent: true } }
      );
    }

    const academicYear = await AcademicYear.create({
      year,
      startDate,
      endDate,
      isCurrent,
      createdBy,
    });

    logger.info(`Academic year created: ${year} by user ${createdBy}`);
    return academicYear;
  } catch (error) {
    logger.error('Error creating academic year:', error);
    throw error;
  }
};

/**
 * Update academic year
 * @param {string} id - Academic year UUID
 * @param {Object} data - Update data
 * @param {string} modifiedBy - User ID
 * @returns {Promise<Object>}
 */
export const updateAcademicYear = async (id, data, modifiedBy) => {
  try {
    const academicYear = await AcademicYear.findByPk(id);
    
    if (!academicYear) {
      throw new Error('Academic year not found');
    }

    const { year, startDate, endDate, isCurrent } = data;

    // Validate dates if provided
    const newStartDate = startDate || academicYear.startDate;
    const newEndDate = endDate || academicYear.endDate;
    
    if (new Date(newEndDate) <= new Date(newStartDate)) {
      throw new Error('End date must be after start date');
    }

    // Check for overlapping academic years (excluding self)
    const overlapping = await AcademicYear.findOne({
      where: {
        id: { [Op.ne]: id },
        [Op.or]: [
          {
            startDate: { [Op.between]: [newStartDate, newEndDate] },
          },
          {
            endDate: { [Op.between]: [newStartDate, newEndDate] },
          },
        ],
      },
    });

    if (overlapping) {
      throw new Error(`Academic year overlaps with existing year: ${overlapping.year}`);
    }

    // If setting as current, unset other current years
    if (isCurrent === true) {
      await AcademicYear.update(
        { isCurrent: false },
        { where: { isCurrent: true, id: { [Op.ne]: id } } }
      );
    }

    await academicYear.update({
      year: year !== undefined ? year : academicYear.year,
      startDate: startDate !== undefined ? startDate : academicYear.startDate,
      endDate: endDate !== undefined ? endDate : academicYear.endDate,
      isCurrent: isCurrent !== undefined ? isCurrent : academicYear.isCurrent,
      modifiedBy,
    });

    logger.info(`Academic year updated: ${id} by user ${modifiedBy}`);
    return academicYear;
  } catch (error) {
    logger.error('Error updating academic year:', error);
    throw error;
  }
};

/**
 * Delete academic year
 * @param {string} id - Academic year UUID
 * @returns {Promise<boolean>}
 */
export const deleteAcademicYear = async (id) => {
  try {
    const academicYear = await AcademicYear.findByPk(id);
    
    if (!academicYear) {
      throw new Error('Academic year not found');
    }

    // Check for enrollments
    const enrollmentCount = await AcademicYearEnrollment.count({
      where: { academicYearId: id },
    });

    if (enrollmentCount > 0) {
      throw new Error(`Cannot delete academic year with ${enrollmentCount} enrollments`);
    }

    await academicYear.destroy();
    logger.info(`Academic year deleted: ${id}`);
    return true;
  } catch (error) {
    logger.error('Error deleting academic year:', error);
    throw error;
  }
};

/**
 * Set academic year as current
 * @param {string} id - Academic year UUID
 * @param {string} modifiedBy - User ID
 * @returns {Promise<Object>}
 */
export const setCurrentAcademicYear = async (id, modifiedBy) => {
  try {
    const academicYear = await AcademicYear.findByPk(id);
    
    if (!academicYear) {
      throw new Error('Academic year not found');
    }

    // Unset all current years
    await AcademicYear.update(
      { isCurrent: false, modifiedBy },
      { where: { isCurrent: true } }
    );

    // Set this year as current
    await academicYear.update({
      isCurrent: true,
      modifiedBy,
    });

    logger.info(`Academic year set as current: ${id} by user ${modifiedBy}`);
    return academicYear;
  } catch (error) {
    logger.error('Error setting current academic year:', error);
    throw error;
  }
};

// ============================================================================
// Enrollment Management
// ============================================================================

/**
 * Get enrollments for an academic year
 * @param {string} academicYearId - Academic year UUID
 * @param {Object} options - Query options
 * @returns {Promise<Array>}
 */
export const getEnrollments = async (academicYearId, options = {}) => {
  try {
    const { grade, section, isActive = true } = options;
    
    const where = { academicYearId };
    if (grade) where.grade = grade;
    if (section) where.section = section;
    if (isActive !== null) where.isActive = isActive;

    const enrollments = await AcademicYearEnrollment.findAll({
      where,
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'studentId', 'firstName', 'lastName', 'email'],
        },
      ],
      order: [['grade', 'ASC'], ['section', 'ASC']],
    });

    return enrollments;
  } catch (error) {
    logger.error('Error getting enrollments:', error);
    throw error;
  }
};

/**
 * Enroll student in academic year
 * @param {Object} data - Enrollment data
 * @param {string} createdBy - User ID
 * @returns {Promise<Object>}
 */
export const enrollStudent = async (data, createdBy) => {
  try {
    const { studentId, academicYearId, schoolId, grade, section } = data;

    // Check if student exists
    const student = await Student.findByPk(studentId);
    if (!student) {
      throw new Error('Student not found');
    }

    // Check if academic year exists
    const academicYear = await AcademicYear.findByPk(academicYearId);
    if (!academicYear) {
      throw new Error('Academic year not found');
    }

    // Check for existing enrollment
    const existing = await AcademicYearEnrollment.findOne({
      where: { studentId, academicYearId },
    });

    if (existing) {
      throw new Error('Student already enrolled in this academic year');
    }

    const enrollment = await AcademicYearEnrollment.create({
      studentId,
      academicYearId,
      schoolId,
      grade,
      section,
      isActive: true,
      createdBy,
    });

    logger.info(`Student ${studentId} enrolled in academic year ${academicYearId}`);
    return enrollment;
  } catch (error) {
    logger.error('Error enrolling student:', error);
    throw error;
  }
};

/**
 * Update enrollment
 * @param {string} enrollmentId - Enrollment UUID
 * @param {Object} data - Update data
 * @param {string} modifiedBy - User ID
 * @returns {Promise<Object>}
 */
export const updateEnrollment = async (enrollmentId, data, modifiedBy) => {
  try {
    const enrollment = await AcademicYearEnrollment.findByPk(enrollmentId);
    
    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    await enrollment.update({
      ...data,
      modifiedBy,
    });

    logger.info(`Enrollment ${enrollmentId} updated by user ${modifiedBy}`);
    return enrollment;
  } catch (error) {
    logger.error('Error updating enrollment:', error);
    throw error;
  }
};

/**
 * Bulk enroll students
 * @param {string} academicYearId - Academic year UUID
 * @param {Array} students - Array of { studentId, grade, section }
 * @param {string} createdBy - User ID
 * @returns {Promise<Object>}
 */
export const bulkEnrollStudents = async (academicYearId, students, createdBy) => {
  try {
    const results = { success: [], failed: [] };

    for (const student of students) {
      try {
        await enrollStudent({
          studentId: student.studentId,
          academicYearId,
          schoolId: student.schoolId,
          grade: student.grade,
          section: student.section,
        }, createdBy);
        results.success.push(student.studentId);
      } catch (error) {
        results.failed.push({
          studentId: student.studentId,
          error: error.message,
        });
      }
    }

    logger.info(`Bulk enrollment: ${results.success.length} success, ${results.failed.length} failed`);
    return results;
  } catch (error) {
    logger.error('Error in bulk enrollment:', error);
    throw error;
  }
};

export default {
  getAcademicYears,
  getCurrentAcademicYear,
  getAcademicYearById,
  createAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,
  setCurrentAcademicYear,
  getEnrollments,
  enrollStudent,
  updateEnrollment,
  bulkEnrollStudents,
};
