import { Op } from 'sequelize';
import { Marksheet, Mark, Subject, Student, User, AuditLog, Teacher, ClassSection } from '../models/index.js';
import logger from '../utils/logger.js';
import sequelize from '../config/database.js';
import * as notificationService from './notification.service.js';

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
 * Auto-save draft marks (lightweight save for periodic auto-save)
 * @param {Object} draftData - Draft marks data
 * @param {string} userId - User ID performing the save
 * @returns {Promise<Object>} Saved draft status
 */
export const autoSaveDraft = async (draftData, userId) => {
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
      marksObtained,
      maxMarks = 100,
      marks, // Array of individual marks
      remarks
    } = draftData;
    
    let marksheet;
    
    if (marksheetId) {
      // Update existing draft
      marksheet = await Marksheet.findByPk(marksheetId, { transaction });
      
      if (!marksheet) {
        throw new Error('Marksheet not found');
      }
      
      if (!marksheet.canEdit()) {
        throw new Error('Cannot auto-save: marksheet is locked or not in editable state');
      }
      
      await marksheet.update({
        marksObtained: marksObtained ?? marksheet.marksObtained,
        maxMarks: maxMarks ?? marksheet.maxMarks,
        remarks: remarks ?? marksheet.remarks,
        lastAutoSave: new Date(),
        modifiedBy: userId,
        modifiedAt: new Date()
      }, { transaction });
    } else {
      // Create new draft
      marksheet = await Marksheet.create({
        coursePartId,
        academicYearId,
        academicYearEnrollmentId,
        studentSubjectEnrollmentId,
        subjectId,
        schoolId,
        marksObtained: marksObtained || 0,
        maxMarks: maxMarks || 100,
        remarks,
        status: 'Draft',
        lastAutoSave: new Date(),
        createdBy: userId,
        modifiedBy: userId
      }, { transaction });
    }
    
    // Save individual marks if provided
    if (marks && Array.isArray(marks) && marks.length > 0) {
      await Mark.bulkUpsert(marksheet.id, marks);
    }
    
    await transaction.commit();
    
    logger.info(`Auto-save completed for marksheet ${marksheet.id} by user ${userId}`);
    
    return {
      success: true,
      marksheetId: marksheet.id,
      lastAutoSave: marksheet.lastAutoSave,
      status: marksheet.status
    };
  } catch (error) {
    await transaction.rollback();
    logger.error('Error auto-saving draft:', error);
    throw error;
  }
};

/**
 * Validate marks before submission
 * @param {Object} validationData - Marks to validate
 * @returns {Object} Validation result with errors if any
 */
export const validateMarks = async (validationData) => {
  const { marksObtained, maxMarks = 100, marks } = validationData;
  
  const errors = [];
  const warnings = [];
  
  // Validate main marks obtained
  if (marksObtained !== undefined) {
    if (marksObtained < 0) {
      errors.push({ field: 'marksObtained', message: 'Marks cannot be negative' });
    }
    if (marksObtained > maxMarks) {
      errors.push({ field: 'marksObtained', message: `Marks cannot exceed maximum (${maxMarks})` });
    }
  }
  
  // Validate individual marks
  if (marks && Array.isArray(marks)) {
    marks.forEach((mark, index) => {
      const markMax = mark.maxMarks || 100;
      
      if (mark.marksObtained < 0) {
        errors.push({ 
          field: `marks[${index}].marksObtained`, 
          message: 'Marks cannot be negative',
          subjectId: mark.subjectId 
        });
      }
      if (mark.marksObtained > markMax) {
        errors.push({ 
          field: `marks[${index}].marksObtained`, 
          message: `Marks cannot exceed maximum (${markMax})`,
          subjectId: mark.subjectId 
        });
      }
    });
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
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
 * @param {Object} options - Additional options (ipAddress)
 * @returns {Promise<Object>} Approved marksheet
 */
export const approveMarksheet = async (marksheetId, reviewerId, options = {}) => {
  const transaction = await sequelize.transaction();
  const { ipAddress } = options;
  
  try {
    const marksheet = await Marksheet.findByPk(marksheetId, { 
      transaction,
      include: [
        { model: Subject, as: 'subject', attributes: ['id', 'name'] }
      ]
    });
    
    if (!marksheet) {
      throw new Error('Marksheet not found');
    }
    
    if (marksheet.status !== 'submitted') {
      throw new Error(`Cannot approve marksheet with status: ${marksheet.status}. Only submitted marksheets can be approved.`);
    }
    
    // Approve the marksheet
    await marksheet.update({
      status: 'approved',
      approvedBy: reviewerId,
      approvedAt: new Date(),
      isLocked: true,
      modifiedBy: reviewerId,
      modifiedAt: new Date()
    }, { transaction });
    
    // Create audit log with IP address
    await AuditLog.create({
      userId: reviewerId,
      action: 'APPROVE',
      entityType: 'marksheet',
      entityId: marksheet.id,
      ipAddress: ipAddress || null,
      details: {
        previousStatus: 'submitted',
        newStatus: 'approved',
        subjectId: marksheet.subjectId,
        ipAddress: ipAddress || 'unknown'
      }
    }, { transaction });
    
    await transaction.commit();
    
    logger.info(`Marksheet ${marksheetId} approved by user ${reviewerId}`);
    
    // Send notification to teacher (non-blocking)
    try {
      // Only notify if we know who submitted it
      if (marksheet.submittedBy) {
        const approver = await User.findByPk(reviewerId, { attributes: ['id', 'firstName', 'lastName'] });
        const approverName = approver ? `${approver.firstName} ${approver.lastName}` : 'Principal';
        const subjectName = marksheet.subject?.name || 'Subject';
        
        // Try to get class name from marksheet context
        let className = 'Class';
        if (marksheet.classSectionId) {
          const classSection = await ClassSection.findByPk(marksheet.classSectionId);
          className = classSection ? classSection.getDisplayName() : 'Class';
        }
        
        await notificationService.notifyMarksApproved({
          teacherUserId: marksheet.submittedBy,
          className,
          subjectName,
          marksheetId,
          approverName
        });
        logger.info(`Approval notification sent to teacher ${marksheet.submittedBy}`);
      }
    } catch (notifyError) {
      // Don't fail the approval if notification fails
      logger.warn(`Failed to send approval notification: ${notifyError.message}`);
    }
    
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
 * @param {Object} options - Additional options (ipAddress)
 * @returns {Promise<Object>} Rejected marksheet
 */
export const rejectMarksheet = async (marksheetId, reviewerId, reason, options = {}) => {
  const transaction = await sequelize.transaction();
  const { ipAddress } = options;
  
  try {
    const marksheet = await Marksheet.findByPk(marksheetId, { 
      transaction,
      include: [
        { model: Subject, as: 'subject', attributes: ['id', 'name'] }
      ]
    });
    
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
      rejectionComments: reason,
      approvedBy: reviewerId,
      approvedAt: new Date(),
      modifiedBy: reviewerId,
      modifiedAt: new Date()
    }, { transaction });
    
    // Create audit log with IP address
    await AuditLog.create({
      userId: reviewerId,
      action: 'REJECT',
      entityType: 'marksheet',
      entityId: marksheet.id,
      ipAddress: ipAddress || null,
      details: {
        previousStatus: 'submitted',
        newStatus: 'rejected',
        reason,
        subjectId: marksheet.subjectId,
        ipAddress: ipAddress || 'unknown'
      }
    }, { transaction });
    
    await transaction.commit();
    
    logger.info(`Marksheet ${marksheetId} rejected by user ${reviewerId}`);
    
    // Send notification to teacher (non-blocking)
    try {
      // Only notify if we know who submitted it
      if (marksheet.submittedBy) {
        const rejector = await User.findByPk(reviewerId, { attributes: ['id', 'firstName', 'lastName'] });
        const rejectorName = rejector ? `${rejector.firstName} ${rejector.lastName}` : 'Principal';
        const subjectName = marksheet.subject?.name || 'Subject';
        
        // Try to get class name from marksheet context
        let className = 'Class';
        if (marksheet.classSectionId) {
          const classSection = await ClassSection.findByPk(marksheet.classSectionId);
          className = classSection ? classSection.getDisplayName() : 'Class';
        }
        
        await notificationService.notifyMarksRejected({
          teacherUserId: marksheet.submittedBy,
          className,
          subjectName,
          marksheetId,
          rejectionComments: reason,
          rejectorName
        });
        logger.info(`Rejection notification sent to teacher ${marksheet.submittedBy}`);
      }
    } catch (notifyError) {
      // Don't fail the rejection if notification fails
      logger.warn(`Failed to send rejection notification: ${notifyError.message}`);
    }
    
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
    const marksheet = await Marksheet.findByPk(marksheetId, { 
      transaction,
      include: [
        { model: Subject, as: 'subject', attributes: ['id', 'name'] }
      ]
    });
    
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
      submittedBy: userId,
      submittedAt: new Date(),
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
    
    // Send notification to principals (non-blocking)
    try {
      const submitter = await User.findByPk(userId, { attributes: ['id', 'firstName', 'lastName'] });
      const teacherName = submitter ? `${submitter.firstName} ${submitter.lastName}` : 'Teacher';
      const subjectName = marksheet.subject?.name || 'Subject';
      
      // Try to get class name from marksheet context
      let className = 'Class';
      if (marksheet.classSectionId) {
        const classSection = await ClassSection.findByPk(marksheet.classSectionId);
        className = classSection ? classSection.getDisplayName() : 'Class';
      }
      
      await notificationService.notifyMarksSubmitted({
        schoolId: marksheet.schoolId,
        teacherName,
        className,
        subjectName,
        marksheetId
      });
      logger.info(`Notification sent to principals for marksheet ${marksheetId} submission`);
    } catch (notifyError) {
      // Don't fail the submission if notification fails
      logger.warn(`Failed to send submission notification: ${notifyError.message}`);
    }
    
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

/**
 * Get detailed statistics for a marksheet (for principal review)
 * Includes class average, highest/lowest scores, and anomaly detection
 * @param {string} marksheetId - Marksheet UUID
 * @returns {Promise<Object>} Detailed statistics
 */
export const getMarksheetStatistics = async (marksheetId) => {
  try {
    const marksheet = await Marksheet.findByPk(marksheetId, {
      include: [
        { model: Subject, as: 'subject', attributes: ['id', 'name'] },
        { 
          model: Mark, 
          as: 'marks',
          include: [
            { model: Student, as: 'student', attributes: ['id', 'firstName', 'lastName', 'enrollmentNumber'] }
          ]
        }
      ]
    });

    if (!marksheet) {
      throw new Error('Marksheet not found');
    }

    const marks = marksheet.marks || [];
    
    if (marks.length === 0) {
      return {
        marksheet: {
          id: marksheet.id,
          status: marksheet.status,
          subject: marksheet.subject
        },
        statistics: {
          totalStudents: 0,
          classAverage: 0,
          highest: null,
          lowest: null,
          median: 0,
          passRate: 0,
          gradeDistribution: {}
        },
        anomalies: [],
        summary: 'No marks entered yet'
      };
    }

    // Calculate statistics
    const marksObtained = marks.map(m => m.marksObtained || 0);
    const maxMarks = marks[0]?.maxMarks || 100;
    
    // Sort for calculations
    const sortedMarks = [...marksObtained].sort((a, b) => a - b);
    
    const totalStudents = marks.length;
    const sum = marksObtained.reduce((acc, m) => acc + m, 0);
    const classAverage = totalStudents > 0 ? (sum / totalStudents).toFixed(2) : 0;
    
    // Highest and lowest with student info
    const highestMark = Math.max(...marksObtained);
    const lowestMark = Math.min(...marksObtained);
    
    const highestStudent = marks.find(m => m.marksObtained === highestMark);
    const lowestStudent = marks.find(m => m.marksObtained === lowestMark);
    
    // Median
    const midIndex = Math.floor(sortedMarks.length / 2);
    const median = sortedMarks.length % 2 !== 0
      ? sortedMarks[midIndex]
      : (sortedMarks[midIndex - 1] + sortedMarks[midIndex]) / 2;
    
    // Pass rate (assuming 40% pass mark)
    const passMark = maxMarks * 0.4;
    const passCount = marksObtained.filter(m => m >= passMark).length;
    const passRate = ((passCount / totalStudents) * 100).toFixed(1);
    
    // Grade distribution
    const gradeDistribution = {
      A: 0, // 80-100%
      B: 0, // 60-79%
      C: 0, // 50-59%
      D: 0, // 40-49%
      F: 0  // Below 40%
    };
    
    marksObtained.forEach(m => {
      const percentage = (m / maxMarks) * 100;
      if (percentage >= 80) gradeDistribution.A++;
      else if (percentage >= 60) gradeDistribution.B++;
      else if (percentage >= 50) gradeDistribution.C++;
      else if (percentage >= 40) gradeDistribution.D++;
      else gradeDistribution.F++;
    });
    
    // Anomaly detection
    const anomalies = [];
    
    // Check for zero marks
    const zeroMarks = marks.filter(m => m.marksObtained === 0);
    if (zeroMarks.length > 0) {
      anomalies.push({
        type: 'zero_marks',
        severity: 'warning',
        message: `${zeroMarks.length} student(s) have zero marks`,
        students: zeroMarks.map(m => ({
          id: m.student?.id,
          name: m.student ? `${m.student.firstName} ${m.student.lastName}` : 'Unknown',
          enrollmentNumber: m.student?.enrollmentNumber
        }))
      });
    }
    
    // Check for perfect scores (might need verification)
    const perfectScores = marks.filter(m => m.marksObtained === maxMarks);
    if (perfectScores.length > 0) {
      anomalies.push({
        type: 'perfect_score',
        severity: 'info',
        message: `${perfectScores.length} student(s) have perfect scores`,
        students: perfectScores.map(m => ({
          id: m.student?.id,
          name: m.student ? `${m.student.firstName} ${m.student.lastName}` : 'Unknown',
          enrollmentNumber: m.student?.enrollmentNumber
        }))
      });
    }
    
    // Check for unusually high failure rate
    if (parseFloat(passRate) < 50) {
      anomalies.push({
        type: 'high_failure_rate',
        severity: 'critical',
        message: `High failure rate: ${100 - parseFloat(passRate)}% of students failed`,
        recommendation: 'Consider reviewing the assessment difficulty or providing additional support'
      });
    }
    
    // Check for outliers (marks significantly below class average)
    const stdDev = Math.sqrt(
      marksObtained.reduce((acc, m) => acc + Math.pow(m - parseFloat(classAverage), 2), 0) / totalStudents
    );
    
    const outlierThreshold = parseFloat(classAverage) - (2 * stdDev);
    const outliers = marks.filter(m => m.marksObtained < outlierThreshold && m.marksObtained > 0);
    
    if (outliers.length > 0) {
      anomalies.push({
        type: 'outliers',
        severity: 'warning',
        message: `${outliers.length} student(s) have marks significantly below class average`,
        students: outliers.map(m => ({
          id: m.student?.id,
          name: m.student ? `${m.student.firstName} ${m.student.lastName}` : 'Unknown',
          marks: m.marksObtained,
          enrollmentNumber: m.student?.enrollmentNumber
        }))
      });
    }

    return {
      marksheet: {
        id: marksheet.id,
        status: marksheet.status,
        subject: marksheet.subject,
        submittedAt: marksheet.submittedAt,
        submittedBy: marksheet.submittedBy
      },
      statistics: {
        totalStudents,
        classAverage: parseFloat(classAverage),
        highest: {
          marks: highestMark,
          student: highestStudent?.student ? {
            id: highestStudent.student.id,
            name: `${highestStudent.student.firstName} ${highestStudent.student.lastName}`,
            enrollmentNumber: highestStudent.student.enrollmentNumber
          } : null
        },
        lowest: {
          marks: lowestMark,
          student: lowestStudent?.student ? {
            id: lowestStudent.student.id,
            name: `${lowestStudent.student.firstName} ${lowestStudent.student.lastName}`,
            enrollmentNumber: lowestStudent.student.enrollmentNumber
          } : null
        },
        median,
        standardDeviation: stdDev.toFixed(2),
        passRate: parseFloat(passRate),
        maxMarks,
        gradeDistribution
      },
      anomalies,
      hasAnomalies: anomalies.length > 0,
      criticalAnomalies: anomalies.filter(a => a.severity === 'critical').length,
      summary: anomalies.length > 0 
        ? `Found ${anomalies.length} issue(s) requiring attention`
        : 'No anomalies detected'
    };
  } catch (error) {
    logger.error('Error getting marksheet statistics:', error);
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
  getStudentMarksheets,
  getMarksheetStatistics
};
