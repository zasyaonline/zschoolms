import Attendance from '../models/Attendance.js';
import { Student, User } from '../models/index.js';
import { AuditLog } from '../models/index.js';
import { Op } from 'sequelize';
import logger from '../utils/logger.js';

/**
 * Mark attendance for students
 * @param {Array} attendanceData - Array of attendance records
 * @param {String} markedBy - User ID of teacher marking attendance
 * @returns {Promise<Object>} Created attendance records
 */
export const markAttendance = async (attendanceData, markedBy) => {
  try {
    logger.info('Marking attendance', { count: attendanceData.length, markedBy });

    const results = [];
    const errors = [];

    for (const record of attendanceData) {
      try {
        const { studentId, date, class: classValue, section, status, remarks } = record;

        // Validate student exists
        const student = await Student.findByPk(studentId);
        if (!student) {
          errors.push({
            studentId,
            error: 'Student not found',
          });
          continue;
        }

        // Check if attendance already exists for this student and date
        const existing = await Attendance.findOne({
          where: {
            studentId,
            date,
          },
        });

        let attendanceRecord;

        if (existing) {
          // Update existing record
          await existing.update({
            class: classValue,
            section,
            status,
            remarks,
            markedBy,
          });
          attendanceRecord = existing;

          // Log update
          await AuditLog.logAction({
            userId: markedBy,
            action: 'UPDATE',
            entityType: 'attendance',
            entityId: existing.id,
            changes: {
              oldStatus: existing.status,
              newStatus: status,
            },
            ipAddress: null,
            userAgent: null,
            status: 'SUCCESS',
          });
        } else {
          // Create new record
          attendanceRecord = await Attendance.create({
            studentId,
            date,
            class: classValue,
            section,
            status,
            markedBy,
            remarks,
          });

          // Log creation
          await AuditLog.logAction({
            userId: markedBy,
            action: 'CREATE',
            entityType: 'attendance',
            entityId: attendanceRecord.id,
            changes: { status },
            ipAddress: null,
            userAgent: null,
            status: 'SUCCESS',
          });
        }

        results.push(attendanceRecord);
      } catch (recordError) {
        logger.error('Error marking attendance for student:', recordError);
        errors.push({
          studentId: record.studentId,
          error: recordError.message,
        });
      }
    }

    logger.info('Attendance marked', { 
      successful: results.length, 
      failed: errors.length 
    });

    return {
      successful: results,
      failed: errors,
      totalProcessed: attendanceData.length,
    };
  } catch (error) {
    logger.error('Error marking attendance:', error);
    throw error;
  }
};

/**
 * Get attendance records
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} Attendance records with statistics
 */
export const getAttendance = async (filters = {}) => {
  try {
    const {
      date,
      startDate,
      endDate,
      studentId,
      class: classValue,
      section,
      status,
      page = 1,
      limit = 50,
    } = filters;

    logger.info('Fetching attendance records', filters);

    // Build where clause
    const where = {};

    if (date) {
      where.date = date;
    } else if (startDate && endDate) {
      where.date = {
        [Op.between]: [startDate, endDate],
      };
    } else if (startDate) {
      where.date = {
        [Op.gte]: startDate,
      };
    } else if (endDate) {
      where.date = {
        [Op.lte]: endDate,
      };
    }

    if (studentId) {
      where.studentId = studentId;
    }

    if (classValue) {
      where.class = classValue;
    }

    if (section) {
      where.section = section;
    }

    if (status) {
      where.status = status;
    }

    // Get total count
    const total = await Attendance.count({ where });

    // Get paginated records
    const offset = (page - 1) * limit;
    const records = await Attendance.findAll({
      where,
      include: [
        {
          model: Student,
          as: 'student',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'firstName', 'lastName', 'email'],
            },
          ],
        },
        {
          model: User,
          as: 'marker',
          attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
        },
      ],
      order: [['date', 'DESC'], ['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    // Calculate statistics
    const stats = await calculateAttendanceStats(where);

    return {
      records,
      statistics: stats,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Error fetching attendance:', error);
    throw error;
  }
};

/**
 * Get attendance for a specific date and class
 * @param {String} date - Date in YYYY-MM-DD format
 * @param {String} classValue - Class/grade
 * @param {String} section - Section (optional)
 * @returns {Promise<Object>} Attendance records with statistics
 */
export const getClassAttendanceByDate = async (date, classValue, section = null) => {
  try {
    logger.info('Fetching class attendance', { date, class: classValue, section });

    const where = {
      date,
      class: classValue,
    };

    if (section) {
      where.section = section;
    }

    const records = await Attendance.findAll({
      where,
      include: [
        {
          model: Student,
          as: 'student',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'firstName', 'lastName', 'email'],
            },
          ],
        },
        {
          model: User,
          as: 'marker',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      order: [['student', 'user', 'firstName', 'ASC']],
    });

    // Calculate statistics
    const stats = await calculateAttendanceStats(where);

    return {
      records,
      statistics: stats,
      date,
      class: classValue,
      section,
    };
  } catch (error) {
    logger.error('Error fetching class attendance:', error);
    throw error;
  }
};

/**
 * Get student attendance history
 * @param {String} studentId - Student ID
 * @param {Object} options - Options (startDate, endDate)
 * @returns {Promise<Object>} Attendance history with statistics
 */
export const getStudentAttendanceHistory = async (studentId, options = {}) => {
  try {
    const { startDate, endDate, page = 1, limit = 30 } = options;

    logger.info('Fetching student attendance history', { studentId, startDate, endDate });

    // Validate student exists
    const student = await Student.findByPk(studentId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    if (!student) {
      throw new Error('Student not found');
    }

    const where = { studentId };

    if (startDate && endDate) {
      where.date = {
        [Op.between]: [startDate, endDate],
      };
    } else if (startDate) {
      where.date = {
        [Op.gte]: startDate,
      };
    } else if (endDate) {
      where.date = {
        [Op.lte]: endDate,
      };
    }

    // Get total count
    const total = await Attendance.count({ where });

    // Get paginated records
    const offset = (page - 1) * limit;
    const records = await Attendance.findAll({
      where,
      include: [
        {
          model: User,
          as: 'marker',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      order: [['date', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    // Calculate statistics
    const stats = await calculateAttendanceStats(where);

    return {
      student,
      records,
      statistics: stats,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Error fetching student attendance history:', error);
    throw error;
  }
};

/**
 * Calculate attendance statistics
 * @param {Object} where - Where clause for filtering
 * @returns {Promise<Object>} Statistics
 */
const calculateAttendanceStats = async (where) => {
  try {
    const total = await Attendance.count({ where });

    const present = await Attendance.count({
      where: { ...where, status: 'present' },
    });

    const absent = await Attendance.count({
      where: { ...where, status: 'absent' },
    });

    const late = await Attendance.count({
      where: { ...where, status: 'late' },
    });

    const excused = await Attendance.count({
      where: { ...where, status: 'excused' },
    });

    const attendanceRate = total > 0 ? ((present / total) * 100).toFixed(2) : 0;

    return {
      total,
      present,
      absent,
      late,
      excused,
      attendanceRate: `${attendanceRate}%`,
    };
  } catch (error) {
    logger.error('Error calculating attendance stats:', error);
    throw error;
  }
};

/**
 * Delete attendance record
 * @param {String} attendanceId - Attendance record ID
 * @param {String} deletedBy - User ID
 * @returns {Promise<Boolean>} Success status
 */
export const deleteAttendance = async (attendanceId, deletedBy) => {
  try {
    logger.info('Deleting attendance record', { attendanceId, deletedBy });

    const record = await Attendance.findByPk(attendanceId);

    if (!record) {
      throw new Error('Attendance record not found');
    }

    await record.destroy();

    // Log deletion
    await AuditLog.logAction({
      userId: deletedBy,
      action: 'DELETE',
      entityType: 'attendance',
      entityId: attendanceId,
      changes: {
        studentId: record.studentId,
        date: record.date,
        status: record.status,
      },
      ipAddress: null,
      userAgent: null,
      status: 'SUCCESS',
    });

    logger.info('Attendance record deleted successfully', { attendanceId });
    return true;
  } catch (error) {
    logger.error('Error deleting attendance record:', error);
    throw error;
  }
};
