import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * School Model
 * Represents a school/educational institution in the system
 * Matches existing database schema
 */
class School extends Model {
  /**
   * Get school by ID with related data
   * @param {string} id - School UUID
   * @returns {object} School with associations
   */
  static async getById(id) {
    return this.findByPk(id);
  }

  /**
   * Get all schools
   * @returns {Array} Array of schools
   */
  static async getAllSchools() {
    return this.findAll({
      order: [['schoolName', 'ASC']]
    });
  }

  /**
   * Search schools by name
   * @param {string} query - Search query
   * @returns {Array} Matching schools
   */
  static async search(query) {
    const { Op } = require('sequelize');
    return this.findAll({
      where: {
        schoolName: { [Op.iLike]: `%${query}%` },
      },
      order: [['schoolName', 'ASC']],
    });
  }
}

School.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    schoolName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'school_name',
      comment: 'School name',
    },
    institute: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'institute',
      comment: 'Institute/organization name',
    },
    gst: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'gst',
      comment: 'GST number',
    },
    registrationNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'registration_number',
      comment: 'Registration number',
    },
    document: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'document',
      comment: 'Document URL or path',
    },
    logoUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'logo_url',
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
    modelName: 'School',
    tableName: 'schools',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        fields: ['school_name'],
      },
    ],
  }
);

export default School;
