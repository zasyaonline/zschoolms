import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import { 
  ReportCard, 
  Student, 
  Sponsor, 
  StudentSponsorMapping, 
  User, 
  AuditLog,
  AcademicYear,
  ClassSection
} from '../models/index.js';
import EmailQueue from '../models/EmailQueue.js';
import BatchJob from '../models/BatchJob.js';
import { sendEmail } from './email.service.js';
import { getSignedUrl } from './s3.service.js';
import batchJobService from './batchjob.service.js';
import notificationService from './notification.service.js';
import logger from '../utils/logger.js';

/**
 * Bulk Distribution Service
 * Handles bulk email distribution of report cards to sponsors
 */

/**
 * Get distribution preview for a class
 * @param {string} classSectionId - Class Section UUID
 * @param {string} academicYearId - Academic Year UUID
 * @returns {Promise<Object>} Distribution preview with summary
 */
export const getDistributionPreview = async (classSectionId, academicYearId) => {
  try {
    // Get class section info
    const classSection = await ClassSection.findByPk(classSectionId, {
      attributes: ['id', 'section_name']
    });

    // Get academic year info
    const academicYear = await AcademicYear.findByPk(academicYearId, {
      attributes: ['id', 'year_name']
    });

    // Get all students with signed report cards
    const reportCards = await ReportCard.findAll({
      where: {
        academicYearId,
        status: { [Op.in]: ['Signed', 'Generated'] }
      },
      include: [{
        model: Student,
        as: 'student',
        attributes: ['id', 'firstName', 'lastName', 'studentId'],
        required: true
      }]
    });

    // Filter to students in this class section
    const enrolledStudentIds = await sequelize.query(
      `SELECT student_id FROM academic_year_enrollments 
       WHERE class_section_id = :classSectionId AND academic_year_id = :academicYearId`,
      {
        replacements: { classSectionId, academicYearId },
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    const studentIdSet = new Set(enrolledStudentIds.map(s => s.student_id));
    const classReportCards = reportCards.filter(rc => studentIdSet.has(rc.studentId));

    // Get sponsor mappings for these students
    const studentIds = classReportCards.map(rc => rc.studentId);
    const sponsorMappings = await StudentSponsorMapping.findAll({
      where: {
        studentId: { [Op.in]: studentIds },
        status: 'active'
      },
      include: [{
        model: Sponsor,
        as: 'sponsor',
        attributes: ['id', 'name', 'email', 'phone']
      }]
    });

    // Group students by sponsor
    const sponsorGroups = {};
    const studentsWithoutSponsors = [];
    
    for (const reportCard of classReportCards) {
      const studentSponsors = sponsorMappings.filter(sm => sm.studentId === reportCard.studentId);
      
      if (studentSponsors.length === 0) {
        studentsWithoutSponsors.push({
          studentId: reportCard.studentId,
          name: `${reportCard.student.firstName} ${reportCard.student.lastName}`,
          admissionNumber: reportCard.student.studentId,
          reportCardId: reportCard.id
        });
        continue;
      }

      for (const mapping of studentSponsors) {
        const sponsorEmail = mapping.sponsor?.email;
        if (!sponsorEmail) continue;

        if (!sponsorGroups[sponsorEmail]) {
          sponsorGroups[sponsorEmail] = {
            sponsor: {
              id: mapping.sponsor.id,
              name: mapping.sponsor.name,
              email: mapping.sponsor.email,
              phone: mapping.sponsor.phone
            },
            students: []
          };
        }

        sponsorGroups[sponsorEmail].students.push({
          studentId: reportCard.studentId,
          name: `${reportCard.student.firstName} ${reportCard.student.lastName}`,
          admissionNumber: reportCard.student.studentId,
          reportCardId: reportCard.id,
          reportCardStatus: reportCard.status
        });
      }
    }

    const uniqueSponsors = Object.keys(sponsorGroups);

    return {
      success: true,
      preview: {
        classSection: {
          id: classSectionId,
          name: classSection?.section_name
        },
        academicYear: {
          id: academicYearId,
          name: academicYear?.year_name
        },
        summary: {
          totalStudents: classReportCards.length,
          studentsWithSponsors: studentIds.length - studentsWithoutSponsors.length,
          studentsWithoutSponsors: studentsWithoutSponsors.length,
          uniqueSponsorEmails: uniqueSponsors.length,
          totalEmailsToSend: uniqueSponsors.length
        },
        sponsorGroups: Object.values(sponsorGroups),
        studentsWithoutSponsors
      }
    };

  } catch (error) {
    logger.error('Error getting distribution preview:', error);
    throw error;
  }
};

/**
 * Generate email template for sponsor
 * @param {Object} sponsor - Sponsor info
 * @param {Array} students - Array of student info
 * @param {Object} metadata - Additional metadata
 * @returns {Object} Email content
 */
const generateSponsorEmailContent = (sponsor, students, metadata = {}) => {
  const { schoolName = 'ZSchool', academicYear = 'Current' } = metadata;
  
  const studentList = students.map(s => 
    `<li><strong>${s.name}</strong> (Admission No: ${s.admissionNumber})</li>`
  ).join('');

  const subject = students.length === 1
    ? `Report Card - ${students[0].name} - ${academicYear}`
    : `Report Cards for Your Sponsored Students - ${academicYear}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1F55A6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
        .footer { background: #eee; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
        .student-list { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .note { background: #fff3cd; padding: 10px; border-radius: 5px; margin: 15px 0; font-size: 13px; }
        ul { margin: 10px 0; padding-left: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${schoolName}</h1>
          <p>Academic Report Card Distribution</p>
        </div>
        <div class="content">
          <p>Dear <strong>${sponsor.name}</strong>,</p>
          
          <p>We hope this message finds you well. Please find attached the academic report card${students.length > 1 ? 's' : ''} for the following student${students.length > 1 ? 's' : ''} you sponsor:</p>
          
          <div class="student-list">
            <ul>
              ${studentList}
            </ul>
          </div>
          
          <p>The attached PDF report card${students.length > 1 ? 's are' : ' is'} digitally signed and verified. ${students.length > 1 ? 'They contain' : 'It contains'} the complete academic performance summary for the <strong>${academicYear}</strong> academic year.</p>
          
          <div class="note">
            <strong>Note:</strong> This is an official document. The digital signature ensures authenticity and prevents tampering.
          </div>
          
          <p>If you have any questions about ${students.length > 1 ? 'these' : 'this'} report${students.length > 1 ? 's' : ''}, please don't hesitate to contact us.</p>
          
          <p>Thank you for your continued support of our students.</p>
          
          <p>Best regards,<br/>
          <strong>${schoolName} Administration</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated message from ${schoolName} Management System.</p>
          <p>Please do not reply directly to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Dear ${sponsor.name},

Please find attached the academic report card${students.length > 1 ? 's' : ''} for the following student${students.length > 1 ? 's' : ''} you sponsor:

${students.map(s => `- ${s.name} (Admission No: ${s.admissionNumber})`).join('\n')}

The attached PDF report card${students.length > 1 ? 's are' : ' is'} digitally signed and verified.

Thank you for your continued support.

Best regards,
${schoolName} Administration
  `.trim();

  return { subject, html, text };
};

/**
 * Initialize bulk distribution job
 * @param {string} classSectionId - Class Section UUID
 * @param {string} academicYearId - Academic Year UUID
 * @param {string} initiatedBy - User ID initiating the distribution
 * @returns {Promise<Object>} Job creation result
 */
export const initiateBulkDistribution = async (classSectionId, academicYearId, initiatedBy) => {
  const transaction = await sequelize.transaction();
  
  try {
    // Get preview data first
    const { preview } = await getDistributionPreview(classSectionId, academicYearId);
    
    if (preview.summary.uniqueSponsorEmails === 0) {
      throw new Error('No sponsors found to distribute report cards to');
    }

    // Create batch job
    const batchJob = await BatchJob.createJob({
      jobType: 'report_card_generation', // Using existing enum value
      jobName: `Report Card Distribution - ${preview.classSection.name || classSectionId}`,
      initiatedBy,
      classSectionId,
      academicYearId,
      totalItems: preview.summary.uniqueSponsorEmails,
      metadata: {
        operation: 'email_distribution',
        totalStudents: preview.summary.totalStudents,
        studentsWithSponsors: preview.summary.studentsWithSponsors,
        uniqueEmails: preview.summary.uniqueSponsorEmails
      }
    });

    // Create email queue entries for each sponsor
    const emailQueueEntries = [];
    
    for (const group of preview.sponsorGroups) {
      const emailContent = generateSponsorEmailContent(group.sponsor, group.students, {
        schoolName: process.env.SCHOOL_NAME || 'ZSchool',
        academicYear: preview.academicYear.name
      });

      const attachments = group.students.map(s => ({
        reportCardId: s.reportCardId,
        studentId: s.studentId,
        studentName: s.name
      }));

      const queueEntry = await EmailQueue.create({
        batch_job_id: batchJob.id,
        recipient_email: group.sponsor.email,
        recipient_name: group.sponsor.name,
        recipient_type: 'sponsor',
        sponsor_id: group.sponsor.id,
        subject: emailContent.subject,
        html_body: emailContent.html,
        text_body: emailContent.text,
        attachments,
        student_ids: group.students.map(s => s.studentId),
        report_card_ids: group.students.map(s => s.reportCardId),
        academic_year_id: academicYearId,
        class_section_id: classSectionId,
        status: 'queued',
        priority: 1, // High priority for report cards
        initiated_by: initiatedBy
      }, { transaction });

      emailQueueEntries.push(queueEntry);
    }

    // Log the distribution initiation
    await AuditLog.create({
      userId: initiatedBy,
      action: 'INITIATE_DISTRIBUTION',
      entityType: 'report_card',
      entityId: classSectionId,
      details: {
        classSectionId,
        academicYearId,
        batchJobId: batchJob.id,
        totalEmails: emailQueueEntries.length,
        totalStudents: preview.summary.totalStudents
      }
    }, { transaction });

    await transaction.commit();

    logger.info(`Bulk distribution initiated: Job ${batchJob.id}, ${emailQueueEntries.length} emails queued`);

    return {
      success: true,
      batchJobId: batchJob.id,
      emailsQueued: emailQueueEntries.length,
      preview
    };

  } catch (error) {
    await transaction.rollback();
    logger.error('Error initiating bulk distribution:', error);
    throw error;
  }
};

/**
 * Process email queue - called by background worker
 * @param {number} batchSize - Number of emails to process in one batch
 * @returns {Promise<Object>} Processing result
 */
export const processEmailQueue = async (batchSize = 10) => {
  const results = {
    processed: 0,
    sent: 0,
    failed: 0,
    errors: []
  };

  try {
    // Get pending emails
    const pendingEmails = await EmailQueue.getPendingEmails(batchSize);
    
    if (pendingEmails.length === 0) {
      // Try to get retryable emails
      const retryableEmails = await EmailQueue.getRetryableEmails(batchSize);
      pendingEmails.push(...retryableEmails);
    }

    if (pendingEmails.length === 0) {
      return { ...results, message: 'No emails to process' };
    }

    for (const email of pendingEmails) {
      try {
        await email.markProcessing();
        results.processed++;

        // Prepare attachments - fetch from S3
        const attachments = [];
        for (const attachment of email.attachments || []) {
          try {
            // Get report card for S3 key
            const reportCard = await ReportCard.findByPk(attachment.reportCardId);
            if (reportCard?.s3Key) {
              const signedUrl = await getSignedUrl(reportCard.s3Key, 3600); // 1 hour expiry
              attachments.push({
                filename: reportCard.pdfFilename || `report-card-${attachment.studentName}.pdf`,
                path: signedUrl
              });
            } else if (reportCard?.pdfUrl) {
              // Use local PDF URL
              attachments.push({
                filename: reportCard.pdfFilename || `report-card-${attachment.studentName}.pdf`,
                path: reportCard.pdfUrl
              });
            }
          } catch (attachError) {
            logger.warn(`Failed to prepare attachment for student ${attachment.studentId}:`, attachError);
          }
        }

        // Send email
        const emailResult = await sendEmail({
          to: email.recipient_email,
          subject: email.subject,
          html: email.html_body,
          text: email.text_body,
          attachments
        });

        if (emailResult.success) {
          await email.markSent(emailResult.messageId, emailResult);
          results.sent++;

          // Update batch job progress
          if (email.batch_job_id) {
            await updateBatchJobProgress(email.batch_job_id);
          }
        } else {
          throw new Error(emailResult.error || 'Email sending failed');
        }

      } catch (emailError) {
        logger.error(`Failed to send email ${email.id}:`, emailError);
        await email.markFailed(emailError.message);
        results.failed++;
        results.errors.push({
          emailId: email.id,
          recipient: email.recipient_email,
          error: emailError.message
        });
      }
    }

    // Check if any batch jobs are complete
    await checkAndCompleteBatchJobs();

    return results;

  } catch (error) {
    logger.error('Error processing email queue:', error);
    throw error;
  }
};

/**
 * Update batch job progress based on email queue status
 * @param {string} batchJobId - Batch Job UUID
 */
const updateBatchJobProgress = async (batchJobId) => {
  try {
    const summary = await EmailQueue.getJobSummary(batchJobId);
    const processed = summary.sent + summary.failed + summary.bounced;
    
    await batchJobService.updateJobProgress(batchJobId, {
      processed,
      successful: summary.sent,
      failed: summary.failed + summary.bounced
    });
  } catch (error) {
    logger.error(`Failed to update batch job progress for ${batchJobId}:`, error);
  }
};

/**
 * Check for completed batch jobs and finalize them
 */
const checkAndCompleteBatchJobs = async () => {
  try {
    // Find in-progress distribution jobs
    const activeJobs = await BatchJob.findAll({
      where: {
        status: 'in_progress',
        job_type: 'report_card_generation'
      }
    });

    for (const job of activeJobs) {
      if (job.metadata?.operation !== 'email_distribution') continue;

      const summary = await EmailQueue.getJobSummary(job.id);
      const isComplete = summary.pending === 0 && summary.queued === 0 && summary.processing === 0;

      if (isComplete) {
        await batchJobService.completeJob(job.id, {
          sent: summary.sent,
          failed: summary.failed,
          bounced: summary.bounced,
          total: summary.total
        });

        logger.info(`Batch job ${job.id} completed: ${summary.sent}/${summary.total} emails sent`);
      }
    }
  } catch (error) {
    logger.error('Error checking batch job completion:', error);
  }
};

/**
 * Get distribution status for a class
 * @param {string} classSectionId - Class Section UUID
 * @param {string} academicYearId - Academic Year UUID
 * @returns {Promise<Object>}
 */
export const getDistributionStatus = async (classSectionId, academicYearId) => {
  try {
    const stats = await EmailQueue.getDistributionStats(classSectionId, academicYearId);
    
    // Get active batch jobs for this distribution
    const activeJobs = await BatchJob.findAll({
      where: {
        class_section_id: classSectionId,
        academic_year_id: academicYearId,
        job_type: 'report_card_generation'
      },
      order: [['created_at', 'DESC']],
      limit: 5
    });

    return {
      ...stats,
      recentJobs: activeJobs.map(job => job.getFormattedStatus())
    };

  } catch (error) {
    logger.error('Error getting distribution status:', error);
    throw error;
  }
};

/**
 * Retry failed emails for a batch job
 * @param {string} batchJobId - Batch Job UUID
 * @returns {Promise<Object>}
 */
export const retryFailedEmails = async (batchJobId) => {
  try {
    const failedEmails = await EmailQueue.findAll({
      where: {
        batch_job_id: batchJobId,
        status: 'failed',
        retry_count: { [Op.lt]: sequelize.col('max_retries') }
      }
    });

    if (failedEmails.length === 0) {
      return { retried: 0, message: 'No failed emails eligible for retry' };
    }

    // Reset status to queued for retry
    for (const email of failedEmails) {
      email.status = 'queued';
      email.next_retry_at = null;
      await email.save();
    }

    logger.info(`${failedEmails.length} failed emails queued for retry in job ${batchJobId}`);

    return {
      retried: failedEmails.length,
      message: `${failedEmails.length} emails queued for retry`
    };

  } catch (error) {
    logger.error('Error retrying failed emails:', error);
    throw error;
  }
};

export default {
  getDistributionPreview,
  initiateBulkDistribution,
  processEmailQueue,
  getDistributionStatus,
  retryFailedEmails
};
