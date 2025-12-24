import AWS from 'aws-sdk';
import dotenv from 'dotenv';

dotenv.config();

/**
 * AWS S3 Configuration for ZSchool Management System
 * Region: ap-south-1 (Asia Pacific Mumbai)
 * Bucket: zschoolms
 */

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'ap-south-1',
});

// Create S3 instance
export const s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  signatureVersion: 'v4',
});

// S3 Configuration
export const s3Config = {
  bucket: process.env.S3_BUCKET_NAME || 'zschoolms',
  region: process.env.AWS_REGION || 'ap-south-1',
  publicUrl: process.env.S3_PUBLIC_URL || 'https://zschoolms.s3.ap-south-1.amazonaws.com',
  
  // Folder structure
  folders: {
    studentPhotos: 'students/photos',
    studentDocuments: 'students/documents',
    reportCards: 'reports/cards',
    reportsBulk: 'reports/bulk',
    certificates: 'certificates/digital',
    uploads: 'uploads/temp',
    backups: 'backups',
  },
  
  // File size limits (in bytes)
  maxSizes: {
    photo: parseInt(process.env.MAX_PHOTO_SIZE) || 2097152, // 2MB
    general: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB
    certificate: parseInt(process.env.MAX_CERTIFICATE_SIZE) || 10485760, // 10MB
  },
  
  // Allowed MIME types
  allowedTypes: {
    photo: ['image/jpeg', 'image/png', 'image/jpg'],
    pdf: ['application/pdf'],
    certificate: ['application/x-pkcs12', 'application/x-x509-ca-cert'],
  },
};

/**
 * Upload file to S3
 * @param {Buffer|Stream} file - File buffer or stream
 * @param {string} key - S3 object key (path)
 * @param {string} contentType - MIME type
 * @param {Object} options - Additional S3 upload options
 * @returns {Promise<Object>} Upload result with Location, Key, Bucket
 */
export const uploadToS3 = async (file, key, contentType, options = {}) => {
  const params = {
    Bucket: s3Config.bucket,
    Key: key,
    Body: file,
    ContentType: contentType,
    ...options,
  };

  try {
    const result = await s3.upload(params).promise();
    return {
      success: true,
      url: result.Location,
      key: result.Key,
      bucket: result.Bucket,
    };
  } catch (error) {
    console.error('S3 Upload Error:', error);
    throw new Error(`Failed to upload file to S3: ${error.message}`);
  }
};

/**
 * Delete file from S3
 * @param {string} key - S3 object key
 * @returns {Promise<boolean>}
 */
export const deleteFromS3 = async (key) => {
  const params = {
    Bucket: s3Config.bucket,
    Key: key,
  };

  try {
    await s3.deleteObject(params).promise();
    return true;
  } catch (error) {
    console.error('S3 Delete Error:', error);
    throw new Error(`Failed to delete file from S3: ${error.message}`);
  }
};

/**
 * Generate presigned URL for private file access
 * @param {string} key - S3 object key
 * @param {number} expiresIn - URL expiration in seconds (default: 15 minutes)
 * @returns {Promise<string>} Presigned URL
 */
export const getPresignedUrl = async (key, expiresIn = 900) => {
  const params = {
    Bucket: s3Config.bucket,
    Key: key,
    Expires: expiresIn,
  };

  try {
    const url = await s3.getSignedUrlPromise('getObject', params);
    return url;
  } catch (error) {
    console.error('S3 Presigned URL Error:', error);
    throw new Error(`Failed to generate presigned URL: ${error.message}`);
  }
};

/**
 * Check if file exists in S3
 * @param {string} key - S3 object key
 * @returns {Promise<boolean>}
 */
export const fileExistsInS3 = async (key) => {
  const params = {
    Bucket: s3Config.bucket,
    Key: key,
  };

  try {
    await s3.headObject(params).promise();
    return true;
  } catch (error) {
    if (error.code === 'NotFound') {
      return false;
    }
    throw error;
  }
};

/**
 * List files in S3 folder
 * @param {string} prefix - Folder prefix
 * @param {number} maxKeys - Maximum number of files to return
 * @returns {Promise<Array>} Array of file objects
 */
export const listS3Files = async (prefix, maxKeys = 1000) => {
  const params = {
    Bucket: s3Config.bucket,
    Prefix: prefix,
    MaxKeys: maxKeys,
  };

  try {
    const result = await s3.listObjectsV2(params).promise();
    return result.Contents || [];
  } catch (error) {
    console.error('S3 List Error:', error);
    throw new Error(`Failed to list S3 files: ${error.message}`);
  }
};

/**
 * Generate S3 key for student photo
 * @param {string} studentId - Student UUID
 * @param {string} filename - Original filename
 * @returns {string} S3 key
 */
export const generateStudentPhotoKey = (studentId, filename) => {
  const ext = filename.split('.').pop();
  return `${s3Config.folders.studentPhotos}/${studentId}/profile.${ext}`;
};

/**
 * Generate S3 key for report card
 * @param {string} academicYear - e.g., '2024-2025'
 * @param {string} examType - e.g., 'final-exam'
 * @param {string} studentId - Student UUID
 * @returns {string} S3 key
 */
export const generateReportCardKey = (academicYear, examType, studentId) => {
  return `${s3Config.folders.reportCards}/${academicYear}/${examType}/${studentId}.pdf`;
};

/**
 * Generate S3 key for digital certificate
 * @param {string} schoolId - School UUID
 * @param {string} filename - Certificate filename
 * @returns {string} S3 key
 */
export const generateCertificateKey = (schoolId, filename) => {
  return `${s3Config.folders.certificates}/${schoolId}/${filename}`;
};

export default {
  s3,
  s3Config,
  uploadToS3,
  deleteFromS3,
  getPresignedUrl,
  fileExistsInS3,
  listS3Files,
  generateStudentPhotoKey,
  generateReportCardKey,
  generateCertificateKey,
};
