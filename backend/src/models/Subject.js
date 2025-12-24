import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * Subject Model
 * Represents academic subjects in the school system
 */
const Subject = sequelize.define('Subject', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Subject name is required' },
      len: {
        args: [2, 255],
        msg: 'Subject name must be between 2 and 255 characters'
      }
    }
  },
  schoolId: {
    type: DataTypes.UUID,
    field: 'school_id',
    allowNull: true
  },
  createdBy: {
    type: DataTypes.UUID,
    field: 'created_by',
    allowNull: true
  },
  modifiedBy: {
    type: DataTypes.UUID,
    field: 'modified_by',
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at',
    defaultValue: DataTypes.NOW
  },
  modifiedAt: {
    type: DataTypes.DATE,
    field: 'modified_at',
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'subjects',
  timestamps: false, // We manage timestamps manually
  underscored: true,
  indexes: [
    {
      fields: ['name']
    },
    {
      fields: ['school_id']
    },
    {
      fields: ['created_by']
    }
  ]
});

/**
 * Instance Methods
 */

/**
 * Get all marksheets for this subject
 * @returns {Promise<Array>} Array of marksheets
 */
Subject.prototype.getMarksheets = async function() {
  const Mark = sequelize.models.Mark;
  const Marksheet = sequelize.models.Marksheet;
  
  const marks = await Mark.findAll({
    where: { subjectId: this.id },
    include: [{
      model: Marksheet,
      as: 'marksheet'
    }]
  });
  
  return marks.map(mark => mark.marksheet);
};

/**
 * Get all marks for this subject
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of marks
 */
Subject.prototype.getMarks = async function(options = {}) {
  const Mark = sequelize.models.Mark;
  
  return await Mark.findAll({
    where: { subjectId: this.id },
    ...options
  });
};

/**
 * Get subject statistics
 * @param {Object} filters - Optional filters (academic_year, term, etc.)
 * @returns {Promise<Object>} Statistics object
 */
Subject.prototype.getStatistics = async function(filters = {}) {
  const Mark = sequelize.models.Mark;
  const Marksheet = sequelize.models.Marksheet;
  const { Op } = require('sequelize');
  
  const where = { subjectId: this.id };
  const marksheetWhere = {};
  
  if (filters.academicYear) {
    marksheetWhere.academicYearId = filters.academicYear;
  }
  
  if (filters.term) {
    marksheetWhere.term = filters.term;
  }
  
  const marks = await Mark.findAll({
    where,
    include: [{
      model: Marksheet,
      as: 'marksheet',
      where: marksheetWhere,
      required: true
    }]
  });
  
  if (marks.length === 0) {
    return {
      totalStudents: 0,
      averageMarks: 0,
      averagePercentage: 0,
      highestMarks: 0,
      lowestMarks: 0,
      passedStudents: 0,
      failedStudents: 0,
      passRate: 0
    };
  }
  
  const marksObtained = marks.map(m => parseFloat(m.marksObtained));
  const percentages = marks.map(m => parseFloat(m.percentage));
  const passingThreshold = 40; // Default passing percentage
  
  const passed = marks.filter(m => parseFloat(m.percentage) >= passingThreshold).length;
  const failed = marks.length - passed;
  
  return {
    totalStudents: marks.length,
    averageMarks: (marksObtained.reduce((a, b) => a + b, 0) / marks.length).toFixed(2),
    averagePercentage: (percentages.reduce((a, b) => a + b, 0) / marks.length).toFixed(2),
    highestMarks: Math.max(...marksObtained).toFixed(2),
    lowestMarks: Math.min(...marksObtained).toFixed(2),
    passedStudents: passed,
    failedStudents: failed,
    passRate: ((passed / marks.length) * 100).toFixed(2)
  };
};

/**
 * Class Methods
 */

/**
 * Get all active subjects
 * @returns {Promise<Array>} Array of active subjects
 */
Subject.getActive = async function() {
  return await this.findAll({
    where: { isActive: true },
    order: [['name', 'ASC']]
  });
};

/**
 * Get subjects by school
 * @param {string} schoolId - School UUID
 * @returns {Promise<Array>} Array of subjects
 */
Subject.getBySchool = async function(schoolId) {
  return await this.findAll({
    where: { schoolId },
    order: [['name', 'ASC']]
  });
};

/**
 * Search subjects by name
 * @param {string} searchTerm - Search term
 * @returns {Promise<Array>} Array of matching subjects
 */
Subject.search = async function(searchTerm) {
  const { Op } = require('sequelize');
  
  return await this.findAll({
    where: {
      name: {
        [Op.iLike]: `%${searchTerm}%`
      }
    },
    order: [['name', 'ASC']]
  });
};

export default Subject;
