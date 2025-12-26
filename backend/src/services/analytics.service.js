import { Op, fn, col, literal } from 'sequelize';
import { Student, Attendance, Marksheet, Mark, Subject, ReportCard, Sponsor, User } from '../models/index.js';
import sequelize from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Analytics Service
 * Business logic for generating analytics and statistics
 */

/**
 * Get comprehensive student performance analytics
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} Student performance analytics
 */
export const getStudentPerformanceAnalytics = async (filters = {}) => {
  try {
    const {
      studentId,
      academicYearId,
      schoolId,
      startDate,
      endDate
    } = filters;

    const where = {};
    if (studentId) where.id = studentId;
    if (schoolId) where.schoolId = schoolId;

    // Get student count
    const totalStudents = await Student.count({ where });

    // Get attendance statistics
    const attendanceWhere = {};
    if (studentId) attendanceWhere.studentId = studentId;
    if (schoolId) attendanceWhere.schoolId = schoolId;
    if (startDate) attendanceWhere.date = { [Op.gte]: startDate };
    if (endDate) {
      attendanceWhere.date = attendanceWhere.date 
        ? { ...attendanceWhere.date, [Op.lte]: endDate }
        : { [Op.lte]: endDate };
    }

    const attendanceStats = await Attendance.findAll({
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count']
      ],
      where: attendanceWhere,
      group: ['status'],
      raw: true
    });

    const attendanceSummary = {
      total: attendanceStats.reduce((sum, stat) => sum + parseInt(stat.count), 0),
      present: attendanceStats.find(s => s.status === 'present')?.count || 0,
      absent: attendanceStats.find(s => s.status === 'absent')?.count || 0,
      late: attendanceStats.find(s => s.status === 'late')?.count || 0,
      excused: attendanceStats.find(s => s.status === 'excused')?.count || 0
    };

    attendanceSummary.attendanceRate = attendanceSummary.total > 0
      ? ((attendanceSummary.present / attendanceSummary.total) * 100).toFixed(2)
      : 0;

    // Get marks statistics
    const marksWhere = {};
    if (academicYearId) marksWhere.academicYearId = academicYearId;
    if (schoolId) marksWhere.schoolId = schoolId;

    const marksheets = await Marksheet.findAll({
      where: { ...marksWhere, status: 'approved' },
      include: [
        {
          model: Mark,
          as: 'marks',
          required: false,
          ...(studentId && {
            where: {
              academicYearEnrollmentId: {
                [Op.in]: literal(`(
                  SELECT id FROM academic_year_enrollments 
                  WHERE student_id = '${studentId}'
                  ${academicYearId ? `AND academic_year_id = '${academicYearId}'` : ''}
                )`)
              }
            }
          })
        }
      ]
    });

    let totalMarks = 0;
    let totalMaxMarks = 0;
    let subjectCount = 0;

    marksheets.forEach(marksheet => {
      if (marksheet.marks && marksheet.marks.length > 0) {
        marksheet.marks.forEach(mark => {
          totalMarks += parseFloat(mark.marksObtained || 0);
          totalMaxMarks += parseFloat(mark.maxMarks || 0);
          subjectCount++;
        });
      }
    });

    const averagePercentage = totalMaxMarks > 0
      ? ((totalMarks / totalMaxMarks) * 100).toFixed(2)
      : 0;

    // Get grade distribution
    const reportCardWhere = {};
    if (studentId) reportCardWhere.studentId = studentId;
    if (academicYearId) reportCardWhere.academicYearId = academicYearId;
    if (schoolId) reportCardWhere.schoolId = schoolId;

    const gradeDistribution = await ReportCard.findAll({
      attributes: [
        'finalGrade',
        [fn('COUNT', col('id')), 'count']
      ],
      where: { ...reportCardWhere, status: { [Op.in]: ['Signed', 'Distributed'] } },
      group: ['finalGrade'],
      raw: true
    });

    // Get top performers
    const topPerformers = await ReportCard.findAll({
      where: {
        ...reportCardWhere,
        status: { [Op.in]: ['Signed', 'Distributed'] }
      },
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'enrollmentNumber', 'userId'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'firstName', 'lastName', 'email']
            }
          ]
        }
      ],
      order: [['percentage', 'DESC']],
      limit: 10
    });

    // Get subject-wise performance
    const subjectPerformance = await Mark.findAll({
      attributes: [
        [col('subject.name'), 'subjectName'],
        [fn('AVG', col('marks_obtained')), 'avgMarks'],
        [fn('AVG', col('max_marks')), 'avgMaxMarks'],
        [fn('COUNT', col('Mark.id')), 'totalStudents']
      ],
      include: [
        {
          model: Subject,
          as: 'subject',
          attributes: []
        }
      ],
      ...(studentId && {
        where: {
          academicYearEnrollmentId: {
            [Op.in]: literal(`(
              SELECT id FROM academic_year_enrollments 
              WHERE student_id = '${studentId}'
            )`)
          }
        }
      }),
      group: ['subject.name'],
      raw: true
    });

    const subjectStats = subjectPerformance.map(subject => ({
      subjectName: subject.subjectName,
      averageMarks: parseFloat(subject.avgMarks).toFixed(2),
      averageMaxMarks: parseFloat(subject.avgMaxMarks).toFixed(2),
      averagePercentage: subject.avgMaxMarks > 0
        ? ((subject.avgMarks / subject.avgMaxMarks) * 100).toFixed(2)
        : 0,
      totalStudents: parseInt(subject.totalStudents)
    }));

    return {
      overview: {
        totalStudents,
        totalSubjects: subjectCount,
        averagePercentage: parseFloat(averagePercentage),
        totalMarksObtained: totalMarks,
        totalMaxMarks: totalMaxMarks
      },
      attendance: attendanceSummary,
      gradeDistribution: gradeDistribution.map(g => ({
        grade: g.finalGrade,
        count: parseInt(g.count)
      })),
      topPerformers: topPerformers.map(rp => ({
        studentId: rp.student?.id,
        studentName: rp.student?.user ? `${rp.student.user.firstName} ${rp.student.user.lastName}` : 'Unknown',
        studentNumber: rp.student?.enrollmentNumber,
        percentage: parseFloat(rp.percentage),
        grade: rp.finalGrade,
        totalMarks: parseFloat(rp.totalMarksObtained),
        maxMarks: parseFloat(rp.totalMaxMarks)
      })),
      subjectPerformance: subjectStats
    };

  } catch (error) {
    logger.error('Error getting student performance analytics:', error);
    throw error;
  }
};

/**
 * Get school-wide analytics dashboard
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} School dashboard analytics
 */
export const getSchoolDashboardAnalytics = async (filters = {}) => {
  try {
    const {
      schoolId,
      academicYearId,
      startDate,
      endDate
    } = filters;

    const where = {};
    if (schoolId) where.schoolId = schoolId;

    // Total students
    const totalStudents = await Student.count({ where });

    // Active students (those with recent attendance)
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 30); // Last 30 days

    const activeStudents = await Attendance.findAll({
      attributes: [[fn('COUNT', fn('DISTINCT', col('student_id'))), 'count']],
      where: {
        ...(schoolId && { schoolId }),
        date: { [Op.gte]: recentDate }
      },
      raw: true
    });

    // Total sponsors
    const totalSponsors = await Sponsor.count({
      where: schoolId ? { schoolId } : {}
    });

    // Attendance overview for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayAttendance = await Attendance.findAll({
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count']
      ],
      where: {
        ...(schoolId && { schoolId }),
        date: {
          [Op.gte]: today,
          [Op.lt]: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      },
      group: ['status'],
      raw: true
    });

    const attendanceToday = {
      total: todayAttendance.reduce((sum, stat) => sum + parseInt(stat.count), 0),
      present: todayAttendance.find(s => s.status === 'present')?.count || 0,
      absent: todayAttendance.find(s => s.status === 'absent')?.count || 0,
      late: todayAttendance.find(s => s.status === 'late')?.count || 0
    };

    // Academic performance overview
    const reportCardWhere = { status: { [Op.in]: ['Signed', 'Distributed'] } };
    if (schoolId) reportCardWhere.schoolId = schoolId;
    if (academicYearId) reportCardWhere.academicYearId = academicYearId;

    const academicStats = await ReportCard.findAll({
      attributes: [
        [fn('AVG', col('percentage')), 'avgPercentage'],
        [fn('COUNT', col('id')), 'totalReports']
      ],
      where: reportCardWhere,
      raw: true
    });

    // Grade distribution for school
    const gradeDistribution = await ReportCard.findAll({
      attributes: [
        'finalGrade',
        [fn('COUNT', col('id')), 'count']
      ],
      where: reportCardWhere,
      group: ['finalGrade'],
      order: [[literal("CASE final_grade WHEN 'A+' THEN 1 WHEN 'A' THEN 2 WHEN 'B+' THEN 3 WHEN 'B' THEN 4 WHEN 'C' THEN 5 WHEN 'D' THEN 6 WHEN 'F' THEN 7 END"), 'ASC']],
      raw: true
    });

    // Recent performance trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const performanceTrend = await ReportCard.findAll({
      attributes: [
        [fn('DATE_TRUNC', 'month', col('created_at')), 'month'],
        [fn('AVG', col('percentage')), 'avgPercentage'],
        [fn('COUNT', col('id')), 'count']
      ],
      where: {
        ...reportCardWhere,
        createdAt: { [Op.gte]: sixMonthsAgo }
      },
      group: [fn('DATE_TRUNC', 'month', col('created_at'))],
      order: [[fn('DATE_TRUNC', 'month', col('created_at')), 'ASC']],
      raw: true
    });

    // Attendance trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const attendanceTrend = await Attendance.findAll({
      attributes: [
        [fn('DATE', col('date')), 'date'],
        [fn('COUNT', col('id')), 'total'],
        [fn('SUM', literal("CASE WHEN status = 'present' THEN 1 ELSE 0 END")), 'present']
      ],
      where: {
        ...(schoolId && { schoolId }),
        date: { [Op.gte]: thirtyDaysAgo }
      },
      group: [fn('DATE', col('date'))],
      order: [[fn('DATE', col('date')), 'ASC']],
      raw: true
    });

    // Subject popularity (most enrolled subjects)
    const subjectStats = await Mark.findAll({
      attributes: [
        [col('subject.name'), 'subjectName'],
        [fn('COUNT', fn('DISTINCT', col('Mark.id'))), 'enrollmentCount']
      ],
      include: [
        {
          model: Subject,
          as: 'subject',
          attributes: []
        }
      ],
      group: ['subject.name'],
      order: [[fn('COUNT', fn('DISTINCT', col('Mark.id'))), 'DESC']],
      limit: 10,
      raw: true
    });

    return {
      overview: {
        totalStudents,
        activeStudents: parseInt(activeStudents[0]?.count || 0),
        totalSponsors,
        averagePerformance: academicStats[0]?.avgPercentage 
          ? parseFloat(academicStats[0].avgPercentage).toFixed(2)
          : 0,
        totalReportCards: parseInt(academicStats[0]?.totalReports || 0)
      },
      attendanceToday,
      gradeDistribution: gradeDistribution.map(g => ({
        grade: g.finalGrade || 'N/A',
        count: parseInt(g.count),
        percentage: academicStats[0]?.totalReports 
          ? ((parseInt(g.count) / parseInt(academicStats[0].totalReports)) * 100).toFixed(2)
          : 0
      })),
      performanceTrend: performanceTrend.map(t => ({
        month: t.month,
        averagePercentage: parseFloat(t.avgPercentage).toFixed(2),
        reportCount: parseInt(t.count)
      })),
      attendanceTrend: attendanceTrend.map(a => ({
        date: a.date,
        total: parseInt(a.total),
        present: parseInt(a.present),
        attendanceRate: a.total > 0 
          ? ((parseInt(a.present) / parseInt(a.total)) * 100).toFixed(2)
          : 0
      })),
      topSubjects: subjectStats.map(s => ({
        subjectName: s.subjectName,
        enrollmentCount: parseInt(s.enrollmentCount)
      }))
    };

  } catch (error) {
    logger.error('Error getting school dashboard analytics:', error);
    throw error;
  }
};

export default {
  getStudentPerformanceAnalytics,
  getSchoolDashboardAnalytics
};
