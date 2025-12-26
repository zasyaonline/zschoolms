import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * GradingScheme Model
 * Defines grading criteria for evaluating student performance
 * Matches existing database schema
 */
class GradingScheme extends Model {
  /**
   * Get grade for a given percentage/value
   * @param {number} value - The value to evaluate
   * @returns {object} Matching grade scheme or null
   */
  static async getGradeForValue(value) {
    const schemes = await this.findAll({
      order: [['minValue', 'DESC']]
    });

    for (const scheme of schemes) {
      if (value >= scheme.minValue && value <= scheme.maxValue) {
        return scheme;
      }
    }
    return null;
  }

  /**
   * Get all grading schemes
   * @returns {Array} Array of grading schemes
   */
  static async getAllSchemes() {
    return this.findAll({
      order: [['minValue', 'DESC']]
    });
  }
}

GradingScheme.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    gradeName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'grade_name',
      comment: 'Grade name (e.g., Grade A+, Grade A)',
    },
    minValue: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'min_value',
      comment: 'Minimum value for this grade',
    },
    maxValue: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'max_value',
      comment: 'Maximum value for this grade',
    },
    passingMarks: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'passing_marks',
      comment: 'Minimum marks to pass',
    },
    createdBy: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: 'system',
      field: 'created_by',
    },
    modifiedBy: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: 'system',
      field: 'modified_by',
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    modifiedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'modified_at',
    },
  },
  {
    sequelize,
    modelName: 'GradingScheme',
    tableName: 'grading_schemes',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        fields: ['grade_name'],
      },
    ],
  }
);

export default GradingScheme;
