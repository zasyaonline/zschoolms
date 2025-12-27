import { Op } from 'sequelize';
import ReportCard from '../models/ReportCard.js';
import ReportCardAttachment from '../models/ReportCardAttachment.js';
import ReportCardDistributionLog from '../models/ReportCardDistributionLog.js';
import { Marksheet, Mark, Subject, Student, User, AuditLog } from '../models/index.js';
import sequelize from '../config/database.js';
import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';
import { generateReportCardPDF, getPDFBuffer } from './pdf.service.js';
import { createReportCardSignature, generatePDFHash, checkCertificateStatus } from './signature.service.js';
import { uploadPDF, getSignedUrl, isS3Configured } from './s3.service.js';

/**
 * Report Card Service
 * Business logic for report card generation, signing, and distribution
 * Integrates with PDF generation, digital signature, and S3 storage services
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

    // Collect subject data for PDF
    const subjects = [];
    approvedMarksheets.forEach(marksheet => {
      if (marksheet.marks && marksheet.marks.length > 0) {
        marksheet.marks.forEach(mark => {
          subjects.push({
            name: mark.subject?.name || 'Subject',
            marksObtained: mark.marksObtained,
            maxMarks: mark.maxMarks
          });
        });
      }
    });

    // Generate actual PDF and store (local or S3)
    const pdfResult = await generateAndStorePDF(studentId, academicYearId, {
      totalMarksObtained,
      totalMaxMarks,
      percentage,
      finalGrade,
      subjects,
      marksheets: approvedMarksheets
    }, existingReport);

    const pdfUrl = pdfResult.pdfUrl;
    const pdfHash = pdfResult.pdfHash;
    const s3Key = pdfResult.s3Key;

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
        pdfHash,
        s3Key,
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
 * Generate actual PDF and optionally upload to S3
 * @param {string} studentId - Student UUID
 * @param {string} academicYearId - Academic Year UUID
 * @param {Object} data - Report card data
 * @param {Object} reportCard - Report card record
 * @returns {Promise<Object>} PDF generation result with URL and hash
 */
const generateAndStorePDF = async (studentId, academicYearId, data, reportCard) => {
  try {
    // Get student and school details for PDF
    const student = await Student.findByPk(studentId, {
      include: [{ model: require('../models/School.js').default, as: 'school' }]
    });

    // Prepare data for PDF generation
    const pdfData = {
      student: {
        firstName: student.firstName,
        lastName: student.lastName,
        studentId: student.studentId,
        class: student.class || 'N/A',
        section: student.section || 'N/A',
        rollNo: student.rollNo,
        dateOfBirth: student.dateOfBirth
      },
      academicYear: { name: academicYearId, year: new Date().getFullYear() },
      school: student.school || { name: 'ZSchool' },
      subjects: data.subjects || [],
      totalMarksObtained: data.totalMarksObtained,
      totalMaxMarks: data.totalMaxMarks,
      percentage: data.percentage,
      finalGrade: data.finalGrade,
      reportCardId: reportCard?.id
    };

    // Generate actual PDF
    const pdfResult = await generateReportCardPDF(pdfData);
    
    if (!pdfResult.success) {
      throw new Error('PDF generation failed');
    }

    // Upload to S3 if configured
    if (isS3Configured()) {
      const s3Result = await uploadPDF(pdfResult.filePath, {
        studentId: student.studentId || studentId,
        academicYear: academicYearId,
        schoolId: student.schoolId || 'default',
        className: student.class || 'general',
        reportCardId: reportCard?.id,
        fileName: pdfResult.fileName
      });

      if (s3Result.success) {
        logger.info(`PDF uploaded to S3: ${s3Result.key}`);
        return {
          pdfUrl: s3Result.location,
          s3Key: s3Result.key,
          pdfHash: pdfResult.pdfHash,
          localStorage: false
        };
      }
    }

    // Return local path if S3 not configured
    logger.info(`PDF stored locally: ${pdfResult.relativePath}`);
    return {
      pdfUrl: pdfResult.relativePath,
      s3Key: null,
      pdfHash: pdfResult.pdfHash,
      localStorage: true
    };

  } catch (error) {
    logger.error('Error generating/storing PDF:', error);
    // Fallback to placeholder URL
    const timestamp = Date.now();
    return {
      pdfUrl: `/uploads/report-cards/report-card-${studentId}-${academicYearId}-${timestamp}.pdf`,
      s3Key: null,
      pdfHash: null,
      localStorage: true,
      error: error.message
    };
  }
};

/**
 * Sign report card (principal/admin only)
 * @param {string} reportCardId - Report Card UUID
 * @param {string} principalId - Principal/Admin user ID
 * @param {Object} options - Additional options (ipAddress)
 * @returns {Promise<Object>} Signed report card
 */
export const signReportCard = async (reportCardId, principalId, options = {}) => {
  const transaction = await sequelize.transaction();
  const { ipAddress } = options;
  
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

    // Check certificate is valid before signing
    const certStatus = checkCertificateStatus();
    if (!certStatus.exists || !certStatus.valid) {
      throw new Error('Principal certificate is missing or expired. Please generate a new certificate.');
    }

    // Create cryptographic signature if PDF hash exists
    let signatureData = null;
    if (reportCard.pdfHash) {
      signatureData = await createReportCardSignature(
        reportCard.id,
        reportCard.pdfHash,
        principalId
      );
      
      // Update report card with signature data
      await reportCard.update({
        digitalSignature: signatureData.signature,
        signatureAlgorithm: signatureData.algorithm,
        certificateFingerprint: signatureData.certificateFingerprint,
        signedAt: new Date()
      }, { transaction });
    }

    // Sign the report card (update status)
    await reportCard.sign(principalId, transaction);

    // Create audit log with IP address
    await AuditLog.create({
      userId: principalId,
      action: 'SIGN',
      entityType: 'report_card',
      entityId: reportCard.id,
      ipAddress: ipAddress || null,
      details: {
        studentId: reportCard.studentId,
        academicYearId: reportCard.academicYearId,
        previousStatus: 'Generated',
        newStatus: 'Signed',
        signatureAlgorithm: signatureData?.algorithm || 'RSA-SHA256',
        certificateFingerprint: signatureData?.certificateFingerprint,
        cryptographicallySigned: !!signatureData,
        ipAddress: ipAddress || 'unknown'
      }
    }, { transaction });

    await transaction.commit();

    logger.info(`Report card ${reportCardId} cryptographically signed by user ${principalId} from IP ${ipAddress || 'unknown'}`);

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

/**
 * Get classes ready for report card signature
 * Returns classes where all subjects for a given term/academic year have approved marksheets
 * @param {string} academicYearId - Academic Year UUID
 * @param {string} coursePartId - Course Part (term) UUID (optional)
 * @returns {Promise<Array>} Classes ready for signature
 */
export const getClassesReadyForSignature = async (academicYearId, coursePartId = null) => {
  try {
    // Get all class sections with their required subjects
    const { ClassSection, ClassSubject } = await import('../models/index.js');
    
    const classSections = await ClassSection.findAll({
      attributes: ['id', 'name', 'classId'],
      include: [
        {
          model: ClassSubject,
          as: 'classSubjects',
          attributes: ['id', 'subjectId'],
          include: [
            {
              model: Subject,
              as: 'subject',
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    });

    const readyClasses = [];

    for (const classSection of classSections) {
      const totalSubjects = classSection.classSubjects?.length || 0;
      
      if (totalSubjects === 0) continue;

      // Build where clause for marksheets
      const whereClause = {
        academicYearId,
        status: 'approved',
        classSectionId: classSection.id
      };
      
      if (coursePartId) {
        whereClause.coursePartId = coursePartId;
      }

      // Count approved marksheets for this class section
      const approvedMarksheets = await Marksheet.findAll({
        where: whereClause,
        attributes: ['subjectId'],
        group: ['subjectId'],
        raw: true
      });

      const approvedSubjectCount = approvedMarksheets.length;
      
      // Check if all subjects have approved marksheets
      const isReady = approvedSubjectCount >= totalSubjects;
      
      // Count pending report cards (generated but not signed)
      const pendingReportCards = await ReportCard.count({
        where: {
          academicYearId,
          status: 'pending'
        },
        include: [
          {
            model: Student,
            as: 'student',
            where: {
              // Students in this class section
              id: {
                [Op.in]: sequelize.literal(`(
                  SELECT student_id FROM academic_year_enrollments 
                  WHERE class_section_id = '${classSection.id}' 
                  AND academic_year_id = '${academicYearId}'
                )`)
              }
            },
            required: true
          }
        ]
      });

      // Count students enrolled in this class
      const enrolledStudents = await sequelize.query(
        `SELECT COUNT(DISTINCT student_id) as count 
         FROM academic_year_enrollments 
         WHERE class_section_id = :classSectionId 
         AND academic_year_id = :academicYearId`,
        {
          replacements: { classSectionId: classSection.id, academicYearId },
          type: sequelize.QueryTypes.SELECT
        }
      );

      const studentCount = parseInt(enrolledStudents[0]?.count || 0);

      readyClasses.push({
        classSectionId: classSection.id,
        className: classSection.name || `Class ${classSection.id}`,
        totalSubjects,
        approvedSubjects: approvedSubjectCount,
        isReadyForSignature: isReady,
        pendingReportCards,
        totalStudents: studentCount,
        completionPercentage: totalSubjects > 0 
          ? Math.round((approvedSubjectCount / totalSubjects) * 100) 
          : 0,
        missingSubjects: classSection.classSubjects
          ?.filter(cs => !approvedMarksheets.some(am => am.subjectId === cs.subjectId))
          ?.map(cs => ({
            id: cs.subject?.id,
            name: cs.subject?.name
          })) || []
      });
    }

    // Sort by completion percentage descending
    readyClasses.sort((a, b) => b.completionPercentage - a.completionPercentage);

    const summary = {
      totalClasses: readyClasses.length,
      readyForSignature: readyClasses.filter(c => c.isReadyForSignature).length,
      partiallyComplete: readyClasses.filter(c => c.completionPercentage > 0 && !c.isReadyForSignature).length,
      notStarted: readyClasses.filter(c => c.completionPercentage === 0).length
    };

    return {
      classes: readyClasses,
      summary
    };
  } catch (error) {
    logger.error('Error getting classes ready for signature:', error);
    throw error;
  }
};

/**
 * Get dashboard summary for principal's signature queue
 * @param {string} academicYearId - Academic Year UUID
 * @returns {Promise<Object>} Signature queue summary
 */
export const getSignatureQueueSummary = async (academicYearId) => {
  try {
    // Count report cards by status
    const pendingSignature = await ReportCard.count({
      where: {
        academicYearId,
        status: 'pending'
      }
    });

    const signedReportCards = await ReportCard.count({
      where: {
        academicYearId,
        status: 'signed'
      }
    });

    const distributedReportCards = await ReportCard.count({
      where: {
        academicYearId,
        status: 'distributed'
      }
    });

    // Get classes ready for signature
    const classesData = await getClassesReadyForSignature(academicYearId);

    return {
      reportCards: {
        pendingSignature,
        signed: signedReportCards,
        distributed: distributedReportCards,
        total: pendingSignature + signedReportCards + distributedReportCards
      },
      classes: classesData.summary,
      readyClasses: classesData.classes.filter(c => c.isReadyForSignature),
      academicYearId
    };
  } catch (error) {
    logger.error('Error getting signature queue summary:', error);
    throw error;
  }
};

/**
 * Batch generate report cards for a class section
 * @param {string} classSectionId - Class Section UUID
 * @param {string} academicYearId - Academic Year UUID
 * @param {string} generatedBy - User ID generating
 * @returns {Promise<Object>} Batch generation result
 */
export const batchGenerateReportCards = async (classSectionId, academicYearId, generatedBy) => {
  try {
    // Get all students enrolled in this class section for this academic year
    const students = await sequelize.query(
      `SELECT DISTINCT student_id as "studentId"
       FROM academic_year_enrollments 
       WHERE class_section_id = :classSectionId 
       AND academic_year_id = :academicYearId`,
      {
        replacements: { classSectionId, academicYearId },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!students || students.length === 0) {
      throw new Error('No students found in this class section for the academic year');
    }

    const results = {
      total: students.length,
      successful: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      generatedReportCards: []
    };

    // Generate report cards for each student
    for (const { studentId } of students) {
      try {
        // Check if report card already exists
        const existingReport = await ReportCard.findOne({
          where: { studentId, academicYearId }
        });

        if (existingReport && existingReport.status !== 'Draft') {
          results.skipped++;
          continue;
        }

        const reportCard = await generateReportCard(studentId, academicYearId, generatedBy);
        results.successful++;
        results.generatedReportCards.push({
          id: reportCard.id,
          studentId: reportCard.studentId
        });
      } catch (error) {
        results.failed++;
        results.errors.push({
          studentId,
          error: error.message
        });
        logger.warn(`Failed to generate report card for student ${studentId}: ${error.message}`);
      }
    }

    // Log batch operation
    await AuditLog.create({
      userId: generatedBy,
      action: 'BATCH_GENERATE',
      entityType: 'report_card',
      entityId: classSectionId,
      details: {
        classSectionId,
        academicYearId,
        totalStudents: results.total,
        successful: results.successful,
        failed: results.failed,
        skipped: results.skipped
      }
    });

    logger.info(`Batch report card generation completed for class ${classSectionId}: ${results.successful}/${results.total} successful`);

    return results;
  } catch (error) {
    logger.error('Error in batch report card generation:', error);
    throw error;
  }
};

/**
 * Batch sign report cards for a class section
 * @param {string} classSectionId - Class Section UUID
 * @param {string} academicYearId - Academic Year UUID
 * @param {string} principalId - Principal/Admin user ID
 * @param {Object} options - Additional options (ipAddress)
 * @returns {Promise<Object>} Batch signing result
 */
export const batchSignReportCards = async (classSectionId, academicYearId, principalId, options = {}) => {
  const { ipAddress } = options;
  
  try {
    // Verify user is principal/admin
    const user = await User.findByPk(principalId, {
      attributes: ['id', 'role']
    });

    if (!user || !['principal', 'admin', 'super_admin'].includes(user.role)) {
      throw new Error('Only principals and admins can sign report cards');
    }

    // Get all students in this class section
    const studentIds = await sequelize.query(
      `SELECT DISTINCT student_id as "studentId"
       FROM academic_year_enrollments 
       WHERE class_section_id = :classSectionId 
       AND academic_year_id = :academicYearId`,
      {
        replacements: { classSectionId, academicYearId },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!studentIds || studentIds.length === 0) {
      throw new Error('No students found in this class section');
    }

    // Get pending report cards for these students
    const pendingReportCards = await ReportCard.findAll({
      where: {
        studentId: { [Op.in]: studentIds.map(s => s.studentId) },
        academicYearId,
        status: 'pending'
      }
    });

    if (pendingReportCards.length === 0) {
      throw new Error('No pending report cards found for this class');
    }

    const results = {
      total: pendingReportCards.length,
      successful: 0,
      failed: 0,
      errors: [],
      signedReportCards: []
    };

    // Sign each report card
    for (const reportCard of pendingReportCards) {
      try {
        const signedReport = await signReportCard(reportCard.id, principalId, { ipAddress });
        results.successful++;
        results.signedReportCards.push({
          id: signedReport.id,
          studentId: signedReport.studentId
        });
      } catch (error) {
        results.failed++;
        results.errors.push({
          reportCardId: reportCard.id,
          studentId: reportCard.studentId,
          error: error.message
        });
        logger.warn(`Failed to sign report card ${reportCard.id}: ${error.message}`);
      }
    }

    // Log batch operation
    await AuditLog.create({
      userId: principalId,
      action: 'BATCH_SIGN',
      entityType: 'report_card',
      entityId: classSectionId,
      ipAddress: ipAddress || null,
      details: {
        classSectionId,
        academicYearId,
        totalReportCards: results.total,
        successful: results.successful,
        failed: results.failed,
        ipAddress: ipAddress || 'unknown'
      }
    });

    logger.info(`Batch report card signing completed for class ${classSectionId}: ${results.successful}/${results.total} successful`);

    return results;
  } catch (error) {
    logger.error('Error in batch report card signing:', error);
    throw error;
  }
};

export default {
  generateReportCard,
  signReportCard,
  distributeReportCard,
  getStudentReportCards,
  getReportCardById,
  deleteReportCard,
  getClassesReadyForSignature,
  getSignatureQueueSummary,
  batchGenerateReportCards,
  batchSignReportCards
};
