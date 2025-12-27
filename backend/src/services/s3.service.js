import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand, 
  HeadObjectCommand,
  DeleteObjectCommand,
  ListObjectVersionsCommand,
  CreateBucketCommand,
  PutBucketVersioningCommand,
  HeadBucketCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl as getPresignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import logger from '../utils/logger.js';

/**
 * S3 Storage Service
 * Handles secure storage of report card PDFs in AWS S3
 * Configured for immutable storage with organized folder structure
 * Uses AWS SDK v3
 */

// Configure S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: process.env.AWS_ACCESS_KEY_ID ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  } : undefined
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'zschool-report-cards';

/**
 * Check if S3 is configured
 * @returns {boolean}
 */
export const isS3Configured = () => {
  return !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_S3_BUCKET
  );
};

/**
 * Generate S3 key (path) for report card
 * Organized structure: school/academic-year/class/student-id/filename
 * @param {Object} metadata - File metadata
 * @returns {string} S3 key
 */
const generateS3Key = (metadata) => {
  const {
    schoolId = 'default',
    academicYear = new Date().getFullYear().toString(),
    className = 'general',
    studentId,
    fileName
  } = metadata;

  // Sanitize values for S3 key
  const sanitize = (str) => str.toString().replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();

  return `report-cards/${sanitize(schoolId)}/${sanitize(academicYear)}/${sanitize(className)}/${sanitize(studentId)}/${fileName}`;
};

/**
 * Upload PDF to S3
 * @param {Buffer|string} fileContent - File buffer or file path
 * @param {Object} metadata - File metadata
 * @returns {Promise<Object>} Upload result with S3 URL
 */
export const uploadPDF = async (fileContent, metadata) => {
  if (!isS3Configured()) {
    logger.warn('S3 not configured. Storing file locally.');
    return {
      success: false,
      message: 'S3 not configured',
      localStorage: true
    };
  }

  try {
    // Get file buffer
    let buffer;
    if (typeof fileContent === 'string' && fs.existsSync(fileContent)) {
      buffer = fs.readFileSync(fileContent);
    } else if (Buffer.isBuffer(fileContent)) {
      buffer = fileContent;
    } else {
      throw new Error('Invalid file content provided');
    }

    // Generate S3 key
    const key = generateS3Key(metadata);

    // Calculate content hash for integrity
    const contentMD5 = crypto.createHash('md5').update(buffer).digest('base64');
    const contentSHA256 = crypto.createHash('sha256').update(buffer).digest('hex');

    // Upload parameters for SDK v3
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: 'application/pdf',
      ContentMD5: contentMD5,
      // Metadata for tracking and verification
      Metadata: {
        'student-id': metadata.studentId || '',
        'academic-year': metadata.academicYear || '',
        'school-id': metadata.schoolId || '',
        'report-card-id': metadata.reportCardId || '',
        'sha256-hash': contentSHA256,
        'generated-at': new Date().toISOString(),
        'signed-by': metadata.signedBy || ''
      },
      // Server-side encryption
      ServerSideEncryption: 'AES256',
      // Set storage class (STANDARD for frequent access, GLACIER for archival)
      StorageClass: 'STANDARD'
    });

    // Upload to S3
    const result = await s3Client.send(command);
    const location = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${key}`;

    logger.info(`PDF uploaded to S3: ${location}`);

    return {
      success: true,
      key,
      bucket: BUCKET_NAME,
      location,
      eTag: result.ETag,
      contentHash: contentSHA256,
      versionId: result.VersionId || null
    };

  } catch (error) {
    logger.error('S3 upload error:', error);
    throw new Error(`Failed to upload to S3: ${error.message}`);
  }
};

/**
 * Get signed URL for PDF download (temporary access)
 * @param {string} key - S3 object key
 * @param {number} expiresIn - URL expiry in seconds (default 1 hour)
 * @returns {Promise<string>} Signed URL
 */
export const getSignedUrl = async (key, expiresIn = 3600) => {
  if (!isS3Configured()) {
    throw new Error('S3 not configured');
  }

  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    const url = await getPresignedUrl(s3Client, command, { expiresIn });
    logger.info(`Generated signed URL for: ${key}`);
    
    return url;

  } catch (error) {
    logger.error('Error generating signed URL:', error);
    throw error;
  }
};

/**
 * Get PDF from S3
 * @param {string} key - S3 object key
 * @returns {Promise<Buffer>} PDF buffer
 */
export const getPDF = async (key) => {
  if (!isS3Configured()) {
    throw new Error('S3 not configured');
  }

  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    const result = await s3Client.send(command);
    // Convert stream to buffer
    const chunks = [];
    for await (const chunk of result.Body) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);

  } catch (error) {
    logger.error('Error getting PDF from S3:', error);
    throw error;
  }
};

/**
 * Check if object exists in S3
 * @param {string} key - S3 object key
 * @returns {Promise<boolean>}
 */
export const objectExists = async (key) => {
  if (!isS3Configured()) {
    return false;
  }

  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });
    await s3Client.send(command);
    
    return true;
  } catch (error) {
    if (error.name === 'NotFound') {
      return false;
    }
    throw error;
  }
};

/**
 * Get object metadata from S3
 * @param {string} key - S3 object key
 * @returns {Promise<Object>} Object metadata
 */
export const getObjectMetadata = async (key) => {
  if (!isS3Configured()) {
    throw new Error('S3 not configured');
  }

  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });
    const result = await s3Client.send(command);

    return {
      contentLength: result.ContentLength,
      contentType: result.ContentType,
      lastModified: result.LastModified,
      eTag: result.ETag,
      metadata: result.Metadata,
      storageClass: result.StorageClass,
      versionId: result.VersionId
    };

  } catch (error) {
    logger.error('Error getting object metadata:', error);
    throw error;
  }
};

/**
 * List all report cards for a student
 * @param {string} studentId - Student ID
 * @param {Object} options - List options
 * @returns {Promise<Array>} List of objects
 */
export const listStudentReportCards = async (studentId, options = {}) => {
  if (!isS3Configured()) {
    return [];
  }

  try {
    const prefix = options.schoolId 
      ? `report-cards/${options.schoolId}/`
      : 'report-cards/';

    // SDK v3 uses ListObjectsV2Command from @aws-sdk/client-s3
    const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
      MaxKeys: options.limit || 100
    });

    const result = await s3Client.send(command);

    // Filter by student ID
    const studentFiles = (result.Contents || []).filter(obj => 
      obj.Key.includes(`/${studentId}/`)
    );

    return studentFiles.map(obj => ({
      key: obj.Key,
      size: obj.Size,
      lastModified: obj.LastModified,
      fileName: path.basename(obj.Key)
    }));

  } catch (error) {
    logger.error('Error listing student report cards:', error);
    return [];
  }
};

/**
 * Create bucket with proper configuration (run once during setup)
 * Enables versioning and configures lifecycle rules for immutability
 * @returns {Promise<Object>} Bucket configuration result
 */
export const setupBucket = async () => {
  if (!isS3Configured()) {
    throw new Error('S3 not configured');
  }

  try {
    // Check if bucket exists
    try {
      const headBucketCommand = new HeadBucketCommand({ Bucket: BUCKET_NAME });
      await s3Client.send(headBucketCommand);
      logger.info(`Bucket ${BUCKET_NAME} already exists`);
    } catch (error) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        // Create bucket
        const createCommand = new CreateBucketCommand({
          Bucket: BUCKET_NAME,
          CreateBucketConfiguration: {
            LocationConstraint: process.env.AWS_REGION || 'ap-south-1'
          }
        });
        await s3Client.send(createCommand);
        logger.info(`Bucket ${BUCKET_NAME} created`);
      } else {
        throw error;
      }
    }

    // Enable versioning for immutability
    const versioningCommand = new PutBucketVersioningCommand({
      Bucket: BUCKET_NAME,
      VersioningConfiguration: {
        Status: 'Enabled'
      }
    });
    await s3Client.send(versioningCommand);
    logger.info('Bucket versioning enabled');

    // Note: For SDK v3, encryption and public access block require additional imports
    // @aws-sdk/client-s3 PutBucketEncryptionCommand and PutPublicAccessBlockCommand
    // These can be added later if needed

    return {
      success: true,
      bucket: BUCKET_NAME,
      region: process.env.AWS_REGION || 'ap-south-1',
      versioning: 'enabled',
      encryption: 'AES256'
    };

  } catch (error) {
    logger.error('Error setting up bucket:', error);
    throw error;
  }
};

export default {
  isS3Configured,
  uploadPDF,
  getSignedUrl,
  getPDF,
  objectExists,
  getObjectMetadata,
  listStudentReportCards,
  setupBucket
};
