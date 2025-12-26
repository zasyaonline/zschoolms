import School from '../models/School.js';
import { Op } from 'sequelize';

/**
 * Get all schools
 * GET /api/schools
 */
export const getSchools = async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    
    const where = {};
    
    if (search) {
      where[Op.or] = [
        { schoolName: { [Op.iLike]: `%${search}%` } },
        { institute: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { rows: schools, count: total } = await School.findAndCountAll({
      where,
      order: [['schoolName', 'ASC']],
      limit: parseInt(limit),
      offset,
    });

    // Transform to match frontend expectations
    const transformedSchools = schools.map(school => ({
      id: school.id,
      name: school.schoolName,
      schoolName: school.schoolName,
      institute: school.institute,
      gst: school.gst,
      registrationNumber: school.registrationNumber,
      document: school.document,
      logoUrl: school.logoUrl,
      createdAt: school.createdAt,
      modifiedAt: school.modifiedAt,
    }));

    res.json({
      success: true,
      data: {
        schools: transformedSchools,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching schools:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch schools',
      error: error.message,
    });
  }
};

/**
 * Get school by ID
 * GET /api/schools/:id
 */
export const getSchoolById = async (req, res) => {
  try {
    const { id } = req.params;

    const school = await School.findByPk(id);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found',
      });
    }

    res.json({
      success: true,
      data: {
        id: school.id,
        name: school.schoolName,
        schoolName: school.schoolName,
        institute: school.institute,
        gst: school.gst,
        registrationNumber: school.registrationNumber,
        document: school.document,
        logoUrl: school.logoUrl,
      },
    });
  } catch (error) {
    console.error('Error fetching school:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch school',
      error: error.message,
    });
  }
};

/**
 * Create new school
 * POST /api/schools
 */
export const createSchool = async (req, res) => {
  try {
    const { name, schoolName, institute, gst, registrationNumber, document, logoUrl } = req.body;

    const finalSchoolName = schoolName || name;

    // Validate required fields
    if (!finalSchoolName) {
      return res.status(400).json({
        success: false,
        message: 'School name is required',
      });
    }

    const school = await School.create({
      schoolName: finalSchoolName,
      institute,
      gst,
      registrationNumber,
      document,
      logoUrl,
    });

    res.status(201).json({
      success: true,
      message: 'School created successfully',
      data: {
        id: school.id,
        name: school.schoolName,
        schoolName: school.schoolName,
        institute: school.institute,
      },
    });
  } catch (error) {
    console.error('Error creating school:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create school',
      error: error.message,
    });
  }
};

/**
 * Update school
 * PUT /api/schools/:id
 */
export const updateSchool = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, schoolName, institute, gst, registrationNumber, document, logoUrl } = req.body;

    const school = await School.findByPk(id);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found',
      });
    }

    const finalSchoolName = schoolName || name;

    await school.update({
      schoolName: finalSchoolName || school.schoolName,
      institute: institute !== undefined ? institute : school.institute,
      gst: gst !== undefined ? gst : school.gst,
      registrationNumber: registrationNumber !== undefined ? registrationNumber : school.registrationNumber,
      document: document !== undefined ? document : school.document,
      logoUrl: logoUrl !== undefined ? logoUrl : school.logoUrl,
    });

    res.json({
      success: true,
      message: 'School updated successfully',
      data: {
        id: school.id,
        name: school.schoolName,
        schoolName: school.schoolName,
        institute: school.institute,
      },
    });
  } catch (error) {
    console.error('Error updating school:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update school',
      error: error.message,
    });
  }
};

/**
 * Delete school
 * DELETE /api/schools/:id
 */
export const deleteSchool = async (req, res) => {
  try {
    const { id } = req.params;

    const school = await School.findByPk(id);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found',
      });
    }

    // Hard delete - be careful with foreign key constraints
    await school.destroy();

    res.json({
      success: true,
      message: 'School deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting school:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete school',
      error: error.message,
    });
  }
};

/**
 * Get school statistics
 * GET /api/schools/:id/stats
 */
export const getSchoolStats = async (req, res) => {
  try {
    const { id } = req.params;

    const school = await School.findByPk(id);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found',
      });
    }

    // TODO: Add actual statistics when related models are connected
    const stats = {
      totalStudents: 0,
      totalTeachers: 0,
      totalClasses: 0,
      activeEnrollments: 0,
    };

    res.json({
      success: true,
      data: {
        school: {
          id: school.id,
          name: school.schoolName,
          schoolName: school.schoolName,
          institute: school.institute,
        },
        stats,
      },
    });
  } catch (error) {
    console.error('Error fetching school stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch school statistics',
      error: error.message,
    });
  }
};
