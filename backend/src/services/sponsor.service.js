import { Op } from 'sequelize';
import Sponsor from '../models/Sponsor.js';
import StudentSponsorMapping from '../models/StudentSponsorMapping.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import logger from '../utils/logger.js';

/**
 * Create new sponsor
 */
export const createSponsor = async (sponsorData, createdBy) => {
  try {
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

    return sponsor;
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
 * Map sponsor to student
 */
export const mapSponsorToStudent = async (mappingData, createdBy) => {
  try {
    const { studentId, sponsorId, sponsorshipType, startDate, endDate, amount, currency, notes } = mappingData;

    // Verify student exists
    const student = await Student.findByPk(studentId);
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

    // Create mapping
    const mapping = await StudentSponsorMapping.create({
      studentId,
      sponsorId,
      sponsorshipType,
      startDate,
      endDate,
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

    return mappingWithDetails;
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
};
