import { Student } from '../models/index.js';
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

    // Get attendance statistics (placeholder for now, will be implemented in Phase 6)
    const attendanceStats = {
      todayPresent: 0,
      todayAbsent: 0,
      attendanceRate: '0%',
      message: 'Attendance tracking will be available after Phase 6 implementation'
    };

    // Get pending approvals (placeholder for Phase 7)
    const pendingApprovals = {
      marksheets: 0,
      reportCards: 0,
      message: 'Approval tracking will be available after Phase 7 implementation'
    };

    const metrics = {
      students: studentStats,
      sponsors: sponsorStats,
      attendance: attendanceStats,
      pendingApprovals,
      generatedAt: new Date().toISOString()
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
    // This will be implemented with audit logs
    return {
      recentStudents: [],
      recentSponsors: [],
      message: 'Recent activity tracking coming soon'
    };
  } catch (error) {
    logger.error('Error fetching recent activity:', error);
    throw error;
  }
};
