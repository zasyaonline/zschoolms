import { AuditLog } from '../models/index.js';
import logger from '../utils/logger.js';

/**
 * Audit logging middleware
 * Logs actions after successful requests
 */

/**
 * Log CREATE action
 */
export const logCreate = (entityType) => async (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = function (data) {
    if (res.statusCode >= 200 && res.statusCode < 300 && data.success !== false) {
      AuditLog.logAction({
        userId: req.user?.id,
        action: 'CREATE',
        entityType,
        entityId: data.data?.id || data.id,
        newValues: data.data || data,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        status: 'SUCCESS',
      }).catch((error) => {
        logger.error('Audit log error:', error);
      });
    }

    return originalJson(data);
  };

  next();
};

/**
 * Log UPDATE action
 */
export const logUpdate = (entityType) => async (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = function (data) {
    if (res.statusCode >= 200 && res.statusCode < 300 && data.success !== false) {
      AuditLog.logAction({
        userId: req.user?.id,
        action: 'UPDATE',
        entityType,
        entityId: req.params.id || data.data?.id || data.id,
        oldValues: req.oldData, // Should be set by controller
        newValues: data.data || data,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        status: 'SUCCESS',
      }).catch((error) => {
        logger.error('Audit log error:', error);
      });
    }

    return originalJson(data);
  };

  next();
};

/**
 * Log DELETE action
 */
export const logDelete = (entityType) => async (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = function (data) {
    if (res.statusCode >= 200 && res.statusCode < 300 && data.success !== false) {
      AuditLog.logAction({
        userId: req.user?.id,
        action: 'DELETE',
        entityType,
        entityId: req.params.id || data.data?.id || data.id,
        oldValues: req.oldData, // Should be set by controller
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        status: 'SUCCESS',
      }).catch((error) => {
        logger.error('Audit log error:', error);
      });
    }

    return originalJson(data);
  };

  next();
};

/**
 * Log custom action
 */
export const logAction = (action, entityType) => async (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = function (data) {
    if (res.statusCode >= 200 && res.statusCode < 300 && data.success !== false) {
      AuditLog.logAction({
        userId: req.user?.id,
        action,
        entityType,
        entityId: req.params.id || data.data?.id || data.id,
        oldValues: req.oldData,
        newValues: data.data || data,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        status: 'SUCCESS',
        metadata: req.auditMetadata || {},
      }).catch((error) => {
        logger.error('Audit log error:', error);
      });
    }

    return originalJson(data);
  };

  next();
};

/**
 * Log marks approval
 */
export const logMarksApproval = async (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = function (data) {
    if (res.statusCode >= 200 && res.statusCode < 300 && data.success !== false) {
      AuditLog.logAction({
        userId: req.user?.id,
        action: 'MARKS_APPROVED',
        entityType: 'Marks',
        entityId: req.params.id || req.body.marksheetId,
        newValues: data.data || data,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        status: 'SUCCESS',
      }).catch((error) => {
        logger.error('Audit log error:', error);
      });
    }

    return originalJson(data);
  };

  next();
};

/**
 * Log marks rejection
 */
export const logMarksRejection = async (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = function (data) {
    if (res.statusCode >= 200 && res.statusCode < 300 && data.success !== false) {
      AuditLog.logAction({
        userId: req.user?.id,
        action: 'MARKS_REJECTED',
        entityType: 'Marks',
        entityId: req.params.id || req.body.marksheetId,
        newValues: data.data || data,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        status: 'SUCCESS',
        metadata: { rejectionReason: req.body.reason },
      }).catch((error) => {
        logger.error('Audit log error:', error);
      });
    }

    return originalJson(data);
  };

  next();
};

/**
 * Log report generation
 */
export const logReportGeneration = async (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = function (data) {
    if (res.statusCode >= 200 && res.statusCode < 300 && data.success !== false) {
      AuditLog.logAction({
        userId: req.user?.id,
        action: 'REPORT_GENERATED',
        entityType: 'Report',
        entityId: data.data?.reportId || data.reportId,
        newValues: data.data || data,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        status: 'SUCCESS',
      }).catch((error) => {
        logger.error('Audit log error:', error);
      });
    }

    return originalJson(data);
  };

  next();
};

/**
 * Log file upload
 */
export const logFileUpload = async (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = function (data) {
    if (res.statusCode >= 200 && res.statusCode < 300 && data.success !== false) {
      AuditLog.logAction({
        userId: req.user?.id,
        action: 'FILE_UPLOADED',
        entityType: req.body.entityType || 'File',
        entityId: req.body.entityId,
        newValues: {
          filename: req.file?.originalname || req.files?.[0]?.originalname,
          size: req.file?.size || req.files?.[0]?.size,
          key: data.data?.key || data.key,
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        status: 'SUCCESS',
      }).catch((error) => {
        logger.error('Audit log error:', error);
      });
    }

    return originalJson(data);
  };

  next();
};

/**
 * Log file deletion
 */
export const logFileDelete = async (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = function (data) {
    if (res.statusCode >= 200 && res.statusCode < 300 && data.success !== false) {
      AuditLog.logAction({
        userId: req.user?.id,
        action: 'FILE_DELETED',
        entityType: 'File',
        entityId: req.params.fileId || req.body.fileId,
        oldValues: {
          key: req.params.key || req.body.key,
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        status: 'SUCCESS',
      }).catch((error) => {
        logger.error('Audit log error:', error);
      });
    }

    return originalJson(data);
  };

  next();
};

export default {
  logCreate,
  logUpdate,
  logDelete,
  logAction,
  logMarksApproval,
  logMarksRejection,
  logReportGeneration,
  logFileUpload,
  logFileDelete,
};
