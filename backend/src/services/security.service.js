import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import { User, AuditLog } from '../models/index.js';
import logger from '../utils/logger.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Security Settings Service
 * Manages system-wide security configurations
 */

// In-memory cache for security settings (can be moved to Redis in production)
let securitySettings = {
  sessionTimeoutMinutes: 30,
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireLowercase: true,
  passwordRequireNumbers: true,
  passwordRequireSpecialChars: true,
  maxLoginAttempts: 5,
  lockoutDurationMinutes: 15,
  mfaRequired: ['super_admin', 'principal'],
  ipWhitelist: [], // Empty means all IPs allowed
  ipWhitelistEnabled: false,
  auditRetentionDays: 365,
};

// Settings file path
const SETTINGS_FILE = path.join(process.cwd(), 'config', 'security-settings.json');

/**
 * Load security settings from file
 */
export const loadSecuritySettings = () => {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
      securitySettings = { ...securitySettings, ...JSON.parse(data) };
      logger.info('Security settings loaded from file');
    }
  } catch (error) {
    logger.warn('Could not load security settings file, using defaults:', error.message);
  }
  return securitySettings;
};

/**
 * Save security settings to file
 */
const saveSecuritySettings = () => {
  try {
    const configDir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(securitySettings, null, 2));
    logger.info('Security settings saved to file');
  } catch (error) {
    logger.error('Could not save security settings:', error);
    throw new Error('Failed to save security settings');
  }
};

/**
 * Get current security settings
 * @returns {Object} Current settings
 */
export const getSecuritySettings = () => {
  return { ...securitySettings };
};

/**
 * Update security settings
 * @param {Object} updates - Settings to update
 * @param {string} updatedBy - User ID making the change
 * @returns {Object} Updated settings
 */
export const updateSecuritySettings = async (updates, updatedBy) => {
  const oldSettings = { ...securitySettings };
  
  // Validate and apply updates
  const allowedFields = [
    'sessionTimeoutMinutes',
    'passwordMinLength',
    'passwordRequireUppercase',
    'passwordRequireLowercase',
    'passwordRequireNumbers',
    'passwordRequireSpecialChars',
    'maxLoginAttempts',
    'lockoutDurationMinutes',
    'mfaRequired',
    'ipWhitelist',
    'ipWhitelistEnabled',
    'auditRetentionDays',
  ];

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      // Type validation
      if (key === 'sessionTimeoutMinutes' && (typeof value !== 'number' || value < 5 || value > 480)) {
        throw new Error('Session timeout must be between 5 and 480 minutes');
      }
      if (key === 'passwordMinLength' && (typeof value !== 'number' || value < 6 || value > 32)) {
        throw new Error('Password minimum length must be between 6 and 32');
      }
      if (key === 'maxLoginAttempts' && (typeof value !== 'number' || value < 3 || value > 20)) {
        throw new Error('Max login attempts must be between 3 and 20');
      }
      if (key === 'ipWhitelist' && !Array.isArray(value)) {
        throw new Error('IP whitelist must be an array');
      }
      if (key === 'mfaRequired' && !Array.isArray(value)) {
        throw new Error('MFA required roles must be an array');
      }

      securitySettings[key] = value;
    }
  }

  // Save to file
  saveSecuritySettings();

  // Log the change
  await AuditLog.create({
    user_id: updatedBy,
    action: 'UPDATE',
    entity_type: 'SecuritySettings',
    old_values: oldSettings,
    new_values: securitySettings,
    status: 'SUCCESS',
  });

  logger.info('Security settings updated', { updatedBy });

  return securitySettings;
};

/**
 * Validate password against security policy
 * @param {string} password - Password to validate
 * @returns {Object} Validation result
 */
export const validatePasswordPolicy = (password) => {
  const errors = [];

  if (password.length < securitySettings.passwordMinLength) {
    errors.push(`Password must be at least ${securitySettings.passwordMinLength} characters`);
  }
  if (securitySettings.passwordRequireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (securitySettings.passwordRequireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (securitySettings.passwordRequireNumbers && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (securitySettings.passwordRequireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Check if IP is whitelisted
 * @param {string} ip - IP address to check
 * @returns {boolean} Whether IP is allowed
 */
export const isIPWhitelisted = (ip) => {
  if (!securitySettings.ipWhitelistEnabled) {
    return true; // All IPs allowed when whitelist is disabled
  }
  if (securitySettings.ipWhitelist.length === 0) {
    return true; // Empty whitelist means allow all
  }
  return securitySettings.ipWhitelist.includes(ip);
};

/**
 * Check if role requires MFA
 * @param {string} role - User role
 * @returns {boolean} Whether MFA is required
 */
export const roleMfaRequired = (role) => {
  return securitySettings.mfaRequired.includes(role);
};

/**
 * Get session timeout in milliseconds
 * @returns {number} Timeout in ms
 */
export const getSessionTimeoutMs = () => {
  return securitySettings.sessionTimeoutMinutes * 60 * 1000;
};

// ============================================================================
// Certificate Management (Step 5: Digital Signature Management)
// ============================================================================

const CERT_VAULT_DIR = path.join(process.cwd(), 'config', 'certificates');

/**
 * Ensure certificate vault directory exists
 */
const ensureCertVaultDir = () => {
  if (!fs.existsSync(CERT_VAULT_DIR)) {
    fs.mkdirSync(CERT_VAULT_DIR, { recursive: true, mode: 0o700 }); // Restricted permissions
  }
};

/**
 * Upload and store principal's digital certificate
 * @param {Buffer} certificateData - Certificate file buffer (PFX/P12)
 * @param {string} password - Certificate password
 * @param {string} schoolId - School ID
 * @param {string} uploadedBy - User ID
 * @returns {Promise<Object>} Upload result
 */
export const uploadCertificate = async (certificateData, password, schoolId, uploadedBy) => {
  ensureCertVaultDir();

  try {
    // Validate the certificate by attempting to read it
    const forge = await import('node-forge');
    
    // Try to parse the PFX/P12 file
    let p12Asn1;
    let p12;
    try {
      p12Asn1 = forge.default.asn1.fromDer(certificateData.toString('binary'));
      p12 = forge.default.pkcs12.pkcs12FromAsn1(p12Asn1, password);
    } catch (parseError) {
      throw new Error('Invalid certificate file or incorrect password');
    }

    // Extract certificate info
    const certBags = p12.getBags({ bagType: forge.default.pki.oids.certBag });
    const certBag = certBags[forge.default.pki.oids.certBag]?.[0];
    
    if (!certBag || !certBag.cert) {
      throw new Error('No certificate found in the file');
    }

    const cert = certBag.cert;
    const subject = cert.subject.getField('CN')?.value || 'Unknown';
    const issuer = cert.issuer.getField('CN')?.value || 'Unknown';
    const validFrom = cert.validity.notBefore;
    const validTo = cert.validity.notAfter;

    // Check if certificate is expired
    const now = new Date();
    if (now > validTo) {
      throw new Error(`Certificate expired on ${validTo.toISOString()}`);
    }
    if (now < validFrom) {
      throw new Error(`Certificate not yet valid. Valid from ${validFrom.toISOString()}`);
    }

    // Generate fingerprint
    const md = forge.default.md.sha256.create();
    md.update(forge.default.asn1.toDer(forge.default.pki.certificateToAsn1(cert)).getBytes());
    const fingerprint = md.digest().toHex().match(/.{2}/g).join(':').toUpperCase();

    // Encrypt the certificate file for storage
    const encryptionKey = process.env.CERT_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(encryptionKey.slice(0, 64), 'hex'), iv);
    
    let encrypted = cipher.update(certificateData);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Store encrypted certificate
    const certFileName = `cert-${schoolId}-${Date.now()}.enc`;
    const certPath = path.join(CERT_VAULT_DIR, certFileName);
    
    // Store as JSON with IV and authTag
    const storedData = {
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      data: encrypted.toString('base64'),
    };
    fs.writeFileSync(certPath, JSON.stringify(storedData), { mode: 0o600 });

    // Store metadata (without the password)
    const metadataPath = path.join(CERT_VAULT_DIR, `cert-${schoolId}-metadata.json`);
    const metadata = {
      schoolId,
      fileName: certFileName,
      subject,
      issuer,
      validFrom: validFrom.toISOString(),
      validTo: validTo.toISOString(),
      fingerprint,
      uploadedAt: new Date().toISOString(),
      uploadedBy,
    };
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), { mode: 0o600 });

    // Log the upload
    await AuditLog.create({
      user_id: uploadedBy,
      action: 'FILE_UPLOADED',
      entity_type: 'Certificate',
      new_values: {
        schoolId,
        subject,
        fingerprint,
        validTo: validTo.toISOString(),
      },
      status: 'SUCCESS',
    });

    logger.info('Certificate uploaded', { schoolId, fingerprint, uploadedBy });

    return {
      success: true,
      certificate: {
        subject,
        issuer,
        validFrom: validFrom.toISOString(),
        validTo: validTo.toISOString(),
        fingerprint,
        daysUntilExpiry: Math.floor((validTo - now) / (1000 * 60 * 60 * 24)),
      },
    };
  } catch (error) {
    logger.error('Certificate upload error:', error);
    throw error;
  }
};

/**
 * Get certificate status for a school
 * @param {string} schoolId - School ID
 * @returns {Object} Certificate status
 */
export const getCertificateStatus = (schoolId) => {
  try {
    const metadataPath = path.join(CERT_VAULT_DIR, `cert-${schoolId}-metadata.json`);
    
    if (!fs.existsSync(metadataPath)) {
      return {
        exists: false,
        message: 'No certificate configured for this school',
      };
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    const now = new Date();
    const validTo = new Date(metadata.validTo);
    const daysUntilExpiry = Math.floor((validTo - now) / (1000 * 60 * 60 * 24));

    return {
      exists: true,
      subject: metadata.subject,
      issuer: metadata.issuer,
      validFrom: metadata.validFrom,
      validTo: metadata.validTo,
      fingerprint: metadata.fingerprint,
      daysUntilExpiry,
      isExpired: daysUntilExpiry < 0,
      isExpiringSoon: daysUntilExpiry > 0 && daysUntilExpiry <= 30,
      uploadedAt: metadata.uploadedAt,
    };
  } catch (error) {
    logger.error('Error getting certificate status:', error);
    return {
      exists: false,
      error: error.message,
    };
  }
};

/**
 * Revoke/delete a certificate
 * @param {string} schoolId - School ID
 * @param {string} revokedBy - User ID
 * @returns {Object} Result
 */
export const revokeCertificate = async (schoolId, revokedBy) => {
  try {
    const metadataPath = path.join(CERT_VAULT_DIR, `cert-${schoolId}-metadata.json`);
    
    if (!fs.existsSync(metadataPath)) {
      throw new Error('No certificate found for this school');
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    const certPath = path.join(CERT_VAULT_DIR, metadata.fileName);

    // Delete certificate file
    if (fs.existsSync(certPath)) {
      fs.unlinkSync(certPath);
    }

    // Archive metadata (rename with .revoked extension)
    const revokedMetadata = {
      ...metadata,
      revokedAt: new Date().toISOString(),
      revokedBy,
    };
    fs.writeFileSync(
      path.join(CERT_VAULT_DIR, `cert-${schoolId}-metadata.revoked.json`),
      JSON.stringify(revokedMetadata, null, 2)
    );
    fs.unlinkSync(metadataPath);

    // Log the revocation
    await AuditLog.create({
      user_id: revokedBy,
      action: 'FILE_DELETED',
      entity_type: 'Certificate',
      old_values: metadata,
      status: 'SUCCESS',
      metadata: { reason: 'Certificate revoked' },
    });

    logger.info('Certificate revoked', { schoolId, revokedBy });

    return {
      success: true,
      message: 'Certificate revoked successfully',
    };
  } catch (error) {
    logger.error('Error revoking certificate:', error);
    throw error;
  }
};

// Load settings on module init
loadSecuritySettings();

export default {
  getSecuritySettings,
  updateSecuritySettings,
  validatePasswordPolicy,
  isIPWhitelisted,
  roleMfaRequired,
  getSessionTimeoutMs,
  loadSecuritySettings,
  uploadCertificate,
  getCertificateStatus,
  revokeCertificate,
};
