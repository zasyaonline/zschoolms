import { Student, User, ReportCard, AuditLog, Marksheet } from '../models/index.js';
import { Sponsor, StudentSponsorMapping } from '../models/index.js';
import { Op } from 'sequelize';
import logger from '../utils/logger.js';

/**
 * Get dashboard metrics
 * Aggregates statistics from students, sponsors, and other entities
 * @returns {Promise<Object>} Dashboard metrics
 */
export const getDashboardMetrics = async () => {
  try {
    logger.info('Fetching dashboard metrics');

    // Get student statistics
    const studentStats = await getStudentStats();

    // Get sponsor statistics
    const sponsorStats = await getSponsorStats();

    // Get teacher statistics
    const teacherStats = await getTeacherStats();

    // Get report card statistics
    const reportCardStats = await getReportCardStats();

    // Get attendance statistics (placeholder for now, will be implemented in Phase 6)
    const attendanceStats = {
      todayPresent: 0,
      todayAbsent: 0,
      attendanceRate: '0%',
      message: 'Attendance tracking will be available after Phase 6 implementation'
    };

    // Get pending approvals (real counts from database)
    const pendingApprovals = await getPendingApprovalStats();

    // Get recent activity from audit logs
    const recentActivity = await getRecentActivity();

    const metrics = {
      students: studentStats,
      sponsors: sponsorStats,
      teachers: teacherStats,
      reportCards: reportCardStats,
      attendance: attendanceStats,
      pendingApprovals,
      recentActivity,
      systemStatus: {
        status: 'operational',
        lastChecked: new Date().toISOString()
      },
      generatedAt: new Date().toISOString(),
      currentDate: new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    };

    logger.info('Dashboard metrics fetched successfully');
    return metrics;
  } catch (error) {
    logger.error('Error fetching dashboard metrics:', error);
    throw error;
  }
};

/**
 * Get student statistics
 * @returns {Promise<Object>} Student stats
 */
const getStudentStats = async () => {
  try {
    // Total students
    const total = await Student.count();

    // Active students
    const active = await Student.count({
      where: { isActive: true }
    });

    // Inactive students
    const inactive = total - active;

    // New students this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newThisMonth = await Student.count({
      where: {
        createdAt: {
          [Op.gte]: startOfMonth
        }
      }
    });

    // Students by class (top 5)
    const byClass = await Student.findAll({
      attributes: [
        'currentClass',
        [Student.sequelize.fn('COUNT', Student.sequelize.col('id')), 'count']
      ],
      where: { isActive: true },
      group: ['currentClass'],
      order: [[Student.sequelize.fn('COUNT', Student.sequelize.col('id')), 'DESC']],
      limit: 5,
      raw: true
    });

    return {
      total,
      active,
      inactive,
      newThisMonth,
      byClass: byClass.map(item => ({
        class: item.currentClass,
        count: parseInt(item.count)
      }))
    };
  } catch (error) {
    logger.error('Error fetching student stats:', error);
    throw error;
  }
};

/**
 * Get sponsor statistics
 * @returns {Promise<Object>} Sponsor stats
 */
const getSponsorStats = async () => {
  try {
    // Total sponsors
    const total = await Sponsor.count();

    // Active sponsors
    const active = await Sponsor.count({
      where: { 
        isActive: true,
        status: 'active'
      }
    });

    // Inactive sponsors
    const inactive = total - active;

    // Total sponsored students
    const totalSponsoredStudents = await StudentSponsorMapping.count({
      where: { status: 'active' }
    });

    // Average students per sponsor
    const averageStudentsPerSponsor = active > 0 
      ? (totalSponsoredStudents / active).toFixed(1) 
      : 0;

    // Sponsors by country (top 5)
    const byCountry = await Sponsor.findAll({
      attributes: [
        'country',
        [Sponsor.sequelize.fn('COUNT', Sponsor.sequelize.col('id')), 'count']
      ],
      where: { isActive: true },
      group: ['country'],
      order: [[Sponsor.sequelize.fn('COUNT', Sponsor.sequelize.col('id')), 'DESC']],
      limit: 5,
      raw: true
    });

    // Expiring sponsorships (next 30 days)
    const expiringDate = new Date();
    expiringDate.setDate(expiringDate.getDate() + 30);

    const expiringSoon = await StudentSponsorMapping.count({
      where: {
        status: 'active',
        endDate: {
          [Op.between]: [new Date(), expiringDate]
        }
      }
    });

    return {
      total,
      active,
      inactive,
      totalSponsoredStudents,
      averageStudentsPerSponsor: parseFloat(averageStudentsPerSponsor),
      expiringSoon,
      byCountry: byCountry.map(item => ({
        country: item.country || 'Unknown',
        count: parseInt(item.count)
      }))
    };
  } catch (error) {
    logger.error('Error fetching sponsor stats:', error);
    throw error;
  }
};

/**
 * Get recent activity (placeholder for now)
 * @returns {Promise<Array>} Recent activities
 */
export const getRecentActivity = async () => {
  try {
    // Fetch recent audit logs
    const recentLogs = await AuditLog.findAll({
      where: {
        status: 'SUCCESS'
      },
      order: [['createdAt', 'DESC']],
      limit: 10,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email', 'role']
      }]
    });

    const activities = recentLogs.map(log => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      user: log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System',
      userRole: log.user?.role || 'system',
      timestamp: log.createdAt,
      timeAgo: getTimeAgo(log.createdAt),
      message: formatActivityMessage(log)
    }));

    return activities;
  } catch (error) {
    logger.error('Error fetching recent activity:', error);
    // Return empty array on error instead of failing
    return [];
  }
};

/**
 * Get teacher statistics
 * @returns {Promise<Object>} Teacher stats
 */
const getTeacherStats = async () => {
  try {
    // Total teachers
    const total = await User.count({
      where: { role: 'teacher' }
    });

    // Active teachers
    const active = await User.count({
      where: { 
        role: 'teacher',
        isActive: true
      }
    });

    // Inactive teachers
    const inactive = total - active;

    // New teachers this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newThisMonth = await User.count({
      where: {
        role: 'teacher',
        createdAt: {
          [Op.gte]: startOfMonth
        }
      }
    });

    return {
      total,
      active,
      inactive,
      newThisMonth
    };
  } catch (error) {
    logger.error('Error fetching teacher stats:', error);
    return { total: 0, active: 0, inactive: 0, newThisMonth: 0 };
  }
};

/**
 * Get report card statistics
 * @returns {Promise<Object>} Report card stats
 */
const getReportCardStats = async () => {
  try {
    // Total report cards
    const total = await ReportCard.count();

    // By status
    const published = await ReportCard.count({
      where: { status: 'published' }
    });

    const pending = await ReportCard.count({
      where: { status: 'pending' }
    });

    const draft = await ReportCard.count({
      where: { status: 'draft' }
    });

    // Generated this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const generatedThisMonth = await ReportCard.count({
      where: {
        createdAt: {
          [Op.gte]: startOfMonth
        }
      }
    });

    return {
      total,
      published,
      pending,
      draft,
      generatedThisMonth
    };
  } catch (error) {
    logger.error('Error fetching report card stats:', error);
    return { total: 0, published: 0, pending: 0, draft: 0, generatedThisMonth: 0 };
  }
};

/**
 * Get pending approval statistics for Principal/Admin dashboard
 * @returns {Promise<Object>} Pending approval stats
 */
const getPendingApprovalStats = async () => {
  try {
    // Pending marksheets (status = 'submitted', awaiting principal/admin approval)
    const pendingMarksheets = await Marksheet.count({
      where: { status: 'submitted' }
    });

    // Recently submitted marksheets (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const newSubmissions = await Marksheet.count({
      where: {
        status: 'submitted',
        submittedAt: {
          [Op.gte]: yesterday
        }
      }
    });

    // Rejected marksheets awaiting teacher revision
    const rejectedMarksheets = await Marksheet.count({
      where: { status: 'rejected' }
    });

    // Approved marksheets this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const approvedThisMonth = await Marksheet.count({
      where: {
        status: 'approved',
        approvedAt: {
          [Op.gte]: startOfMonth
        }
      }
    });

    // Report cards pending signature
    const pendingReportCards = await ReportCard.count({
      where: { status: 'pending' }
    });

    // Report cards ready for distribution (signed but not distributed)
    const readyForDistribution = await ReportCard.count({
      where: { status: 'signed' }
    });

    return {
      marksheets: pendingMarksheets,
      newSubmissions,
      rejectedMarksheets,
      approvedThisMonth,
      reportCards: pendingReportCards,
      readyForDistribution,
      total: pendingMarksheets + pendingReportCards
    };
  } catch (error) {
    logger.error('Error fetching pending approval stats:', error);
    return {
      marksheets: 0,
      newSubmissions: 0,
      rejectedMarksheets: 0,
      approvedThisMonth: 0,
      reportCards: 0,
      readyForDistribution: 0,
      total: 0
    };
  }
};

/**
 * Format activity message based on audit log
 * @param {Object} log - Audit log entry
 * @returns {string} Formatted message
 */
const formatActivityMessage = (log) => {
  const userName = log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System';
  const entity = log.entityType || 'record';
  
  const actionMessages = {
    'CREATE': `${userName} created a new ${entity}`,
    'UPDATE': `${userName} updated a ${entity}`,
    'DELETE': `${userName} deleted a ${entity}`,
    'LOGIN': `${userName} logged in`,
    'LOGOUT': `${userName} logged out`,
    'LOGIN_FAILED': `Failed login attempt`,
    'PASSWORD_CHANGED': `${userName} changed their password`,
    'MFA_ENABLED': `${userName} enabled MFA`,
    'MFA_DISABLED': `${userName} disabled MFA`,
    'MARKS_APPROVED': `${userName} approved marks`,
    'MARKS_REJECTED': `${userName} rejected marks`,
    'REPORT_GENERATED': `${userName} generated a report card`,
    'USER_ACTIVATED': `${userName} activated a user`,
    'USER_DEACTIVATED': `${userName} deactivated a user`,
    'ROLE_CHANGED': `${userName} changed a user role`
  };

  return actionMessages[log.action] || `${userName} performed ${log.action} on ${entity}`;
};

/**
 * Get relative time string
 * @param {Date} date - Date to compare
 * @returns {string} Relative time string
 */
const getTimeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return interval === 1 ? `1 ${unit} ago` : `${interval} ${unit}s ago`;
    }
  }
  
  return 'just now';
};
