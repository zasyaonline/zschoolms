import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * Mark Model
 * Represents individual subject marks within a marksheet
 * Features auto-calculation of grade and percentage via database trigger
 */
const Mark = sequelize.define('Mark', {
  id: {
    type: DataTypes.UUID,
    defaultValue: sequelize.literal('gen_random_uuid()'),
    primaryKey: true
  },
  marksheetId: {
    type: DataTypes.UUID,
    field: 'marksheet_id',
    allowNull: false,
    validate: {
      notNull: { msg: 'Marksheet ID is required' }
    }
  },
  subjectId: {
    type: DataTypes.UUID,
    field: 'subject_id',
    allowNull: false,
    validate: {
      notNull: { msg: 'Subject ID is required' }
    }
  },
  marksObtained: {
    type: DataTypes.DECIMAL(5, 2),
    field: 'marks_obtained',
    allowNull: false,
    validate: {
      notNull: { msg: 'Marks obtained is required' },
      isDecimal: { msg: 'Marks must be a valid number' },
      min: {
        args: [0],
        msg: 'Marks cannot be negative'
      }
    }
  },
  maxMarks: {
    type: DataTypes.INTEGER,
    field: 'max_marks',
    allowNull: false,
    validate: {
      notNull: { msg: 'Max marks is required' },
      isInt: { msg: 'Max marks must be an integer' },
      min: {
        args: [1],
        msg: 'Max marks must be greater than 0'
      }
    }
  },
  grade: {
    type: DataTypes.STRING(5),
    allowNull: true,
    comment: 'Auto-calculated by database trigger based on percentage'
  },
  percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Auto-calculated by database trigger: (marks_obtained / max_marks) * 100'
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at',
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    field: 'updated_at',
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'marks',
  timestamps: false, // We manage timestamps manually
  underscored: true,
  indexes: [
    {
      fields: ['marksheet_id']
    },
    {
      fields: ['subject_id']
    },
    {
      fields: ['grade']
    },
    {
      name: 'idx_marks_marksheet_subject',
      fields: ['marksheet_id', 'subject_id']
    },
    {
      name: 'marks_unique_marksheet_subject',
      unique: true,
      fields: ['marksheet_id', 'subject_id']
    }
  ],
  validate: {
    marksNotExceedMax() {
      if (this.marksObtained > this.maxMarks) {
        throw new Error('Marks obtained cannot exceed max marks');
      }
    }
  }
});

/**
 * Instance Methods
 */

/**
 * Check if student passed this subject
 * @param {number} passingPercentage - Passing percentage threshold (default: 40)
 * @returns {boolean}
 */
Mark.prototype.isPassed = function(passingPercentage = 40) {
  return this.percentage && parseFloat(this.percentage) >= passingPercentage;
};

/**
 * Check if student failed this subject
 * @param {number} passingPercentage - Passing percentage threshold (default: 40)
 * @returns {boolean}
 */
Mark.prototype.isFailed = function(passingPercentage = 40) {
  return !this.isPassed(passingPercentage);
};

/**
 * Get grade classification
 * @returns {string} Grade classification (e.g., 'Excellent', 'Good', 'Fail')
 */
Mark.prototype.getClassification = function() {
  const percentage = parseFloat(this.percentage);
  
  if (percentage >= 90) return 'Exceptional';
  if (percentage >= 80) return 'Excellent';
  if (percentage >= 70) return 'Very Good';
  if (percentage >= 60) return 'Good';
  if (percentage >= 50) return 'Satisfactory';
  if (percentage >= 40) return 'Pass';
  return 'Fail';
};

/**
 * Update marks (will trigger auto-calculation of grade and percentage)
 * @param {number} newMarks - New marks obtained
 * @param {number} newMaxMarks - New max marks (optional)
 * @returns {Promise<Mark>}
 */
Mark.prototype.updateMarks = async function(newMarks, newMaxMarks = null) {
  this.marksObtained = newMarks;
  
  if (newMaxMarks !== null) {
    this.maxMarks = newMaxMarks;
  }
  
  // Validate before saving (grade and percentage will be auto-calculated by trigger)
  if (this.marksObtained > this.maxMarks) {
    throw new Error('Marks obtained cannot exceed max marks');
  }
  
  return await this.save();
};

/**
 * Get formatted mark string
 * @returns {string} Formatted string like "85/100 (85.00%)"
 */
Mark.prototype.getFormattedMarks = function() {
  return `${this.marksObtained}/${this.maxMarks} (${this.percentage}%)`;
};

/**
 * Class Methods
 */

/**
 * Get marks for a specific marksheet
 * @param {string} marksheetId - Marksheet UUID
 * @returns {Promise<Array>} Array of marks with subject details
 */
Mark.getByMarksheet = async function(marksheetId) {
  const Subject = sequelize.models.Subject;
  
  return await this.findAll({
    where: { marksheetId },
    include: [{
      model: Subject,
      as: 'subject',
      attributes: ['id', 'name']
    }],
    order: [['createdAt', 'ASC']]
  });
};

/**
 * Get marks for a specific subject
 * @param {string} subjectId - Subject UUID
 * @param {Object} filters - Additional filters (e.g., academicYearId, term)
 * @returns {Promise<Array>} Array of marks
 */
Mark.getBySubject = async function(subjectId, filters = {}) {
  const Marksheet = sequelize.models.Marksheet;
  
  const where = { subjectId };
  const marksheetWhere = {};
  
  if (filters.academicYearId) {
    marksheetWhere.academicYearId = filters.academicYearId;
  }
  
  if (filters.term) {
    marksheetWhere.term = filters.term;
  }
  
  return await this.findAll({
    where,
    include: [{
      model: Marksheet,
      as: 'marksheet',
      where: marksheetWhere,
      required: true
    }],
    order: [['percentage', 'DESC']]
  });
};

/**
 * Get top performers for a subject
 * @param {string} subjectId - Subject UUID
 * @param {number} limit - Number of top performers to return
 * @param {Object} filters - Additional filters
 * @returns {Promise<Array>} Array of top performing marks
 */
Mark.getTopPerformers = async function(subjectId, limit = 10, filters = {}) {
  const marks = await this.getBySubject(subjectId, filters);
  return marks.slice(0, limit);
};

/**
 * Calculate subject statistics
 * @param {string} subjectId - Subject UUID
 * @param {Object} filters - Additional filters
 * @returns {Promise<Object>} Statistics object
 */
Mark.calculateStatistics = async function(subjectId, filters = {}) {
  const marks = await this.getBySubject(subjectId, filters);
  
  if (marks.length === 0) {
    return {
      totalStudents: 0,
      averageMarks: 0,
      averagePercentage: 0,
      highestMarks: 0,
      lowestMarks: 0,
      passedCount: 0,
      failedCount: 0,
      passRate: 0
    };
  }
  
  const marksArray = marks.map(m => parseFloat(m.marksObtained));
  const percentages = marks.map(m => parseFloat(m.percentage));
  const passingPercentage = 40;
  
  const passed = marks.filter(m => parseFloat(m.percentage) >= passingPercentage).length;
  const failed = marks.length - passed;
  
  return {
    totalStudents: marks.length,
    averageMarks: (marksArray.reduce((a, b) => a + b, 0) / marks.length).toFixed(2),
    averagePercentage: (percentages.reduce((a, b) => a + b, 0) / marks.length).toFixed(2),
    highestMarks: Math.max(...marksArray).toFixed(2),
    lowestMarks: Math.min(...marksArray).toFixed(2),
    passedCount: passed,
    failedCount: failed,
    passRate: ((passed / marks.length) * 100).toFixed(2)
  };
};

/**
 * Bulk create or update marks for a marksheet
 * @param {string} marksheetId - Marksheet UUID
 * @param {Array} marksData - Array of {subjectId, marksObtained, maxMarks, remarks}
 * @returns {Promise<Object>} Result object with created/updated counts
 */
Mark.bulkUpsert = async function(marksheetId, marksData) {
  const results = {
    created: [],
    updated: [],
    failed: []
  };
  
  for (const data of marksData) {
    try {
      const [mark, created] = await this.findOrCreate({
        where: {
          marksheetId,
          subjectId: data.subjectId
        },
        defaults: {
          marksheetId,
          subjectId: data.subjectId,
          marksObtained: data.marksObtained,
          maxMarks: data.maxMarks,
          remarks: data.remarks || null
        }
      });
      
      if (!created) {
        // Update existing mark
        await mark.update({
          marksObtained: data.marksObtained,
          maxMarks: data.maxMarks,
          remarks: data.remarks || mark.remarks
        });
        results.updated.push(mark);
      } else {
        results.created.push(mark);
      }
    } catch (error) {
      results.failed.push({
        subjectId: data.subjectId,
        error: error.message
      });
    }
  }
  
  return results;
};

export default Mark;
