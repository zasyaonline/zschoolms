import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Email Service Configuration
 * Provider: Zeptomail SMTP
 * From: noreply@zasyaonline.com
 * 
 * Environment Variables:
 * - ENABLE_EMAIL_SENDING: Set to 'true' to enable email sending (default: false)
 * - DAILY_EMAIL_LIMIT: Maximum emails per day (default: 50)
 */

// ============================================================================
// EMAIL SETTINGS (Configurable via environment or admin settings)
// ============================================================================

/**
 * Email sending is controlled by environment variable
 * Set ENABLE_EMAIL_SENDING=true in .env to enable
 * Default: DISABLED for safety
 */
const isEmailEnabled = () => process.env.ENABLE_EMAIL_SENDING === 'true';

/**
 * Daily email limit - prevents runaway email sending
 * Default: 50 emails per day
 */
const DAILY_EMAIL_LIMIT = parseInt(process.env.DAILY_EMAIL_LIMIT) || 50;

/**
 * Track emails sent today for rate limiting
 */
let emailsSentToday = 0;
let lastResetDate = new Date().toDateString();

/**
 * Track sent emails to prevent duplicates (key: recipient+subject hash)
 * Resets daily
 */
const sentEmailsCache = new Map();

/**
 * Reset daily counters at midnight
 */
const resetDailyCountersIfNeeded = () => {
  const today = new Date().toDateString();
  if (lastResetDate !== today) {
    emailsSentToday = 0;
    sentEmailsCache.clear();
    lastResetDate = today;
    console.log('📧 Daily email counters reset');
  }
};

/**
 * Generate a unique key for deduplication
 */
const getEmailKey = (to, subject) => {
  return `${to}:${subject}`.toLowerCase();
};

/**
 * Check if email was already sent today (prevent duplicates)
 */
const wasEmailSentToday = (to, subject) => {
  const key = getEmailKey(to, subject);
  return sentEmailsCache.has(key);
};

/**
 * Mark email as sent for deduplication
 */
const markEmailAsSent = (to, subject) => {
  const key = getEmailKey(to, subject);
  sentEmailsCache.set(key, Date.now());
};

/**
 * Get current email statistics
 */
export const getEmailStats = () => {
  resetDailyCountersIfNeeded();
  return {
    enabled: isEmailEnabled(),
    emailsSentToday,
    dailyLimit: DAILY_EMAIL_LIMIT,
    remainingToday: Math.max(0, DAILY_EMAIL_LIMIT - emailsSentToday),
    uniqueEmailsSent: sentEmailsCache.size,
    lastResetDate
  };
};

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.zeptomail.in',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // Use TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: true,
  },
});

// Verify transporter configuration (non-blocking)
transporter.verify().then(() => {
  console.log('✅ Email Service Ready');
  console.log(`📧 Email sending: ${isEmailEnabled() ? 'ENABLED' : 'DISABLED'}`);
  console.log(`📧 Daily limit: ${DAILY_EMAIL_LIMIT} emails`);
}).catch((error) => {
  console.error('❌ Email Service Error:', error.message);
});

/**
 * Send email with rate limiting, deduplication, and environment toggle
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 * @param {Array} options.attachments - Attachments array
 * @param {boolean} options.bypassDedup - Skip deduplication check (for critical emails)
 * @returns {Promise<Object>} Email result
 */
export const sendEmail = async ({ to, subject, text, html, attachments = [], bypassDedup = false }) => {
  resetDailyCountersIfNeeded();

  // Check 1: Environment toggle - is email sending enabled?
  if (!isEmailEnabled()) {
    console.log(`🚫 EMAIL DISABLED: Would send to ${to} - Subject: ${subject}`);
    return {
      success: true, // Return success to prevent retries
      messageId: 'disabled-' + Date.now(),
      accepted: [to],
      rejected: [],
      blocked: true,
      reason: 'Email sending disabled via ENABLE_EMAIL_SENDING env var'
    };
  }

  // Check 2: Daily limit reached?
  if (emailsSentToday >= DAILY_EMAIL_LIMIT) {
    console.log(`🚫 DAILY LIMIT REACHED (${DAILY_EMAIL_LIMIT}): Would send to ${to} - Subject: ${subject}`);
    return {
      success: false,
      blocked: true,
      reason: `Daily email limit (${DAILY_EMAIL_LIMIT}) reached. Resets at midnight.`,
      emailsSentToday,
      dailyLimit: DAILY_EMAIL_LIMIT
    };
  }

  // Check 3: Duplicate prevention (unless bypassed)
  if (!bypassDedup && wasEmailSentToday(to, subject)) {
    console.log(`🔄 DUPLICATE PREVENTED: Already sent to ${to} - Subject: ${subject}`);
    return {
      success: true, // Return success to prevent retries
      messageId: 'duplicate-' + Date.now(),
      accepted: [to],
      rejected: [],
      blocked: true,
      reason: 'Duplicate email prevented - already sent today'
    };
  }

  try {
    const mailOptions = {
      from: `${process.env.SMTP_FROM_NAME || 'ZSchool Management System'} <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject,
      text,
      html,
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    
    // Update tracking
    emailsSentToday++;
    markEmailAsSent(to, subject);
    
    console.log(`✉️  Email sent to ${to}: ${info.messageId} (${emailsSentToday}/${DAILY_EMAIL_LIMIT} today)`);
    
    return {
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
    };
  } catch (error) {
    console.error('Email Send Error:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

/**
 * Send welcome email to new user
 * @param {Object} user - User object
 * @param {string} tempPassword - Temporary password
 * @returns {Promise<Object>}
 */
export const sendWelcomeEmail = async (user, tempPassword) => {
  const subject = 'Welcome to ZSchool Management System';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1F55A6; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .credentials { background: white; padding: 15px; border-left: 4px solid #1F55A6; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        .button { display: inline-block; padding: 12px 24px; background: #1F55A6; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to ZSchool!</h1>
        </div>
        <div class="content">
          <p>Hello ${user.firstName} ${user.lastName},</p>
          <p>Your account has been created successfully. Here are your login credentials:</p>
          
          <div class="credentials">
            <p><strong>Username:</strong> ${user.username}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Temporary Password:</strong> ${tempPassword}</p>
            <p><strong>Role:</strong> ${user.role}</p>
          </div>
          
          <p><strong>Important:</strong> Please change your password after your first login.</p>
          
          <p style="text-align: center;">
            <a href="${process.env.FRONTEND_URL}/login" class="button">Login Now</a>
          </p>
          
          <p>If you have any questions, please contact the system administrator.</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 ZSchool Management System. All rights reserved.</p>
          <p>This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: user.email,
    subject,
    html,
  });
};

/**
 * Send password reset email
 * @param {Object} user - User object
 * @param {string} resetToken - Password reset token
 * @returns {Promise<Object>}
 */
export const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  const subject = 'Password Reset Request';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1F55A6; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .warning { background: #FFF3CD; border-left: 4px solid #FFC107; padding: 15px; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 24px; background: #1F55A6; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hello ${user.firstName} ${user.lastName},</p>
          <p>We received a request to reset your password. Click the button below to reset it:</p>
          
          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>
          
          <div class="warning">
            <strong>Security Notice:</strong>
            <ul>
              <li>This link will expire in 1 hour</li>
              <li>If you didn't request this reset, please ignore this email</li>
              <li>Your password will not change until you create a new one</li>
            </ul>
          </div>
          
          <p>Or copy and paste this URL into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 ZSchool Management System. All rights reserved.</p>
          <p>This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: user.email,
    subject,
    html,
  });
};

/**
 * Send marks approval notification to teacher
 * @param {Object} teacher - Teacher object
 * @param {Object} marksheet - Marksheet object
 * @returns {Promise<Object>}
 */
export const sendMarksApprovalEmail = async (teacher, marksheet) => {
  const subject = 'Marksheet Approved';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #28A745; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .details { background: white; padding: 15px; border-left: 4px solid #28A745; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Marksheet Approved</h1>
        </div>
        <div class="content">
          <p>Hello ${teacher.firstName} ${teacher.lastName},</p>
          <p>Your submitted marksheet has been approved:</p>
          
          <div class="details">
            <p><strong>Grade:</strong> ${marksheet.grade}</p>
            <p><strong>Section:</strong> ${marksheet.section}</p>
            <p><strong>Subject:</strong> ${marksheet.subject}</p>
            <p><strong>Exam Type:</strong> ${marksheet.examType}</p>
            <p><strong>Approved By:</strong> ${marksheet.approvedBy}</p>
          </div>
          
          <p>The marks are now locked and will be included in report card generation.</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 ZSchool Management System</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: teacher.email,
    subject,
    html,
  });
};

/**
 * Send marks rejection notification to teacher
 * @param {Object} teacher - Teacher object
 * @param {Object} marksheet - Marksheet object
 * @returns {Promise<Object>}
 */
export const sendMarksRejectionEmail = async (teacher, marksheet) => {
  const subject = 'Marksheet Rejected - Action Required';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #DC3545; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .details { background: white; padding: 15px; border-left: 4px solid #DC3545; margin: 20px 0; }
        .reason { background: #FFF3CD; padding: 15px; border-radius: 4px; margin: 15px 0; }
        .button { display: inline-block; padding: 12px 24px; background: #DC3545; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>❌ Marksheet Rejected</h1>
        </div>
        <div class="content">
          <p>Hello ${teacher.firstName} ${teacher.lastName},</p>
          <p>Your submitted marksheet has been rejected and requires correction:</p>
          
          <div class="details">
            <p><strong>Grade:</strong> ${marksheet.grade}</p>
            <p><strong>Section:</strong> ${marksheet.section}</p>
            <p><strong>Subject:</strong> ${marksheet.subject}</p>
            <p><strong>Exam Type:</strong> ${marksheet.examType}</p>
            <p><strong>Rejected By:</strong> ${marksheet.rejectedBy}</p>
          </div>
          
          <div class="reason">
            <p><strong>Reason for Rejection:</strong></p>
            <p>${marksheet.rejectionReason}</p>
          </div>
          
          <p>Please review the marks and resubmit after making necessary corrections.</p>
          
          <p style="text-align: center;">
            <a href="${process.env.FRONTEND_URL}/teacher/marks-correction" class="button">Correct Marks</a>
          </p>
        </div>
        <div class="footer">
          <p>&copy; 2025 ZSchool Management System</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: teacher.email,
    subject,
    html,
  });
};

/**
 * Send welcome email to new sponsor
 * @param {Object} sponsor - Sponsor object
 * @param {Object} user - Associated user account (if created)
 * @param {string} tempPassword - Temporary password (if user account created)
 * @returns {Promise<Object>}
 */
export const sendSponsorWelcomeEmail = async (sponsor, user = null, tempPassword = null) => {
  const subject = 'Welcome to ZSchool Sponsor Portal';
  
  const loginSection = user && tempPassword ? `
    <div class="credentials">
      <h3>🔐 Your Login Credentials</h3>
      <p><strong>Username:</strong> ${user.username}</p>
      <p><strong>Email:</strong> ${user.email}</p>
      <p><strong>Temporary Password:</strong> ${tempPassword}</p>
      <p style="color: #DC3545;"><em>Please change your password after first login</em></p>
    </div>
    
    <p style="text-align: center;">
      <a href="${process.env.FRONTEND_URL}/login" class="button">Login to Sponsor Portal</a>
    </p>
  ` : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1F55A6, #28A745); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; }
        .content { padding: 25px; background: #f9f9f9; }
        .welcome-box { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin: 20px 0; }
        .credentials { background: #E8F4FD; padding: 20px; border-left: 4px solid #1F55A6; margin: 20px 0; border-radius: 4px; }
        .credentials h3 { margin-top: 0; color: #1F55A6; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
        .info-item { background: white; padding: 15px; border-radius: 4px; }
        .info-item h4 { margin: 0 0 5px 0; color: #666; font-size: 12px; text-transform: uppercase; }
        .info-item p { margin: 0; font-size: 16px; color: #333; }
        .features { background: #F0FFF4; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .features h3 { color: #28A745; margin-top: 0; }
        .features ul { margin: 0; padding-left: 20px; }
        .features li { margin-bottom: 10px; }
        .button { display: inline-block; padding: 14px 28px; background: #1F55A6; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; font-weight: bold; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; background: #f0f0f0; }
        .contact { background: white; padding: 15px; border-radius: 4px; margin: 20px 0; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎓 Welcome to ZSchool!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Thank you for becoming a sponsor</p>
        </div>
        <div class="content">
          <div class="welcome-box">
            <p>Dear <strong>${sponsor.name}</strong>,</p>
            <p>We are delighted to welcome you to the ZSchool Management System as a valued sponsor. Your generous support makes a significant difference in the lives of students.</p>
          </div>
          
          <div class="info-grid">
            <div class="info-item">
              <h4>Sponsor ID</h4>
              <p>${sponsor.id ? sponsor.id.substring(0, 8).toUpperCase() : 'N/A'}</p>
            </div>
            <div class="info-item">
              <h4>Sponsorship Type</h4>
              <p>${sponsor.sponsorshipType ? sponsor.sponsorshipType.charAt(0).toUpperCase() + sponsor.sponsorshipType.slice(1) : 'Full'}</p>
            </div>
            <div class="info-item">
              <h4>Email</h4>
              <p>${sponsor.email}</p>
            </div>
            <div class="info-item">
              <h4>Status</h4>
              <p style="color: #28A745;">✓ Active</p>
            </div>
          </div>
          
          ${loginSection}
          
          <div class="features">
            <h3>📋 What You Can Do in the Sponsor Portal</h3>
            <ul>
              <li><strong>View Sponsored Students</strong> - See all students you are supporting</li>
              <li><strong>Track Academic Progress</strong> - Monitor student performance and grades</li>
              <li><strong>Download Report Cards</strong> - Access official digitally signed report cards</li>
              <li><strong>Receive Updates</strong> - Get notifications about student achievements</li>
              <li><strong>Manage Sponsorship</strong> - View and renew sponsorship details</li>
            </ul>
          </div>
          
          <div class="contact">
            <p><strong>Need Help?</strong></p>
            <p>Contact our support team at <a href="mailto:support@zasyaonline.com">support@zasyaonline.com</a></p>
          </div>
        </div>
        <div class="footer">
          <p>&copy; 2025 ZSchool Management System. All rights reserved.</p>
          <p>This is an automated email. Please do not reply directly.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: sponsor.email,
    subject,
    html,
  });
};

/**
 * Send notification email when a student is assigned to a sponsor
 * @param {Object} sponsor - Sponsor object
 * @param {Object} student - Student object with user info
 * @param {Object} mapping - StudentSponsorMapping object
 * @returns {Promise<Object>}
 */
export const sendStudentAssignmentEmail = async (sponsor, student, mapping) => {
  const subject = 'New Student Assigned to Your Sponsorship';
  
  const studentName = student.user 
    ? `${student.user.firstName} ${student.user.lastName}` 
    : student.firstName 
      ? `${student.firstName} ${student.lastName}`
      : 'Student';
  
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #28A745, #20C997); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; }
        .content { padding: 25px; background: #f9f9f9; }
        .student-card { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin: 20px 0; }
        .student-avatar { width: 80px; height: 80px; background: linear-gradient(135deg, #1F55A6, #28A745); border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; }
        .student-avatar span { color: white; font-size: 32px; font-weight: bold; }
        .student-name { text-align: center; font-size: 24px; font-weight: bold; color: #333; margin-bottom: 20px; }
        .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .detail-item { padding: 12px; background: #f8f9fa; border-radius: 6px; }
        .detail-item label { font-size: 11px; text-transform: uppercase; color: #666; display: block; margin-bottom: 4px; }
        .detail-item value { font-size: 15px; font-weight: 500; color: #333; }
        .sponsorship-info { background: #E8F4FD; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .sponsorship-info h3 { color: #1F55A6; margin-top: 0; }
        .date-badge { display: inline-block; padding: 8px 16px; background: #28A745; color: white; border-radius: 20px; font-size: 14px; margin: 5px 0; }
        .renewal-notice { background: #FFF3CD; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #FFC107; }
        .button { display: inline-block; padding: 14px 28px; background: #1F55A6; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; font-weight: bold; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; background: #f0f0f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 New Student Assigned!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">A student has been added to your sponsorship</p>
        </div>
        <div class="content">
          <p>Dear <strong>${sponsor.name}</strong>,</p>
          <p>We are pleased to inform you that a new student has been assigned to your sponsorship. Here are the details:</p>
          
          <div class="student-card">
            <div class="student-avatar">
              <span>${studentName.charAt(0).toUpperCase()}</span>
            </div>
            <div class="student-name">${studentName}</div>
            
            <div class="details-grid">
              <div class="detail-item">
                <label>Student ID</label>
                <value>${student.admissionNumber || student.id?.substring(0, 8).toUpperCase() || 'N/A'}</value>
              </div>
              <div class="detail-item">
                <label>Grade/Class</label>
                <value>${student.currentGrade || student.grade || 'N/A'}</value>
              </div>
              <div class="detail-item">
                <label>Email</label>
                <value>${student.user?.email || student.email || 'N/A'}</value>
              </div>
              <div class="detail-item">
                <label>Gender</label>
                <value>${student.gender ? student.gender.charAt(0).toUpperCase() + student.gender.slice(1) : 'N/A'}</value>
              </div>
            </div>
          </div>
          
          <div class="sponsorship-info">
            <h3>📅 Sponsorship Details</h3>
            <p><strong>Type:</strong> ${mapping.sponsorshipType ? mapping.sponsorshipType.charAt(0).toUpperCase() + mapping.sponsorshipType.slice(1) : 'Full'} Sponsorship</p>
            <p><strong>Start Date:</strong> <span class="date-badge">${formatDate(mapping.startDate)}</span></p>
            <p><strong>Renewal Date:</strong> <span class="date-badge">${formatDate(mapping.endDate)}</span></p>
            ${mapping.amount ? `<p><strong>Amount:</strong> ${mapping.currency || 'USD'} ${parseFloat(mapping.amount).toLocaleString()}</p>` : ''}
          </div>
          
          <div class="renewal-notice">
            <strong>📆 Renewal Reminder</strong>
            <p style="margin: 10px 0 0 0;">You will receive a reminder email 30 days before the sponsorship renewal date. This helps ensure uninterrupted support for your sponsored student.</p>
          </div>
          
          <p style="text-align: center;">
            <a href="${process.env.FRONTEND_URL}/sponsor/students" class="button">View in Sponsor Portal</a>
          </p>
          
          <p>Thank you for your continued support in making education accessible to all!</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 ZSchool Management System. All rights reserved.</p>
          <p>This is an automated email. Please do not reply directly.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: sponsor.email,
    subject,
    html,
  });
};

export default {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendMarksApprovalEmail,
  sendMarksRejectionEmail,
  sendSponsorWelcomeEmail,
  sendStudentAssignmentEmail,
};
