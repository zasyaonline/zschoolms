import cron from 'node-cron';
import { Op } from 'sequelize';
import { sendEmail } from '../services/email.service.js';
import logger from '../utils/logger.js';

/**
 * Sponsorship Renewal Reminder Job
 * Automated system that tracks renewal dates and dispatches
 * reminder and overdue emails to sponsors at predefined intervals
 * 
 * Schedule:
 * - Daily at 8:00 AM: Check for upcoming renewals and overdue sponsorships
 * - Reminder intervals: 60 days, 30 days, 7 days, 0 days (due date) before expiry
 * - Overdue intervals: 15 days, 30 days after expiry
 */

// Import models dynamically to avoid circular dependencies
let Sponsor, StudentSponsorMapping, Student;

const loadModels = async () => {
  if (!Sponsor) {
    const models = await import('../models/index.js');
    Sponsor = models.Sponsor;
    StudentSponsorMapping = models.StudentSponsorMapping;
    Student = models.Student;
  }
};

// Reminder intervals (days before expiry) - updated per requirements
const REMINDER_DAYS = [60, 30, 7, 0];
// Overdue intervals (days after expiry) - updated per requirements
const OVERDUE_DAYS = [15, 30];

/**
 * Get sponsorships expiring within specified days
 * @param {number} days - Days until expiry
 * @returns {Promise<Array>} Sponsorships expiring on that date
 */
const getExpiringSponshorships = async (days) => {
  await loadModels();

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + days);
  targetDate.setHours(0, 0, 0, 0);

  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);

  return await StudentSponsorMapping.findAll({
    where: {
      status: 'active',
      endDate: {
        [Op.gte]: targetDate,
        [Op.lt]: nextDay
      }
    },
    include: [
      {
        model: Sponsor,
        as: 'sponsor',
        where: { isActive: true },
        required: true
      },
      {
        model: Student,
        as: 'student',
        required: true
      }
    ]
  });
};

/**
 * Get overdue sponsorships (expired but not terminated)
 * @param {number} days - Days since expiry
 * @returns {Promise<Array>} Overdue sponsorships
 */
const getOverdueSponshorships = async (days) => {
  await loadModels();

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - days);
  targetDate.setHours(0, 0, 0, 0);

  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);

  return await StudentSponsorMapping.findAll({
    where: {
      status: 'active', // Still marked active but actually expired
      endDate: {
        [Op.gte]: targetDate,
        [Op.lt]: nextDay
      }
    },
    include: [
      {
        model: Sponsor,
        as: 'sponsor',
        where: { isActive: true },
        required: true
      },
      {
        model: Student,
        as: 'student',
        required: true
      }
    ]
  });
};

/**
 * Send renewal reminder email
 * @param {Object} sponsorship - Sponsorship mapping with sponsor and student
 * @param {number} daysRemaining - Days until expiry
 */
const sendReminderEmail = async (sponsorship, daysRemaining) => {
  const { sponsor, student } = sponsorship;

  if (!sponsor.email) {
    logger.warn(`Sponsor ${sponsor.id} has no email address`);
    return;
  }

  const subject = `Sponsorship Renewal Reminder - ${daysRemaining} days remaining`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1F55A6; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .highlight { background: #FFF3CD; border-left: 4px solid #FFC107; padding: 15px; margin: 20px 0; }
        .student-info { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .button { display: inline-block; padding: 12px 24px; background: #1F55A6; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Sponsorship Renewal Reminder</h1>
        </div>
        <div class="content">
          <p>Dear ${sponsor.firstName || sponsor.organizationName || 'Sponsor'},</p>
          
          <div class="highlight">
            <strong>⏰ ${daysRemaining} days remaining</strong> until your sponsorship expires.
          </div>
          
          <p>Your sponsorship for the following student is expiring soon:</p>
          
          <div class="student-info">
            <p><strong>Student Name:</strong> ${student.firstName} ${student.lastName}</p>
            <p><strong>Student ID:</strong> ${student.studentId || 'N/A'}</p>
            <p><strong>Sponsorship Type:</strong> ${sponsorship.sponsorshipType || 'Full'}</p>
            <p><strong>Current End Date:</strong> ${new Date(sponsorship.endDate).toLocaleDateString()}</p>
          </div>
          
          <p>To continue supporting this student's education, please renew your sponsorship before the expiry date.</p>
          
          <p style="text-align: center;">
            <a href="${process.env.FRONTEND_URL}/sponsor/renew/${sponsorship.id}" class="button">Renew Sponsorship</a>
          </p>
          
          <p>If you have any questions about the renewal process, please contact our support team.</p>
          
          <p>Thank you for your continued support!</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 ZSchool Management System. All rights reserved.</p>
          <p>This is an automated reminder. If you've already renewed, please disregard this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await sendEmail({
      to: sponsor.email,
      subject,
      html
    });
    logger.info(`Reminder email sent to ${sponsor.email} for sponsorship ${sponsorship.id}`);
  } catch (error) {
    logger.error(`Failed to send reminder email to ${sponsor.email}:`, error);
  }
};

/**
 * Send overdue notification email
 * @param {Object} sponsorship - Sponsorship mapping with sponsor and student
 * @param {number} daysOverdue - Days since expiry
 */
const sendOverdueEmail = async (sponsorship, daysOverdue) => {
  const { sponsor, student } = sponsorship;

  if (!sponsor.email) {
    logger.warn(`Sponsor ${sponsor.id} has no email address`);
    return;
  }

  const subject = `URGENT: Sponsorship Expired - ${daysOverdue} day(s) overdue`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #DC3545; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .alert { background: #F8D7DA; border-left: 4px solid #DC3545; padding: 15px; margin: 20px 0; }
        .student-info { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .button { display: inline-block; padding: 12px 24px; background: #DC3545; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚠️ Sponsorship Expired</h1>
        </div>
        <div class="content">
          <p>Dear ${sponsor.firstName || sponsor.organizationName || 'Sponsor'},</p>
          
          <div class="alert">
            <strong>🚨 Your sponsorship has expired ${daysOverdue} day(s) ago.</strong>
            <br>Immediate action is required to continue supporting the student.
          </div>
          
          <p>The sponsorship for the following student has expired:</p>
          
          <div class="student-info">
            <p><strong>Student Name:</strong> ${student.firstName} ${student.lastName}</p>
            <p><strong>Student ID:</strong> ${student.studentId || 'N/A'}</p>
            <p><strong>Sponsorship Type:</strong> ${sponsorship.sponsorshipType || 'Full'}</p>
            <p><strong>Expired On:</strong> ${new Date(sponsorship.endDate).toLocaleDateString()}</p>
          </div>
          
          <p><strong>What happens if not renewed?</strong></p>
          <ul>
            <li>The student may lose access to educational resources</li>
            <li>Sponsorship records will be marked as terminated</li>
            <li>A new sponsorship application may be required</li>
          </ul>
          
          <p style="text-align: center;">
            <a href="${process.env.FRONTEND_URL}/sponsor/renew/${sponsorship.id}" class="button">Renew Now</a>
          </p>
          
          <p>If you need assistance or have questions about your sponsorship, please contact our support team immediately.</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 ZSchool Management System. All rights reserved.</p>
          <p>This is an urgent automated notification.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await sendEmail({
      to: sponsor.email,
      subject,
      html
    });
    logger.info(`Overdue email sent to ${sponsor.email} for sponsorship ${sponsorship.id}`);
  } catch (error) {
    logger.error(`Failed to send overdue email to ${sponsor.email}:`, error);
  }
};

/**
 * Process all renewal reminders
 */
const processRenewalReminders = async () => {
  logger.info('Starting sponsorship renewal reminder processing...');

  let totalReminders = 0;
  let totalOverdue = 0;

  // Process upcoming reminders
  for (const days of REMINDER_DAYS) {
    try {
      const expiringSponshorships = await getExpiringSponshorships(days);
      
      for (const sponsorship of expiringSponshorships) {
        await sendReminderEmail(sponsorship, days);
        totalReminders++;
      }
      
      if (expiringSponshorships.length > 0) {
        logger.info(`Sent ${expiringSponshorships.length} reminders for ${days}-day expiry`);
      }
    } catch (error) {
      logger.error(`Error processing ${days}-day reminders:`, error);
    }
  }

  // Process overdue notifications
  for (const days of OVERDUE_DAYS) {
    try {
      const overdueSponshorships = await getOverdueSponshorships(days);
      
      for (const sponsorship of overdueSponshorships) {
        await sendOverdueEmail(sponsorship, days);
        totalOverdue++;
      }
      
      if (overdueSponshorships.length > 0) {
        logger.info(`Sent ${overdueSponshorships.length} overdue notices for ${days}-day expiry`);
      }
    } catch (error) {
      logger.error(`Error processing ${days}-day overdue notices:`, error);
    }
  }

  logger.info(`Renewal processing complete. Reminders: ${totalReminders}, Overdue: ${totalOverdue}`);
};

/**
 * Start the cron job scheduler
 * Runs daily at 8:00 AM
 */
export const startRenewalReminderJob = () => {
  // Schedule: At 8:00 AM every day
  const schedule = process.env.RENEWAL_CRON_SCHEDULE || '0 8 * * *';

  const job = cron.schedule(schedule, async () => {
    logger.info('Renewal reminder cron job triggered');
    await processRenewalReminders();
  }, {
    scheduled: true,
    timezone: process.env.TIMEZONE || 'Asia/Kolkata'
  });

  logger.info(`Sponsorship renewal reminder job scheduled: ${schedule}`);
  
  return job;
};

/**
 * Run renewal check manually (for testing or on-demand)
 */
export const runRenewalCheckManually = async () => {
  logger.info('Manual renewal check triggered');
  await processRenewalReminders();
};

/**
 * Get upcoming renewals summary (for dashboard)
 * @returns {Promise<Object>} Summary of upcoming renewals
 */
export const getRenewalsSummary = async () => {
  await loadModels();

  const now = new Date();
  const thirtyDaysLater = new Date(now);
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

  try {
    // Expiring in next 30 days
    const expiringCount = await StudentSponsorMapping.count({
      where: {
        status: 'active',
        endDate: {
          [Op.gte]: now,
          [Op.lte]: thirtyDaysLater
        }
      }
    });

    // Already expired (overdue)
    const overdueCount = await StudentSponsorMapping.count({
      where: {
        status: 'active',
        endDate: {
          [Op.lt]: now
        }
      }
    });

    // Expiring this week
    const oneWeekLater = new Date(now);
    oneWeekLater.setDate(oneWeekLater.getDate() + 7);
    
    const expiringThisWeek = await StudentSponsorMapping.count({
      where: {
        status: 'active',
        endDate: {
          [Op.gte]: now,
          [Op.lte]: oneWeekLater
        }
      }
    });

    return {
      expiringIn30Days: expiringCount,
      expiringThisWeek,
      overdue: overdueCount,
      total: expiringCount + overdueCount
    };

  } catch (error) {
    logger.error('Error getting renewals summary:', error);
    return {
      expiringIn30Days: 0,
      expiringThisWeek: 0,
      overdue: 0,
      total: 0,
      error: error.message
    };
  }
};

export default {
  startRenewalReminderJob,
  runRenewalCheckManually,
  getRenewalsSummary
};
