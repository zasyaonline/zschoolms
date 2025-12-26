import GradingScheme from '../models/GradingScheme.js';
import { Op } from 'sequelize';

/**
 * Get all grading schemes
 * GET /api/grading-schemes
 */
export const getGradingSchemes = async (req, res) => {
  try {
    const schemes = await GradingScheme.findAll({
      order: [['minValue', 'DESC']],
    });

    // Transform to match frontend expectations
    const transformedSchemes = schemes.map(scheme => ({
      id: scheme.id,
      name: scheme.gradeName,
      grade: scheme.gradeName.replace('Grade ', ''),
      minValue: scheme.minValue,
      maxValue: scheme.maxValue,
      minPercentage: scheme.minValue,
      maxPercentage: scheme.maxValue,
      passingMarks: scheme.passingMarks,
      createdBy: scheme.createdBy,
      modifiedBy: scheme.modifiedBy,
    }));

    res.json({
      success: true,
      data: {
        schemes: transformedSchemes,
        total: transformedSchemes.length,
      },
    });
  } catch (error) {
    console.error('Error fetching grading schemes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch grading schemes',
      error: error.message,
    });
  }
};

/**
 * Get grading scheme by ID
 * GET /api/grading-schemes/:id
 */
export const getGradingSchemeById = async (req, res) => {
  try {
    const { id } = req.params;

    const scheme = await GradingScheme.findByPk(id);

    if (!scheme) {
      return res.status(404).json({
        success: false,
        message: 'Grading scheme not found',
      });
    }

    res.json({
      success: true,
      data: {
        id: scheme.id,
        name: scheme.gradeName,
        grade: scheme.gradeName.replace('Grade ', ''),
        minValue: scheme.minValue,
        maxValue: scheme.maxValue,
        passingMarks: scheme.passingMarks,
      },
    });
  } catch (error) {
    console.error('Error fetching grading scheme:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch grading scheme',
      error: error.message,
    });
  }
};

/**
 * Create new grading scheme
 * POST /api/grading-schemes
 */
export const createGradingScheme = async (req, res) => {
  try {
    const { name, grade, minValue, maxValue, minPercentage, maxPercentage, passingMarks } = req.body;

    // Support both minValue/maxValue and minPercentage/maxPercentage
    const min = minValue !== undefined ? minValue : minPercentage;
    const max = maxValue !== undefined ? maxValue : maxPercentage;
    const gradeName = name || `Grade ${grade}`;

    // Validate required fields
    if (!gradeName || min === undefined || max === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name/grade, minValue, and maxValue are required',
      });
    }

    // Check for overlapping ranges
    const overlapping = await GradingScheme.findOne({
      where: {
        [Op.or]: [
          {
            minValue: { [Op.lte]: max },
            maxValue: { [Op.gte]: min },
          },
        ],
      },
    });

    if (overlapping) {
      return res.status(400).json({
        success: false,
        message: 'Value range overlaps with existing grading scheme',
      });
    }

    const scheme = await GradingScheme.create({
      gradeName,
      minValue: parseInt(min),
      maxValue: parseInt(max),
      passingMarks: passingMarks || 40,
      createdBy: req.user?.username || 'system',
      modifiedBy: req.user?.username || 'system',
    });

    res.status(201).json({
      success: true,
      message: 'Grading scheme created successfully',
      data: {
        id: scheme.id,
        name: scheme.gradeName,
        grade: scheme.gradeName.replace('Grade ', ''),
        minValue: scheme.minValue,
        maxValue: scheme.maxValue,
        passingMarks: scheme.passingMarks,
      },
    });
  } catch (error) {
    console.error('Error creating grading scheme:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create grading scheme',
      error: error.message,
    });
  }
};

/**
 * Update grading scheme
 * PUT /api/grading-schemes/:id
 */
export const updateGradingScheme = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, grade, minValue, maxValue, minPercentage, maxPercentage, passingMarks } = req.body;

    const scheme = await GradingScheme.findByPk(id);

    if (!scheme) {
      return res.status(404).json({
        success: false,
        message: 'Grading scheme not found',
      });
    }

    const min = minValue !== undefined ? minValue : minPercentage;
    const max = maxValue !== undefined ? maxValue : maxPercentage;
    const gradeName = name || (grade ? `Grade ${grade}` : scheme.gradeName);

    // Check for overlapping ranges (excluding current scheme)
    if (min !== undefined && max !== undefined) {
      const overlapping = await GradingScheme.findOne({
        where: {
          id: { [Op.ne]: id },
          [Op.or]: [
            {
              minValue: { [Op.lte]: max },
              maxValue: { [Op.gte]: min },
            },
          ],
        },
      });

      if (overlapping) {
        return res.status(400).json({
          success: false,
          message: 'Value range overlaps with existing grading scheme',
        });
      }
    }

    await scheme.update({
      gradeName,
      minValue: min !== undefined ? parseInt(min) : scheme.minValue,
      maxValue: max !== undefined ? parseInt(max) : scheme.maxValue,
      passingMarks: passingMarks !== undefined ? passingMarks : scheme.passingMarks,
      modifiedBy: req.user?.username || 'system',
    });

    res.json({
      success: true,
      message: 'Grading scheme updated successfully',
      data: {
        id: scheme.id,
        name: scheme.gradeName,
        grade: scheme.gradeName.replace('Grade ', ''),
        minValue: scheme.minValue,
        maxValue: scheme.maxValue,
        passingMarks: scheme.passingMarks,
      },
    });
  } catch (error) {
    console.error('Error updating grading scheme:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update grading scheme',
      error: error.message,
    });
  }
};

/**
 * Delete grading scheme
 * DELETE /api/grading-schemes/:id
 */
export const deleteGradingScheme = async (req, res) => {
  try {
    const { id } = req.params;

    const scheme = await GradingScheme.findByPk(id);

    if (!scheme) {
      return res.status(404).json({
        success: false,
        message: 'Grading scheme not found',
      });
    }

    // Hard delete since there's no isActive column
    await scheme.destroy();

    res.json({
      success: true,
      message: 'Grading scheme deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting grading scheme:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete grading scheme',
      error: error.message,
    });
  }
};

/**
 * Get grade for value/percentage
 * GET /api/grading-schemes/calculate/:percentage
 */
export const getGradeForPercentage = async (req, res) => {
  try {
    const { percentage } = req.params;

    const pct = parseFloat(percentage);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      return res.status(400).json({
        success: false,
        message: 'Percentage must be a number between 0 and 100',
      });
    }

    const scheme = await GradingScheme.findOne({
      where: {
        minValue: { [Op.lte]: pct },
        maxValue: { [Op.gte]: pct },
      },
      order: [['minValue', 'DESC']],
    });

    if (!scheme) {
      return res.status(404).json({
        success: false,
        message: 'No matching grade found for this percentage',
      });
    }

    res.json({
      success: true,
      data: {
        percentage: pct,
        grade: scheme.gradeName.replace('Grade ', ''),
        name: scheme.gradeName,
        passed: pct >= (scheme.passingMarks || 40),
      },
    });
  } catch (error) {
    console.error('Error calculating grade:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate grade',
      error: error.message,
    });
  }
};

/**
 * Seed default grading schemes
 * POST /api/grading-schemes/seed
 */
export const seedGradingSchemes = async (req, res) => {
  try {
    // Check if schemes already exist
    const existing = await GradingScheme.count();

    if (existing > 0) {
      return res.status(400).json({
        success: false,
        message: 'Grading schemes already exist',
      });
    }

    const defaultSchemes = [
      { gradeName: 'Grade A+', minValue: 90, maxValue: 100, passingMarks: 40 },
      { gradeName: 'Grade A', minValue: 80, maxValue: 89, passingMarks: 40 },
      { gradeName: 'Grade B+', minValue: 75, maxValue: 79, passingMarks: 40 },
      { gradeName: 'Grade B', minValue: 70, maxValue: 74, passingMarks: 40 },
      { gradeName: 'Grade C+', minValue: 65, maxValue: 69, passingMarks: 40 },
      { gradeName: 'Grade C', minValue: 60, maxValue: 64, passingMarks: 40 },
      { gradeName: 'Grade D+', minValue: 55, maxValue: 59, passingMarks: 40 },
      { gradeName: 'Grade D', minValue: 50, maxValue: 54, passingMarks: 40 },
      { gradeName: 'Grade E', minValue: 40, maxValue: 49, passingMarks: 40 },
      { gradeName: 'Grade F', minValue: 0, maxValue: 39, passingMarks: 40 },
    ];

    const schemes = await GradingScheme.bulkCreate(
      defaultSchemes.map(s => ({ ...s, createdBy: 'system', modifiedBy: 'system' }))
    );

    res.status(201).json({
      success: true,
      message: 'Default grading schemes created successfully',
      data: { schemes, total: schemes.length },
    });
  } catch (error) {
    console.error('Error seeding grading schemes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to seed grading schemes',
      error: error.message,
    });
  }
};
