import { Op } from 'sequelize';
import ReportCard from '../models/ReportCard.js';
import ReportCardAttachment from '../models/ReportCardAttachment.js';
import ReportCardDistributionLog from '../models/ReportCardDistributionLog.js';
import { Marksheet, Mark, Subject, Student, User, AuditLog } from '../models/index.js';
import sequelize from '../config/database.js';
import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

/**
 * Report Card Service
 * Business logic for report card generation, signing, and distribution
 */

/**
 * Generate report card for a student
 * Calculates totals from approved marksheets and creates report card
 * @param {string} studentId - Student UUID
 * @param {string} academicYearId - Academic Year UUID
 * @param {string} generatedBy - User ID generating the report
 * @returns {Promise<Object>} Generated report card
 */
export const generateReportCard = async (studentId, academicYearId, generatedBy) => {
  const transaction = await sequelize.transaction();
  
  try {
    // Check if report card already exists for this student/academic year
    const existingReport = await ReportCard.findOne({
      where: {
        studentId,
        academicYearId
      }
    });
    
    if (existingReport && existingReport.status !== 'Draft') {
      throw new Error('Report card already exists for this student and academic year');
    }

    // Get student details
    const student = await Student.findByPk(studentId, {
      attributes: ['id', 'firstName', 'lastName', 'schoolId'],
      transaction
    });

    if (!student) {
      throw new Error('Student not found');
    }

    // Get all approved marksheets for this student and academic year
    const approvedMarksheets = await Marksheet.findAll({
      where: {
        academicYearId,
        status: 'approved'
      },
      include: [
        {
          model: Mark,
          as: 'marks',
          where: {
            // Filter marks for this student through enrollment
            academicYearEnrollmentId: {
              [Op.in]: sequelize.literal(`(
                SELECT id FROM academic_year_enrollments 
                WHERE student_id = '${studentId}' 
                AND academic_year_id = '${academicYearId}'
              )`)
            }
          },
          required: true,
          include: [
            {
              model: Subject,
              as: 'subject',
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      transaction
    });

    if (!approvedMarksheets || approvedMarksheets.length === 0) {
      throw new Error('No approved marksheets found for this student and academic year');
    }

    // Calculate totals
    let totalMarksObtained = 0;
    let totalMaxMarks = 0;

    approvedMarksheets.forEach(marksheet => {
      if (marksheet.marks && marksheet.marks.length > 0) {
        marksheet.marks.forEach(mark => {
          totalMarksObtained += parseFloat(mark.marksObtained || 0);
          totalMaxMarks += parseFloat(mark.maxMarks || 0);
        });
      }
    });

    // Calculate percentage
    const percentage = totalMaxMarks > 0 
      ? ((totalMarksObtained / totalMaxMarks) * 100).toFixed(2)
      : 0;

    // Calculate grade
    const finalGrade = ReportCard.calculateGrade(parseFloat(percentage));

    // Generate PDF URL (placeholder - can be enhanced with actual PDF generation)
    const pdfUrl = await generatePDFUrl(studentId, academicYearId, {
      totalMarksObtained,
      totalMaxMarks,
      percentage,
      finalGrade,
      marksheets: approvedMarksheets
    });

    // Create or update report card
    let reportCard;
    if (existingReport) {
      // Update existing draft
      await existingReport.update({
        totalMarksObtained,
        totalMaxMarks,
        percentage,
        finalGrade,
        pdfUrl,
        status: 'Generated',
        modifiedAt: new Date()
      }, { transaction });
      reportCard = existingReport;
    } else {
      // Create new report card
      reportCard = await ReportCard.create({
        studentId,
        academicYearId,
        schoolId: student.schoolId,
        totalMarksObtained,
        totalMaxMarks,
        percentage,
        finalGrade,
        pdfUrl,
        status: 'Generated'
      }, { transaction });
    }

    // Create audit log
    await AuditLog.create({
      userId: generatedBy,
      action: 'GENERATE',
      entityType: 'report_card',
      entityId: reportCard.id,
      details: {
        studentId,
        academicYearId,
        totalMarksObtained,
        totalMaxMarks,
        percentage,
        finalGrade
      }
    }, { transaction });

    await transaction.commit();

    logger.info(`Report card generated for student ${studentId}, academic year ${academicYearId}`);

    // Return report card with related data
    return await ReportCard.findByPk(reportCard.id, {
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'firstName', 'lastName', 'studentId']
        },
        {
          model: User,
          as: 'signer',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

  } catch (error) {
    await transaction.rollback();
    logger.error('Error generating report card:', error);
    throw error;
  }
};

/**
 * Generate PDF URL for report card
 * @param {string} studentId - Student UUID
 * @param {string} academicYearId - Academic Year UUID
 * @param {Object} data - Report card data
 * @returns {Promise<string>} PDF URL
 */
const generatePDFUrl = async (studentId, academicYearId, data) => {
  // Placeholder implementation
  // In production, use puppeteer, pdfkit, or similar to generate actual PDF
  // Store in S3 or local storage and return URL
  
  const timestamp = Date.now();
  const pdfFileName = `report-card-${studentId}-${academicYearId}-${timestamp}.pdf`;
  
  // For now, return a placeholder URL
  // TODO: Implement actual PDF generation
  return `/uploads/report-cards/${pdfFileName}`;
};

/**
 * Sign report card (principal/admin only)
 * @param {string} reportCardId - Report Card UUID
 * @param {string} principalId - Principal/Admin user ID
 * @returns {Promise<Object>} Signed report card
 */
export const signReportCard = async (reportCardId, principalId) => {
  const transaction = await sequelize.transaction();
  
  try {
    const reportCard = await ReportCard.findByPk(reportCardId, { transaction });

    if (!reportCard) {
      throw new Error('Report card not found');
    }

    // Verify user is principal, admin, or super_admin
    const user = await User.findByPk(principalId, {
      attributes: ['id', 'role'],
      transaction
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (!['principal', 'admin', 'super_admin'].includes(user.role)) {
      throw new Error('Only principals and admins can sign report cards');
    }

    // Sign the report card
    await reportCard.sign(principalId, transaction);

    // Create audit log
    await AuditLog.create({
      userId: principalId,
      action: 'SIGN',
      entityType: 'report_card',
      entityId: reportCard.id,
      details: {
        studentId: reportCard.studentId,
        academicYearId: reportCard.academicYearId,
        previousStatus: 'Generated',
        newStatus: 'Signed'
      }
    }, { transaction });

    await transaction.commit();

    logger.info(`Report card ${reportCardId} signed by user ${principalId}`);

    return await ReportCard.findByPk(reportCardId, {
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'firstName', 'lastName', 'studentId']
        },
        {
          model: User,
          as: 'signer',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

  } catch (error) {
    await transaction.rollback();
    logger.error('Error signing report card:', error);
    throw error;
  }
};

/**
 * Distribute report card via email
 * @param {string} reportCardId - Report Card UUID
 * @param {string} distributedBy - User ID distributing the report
 * @param {Array<string>} recipientEmails - Array of recipient email addresses
 * @param {Array<string>} recipientTypes - Array of recipient types (parent, sponsor, etc.)
 * @returns {Promise<Object>} Distribution result
 */
export const distributeReportCard = async (reportCardId, distributedBy, recipientEmails, recipientTypes = []) => {
  const transaction = await sequelize.transaction();
  
  try {
    const reportCard = await ReportCard.findByPk(reportCardId, {
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'firstName', 'lastName', 'studentId']
        }
      ],
      transaction
    });

    if (!reportCard) {
      throw new Error('Report card not found');
    }

    if (!reportCard.canDistribute()) {
      throw new Error(`Report card cannot be distributed. Current status: ${reportCard.status}`);
    }

    if (!recipientEmails || recipientEmails.length === 0) {
      throw new Error('At least one recipient email is required');
    }

    // Send emails to all recipients
    const emailResults = [];
    const distributionLogs = [];

    for (let i = 0; i < recipientEmails.length; i++) {
      const email = recipientEmails[i];
      const recipientType = recipientTypes[i] || 'other';

      try {
        // Send email
        await sendReportCardEmail(email, reportCard);

        // Log successful distribution
        const log = await ReportCardDistributionLog.create({
          reportCardId,
          recipientEmail: email,
          recipientType,
          distributedBy,
          emailStatus: 'sent'
        }, { transaction });

        distributionLogs.push(log);
        emailResults.push({ email, status: 'sent', success: true });

      } catch (emailError) {
        logger.error(`Failed to send email to ${email}:`, emailError);

        // Log failed distribution
        const log = await ReportCardDistributionLog.create({
          reportCardId,
          recipientEmail: email,
          recipientType,
          distributedBy,
          emailStatus: 'failed',
          errorMessage: emailError.message
        }, { transaction });

        distributionLogs.push(log);
        emailResults.push({ email, status: 'failed', success: false, error: emailError.message });
      }
    }

    // Mark report card as distributed
    await reportCard.markDistributed(transaction);

    // Create audit log
    await AuditLog.create({
      userId: distributedBy,
      action: 'DISTRIBUTE',
      entityType: 'report_card',
      entityId: reportCard.id,
      details: {
        recipientCount: recipientEmails.length,
        successCount: emailResults.filter(r => r.success).length,
        failedCount: emailResults.filter(r => !r.success).length
      }
    }, { transaction });

    await transaction.commit();

    logger.info(`Report card ${reportCardId} distributed to ${recipientEmails.length} recipients`);

    return {
      reportCard,
      distributionLogs,
      emailResults,
      summary: {
        total: recipientEmails.length,
        sent: emailResults.filter(r => r.success).length,
        failed: emailResults.filter(r => !r.success).length
      }
    };

  } catch (error) {
    await transaction.rollback();
    logger.error('Error distributing report card:', error);
    throw error;
  }
};

/**
 * Send report card email
 * @param {string} recipientEmail - Recipient email address
 * @param {Object} reportCard - Report card object
 * @returns {Promise<void>}
 */
const sendReportCardEmail = async (recipientEmail, reportCard) => {
  // Create email transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });

  const studentName = reportCard.student 
    ? `${reportCard.student.firstName} ${reportCard.student.lastName}`
    : 'Student';

  // Email content
  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@zschool.com',
    to: recipientEmail,
    subject: `Report Card - ${studentName}`,
    html: `
      <h2>Student Report Card</h2>
      <p>Dear Parent/Guardian,</p>
      <p>Please find the report card for <strong>${studentName}</strong>.</p>
      <ul>
        <li><strong>Total Marks Obtained:</strong> ${reportCard.totalMarksObtained}</li>
        <li><strong>Total Maximum Marks:</strong> ${reportCard.totalMaxMarks}</li>
        <li><strong>Percentage:</strong> ${reportCard.percentage}%</li>
        <li><strong>Grade:</strong> ${reportCard.finalGrade}</li>
      </ul>
      <p>You can download the full report card from: <a href="${reportCard.pdfUrl}">Download PDF</a></p>
      <p>Best regards,<br/>ZSchool Management Team</p>
    `
  };

  // Send email
  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully to ${recipientEmail}`);
  } catch (error) {
    logger.error(`Failed to send email to ${recipientEmail}:`, error);
    throw error;
  }
};

/**
 * Get student report cards with filters and pagination
 * @param {string} studentId - Student UUID
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} Paginated report cards
 */
export const getStudentReportCards = async (studentId, filters = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      academicYearId,
      status
    } = filters;

    const offset = (page - 1) * limit;
    const where = { studentId };

    if (academicYearId) {
      where.academicYearId = academicYearId;
    }

    if (status) {
      where.status = status;
    }

    const { count, rows } = await ReportCard.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'firstName', 'lastName', 'studentId']
        },
        {
          model: User,
          as: 'signer',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: ReportCardAttachment,
          as: 'attachments',
          required: false
        }
      ]
    });

    return {
      reportCards: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    };

  } catch (error) {
    logger.error('Error getting student report cards:', error);
    throw error;
  }
};

/**
 * Get report card by ID
 * @param {string} reportCardId - Report Card UUID
 * @returns {Promise<Object>} Report card with related data
 */
export const getReportCardById = async (reportCardId) => {
  try {
    const reportCard = await ReportCard.findByPk(reportCardId, {
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'firstName', 'lastName', 'studentId', 'email']
        },
        {
          model: User,
          as: 'signer',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: ReportCardAttachment,
          as: 'attachments',
          required: false
        },
        {
          model: ReportCardDistributionLog,
          as: 'distributionLogs',
          required: false,
          order: [['distributedAt', 'DESC']],
          limit: 10
        }
      ]
    });

    if (!reportCard) {
      throw new Error('Report card not found');
    }

    return reportCard;

  } catch (error) {
    logger.error('Error getting report card by ID:', error);
    throw error;
  }
};

/**
 * Delete report card (only if status is Draft)
 * @param {string} reportCardId - Report Card UUID
 * @param {string} userId - User ID performing the action
 * @returns {Promise<void>}
 */
export const deleteReportCard = async (reportCardId, userId) => {
  const transaction = await sequelize.transaction();
  
  try {
    const reportCard = await ReportCard.findByPk(reportCardId, { transaction });

    if (!reportCard) {
      throw new Error('Report card not found');
    }

    if (reportCard.status !== 'Draft') {
      throw new Error('Only draft report cards can be deleted');
    }

    // Delete related attachments
    await ReportCardAttachment.destroy({
      where: { reportCardId },
      transaction
    });

    // Delete related distribution logs
    await ReportCardDistributionLog.destroy({
      where: { reportCardId },
      transaction
    });

    // Delete report card
    await reportCard.destroy({ transaction });

    // Create audit log
    await AuditLog.create({
      userId,
      action: 'DELETE',
      entityType: 'report_card',
      entityId: reportCardId,
      details: {
        studentId: reportCard.studentId,
        academicYearId: reportCard.academicYearId,
        status: reportCard.status
      }
    }, { transaction });

    await transaction.commit();

    logger.info(`Report card ${reportCardId} deleted by user ${userId}`);

  } catch (error) {
    await transaction.rollback();
    logger.error('Error deleting report card:', error);
    throw error;
  }
};

export default {
  generateReportCard,
  signReportCard,
  distributeReportCard,
  getStudentReportCards,
  getReportCardById,
  deleteReportCard
};
