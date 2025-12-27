import { Op } from 'sequelize';
import Student from '../models/Student.js';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import ReportCard from '../models/ReportCard.js';
import Mark from '../models/Mark.js';
import AcademicYear from '../models/AcademicYear.js';
import logger from '../utils/logger.js';

/**
 * Student Portal Service
 * Provides read-only access to student's own academic information
 * Completely sandboxed - students can only see their own data
 */

/**
 * Get student dashboard data
 * @param {string} userId - The user ID of the logged-in student
 * @returns {Promise<Object>} Dashboard data
 */
export const getStudentDashboard = async (userId) => {
  try {
    // Find the student profile for this user
    const student = await Student.findOne({
      where: { userId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'username'],
        },
      ],
    });

    if (!student) {
      throw new Error('Student profile not found');
    }

    // Get current academic year
    const currentYear = await AcademicYear.findOne({
      where: { isCurrent: true },
    });

    // Get attendance summary for current term/year
    const attendanceSummary = await getAttendanceSummary(student.id, currentYear?.id);

    // Get recent report cards count
    const reportCardsCount = await ReportCard.count({
      where: { studentId: student.id },
    });

    // Get recent marks/grades summary
    const recentMarks = await getRecentMarksSummary(student.id, currentYear?.id);

    return {
      student: {
        id: student.id,
        name: `${student.user.firstName} ${student.user.lastName}`,
        admissionNumber: student.admissionNumber || student.enrollmentNumber,
        currentClass: student.currentClass || student.currentGrade,
        section: student.section || student.currentSection,
        rollNumber: student.rollNumber,
        email: student.user.email,
      },
      academicYear: currentYear ? {
        id: currentYear.id,
        name: currentYear.name,
        startDate: currentYear.startDate,
        endDate: currentYear.endDate,
      } : null,
      attendance: attendanceSummary,
      reportCards: {
        totalAvailable: reportCardsCount,
      },
      recentPerformance: recentMarks,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Error fetching student dashboard:', error);
    throw error;
  }
};

/**
 * Get student's report cards
 * @param {string} userId - The user ID of the logged-in student
 * @param {Object} options - Pagination options
 * @returns {Promise<Object>} Report cards list
 */
export const getStudentReportCards = async (userId, options = {}) => {
  try {
    const { page = 1, limit = 10, academicYearId } = options;
    const offset = (page - 1) * limit;

    // Find the student profile
    const student = await Student.findOne({
      where: { userId },
      attributes: ['id'],
    });

    if (!student) {
      throw new Error('Student profile not found');
    }

    // Build where clause
    const where = { studentId: student.id };
    if (academicYearId) {
      where.academicYearId = academicYearId;
    }

    // Only show signed/finalized report cards to students
    where.status = { [Op.in]: ['signed', 'finalized', 'distributed'] };

    const { count, rows } = await ReportCard.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset,
      include: [
        {
          model: AcademicYear,
          as: 'academicYear',
          attributes: ['id', 'name'],
        },
      ],
      attributes: [
        'id', 'examType', 'term', 'totalMarks', 'percentage', 
        'grade', 'rank', 'status', 's3Key', 'createdAt', 'signedAt'
      ],
    });

    // Format report cards for student view
    const reportCards = rows.map(rc => ({
      id: rc.id,
      examType: rc.examType,
      term: rc.term,
      academicYear: rc.academicYear?.name,
      totalMarks: rc.totalMarks,
      percentage: rc.percentage,
      grade: rc.grade,
      rank: rc.rank,
      status: rc.status,
      canDownload: !!rc.s3Key,
      signedAt: rc.signedAt,
      createdAt: rc.createdAt,
    }));

    return {
      reportCards,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    };
  } catch (error) {
    logger.error('Error fetching student report cards:', error);
    throw error;
  }
};

/**
 * Get a specific report card for download
 * @param {string} userId - The user ID of the logged-in student
 * @param {string} reportCardId - The report card ID
 * @returns {Promise<Object>} Report card with download info
 */
export const getReportCardForDownload = async (userId, reportCardId) => {
  try {
    // Find the student profile
    const student = await Student.findOne({
      where: { userId },
      attributes: ['id'],
    });

    if (!student) {
      throw new Error('Student profile not found');
    }

    // Find the report card - ensure it belongs to this student
    const reportCard = await ReportCard.findOne({
      where: {
        id: reportCardId,
        studentId: student.id,
        status: { [Op.in]: ['signed', 'finalized', 'distributed'] },
      },
      include: [
        {
          model: AcademicYear,
          as: 'academicYear',
          attributes: ['id', 'name'],
        },
      ],
    });

    if (!reportCard) {
      throw new Error('Report card not found or not available for download');
    }

    return {
      id: reportCard.id,
      s3Key: reportCard.s3Key,
      filename: `Report_Card_${reportCard.term || ''}_${reportCard.academicYear?.name || ''}.pdf`,
      examType: reportCard.examType,
      term: reportCard.term,
      academicYear: reportCard.academicYear?.name,
    };
  } catch (error) {
    logger.error('Error fetching report card for download:', error);
    throw error;
  }
};

/**
 * Get student's attendance records
 * @param {string} userId - The user ID of the logged-in student
 * @param {Object} options - Filter options
 * @returns {Promise<Object>} Attendance records and summary
 */
export const getStudentAttendance = async (userId, options = {}) => {
  try {
    const { month, year, startDate, endDate, page = 1, limit = 31 } = options;
    const offset = (page - 1) * limit;

    // Find the student profile
    const student = await Student.findOne({
      where: { userId },
      attributes: ['id'],
    });

    if (!student) {
      throw new Error('Student profile not found');
    }

    // Build date filter
    const where = { studentId: student.id };
    
    if (month && year) {
      // Get attendance for specific month
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0);
      where.date = {
        [Op.between]: [startOfMonth.toISOString().split('T')[0], endOfMonth.toISOString().split('T')[0]],
      };
    } else if (startDate && endDate) {
      where.date = {
        [Op.between]: [startDate, endDate],
      };
    } else {
      // Default to current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      where.date = {
        [Op.between]: [startOfMonth.toISOString().split('T')[0], endOfMonth.toISOString().split('T')[0]],
      };
    }

    // Get attendance records
    const { count, rows } = await Attendance.findAndCountAll({
      where,
      order: [['date', 'DESC']],
      limit: parseInt(limit),
      offset,
      attributes: ['id', 'date', 'status', 'remarks'],
    });

    // Calculate summary
    const summary = {
      total: count,
      present: rows.filter(a => a.status === 'present').length,
      absent: rows.filter(a => a.status === 'absent').length,
      late: rows.filter(a => a.status === 'late').length,
      excused: rows.filter(a => a.status === 'excused').length,
    };
    summary.percentage = count > 0 
      ? ((summary.present + summary.late) / count * 100).toFixed(1) 
      : 0;

    // Format as calendar data
    const calendarData = rows.map(a => ({
      date: a.date,
      status: a.status,
      remarks: a.remarks,
    }));

    return {
      attendance: calendarData,
      summary,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    };
  } catch (error) {
    logger.error('Error fetching student attendance:', error);
    throw error;
  }
};

/**
 * Get student's profile (read-only)
 * @param {string} userId - The user ID of the logged-in student
 * @returns {Promise<Object>} Student profile
 */
export const getStudentProfile = async (userId) => {
  try {
    const student = await Student.findOne({
      where: { userId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'username'],
        },
      ],
    });

    if (!student) {
      throw new Error('Student profile not found');
    }

    // Return only safe, read-only fields
    return {
      personalInfo: {
        firstName: student.user.firstName,
        lastName: student.user.lastName,
        email: student.user.email,
        username: student.user.username,
        dateOfBirth: student.dateOfBirth,
        gender: student.gender,
        bloodGroup: student.bloodGroup,
      },
      academicInfo: {
        admissionNumber: student.admissionNumber || student.enrollmentNumber,
        admissionDate: student.admissionDate,
        currentClass: student.currentClass || student.currentGrade,
        section: student.section || student.currentSection,
        rollNumber: student.rollNumber,
      },
      contactInfo: {
        address: student.address,
        city: student.city,
        state: student.state,
        pincode: student.pincode,
        emergencyContact: student.emergencyContact,
        emergencyContactName: student.emergencyContactName,
      },
      // Explicitly NOT including: sponsorId, parentId, financial info, etc.
    };
  } catch (error) {
    logger.error('Error fetching student profile:', error);
    throw error;
  }
};

/**
 * Get attendance summary helper
 */
const getAttendanceSummary = async (studentId, academicYearId) => {
  try {
    // Get current month attendance
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthlyRecords = await Attendance.findAll({
      where: {
        studentId,
        date: {
          [Op.between]: [startOfMonth.toISOString().split('T')[0], endOfMonth.toISOString().split('T')[0]],
        },
      },
      attributes: ['status'],
    });

    const monthlyTotal = monthlyRecords.length;
    const monthlyPresent = monthlyRecords.filter(a => a.status === 'present' || a.status === 'late').length;

    // Get term/year attendance (last 3 months as proxy)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const termRecords = await Attendance.findAll({
      where: {
        studentId,
        date: {
          [Op.gte]: threeMonthsAgo.toISOString().split('T')[0],
        },
      },
      attributes: ['status'],
    });

    const termTotal = termRecords.length;
    const termPresent = termRecords.filter(a => a.status === 'present' || a.status === 'late').length;

    return {
      currentMonth: {
        total: monthlyTotal,
        present: monthlyPresent,
        percentage: monthlyTotal > 0 ? ((monthlyPresent / monthlyTotal) * 100).toFixed(1) : 0,
      },
      term: {
        total: termTotal,
        present: termPresent,
        percentage: termTotal > 0 ? ((termPresent / termTotal) * 100).toFixed(1) : 0,
      },
    };
  } catch (error) {
    logger.error('Error calculating attendance summary:', error);
    return {
      currentMonth: { total: 0, present: 0, percentage: 0 },
      term: { total: 0, present: 0, percentage: 0 },
    };
  }
};

/**
 * Get recent marks summary helper
 */
const getRecentMarksSummary = async (studentId, academicYearId) => {
  try {
    // Get last 5 marks entries
    const recentMarks = await Mark.findAll({
      where: { studentId },
      order: [['createdAt', 'DESC']],
      limit: 5,
      attributes: ['subjectId', 'marksObtained', 'maxMarks', 'grade', 'examType'],
    });

    if (recentMarks.length === 0) {
      return {
        hasData: false,
        averagePercentage: 0,
        subjectCount: 0,
      };
    }

    // Calculate average
    const totalPercentage = recentMarks.reduce((sum, m) => {
      const pct = m.maxMarks > 0 ? (m.marksObtained / m.maxMarks) * 100 : 0;
      return sum + pct;
    }, 0);

    return {
      hasData: true,
      averagePercentage: (totalPercentage / recentMarks.length).toFixed(1),
      subjectCount: new Set(recentMarks.map(m => m.subjectId)).size,
      latestGrade: recentMarks[0]?.grade,
    };
  } catch (error) {
    logger.error('Error calculating marks summary:', error);
    return {
      hasData: false,
      averagePercentage: 0,
      subjectCount: 0,
    };
  }
};

export default {
  getStudentDashboard,
  getStudentReportCards,
  getReportCardForDownload,
  getStudentAttendance,
  getStudentProfile,
};
