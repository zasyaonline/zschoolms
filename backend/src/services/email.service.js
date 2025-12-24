import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Email Service Configuration
 * Provider: Zeptomail SMTP
 * From: noreply@zasyaonline.com
 */

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
}).catch((error) => {
  console.error('❌ Email Service Error:', error.message);
});

/**
 * Send email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 * @param {Array} options.attachments - Attachments array
 * @returns {Promise<Object>} Email result
 */
export const sendEmail = async ({ to, subject, text, html, attachments = [] }) => {
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
    console.log(`✉️  Email sent to ${to}: ${info.messageId}`);
    
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

export default {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendMarksApprovalEmail,
  sendMarksRejectionEmail,
};
