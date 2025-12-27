import { Op } from 'sequelize';
import Sponsor from '../models/Sponsor.js';
import StudentSponsorMapping from '../models/StudentSponsorMapping.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import logger from '../utils/logger.js';
import { sendSponsorWelcomeEmail, sendStudentAssignmentEmail } from './email.service.js';

/**
 * Create new sponsor with optional welcome email
 * @param {Object} sponsorData - Sponsor details
 * @param {string} createdBy - User ID who created the sponsor
 * @param {Object} options - Additional options
 * @param {boolean} options.sendWelcomeEmail - Whether to send welcome email (default: true)
 * @param {Object} options.userAccount - Associated user account (if created)
 * @param {string} options.tempPassword - Temporary password (if user account created)
 */
export const createSponsor = async (sponsorData, createdBy, options = {}) => {
  try {
    const { sendWelcomeEmail: shouldSendEmail = true, userAccount = null, tempPassword = null } = options;
    
    const sponsor = await Sponsor.create({
      ...sponsorData,
      createdBy,
    });

    // Log audit
    await AuditLog.logAction({
      userId: createdBy,
      action: 'CREATE',
      entityType: 'sponsor',
      entityId: sponsor.id,
      newValues: sponsor.toJSON(),
    });

    // Send welcome email if enabled and sponsor has email
    let emailResult = null;
    if (shouldSendEmail && sponsor.email) {
      try {
        emailResult = await sendSponsorWelcomeEmail(sponsor, userAccount, tempPassword);
        logger.info(`Welcome email sent to sponsor: ${sponsor.email}`);
      } catch (emailError) {
        logger.error(`Failed to send welcome email to sponsor ${sponsor.email}:`, emailError);
        // Don't fail sponsor creation if email fails
        emailResult = { success: false, error: emailError.message };
      }
    }

    return {
      sponsor,
      emailSent: emailResult?.success || false,
      emailResult,
    };
  } catch (error) {
    logger.error('Error creating sponsor:', error);
    throw error;
  }
};

/**
 * Get all sponsors with pagination and filters
 */
export const getSponsors = async (options = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      country,
      sponsorshipType,
      isActive,
      search,
    } = options;

    const offset = (page - 1) * limit;

    // Build where clause
    const where = {};

    if (status) {
      where.status = status;
    }

    if (country) {
      where.country = country;
    }

    if (sponsorshipType) {
      where.sponsorshipType = sponsorshipType;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Search by name or email
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { organization: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Sponsor.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    return {
      sponsors: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    };
  } catch (error) {
    logger.error('Error fetching sponsors:', error);
    throw error;
  }
};

/**
 * Get sponsor by ID with details
 */
export const getSponsorById = async (sponsorId) => {
  try {
    const sponsor = await Sponsor.findByPk(sponsorId, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    if (!sponsor) {
      throw new Error('Sponsor not found');
    }

    // Get mapped students
    const mappings = await StudentSponsorMapping.findAll({
      where: { sponsorId: sponsor.id },
      include: [
        {
          model: Student,
          as: 'student',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'firstName', 'lastName', 'email'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return {
      ...sponsor.toJSON(),
      mappedStudents: mappings,
    };
  } catch (error) {
    logger.error('Error fetching sponsor by ID:', error);
    throw error;
  }
};

/**
 * Update sponsor
 */
export const updateSponsor = async (sponsorId, updates, updatedBy) => {
  try {
    const sponsor = await Sponsor.findByPk(sponsorId);

    if (!sponsor) {
      throw new Error('Sponsor not found');
    }

    const oldValues = sponsor.toJSON();

    // Update allowed fields
    const allowedFields = [
      'name',
      'email',
      'phoneNumber',
      'country',
      'organization',
      'sponsorshipType',
      'status',
      'notes',
      'address',
      'city',
      'state',
      'postalCode',
      'isActive',
    ];

    Object.keys(updates).forEach((key) => {
      if (allowedFields.includes(key)) {
        sponsor[key] = updates[key];
      }
    });

    await sponsor.save();

    // Log audit
    await AuditLog.logAction({
      userId: updatedBy,
      action: 'UPDATE',
      entityType: 'sponsor',
      entityId: sponsor.id,
      oldValues,
      newValues: sponsor.toJSON(),
    });

    return sponsor;
  } catch (error) {
    logger.error('Error updating sponsor:', error);
    throw error;
  }
};

/**
 * Delete sponsor (soft delete)
 */
export const deleteSponsor = async (sponsorId, deletedBy) => {
  try {
    const sponsor = await Sponsor.findByPk(sponsorId);

    if (!sponsor) {
      throw new Error('Sponsor not found');
    }

    // Check if sponsor has active mappings
    const activeMappingsCount = await StudentSponsorMapping.count({
      where: {
        sponsorId: sponsor.id,
        status: 'active',
      },
    });

    if (activeMappingsCount > 0) {
      throw new Error(
        `Cannot delete sponsor with ${activeMappingsCount} active sponsorships. Terminate sponsorships first.`
      );
    }

    const oldValues = sponsor.toJSON();

    // Soft delete
    sponsor.isActive = false;
    sponsor.status = 'inactive';
    await sponsor.save();

    // Log audit
    await AuditLog.logAction({
      userId: deletedBy,
      action: 'DELETE',
      entityType: 'sponsor',
      entityId: sponsor.id,
      oldValues,
    });

    return { message: 'Sponsor deleted successfully' };
  } catch (error) {
    logger.error('Error deleting sponsor:', error);
    throw error;
  }
};

/**
 * Map sponsor to student with automatic renewal date calculation and notification
 * @param {Object} mappingData - Mapping details
 * @param {string} createdBy - User ID who created the mapping
 * @param {Object} options - Additional options
 * @param {boolean} options.sendNotificationEmail - Whether to send notification email (default: true)
 * @param {number} options.defaultDurationMonths - Default sponsorship duration in months (default: 12)
 */
export const mapSponsorToStudent = async (mappingData, createdBy, options = {}) => {
  try {
    const { sendNotificationEmail = true, defaultDurationMonths = 12 } = options;
    const { studentId, sponsorId, sponsorshipType, startDate, endDate, amount, currency, notes } = mappingData;

    // Verify student exists
    const student = await Student.findByPk(studentId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });
    if (!student) {
      throw new Error('Student not found');
    }

    // Verify sponsor exists and is active
    const sponsor = await Sponsor.findByPk(sponsorId);
    if (!sponsor) {
      throw new Error('Sponsor not found');
    }

    if (sponsor.status !== 'active') {
      throw new Error('Sponsor is not active');
    }

    // Check for existing active mapping
    const existingMapping = await StudentSponsorMapping.findOne({
      where: {
        studentId,
        sponsorId,
        status: 'active',
      },
    });

    if (existingMapping) {
      throw new Error('An active sponsorship already exists between this student and sponsor');
    }

    // Calculate start date (default to today if not provided)
    const effectiveStartDate = startDate || new Date().toISOString().split('T')[0];
    
    // Auto-calculate end date if not provided (default: 1 year from start)
    let effectiveEndDate = endDate;
    if (!effectiveEndDate) {
      const start = new Date(effectiveStartDate);
      start.setMonth(start.getMonth() + defaultDurationMonths);
      effectiveEndDate = start.toISOString().split('T')[0];
    }

    // Create mapping
    const mapping = await StudentSponsorMapping.create({
      studentId,
      sponsorId,
      sponsorshipType: sponsorshipType || 'full',
      startDate: effectiveStartDate,
      endDate: effectiveEndDate,
      amount,
      currency: currency || 'USD',
      status: 'active',
      notes,
      createdBy,
    });

    // The trigger will auto-update sponsor's total_sponsored_students count

    // Log audit
    await AuditLog.logAction({
      userId: createdBy,
      action: 'CREATE',
      entityType: 'student_sponsor_mapping',
      entityId: mapping.id,
      newValues: mapping.toJSON(),
      metadata: {
        studentId,
        sponsorId,
        autoCalculatedEndDate: !endDate,
      },
    });

    // Return mapping with related data
    const mappingWithDetails = await StudentSponsorMapping.findByPk(mapping.id, {
      include: [
        {
          model: Student,
          as: 'student',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'firstName', 'lastName', 'email'],
            },
          ],
        },
        {
          model: Sponsor,
          as: 'sponsor',
        },
      ],
    });

    // Send notification email to sponsor
    let emailResult = null;
    if (sendNotificationEmail && sponsor.email) {
      try {
        emailResult = await sendStudentAssignmentEmail(sponsor, student, mapping);
        logger.info(`Student assignment notification sent to sponsor: ${sponsor.email}`);
      } catch (emailError) {
        logger.error(`Failed to send assignment email to sponsor ${sponsor.email}:`, emailError);
        // Don't fail the mapping if email fails
        emailResult = { success: false, error: emailError.message };
      }
    }

    return {
      mapping: mappingWithDetails,
      emailSent: emailResult?.success || false,
      emailResult,
    };
  } catch (error) {
    logger.error('Error mapping sponsor to student:', error);
    throw error;
  }
};

/**
 * Get students mapped to a sponsor
 */
export const getSponsorStudents = async (sponsorId, options = {}) => {
  try {
    const { status, page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    // Verify sponsor exists
    const sponsor = await Sponsor.findByPk(sponsorId);
    if (!sponsor) {
      throw new Error('Sponsor not found');
    }

    const where = { sponsorId };

    if (status) {
      where.status = status;
    }

    const { count, rows } = await StudentSponsorMapping.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Student,
          as: 'student',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'firstName', 'lastName', 'email'],
            },
          ],
        },
      ],
    });

    return {
      sponsor,
      mappings: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    };
  } catch (error) {
    logger.error('Error fetching sponsor students:', error);
    throw error;
  }
};

/**
 * Update sponsorship mapping
 */
export const updateSponsorshipMapping = async (mappingId, updates, updatedBy) => {
  try {
    const mapping = await StudentSponsorMapping.findByPk(mappingId);

    if (!mapping) {
      throw new Error('Sponsorship mapping not found');
    }

    const oldValues = mapping.toJSON();

    // Update allowed fields
    const allowedFields = ['sponsorshipType', 'startDate', 'endDate', 'amount', 'currency', 'status', 'notes'];

    Object.keys(updates).forEach((key) => {
      if (allowedFields.includes(key)) {
        mapping[key] = updates[key];
      }
    });

    await mapping.save();

    // Log audit
    await AuditLog.logAction({
      userId: updatedBy,
      action: 'UPDATE',
      entityType: 'student_sponsor_mapping',
      entityId: mapping.id,
      oldValues,
      newValues: mapping.toJSON(),
    });

    // Return with details
    const updatedMapping = await StudentSponsorMapping.findByPk(mappingId, {
      include: [
        {
          model: Student,
          as: 'student',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'firstName', 'lastName', 'email'],
            },
          ],
        },
        {
          model: Sponsor,
          as: 'sponsor',
        },
      ],
    });

    return updatedMapping;
  } catch (error) {
    logger.error('Error updating sponsorship mapping:', error);
    throw error;
  }
};

/**
 * Terminate sponsorship
 */
export const terminateSponsorship = async (mappingId, terminatedBy, reason) => {
  try {
    const mapping = await StudentSponsorMapping.findByPk(mappingId);

    if (!mapping) {
      throw new Error('Sponsorship mapping not found');
    }

    const oldValues = mapping.toJSON();

    mapping.status = 'terminated';
    mapping.endDate = new Date();
    if (reason) {
      mapping.notes = mapping.notes
        ? `${mapping.notes}\nTermination reason: ${reason}`
        : `Termination reason: ${reason}`;
    }

    await mapping.save();

    // Log audit
    await AuditLog.logAction({
      userId: terminatedBy,
      action: 'UPDATE',
      entityType: 'student_sponsor_mapping',
      entityId: mapping.id,
      oldValues,
      newValues: mapping.toJSON(),
      metadata: {
        action: 'terminate',
        reason,
      },
    });

    return mapping;
  } catch (error) {
    logger.error('Error terminating sponsorship:', error);
    throw error;
  }
};

/**
 * Get sponsor statistics
 */
export const getSponsorStats = async () => {
  try {
    const [
      totalSponsors,
      activeSponsors,
      inactiveSponsors,
      individualSponsors,
      organizationSponsors,
      totalMappings,
      activeMappings,
    ] = await Promise.all([
      Sponsor.count(),
      Sponsor.count({ where: { status: 'active' } }),
      Sponsor.count({ where: { status: { [Op.in]: ['inactive', 'suspended'] } } }),
      Sponsor.count({ where: { sponsorshipType: 'individual' } }),
      Sponsor.count({ where: { sponsorshipType: 'organization' } }),
      StudentSponsorMapping.count(),
      StudentSponsorMapping.count({ where: { status: 'active' } }),
    ]);

    // Get sponsors by country
    const sponsorsByCountry = await Sponsor.findAll({
      attributes: [
        'country',
        [StudentSponsorMapping.sequelize.fn('COUNT', StudentSponsorMapping.sequelize.col('id')), 'count'],
      ],
      where: { country: { [Op.ne]: null } },
      group: ['country'],
      raw: true,
    });

    // Get expiring sponsorships (within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringSoon = await StudentSponsorMapping.count({
      where: {
        status: 'active',
        endDate: {
          [Op.between]: [new Date(), thirtyDaysFromNow],
        },
      },
    });

    return {
      totalSponsors,
      activeSponsors,
      inactiveSponsors,
      byType: {
        individual: individualSponsors,
        organization: organizationSponsors,
      },
      sponsorships: {
        total: totalMappings,
        active: activeMappings,
        expiringSoon,
      },
      byCountry: sponsorsByCountry,
    };
  } catch (error) {
    logger.error('Error fetching sponsor stats:', error);
    throw error;
  }
};

/**
 * Get sponsored students by user ID (for sponsor portal)
 */
export const getSponsoredStudentsByUserId = async (userId, options = {}) => {
  try {
    const { status, page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    // Find sponsor by userId
    const sponsor = await Sponsor.findOne({
      where: { userId }
    });

    if (!sponsor) {
      throw new Error('Sponsor profile not found for this user');
    }

    const where = { sponsorId: sponsor.id };
    if (status) {
      where.status = status;
    }

    const { count, rows } = await StudentSponsorMapping.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Student,
          as: 'student',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'firstName', 'lastName', 'email'],
            },
          ],
        },
      ],
    });

    return {
      sponsor: {
        id: sponsor.id,
        name: sponsor.name,
        email: sponsor.email,
      },
      students: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    };
  } catch (error) {
    logger.error('Error fetching sponsored students by user ID:', error);
    throw error;
  }
};

/**
 * Get sponsor dashboard data by user ID
 */
export const getSponsorDashboardByUserId = async (userId) => {
  try {
    // Find sponsor by userId
    const sponsor = await Sponsor.findOne({
      where: { userId }
    });

    if (!sponsor) {
      throw new Error('Sponsor profile not found for this user');
    }

    // Get all mappings with student details
    const mappings = await StudentSponsorMapping.findAll({
      where: { sponsorId: sponsor.id },
      include: [
        {
          model: Student,
          as: 'student',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'firstName', 'lastName', 'email'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    // Calculate stats
    const activeSponsorships = mappings.filter(m => m.status === 'active').length;
    const expiredSponsorships = mappings.filter(m => m.status === 'expired').length;
    const terminatedSponsorships = mappings.filter(m => m.status === 'terminated').length;

    // Get students with basic info
    const students = mappings.map(mapping => ({
      id: mapping.student?.id,
      name: mapping.student?.user 
        ? `${mapping.student.user.firstName} ${mapping.student.user.lastName}` 
        : 'Unknown',
      email: mapping.student?.user?.email,
      class: mapping.student?.currentClass,
      sponsorshipType: mapping.sponsorshipType,
      sponsorshipStatus: mapping.status,
      startDate: mapping.startDate,
      endDate: mapping.endDate,
    }));

    return {
      sponsor: {
        id: sponsor.id,
        name: sponsor.name,
        email: sponsor.email,
        organization: sponsor.organization,
        status: sponsor.status,
      },
      stats: {
        totalStudents: mappings.length,
        activeSponsorships,
        expiredSponsorships,
        terminatedSponsorships,
      },
      students,
    };
  } catch (error) {
    logger.error('Error fetching sponsor dashboard:', error);
    throw error;
  }
};

/**
 * Get students available for sponsorship (no active sponsorship or specified sponsor)
 * @param {Object} options - Filter options
 * @param {string} options.sponsorId - Optional sponsor ID to exclude students already sponsored by this sponsor
 * @param {string} options.grade - Filter by grade
 * @param {string} options.search - Search by name
 * @param {number} options.page - Page number
 * @param {number} options.limit - Items per page
 * @returns {Promise<Object>} Available students with pagination
 */
export const getAvailableStudentsForSponsorship = async (options = {}) => {
  try {
    const { sponsorId, grade, search, page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    // Get IDs of students with active sponsorships
    const activeSponshorshipsWhere = { status: 'active' };
    if (sponsorId) {
      // If sponsorId provided, only exclude students already sponsored by this specific sponsor
      activeSponshorshipsWhere.sponsorId = sponsorId;
    }

    const activeSponsorships = await StudentSponsorMapping.findAll({
      where: activeSponshorshipsWhere,
      attributes: ['studentId'],
    });
    
    const sponsoredStudentIds = activeSponsorships.map(m => m.studentId);

    // Build student where clause
    const studentWhere = {};
    
    // Exclude already sponsored students
    if (sponsoredStudentIds.length > 0) {
      studentWhere.id = { [Op.notIn]: sponsoredStudentIds };
    }
    
    // Filter by grade if provided
    if (grade) {
      studentWhere.currentGrade = grade;
    }

    // Build user include for search
    const userInclude = {
      model: User,
      as: 'user',
      attributes: ['id', 'firstName', 'lastName', 'email'],
      required: true,
    };

    if (search) {
      userInclude.where = {
        [Op.or]: [
          { firstName: { [Op.iLike]: `%${search}%` } },
          { lastName: { [Op.iLike]: `%${search}%` } },
        ],
      };
    }

    const { count, rows } = await Student.findAndCountAll({
      where: studentWhere,
      include: [userInclude],
      limit: parseInt(limit),
      offset,
      order: [[{ model: User, as: 'user' }, 'lastName', 'ASC']],
    });

    // Format response
    const students = rows.map(student => ({
      id: student.id,
      admissionNumber: student.admissionNumber,
      firstName: student.user?.firstName,
      lastName: student.user?.lastName,
      name: student.user ? `${student.user.firstName} ${student.user.lastName}` : 'Unknown',
      email: student.user?.email,
      currentGrade: student.currentGrade,
      currentSection: student.currentSection,
      gender: student.gender,
      dateOfBirth: student.dateOfBirth,
    }));

    return {
      students,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    };
  } catch (error) {
    logger.error('Error fetching available students for sponsorship:', error);
    throw error;
  }
};

/**
 * Get sponsorship summary for admin dashboard
 * @returns {Promise<Object>} Sponsorship summary statistics
 */
export const getSponsorshipSummary = async () => {
  try {
    const [
      totalSponsors,
      activeSponsors,
      totalMappings,
      activeMappings,
      expiredMappings,
      terminatedMappings,
    ] = await Promise.all([
      Sponsor.count(),
      Sponsor.count({ where: { status: 'active' } }),
      StudentSponsorMapping.count(),
      StudentSponsorMapping.count({ where: { status: 'active' } }),
      StudentSponsorMapping.count({ where: { status: 'expired' } }),
      StudentSponsorMapping.count({ where: { status: 'terminated' } }),
    ]);

    // Get expiring soon (within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringSoon = await StudentSponsorMapping.count({
      where: {
        status: 'active',
        endDate: {
          [Op.lte]: thirtyDaysFromNow,
          [Op.gt]: new Date(),
        },
      },
    });

    return {
      sponsors: {
        total: totalSponsors,
        active: activeSponsors,
        inactive: totalSponsors - activeSponsors,
      },
      sponsorships: {
        total: totalMappings,
        active: activeMappings,
        expired: expiredMappings,
        terminated: terminatedMappings,
        expiringSoon,
      },
    };
  } catch (error) {
    logger.error('Error fetching sponsorship summary:', error);
    throw error;
  }
};

export default {
  createSponsor,
  getSponsors,
  getSponsorById,
  updateSponsor,
  deleteSponsor,
  mapSponsorToStudent,
  getSponsorStudents,
  updateSponsorshipMapping,
  terminateSponsorship,
  getSponsorStats,
  getSponsoredStudentsByUserId,
  getSponsorDashboardByUserId,
  getAvailableStudentsForSponsorship,
  getSponsorshipSummary,
};
