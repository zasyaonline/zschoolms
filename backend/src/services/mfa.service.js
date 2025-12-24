import crypto from 'crypto';
import { User } from '../models/index.js';
import { sendEmail } from './email.service.js';
import logger from '../utils/logger.js';

/**
 * MFA Service - Email OTP Based
 * Generates and verifies 6-digit OTP codes sent via email
 */

/**
 * Generate 6-digit OTP code
 * @returns {string} 6-digit code
 */
const generateOTPCode = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Send MFA code via email
 * @param {Object} user - User object
 * @returns {Promise<Object>} Result
 */
export const sendMFACode = async (user) => {
  try {
    // Generate 6-digit code
    const code = generateOTPCode();
    
    // Set expiration (5 minutes)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    
    // Update user with MFA code
    await User.update(
      {
        mfa_code: code,
        mfa_expires_at: expiresAt,
      },
      {
        where: { id: user.id },
      }
    );
    
    // Send email
    const subject = 'ZSchool - Login Verification Code';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1F55A6; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .code-box { background: white; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1F55A6; border: 2px dashed #1F55A6; margin: 20px 0; }
          .warning { background: #FFF3CD; border-left: 4px solid #FFC107; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Verification Code</h1>
          </div>
          <div class="content">
            <p>Hello ${user.first_name} ${user.last_name},</p>
            <p>Your verification code for logging into ZSchool Management System is:</p>
            
            <div class="code-box">
              ${code}
            </div>
            
            <div class="warning">
              <strong>Security Notice:</strong>
              <ul>
                <li>This code will expire in <strong>5 minutes</strong></li>
                <li>Never share this code with anyone</li>
                <li>If you didn't request this code, please ignore this email</li>
              </ul>
            </div>
            
            <p>If you're having trouble logging in, please contact your system administrator.</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 ZSchool Management System. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    await sendEmail({
      to: user.email,
      subject,
      html,
    });
    
    logger.info('MFA code sent', {
      userId: user.id,
      email: user.email,
      expiresAt,
    });
    
    return {
      success: true,
      message: 'Verification code sent to your email',
      expiresAt,
    };
  } catch (error) {
    logger.error('Error sending MFA code:', error);
    throw new Error('Failed to send verification code');
  }
};

/**
 * Verify MFA code
 * @param {string} userId - User ID
 * @param {string} code - OTP code
 * @returns {Promise<Object>} Verification result
 */
export const verifyMFACode = async (userId, code) => {
  try {
    const user = await User.findByPk(userId);
    
    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    }
    
    // Check if code exists
    if (!user.mfa_code) {
      return {
        success: false,
        message: 'No verification code found. Please request a new one.',
      };
    }
    
    // Check if code is expired
    if (new Date() > user.mfa_expires_at) {
      // Clear expired code
      await User.update(
        {
          mfa_code: null,
          mfa_expires_at: null,
        },
        {
          where: { id: userId },
        }
      );
      
      return {
        success: false,
        message: 'Verification code has expired. Please request a new one.',
      };
    }
    
    // Verify code
    if (user.mfa_code !== code) {
      return {
        success: false,
        message: 'Invalid verification code',
      };
    }
    
    // Clear used code
    await User.update(
      {
        mfa_code: null,
        mfa_expires_at: null,
      },
      {
        where: { id: userId },
      }
    );
    
    logger.info('MFA code verified successfully', {
      userId: user.id,
      email: user.email,
    });
    
    return {
      success: true,
      message: 'Verification code verified successfully',
      user,
    };
  } catch (error) {
    logger.error('Error verifying MFA code:', error);
    throw new Error('Failed to verify code');
  }
};

/**
 * Resend MFA code
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Result
 */
export const resendMFACode = async (userId) => {
  try {
    const user = await User.findByPk(userId);
    
    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    }
    
    return await sendMFACode(user);
  } catch (error) {
    logger.error('Error resending MFA code:', error);
    throw new Error('Failed to resend verification code');
  }
};

export default {
  sendMFACode,
  verifyMFACode,
  resendMFACode,
};
