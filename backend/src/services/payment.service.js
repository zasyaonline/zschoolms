import { Op } from 'sequelize';
import SponsorPayment from '../models/SponsorPayment.js';
import StudentSponsorMapping from '../models/StudentSponsorMapping.js';
import Sponsor from '../models/Sponsor.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import logger from '../utils/logger.js';
import { sendEmail } from './email.service.js';
// TODO: Implement generateReceiptPDF when receipt generation is needed
// import { generateReceiptPDF } from './pdf.service.js';
// TODO: Use uploadPDF from s3.service.js when receipt uploads are needed
// import { uploadPDF } from './s3.service.js';

/**
 * Payment Recording Service
 * Handles sponsor payment recording, receipt generation, and sponsorship renewal
 */

/**
 * Record a sponsor payment and update sponsorship
 * @param {Object} paymentData - Payment details
 * @param {string} recordedBy - User ID who recorded the payment
 * @returns {Promise<Object>} Payment record with updated sponsorship
 */
export const recordPayment = async (paymentData, recordedBy) => {
  try {
    const {
      sponsorshipId,
      amount,
      currency = 'USD',
      paymentDate,
      transactionReference,
      paymentMethod,
      notes,
      renewalMonths = 12, // Default renewal period
    } = paymentData;

    // Verify sponsorship exists
    const sponsorship = await StudentSponsorMapping.findByPk(sponsorshipId, {
      include: [
        { model: Sponsor, as: 'sponsor' },
        { 
          model: Student, 
          as: 'student',
          include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName', 'email'] }]
        },
      ],
    });

    if (!sponsorship) {
      throw new Error('Sponsorship not found');
    }

    // Generate receipt number
    const receiptNumber = await SponsorPayment.generateReceiptNumber();

    // Calculate new end date (extend from current end date or from today if expired)
    const currentEndDate = sponsorship.endDate ? new Date(sponsorship.endDate) : new Date();
    const baseDate = currentEndDate > new Date() ? currentEndDate : new Date();
    const newEndDate = new Date(baseDate);
    newEndDate.setMonth(newEndDate.getMonth() + renewalMonths);
    const newEndDateStr = newEndDate.toISOString().split('T')[0];

    // Create payment record
    const payment = await SponsorPayment.create({
      sponsorshipId,
      sponsorId: sponsorship.sponsorId,
      amount,
      currency,
      paymentDate,
      transactionReference,
      paymentMethod,
      status: 'confirmed',
      receiptNumber,
      receiptGeneratedAt: new Date(),
      notes,
      verifiedBy: recordedBy,
      verifiedAt: new Date(),
      isRenewalPayment: true,
      previousEndDate: sponsorship.endDate,
      newEndDate: newEndDateStr,
      createdBy: recordedBy,
    });

    // Update sponsorship end date and status
    const previousEndDate = sponsorship.endDate;
    sponsorship.endDate = newEndDateStr;
    sponsorship.status = 'active';
    sponsorship.reminderCount = 0; // Reset reminder counter
    sponsorship.lastReminderSent = null;
    await sponsorship.save();

    // Log audit
    await AuditLog.logAction({
      userId: recordedBy,
      action: 'CREATE',
      entityType: 'sponsor_payment',
      entityId: payment.id,
      newValues: payment.toJSON(),
      metadata: {
        sponsorshipId,
        previousEndDate,
        newEndDate: newEndDateStr,
        renewalMonths,
      },
    });

    // Generate receipt PDF and upload to S3
    let receiptUrl = null;
    try {
      const receiptPdfBuffer = await generatePaymentReceiptPDF(payment, sponsorship);
      const s3Key = `receipts/${new Date().getFullYear()}/${payment.id}.pdf`;
      await uploadToS3(receiptPdfBuffer, s3Key, 'application/pdf');
      
      payment.receiptS3Key = s3Key;
      await payment.save();
      
      receiptUrl = s3Key;
    } catch (pdfError) {
      logger.error('Failed to generate/upload receipt PDF:', pdfError);
      // Don't fail the payment if PDF generation fails
    }

    // Send confirmation email
    let emailSent = false;
    if (sponsorship.sponsor?.email) {
      try {
        await sendPaymentConfirmationEmail(payment, sponsorship);
        emailSent = true;
        logger.info(`Payment confirmation email sent to ${sponsorship.sponsor.email}`);
      } catch (emailError) {
        logger.error('Failed to send payment confirmation email:', emailError);
      }
    }

    return {
      payment,
      sponsorship,
      emailSent,
      receiptUrl,
      renewalInfo: {
        previousEndDate,
        newEndDate: newEndDateStr,
        renewalMonths,
      },
    };
  } catch (error) {
    logger.error('Error recording payment:', error);
    throw error;
  }
};

/**
 * Get payment history for a sponsorship
 */
export const getPaymentHistory = async (sponsorshipId, options = {}) => {
  try {
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    const { count, rows } = await SponsorPayment.findAndCountAll({
      where: { sponsorshipId },
      order: [['paymentDate', 'DESC']],
      limit: parseInt(limit),
      offset,
      include: [
        { model: User, as: 'verifier', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] },
      ],
    });

    return {
      payments: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    };
  } catch (error) {
    logger.error('Error fetching payment history:', error);
    throw error;
  }
};

/**
 * Get payments for a sponsor
 */
export const getSponsorPayments = async (sponsorId, options = {}) => {
  try {
    const { page = 1, limit = 10, startDate, endDate } = options;
    const offset = (page - 1) * limit;

    const where = { sponsorId };
    
    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate[Op.gte] = startDate;
      if (endDate) where.paymentDate[Op.lte] = endDate;
    }

    const { count, rows } = await SponsorPayment.findAndCountAll({
      where,
      order: [['paymentDate', 'DESC']],
      limit: parseInt(limit),
      offset,
      include: [
        { 
          model: StudentSponsorMapping, 
          as: 'sponsorship',
          include: [
            { 
              model: Student, 
              as: 'student',
              include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName'] }]
            }
          ]
        },
      ],
    });

    return {
      payments: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    };
  } catch (error) {
    logger.error('Error fetching sponsor payments:', error);
    throw error;
  }
};

/**
 * Get payment by ID
 */
export const getPaymentById = async (paymentId) => {
  try {
    const payment = await SponsorPayment.findByPk(paymentId, {
      include: [
        { model: Sponsor, as: 'sponsor' },
        { 
          model: StudentSponsorMapping, 
          as: 'sponsorship',
          include: [
            { 
              model: Student, 
              as: 'student',
              include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName', 'email'] }]
            }
          ]
        },
        { model: User, as: 'verifier', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] },
      ],
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    return payment;
  } catch (error) {
    logger.error('Error fetching payment:', error);
    throw error;
  }
};

/**
 * Generate payment receipt PDF
 */
const generatePaymentReceiptPDF = async (payment, sponsorship) => {
  // Use the existing PDF service structure
  const receiptData = {
    receiptNumber: payment.receiptNumber,
    paymentDate: payment.paymentDate,
    amount: parseFloat(payment.amount).toLocaleString(),
    currency: payment.currency,
    paymentMethod: payment.paymentMethod,
    transactionReference: payment.transactionReference,
    sponsor: {
      name: sponsorship.sponsor?.name || 'Unknown Sponsor',
      email: sponsorship.sponsor?.email,
      organization: sponsorship.sponsor?.organization,
    },
    student: {
      name: sponsorship.student?.user 
        ? `${sponsorship.student.user.firstName} ${sponsorship.student.user.lastName}`
        : 'Unknown Student',
      admissionNumber: sponsorship.student?.admissionNumber,
    },
    sponsorship: {
      type: sponsorship.sponsorshipType,
      previousEndDate: payment.previousEndDate,
      newEndDate: payment.newEndDate,
    },
    generatedAt: new Date().toISOString(),
  };

  // For now, return a placeholder - integrate with actual PDF generation
  return Buffer.from(JSON.stringify(receiptData));
};

/**
 * Send payment confirmation email
 */
const sendPaymentConfirmationEmail = async (payment, sponsorship) => {
  const sponsor = sponsorship.sponsor;
  const student = sponsorship.student;
  const studentName = student?.user 
    ? `${student.user.firstName} ${student.user.lastName}` 
    : 'the sponsored student';

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const subject = `Payment Confirmed - Receipt #${payment.receiptNumber}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #28A745, #20C997); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 25px; background: #f9f9f9; }
        .receipt-box { background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin: 20px 0; }
        .receipt-header { text-align: center; border-bottom: 2px solid #28A745; padding-bottom: 15px; margin-bottom: 20px; }
        .receipt-number { font-size: 24px; font-weight: bold; color: #28A745; }
        .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .detail-item { padding: 10px; background: #f8f9fa; border-radius: 4px; }
        .detail-item label { font-size: 11px; text-transform: uppercase; color: #666; }
        .detail-item value { font-size: 15px; font-weight: 500; color: #333; display: block; margin-top: 4px; }
        .amount-box { text-align: center; background: #E8F5E9; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .amount { font-size: 32px; font-weight: bold; color: #28A745; }
        .renewal-info { background: #E3F2FD; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .renewal-info h3 { color: #1976D2; margin-top: 0; }
        .thank-you { text-align: center; padding: 20px; background: #FFF9C4; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Payment Confirmed!</h1>
          <p style="margin: 0; opacity: 0.9;">Thank you for your continued support</p>
        </div>
        <div class="content">
          <p>Dear <strong>${sponsor.name}</strong>,</p>
          <p>We have received your sponsorship renewal payment. Please find your receipt details below:</p>
          
          <div class="receipt-box">
            <div class="receipt-header">
              <div class="receipt-number">${payment.receiptNumber}</div>
              <p style="margin: 5px 0 0 0; color: #666;">Official Payment Receipt</p>
            </div>
            
            <div class="amount-box">
              <div class="amount">${payment.currency} ${parseFloat(payment.amount).toLocaleString()}</div>
              <p style="margin: 5px 0 0 0; color: #666;">Amount Paid</p>
            </div>
            
            <div class="details-grid">
              <div class="detail-item">
                <label>Payment Date</label>
                <value>${formatDate(payment.paymentDate)}</value>
              </div>
              <div class="detail-item">
                <label>Payment Method</label>
                <value>${payment.paymentMethod ? payment.paymentMethod.replace('_', ' ').toUpperCase() : 'N/A'}</value>
              </div>
              <div class="detail-item">
                <label>Transaction Ref</label>
                <value>${payment.transactionReference || 'N/A'}</value>
              </div>
              <div class="detail-item">
                <label>Student</label>
                <value>${studentName}</value>
              </div>
            </div>
          </div>
          
          <div class="renewal-info">
            <h3>📅 Sponsorship Renewal Details</h3>
            <p><strong>Previous End Date:</strong> ${formatDate(payment.previousEndDate)}</p>
            <p><strong>New End Date:</strong> <span style="color: #28A745; font-weight: bold;">${formatDate(payment.newEndDate)}</span></p>
            <p style="margin-bottom: 0;">Your sponsorship has been successfully renewed until the new end date.</p>
          </div>
          
          <div class="thank-you">
            <h3>🙏 Thank You!</h3>
            <p style="margin-bottom: 0;">Your generous support continues to make a difference in ${studentName}'s education. We are deeply grateful for your commitment.</p>
          </div>
          
          <p style="text-align: center;">
            <a href="${process.env.FRONTEND_URL}/sponsor/students" style="display: inline-block; padding: 14px 28px; background: #1F55A6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">View Sponsor Portal</a>
          </p>
        </div>
        <div class="footer">
          <p>&copy; 2025 ZSchool Management System. All rights reserved.</p>
          <p>This is an automated email. Please keep this receipt for your records.</p>
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
 * Get payment statistics
 */
export const getPaymentStats = async (options = {}) => {
  try {
    const { startDate, endDate, sponsorId } = options;

    const where = { status: 'confirmed' };
    if (sponsorId) where.sponsorId = sponsorId;
    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate[Op.gte] = startDate;
      if (endDate) where.paymentDate[Op.lte] = endDate;
    }

    const payments = await SponsorPayment.findAll({ where });

    const totalAmount = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const paymentCount = payments.length;

    // Group by month
    const byMonth = {};
    payments.forEach(p => {
      const month = new Date(p.paymentDate).toISOString().substring(0, 7);
      if (!byMonth[month]) byMonth[month] = { count: 0, amount: 0 };
      byMonth[month].count++;
      byMonth[month].amount += parseFloat(p.amount);
    });

    // Group by payment method
    const byMethod = {};
    payments.forEach(p => {
      const method = p.paymentMethod || 'unknown';
      if (!byMethod[method]) byMethod[method] = { count: 0, amount: 0 };
      byMethod[method].count++;
      byMethod[method].amount += parseFloat(p.amount);
    });

    return {
      totalAmount,
      paymentCount,
      averageAmount: paymentCount > 0 ? totalAmount / paymentCount : 0,
      byMonth,
      byMethod,
    };
  } catch (error) {
    logger.error('Error fetching payment stats:', error);
    throw error;
  }
};

export default {
  recordPayment,
  getPaymentHistory,
  getSponsorPayments,
  getPaymentById,
  getPaymentStats,
};
