import forge from 'node-forge';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import logger from '../utils/logger.js';

/**
 * Digital Signature Service
 * Provides cryptographic signing capabilities for report cards
 * Uses RSA keys for digital signatures with SHA-256
 */

// Certificate storage paths
const CERT_DIR = process.env.CERT_DIR || path.join(process.cwd(), 'certs');
const PRIVATE_KEY_PATH = path.join(CERT_DIR, 'principal-private.pem');
const PUBLIC_KEY_PATH = path.join(CERT_DIR, 'principal-public.pem');
const CERTIFICATE_PATH = path.join(CERT_DIR, 'principal-cert.pem');

/**
 * Ensure certificate directory exists
 */
const ensureCertDir = () => {
  if (!fs.existsSync(CERT_DIR)) {
    fs.mkdirSync(CERT_DIR, { recursive: true });
    logger.info(`Created certificate directory: ${CERT_DIR}`);
  }
};

/**
 * Generate self-signed certificate for Principal
 * In production, use a proper CA-issued certificate
 * @param {Object} principalInfo - Principal information
 * @returns {Object} Generated keys and certificate
 */
export const generatePrincipalCertificate = async (principalInfo = {}) => {
  ensureCertDir();

  const {
    commonName = 'Principal',
    organization = 'ZSchool',
    country = 'IN',
    state = 'Telangana',
    locality = 'Hyderabad',
    email = 'principal@zschool.edu',
    validityDays = 365
  } = principalInfo;

  try {
    // Generate RSA key pair (2048 bits)
    const keys = forge.pki.rsa.generateKeyPair(2048);
    
    // Create certificate
    const cert = forge.pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = Date.now().toString(16);
    
    // Set validity
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setDate(cert.validity.notBefore.getDate() + validityDays);
    
    // Set subject and issuer (self-signed)
    const attrs = [
      { name: 'commonName', value: commonName },
      { name: 'countryName', value: country },
      { shortName: 'ST', value: state },
      { name: 'localityName', value: locality },
      { name: 'organizationName', value: organization },
      { name: 'emailAddress', value: email }
    ];
    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    
    // Add extensions
    cert.setExtensions([
      {
        name: 'basicConstraints',
        cA: false
      },
      {
        name: 'keyUsage',
        digitalSignature: true,
        nonRepudiation: true
      },
      {
        name: 'extKeyUsage',
        clientAuth: true,
        emailProtection: true
      },
      {
        name: 'subjectAltName',
        altNames: [{
          type: 6, // URI
          value: `mailto:${email}`
        }]
      }
    ]);
    
    // Self-sign certificate
    cert.sign(keys.privateKey, forge.md.sha256.create());
    
    // Convert to PEM format
    const privateKeyPem = forge.pki.privateKeyToPem(keys.privateKey);
    const publicKeyPem = forge.pki.publicKeyToPem(keys.publicKey);
    const certPem = forge.pki.certificateToPem(cert);
    
    // Save to files
    fs.writeFileSync(PRIVATE_KEY_PATH, privateKeyPem, { mode: 0o600 });
    fs.writeFileSync(PUBLIC_KEY_PATH, publicKeyPem);
    fs.writeFileSync(CERTIFICATE_PATH, certPem);
    
    logger.info('Principal certificate generated successfully');
    
    return {
      privateKeyPath: PRIVATE_KEY_PATH,
      publicKeyPath: PUBLIC_KEY_PATH,
      certificatePath: CERTIFICATE_PATH,
      fingerprint: forge.pki.getPublicKeyFingerprint(keys.publicKey, {
        md: forge.md.sha256.create(),
        encoding: 'hex'
      }),
      validUntil: cert.validity.notAfter,
      subject: commonName
    };
    
  } catch (error) {
    logger.error('Error generating certificate:', error);
    throw new Error(`Failed to generate certificate: ${error.message}`);
  }
};

/**
 * Check if certificate exists and is valid
 * @returns {Object} Certificate status
 */
export const checkCertificateStatus = () => {
  try {
    if (!fs.existsSync(PRIVATE_KEY_PATH) || !fs.existsSync(CERTIFICATE_PATH)) {
      return { exists: false, valid: false, message: 'Certificate not found' };
    }
    
    const certPem = fs.readFileSync(CERTIFICATE_PATH, 'utf8');
    const cert = forge.pki.certificateFromPem(certPem);
    
    const now = new Date();
    const isValid = now >= cert.validity.notBefore && now <= cert.validity.notAfter;
    const daysRemaining = Math.ceil((cert.validity.notAfter - now) / (1000 * 60 * 60 * 24));
    
    return {
      exists: true,
      valid: isValid,
      subject: cert.subject.getField('CN').value,
      issuer: cert.issuer.getField('CN').value,
      validFrom: cert.validity.notBefore,
      validUntil: cert.validity.notAfter,
      daysRemaining: isValid ? daysRemaining : 0,
      fingerprint: forge.pki.getPublicKeyFingerprint(cert.publicKey, {
        md: forge.md.sha256.create(),
        encoding: 'hex'
      })
    };
    
  } catch (error) {
    logger.error('Error checking certificate:', error);
    return { exists: false, valid: false, message: error.message };
  }
};

/**
 * Sign data (PDF hash) with Principal's private key
 * @param {Buffer|string} data - Data to sign (typically PDF hash)
 * @returns {Object} Signature details
 */
export const signData = async (data) => {
  try {
    // Check certificate exists
    if (!fs.existsSync(PRIVATE_KEY_PATH)) {
      throw new Error('Principal certificate not found. Please generate a certificate first.');
    }
    
    // Load private key
    const privateKeyPem = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
    
    // Create hash of data
    const md = forge.md.sha256.create();
    md.update(data.toString(), 'utf8');
    
    // Sign the hash
    const signature = privateKey.sign(md);
    
    // Convert to base64
    const signatureBase64 = forge.util.encode64(signature);
    
    // Get timestamp
    const timestamp = new Date().toISOString();
    
    logger.info('Data signed successfully');
    
    return {
      signature: signatureBase64,
      algorithm: 'RSA-SHA256',
      timestamp,
      hashHex: md.digest().toHex()
    };
    
  } catch (error) {
    logger.error('Error signing data:', error);
    throw new Error(`Failed to sign data: ${error.message}`);
  }
};

/**
 * Verify signature
 * @param {Buffer|string} data - Original data
 * @param {string} signatureBase64 - Base64 encoded signature
 * @returns {boolean} True if signature is valid
 */
export const verifySignature = async (data, signatureBase64) => {
  try {
    if (!fs.existsSync(PUBLIC_KEY_PATH)) {
      throw new Error('Public key not found');
    }
    
    // Load public key
    const publicKeyPem = fs.readFileSync(PUBLIC_KEY_PATH, 'utf8');
    const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
    
    // Create hash of data
    const md = forge.md.sha256.create();
    md.update(data.toString(), 'utf8');
    
    // Decode signature
    const signature = forge.util.decode64(signatureBase64);
    
    // Verify
    const isValid = publicKey.verify(md.digest().bytes(), signature);
    
    return isValid;
    
  } catch (error) {
    logger.error('Error verifying signature:', error);
    return false;
  }
};

/**
 * Create digital signature record for report card
 * @param {string} reportCardId - Report card ID
 * @param {string} pdfHash - SHA-256 hash of PDF content
 * @param {string} principalId - Principal user ID
 * @returns {Object} Signature record
 */
export const createReportCardSignature = async (reportCardId, pdfHash, principalId) => {
  try {
    // Sign the PDF hash
    const signatureResult = await signData(pdfHash);
    
    // Get certificate info
    const certStatus = checkCertificateStatus();
    
    // Create signature record
    const signatureRecord = {
      reportCardId,
      principalId,
      signature: signatureResult.signature,
      algorithm: signatureResult.algorithm,
      signedAt: signatureResult.timestamp,
      pdfHash: pdfHash,
      hashAlgorithm: 'SHA-256',
      certificateFingerprint: certStatus.fingerprint,
      certificateSubject: certStatus.subject,
      certificateValidUntil: certStatus.validUntil
    };
    
    logger.info(`Report card ${reportCardId} signed by principal ${principalId}`);
    
    return signatureRecord;
    
  } catch (error) {
    logger.error('Error creating report card signature:', error);
    throw error;
  }
};

/**
 * Verify report card signature
 * @param {string} pdfHash - SHA-256 hash of PDF content
 * @param {string} signatureBase64 - Base64 encoded signature
 * @returns {Object} Verification result
 */
export const verifyReportCardSignature = async (pdfHash, signatureBase64) => {
  try {
    const isValid = await verifySignature(pdfHash, signatureBase64);
    const certStatus = checkCertificateStatus();
    
    return {
      valid: isValid,
      certificateValid: certStatus.valid,
      certificateSubject: certStatus.subject,
      message: isValid ? 'Signature is valid' : 'Signature verification failed'
    };
    
  } catch (error) {
    logger.error('Error verifying report card signature:', error);
    return {
      valid: false,
      message: error.message
    };
  }
};

/**
 * Generate PDF hash for signing
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @returns {string} SHA-256 hash in hex
 */
export const generatePDFHash = (pdfBuffer) => {
  return crypto.createHash('sha256').update(pdfBuffer).digest('hex');
};

export default {
  generatePrincipalCertificate,
  checkCertificateStatus,
  signData,
  verifySignature,
  createReportCardSignature,
  verifyReportCardSignature,
  generatePDFHash
};
