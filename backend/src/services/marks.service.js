import { Op } from 'sequelize';
import { Marksheet, Mark, Subject, Student, User, AuditLog } from '../models/index.js';
import logger from '../utils/logger.js';
import sequelize from '../config/database.js';

/**
 * Marks Service
 * Business logic for marks/grading management
 * Works with existing complex schema (enrollments, course parts, academic years)
 */

/**
 * Enter or update marks for a marksheet
 * @param {Object} marksData - Marks entry data
 * @param {string} userId - User ID performing the action
 * @returns {Promise<Object>} Created/updated marksheet with marks
 */
export const enterMarks = async (marksData, userId) => {
  const transaction = await sequelize.transaction();
  
  try {
    const {
      marksheetId,
      coursePartId,
      academicYearId,
      academicYearEnrollmentId,
      studentSubjectEnrollmentId,
      subjectId,
      schoolId,
      marks, // Array of { subjectId, marksObtained, maxMarks, remarks }
      status = 'Draft',
      remarks
    } = marksData;
    
    let marksheet;
    
    // If marksheetId provided, update existing marksheet
    if (marksheetId) {
      marksheet = await Marksheet.findByPk(marksheetId, { transaction });
      
      if (!marksheet) {
        throw new Error('Marksheet not found');
      }
      
      // Check if marksheet can be edited (not approved)
      if (marksheet.status === 'approved') {
        throw new Error('Cannot edit approved marksheet');
      }
      
      // Update marksheet fields
      await marksheet.update({
        marksObtained: marksData.marksObtained || marksheet.marksObtained,
        remarks: remarks || marksheet.remarks,
        status,
        modifiedBy: userId
      }, { transaction });
      
      logger.info(`Marksheet ${marksheetId} updated by user ${userId}`);
    } else {
      // Create new marksheet
      marksheet = await Marksheet.create({
        coursePartId,
        academicYearId,
        academicYearEnrollmentId,
        studentSubjectEnrollmentId,
        subjectId,
        schoolId,
        marksObtained: marksData.marksObtained || 0,
        remarks,
        status,
        createdBy: userId,
        modifiedBy: userId
      }, { transaction });
      
      logger.info(`New marksheet ${marksheet.id} created by user ${userId}`);
    }
    
    // If marks array is provided, bulk upsert individual subject marks
    if (marks && Array.isArray(marks) && marks.length > 0) {
      const markResults = await Mark.bulkUpsert(marksheet.id, marks);
      
      logger.info(`Marks entry: ${markResults.created.length} created, ${markResults.updated.length} updated, ${markResults.failed.length} failed`);
      
      if (markResults.failed.length > 0) {
        logger.warn('Some marks failed to save', { failed: markResults.failed });
      }
    }
    
    // Create audit log
    await AuditLog.create({
      userId,
      action: marksheetId ? 'UPDATE' : 'CREATE',
      entityType: 'marksheet',
      entityId: marksheet.id,
      details: {
        status,
        subjectId,
        marksCount: marks?.length || 0
      }
    }, { transaction });
    
    await transaction.commit();
    
    // Fetch complete marksheet with marks
    const completeMarksheet = await Marksheet.findByPk(marksheet.id, {
      include: [
        {
          model: Mark,
          as: 'marks',
          include: [{ model: Subject, as: 'subject', attributes: ['id', 'name'] }]
        },
        {
          model: Subject,
          as: 'subject',
          attributes: ['id', 'name']
        }
      ]
    });
    
    return completeMarksheet;
  } catch (error) {
    await transaction.rollback();
    logger.error('Error entering marks:', error);
    throw error;
  }
};

/**
 * Get pending marksheets for approval
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} Paginated pending marksheets
 */
export const getPendingMarksheets = async (filters = {}) => {
  try {
    const {
      page = 1,
      limit = 50,
      academicYearId,
      subjectId,
      schoolId,
      search
    } = filters;
    
    const offset = (page - 1) * limit;
    const where = { status: 'submitted' };
    
    if (academicYearId) where.academicYearId = academicYearId;
    if (subjectId) where.subjectId = subjectId;
    if (schoolId) where.schoolId = schoolId;
    
    const include = [
      {
        model: Subject,
        as: 'subject',
        attributes: ['id', 'name']
      },
      {
        model: Mark,
        as: 'marks',
        include: [{ model: Subject, as: 'subject', attributes: ['id', 'name'] }]
      }
    ];
    
    const { count, rows } = await Marksheet.findAndCountAll({
      where,
      include,
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
      distinct: true
    });
    
    // Calculate totals for each marksheet
    const marksheetsWithTotals = await Promise.all(
      rows.map(async (marksheet) => {
        const totals = await marksheet.calculateTotals();
        return {
          ...marksheet.toJSON(),
          totals
        };
      })
    );
    
    logger.info(`Retrieved ${count} pending marksheets`);
    
    return {
      marksheets: marksheetsWithTotals,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    };
  } catch (error) {
    logger.error('Error getting pending marksheets:', error);
    throw error;
  }
};

/**
 * Get marksheets by filters
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} Paginated marksheets
 */
export const getMarksheets = async (filters = {}) => {
  try {
    const {
      page = 1,
      limit = 50,
      academicYearId,
      subjectId,
      schoolId,
      status,
      enrollmentId
    } = filters;
    
    const offset = (page - 1) * limit;
    const where = {};
    
    if (academicYearId) where.academicYearId = academicYearId;
    if (subjectId) where.subjectId = subjectId;
    if (schoolId) where.schoolId = schoolId;
    if (status) where.status = status;
    if (enrollmentId) where.academicYearEnrollmentId = enrollmentId;
    
    const include = [
      {
        model: Subject,
        as: 'subject',
        attributes: ['id', 'name']
      },
      {
        model: Mark,
        as: 'marks',
        include: [{ model: Subject, as: 'subject', attributes: ['id', 'name'] }]
      }
    ];
    
    const { count, rows } = await Marksheet.findAndCountAll({
      where,
      include,
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
      distinct: true
    });
    
    logger.info(`Retrieved ${count} marksheets with filters`);
    
    return {
      marksheets: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    };
  } catch (error) {
    logger.error('Error getting marksheets:', error);
    throw error;
  }
};

/**
 * Get marksheet by ID
 * @param {string} marksheetId - Marksheet UUID
 * @returns {Promise<Object>} Marksheet with marks
 */
export const getMarksheetById = async (marksheetId) => {
  try {
    const marksheet = await Marksheet.findByPk(marksheetId, {
      include: [
        {
          model: Subject,
          as: 'subject',
          attributes: ['id', 'name']
        },
        {
          model: Mark,
          as: 'marks',
          include: [{ model: Subject, as: 'subject', attributes: ['id', 'name'] }]
        }
      ]
    });
    
    if (!marksheet) {
      throw new Error('Marksheet not found');
    }
    
    const totals = await marksheet.calculateTotals();
    
    return {
      ...marksheet.toJSON(),
      totals
    };
  } catch (error) {
    logger.error('Error getting marksheet by ID:', error);
    throw error;
  }
};

/**
 * Approve marksheet
 * @param {string} marksheetId - Marksheet UUID
 * @param {string} reviewerId - User ID of reviewer (principal/admin)
 * @returns {Promise<Object>} Approved marksheet
 */
export const approveMarksheet = async (marksheetId, reviewerId) => {
  const transaction = await sequelize.transaction();
  
  try {
    const marksheet = await Marksheet.findByPk(marksheetId, { transaction });
    
    if (!marksheet) {
      throw new Error('Marksheet not found');
    }
    
    if (marksheet.status !== 'submitted') {
      throw new Error(`Cannot approve marksheet with status: ${marksheet.status}. Only submitted marksheets can be approved.`);
    }
    
    // Approve the marksheet
    await marksheet.update({
      status: 'approved',
      modifiedBy: reviewerId,
      modifiedAt: new Date()
    }, { transaction });
    
    // Create audit log
    await AuditLog.create({
      userId: reviewerId,
      action: 'APPROVE',
      entityType: 'marksheet',
      entityId: marksheet.id,
      details: {
        previousStatus: 'submitted',
        newStatus: 'approved',
        subjectId: marksheet.subjectId
      }
    }, { transaction });
    
    await transaction.commit();
    
    logger.info(`Marksheet ${marksheetId} approved by user ${reviewerId}`);
    
    // Return complete marksheet
    return await getMarksheetById(marksheetId);
  } catch (error) {
    await transaction.rollback();
    logger.error('Error approving marksheet:', error);
    throw error;
  }
};

/**
 * Reject marksheet
 * @param {string} marksheetId - Marksheet UUID
 * @param {string} reviewerId - User ID of reviewer (principal/admin)
 * @param {string} reason - Rejection reason
 * @returns {Promise<Object>} Rejected marksheet
 */
export const rejectMarksheet = async (marksheetId, reviewerId, reason) => {
  const transaction = await sequelize.transaction();
  
  try {
    const marksheet = await Marksheet.findByPk(marksheetId, { transaction });
    
    if (!marksheet) {
      throw new Error('Marksheet not found');
    }
    
    if (marksheet.status !== 'submitted') {
      throw new Error(`Cannot reject marksheet with status: ${marksheet.status}. Only submitted marksheets can be rejected.`);
    }
    
    if (!reason || reason.trim().length === 0) {
      throw new Error('Rejection reason is required');
    }
    
    // Reject the marksheet
    await marksheet.update({
      status: 'rejected',
      remarks: reason,
      modifiedBy: reviewerId,
      modifiedAt: new Date()
    }, { transaction });
    
    // Create audit log
    await AuditLog.create({
      userId: reviewerId,
      action: 'REJECT',
      entityType: 'marksheet',
      entityId: marksheet.id,
      details: {
        previousStatus: 'submitted',
        newStatus: 'rejected',
        reason,
        subjectId: marksheet.subjectId
      }
    }, { transaction });
    
    await transaction.commit();
    
    logger.info(`Marksheet ${marksheetId} rejected by user ${reviewerId}`);
    
    // Return complete marksheet
    return await getMarksheetById(marksheetId);
  } catch (error) {
    await transaction.rollback();
    logger.error('Error rejecting marksheet:', error);
    throw error;
  }
};

/**
 * Submit marksheet for approval
 * @param {string} marksheetId - Marksheet UUID
 * @param {string} userId - User ID submitting
 * @returns {Promise<Object>} Submitted marksheet
 */
export const submitMarksheet = async (marksheetId, userId) => {
  const transaction = await sequelize.transaction();
  
  try {
    const marksheet = await Marksheet.findByPk(marksheetId, { transaction });
    
    if (!marksheet) {
      throw new Error('Marksheet not found');
    }
    
    if (!marksheet.canEdit()) {
      throw new Error(`Cannot submit marksheet with status: ${marksheet.status}`);
    }
    
    // Validate that marks exist
    const marks = await marksheet.getMarks();
    if (marks.length === 0) {
      throw new Error('Cannot submit marksheet without any marks');
    }
    
    // Submit the marksheet
    await marksheet.update({
      status: 'submitted',
      modifiedBy: userId,
      modifiedAt: new Date()
    }, { transaction });
    
    // Create audit log
    await AuditLog.create({
      userId,
      action: 'SUBMIT',
      entityType: 'marksheet',
      entityId: marksheet.id,
      details: {
        previousStatus: marksheet.status,
        newStatus: 'submitted',
        marksCount: marks.length,
        subjectId: marksheet.subjectId
      }
    }, { transaction });
    
    await transaction.commit();
    
    logger.info(`Marksheet ${marksheetId} submitted by user ${userId}`);
    
    // Return complete marksheet
    return await getMarksheetById(marksheetId);
  } catch (error) {
    await transaction.rollback();
    logger.error('Error submitting marksheet:', error);
    throw error;
  }
};

/**
 * Delete marksheet (only if in draft or rejected status)
 * @param {string} marksheetId - Marksheet UUID
 * @param {string} userId - User ID performing deletion
 * @returns {Promise<void>}
 */
export const deleteMarksheet = async (marksheetId, userId) => {
  const transaction = await sequelize.transaction();
  
  try {
    const marksheet = await Marksheet.findByPk(marksheetId, { transaction });
    
    if (!marksheet) {
      throw new Error('Marksheet not found');
    }
    
    if (marksheet.status === 'approved' || marksheet.status === 'submitted') {
      throw new Error(`Cannot delete marksheet with status: ${marksheet.status}`);
    }
    
    // Create audit log before deletion
    await AuditLog.create({
      userId,
      action: 'DELETE',
      entityType: 'marksheet',
      entityId: marksheet.id,
      details: {
        status: marksheet.status,
        subjectId: marksheet.subjectId
      }
    }, { transaction });
    
    // Delete marksheet (cascade will delete associated marks)
    await marksheet.destroy({ transaction });
    
    await transaction.commit();
    
    logger.info(`Marksheet ${marksheetId} deleted by user ${userId}`);
  } catch (error) {
    await transaction.rollback();
    logger.error('Error deleting marksheet:', error);
    throw error;
  }
};

/**
 * Get marks statistics for a subject
 * @param {string} subjectId - Subject UUID
 * @param {Object} filters - Additional filters
 * @returns {Promise<Object>} Statistics
 */
export const getSubjectStatistics = async (subjectId, filters = {}) => {
  try {
    const subject = await Subject.findByPk(subjectId);
    
    if (!subject) {
      throw new Error('Subject not found');
    }
    
    const statistics = await subject.getStatistics(filters);
    
    return {
      subject: {
        id: subject.id,
        name: subject.name
      },
      statistics,
      filters
    };
  } catch (error) {
    logger.error('Error getting subject statistics:', error);
    throw error;
  }
};

/**
 * Get student's marksheets
 * @param {string} enrollmentId - Academic year enrollment ID
 * @returns {Promise<Array>} Student's marksheets
 */
export const getStudentMarksheets = async (enrollmentId) => {
  try {
    const marksheets = await Marksheet.findAll({
      where: { academicYearEnrollmentId: enrollmentId },
      include: [
        {
          model: Subject,
          as: 'subject',
          attributes: ['id', 'name']
        },
        {
          model: Mark,
          as: 'marks',
          include: [{ model: Subject, as: 'subject', attributes: ['id', 'name'] }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    // Calculate totals for each marksheet
    const marksheetsWithTotals = await Promise.all(
      marksheets.map(async (marksheet) => {
        const totals = await marksheet.calculateTotals();
        return {
          ...marksheet.toJSON(),
          totals
        };
      })
    );
    
    return marksheetsWithTotals;
  } catch (error) {
    logger.error('Error getting student marksheets:', error);
    throw error;
  }
};

export default {
  enterMarks,
  getPendingMarksheets,
  getMarksheets,
  getMarksheetById,
  approveMarksheet,
  rejectMarksheet,
  submitMarksheet,
  deleteMarksheet,
  getSubjectStatistics,
  getStudentMarksheets
};
