import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * Marksheet Model
 * Represents student marksheets (collection of marks for a term/exam)
 * Note: Works with existing complex schema with enrollment tracking
 */
const Marksheet = sequelize.define('Marksheet', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  ms1: {
    type: DataTypes.STRING(100),
    field: 'ms_1',
    allowNull: true
  },
  coursePartId: {
    type: DataTypes.UUID,
    field: 'course_part_id',
    allowNull: false
  },
  academicYearId: {
    type: DataTypes.UUID,
    field: 'academic_year_id',
    allowNull: false
  },
  academicYearEnrollmentId: {
    type: DataTypes.UUID,
    field: 'academic_year_enrollment_id',
    allowNull: false
  },
  studentSubjectEnrollmentId: {
    type: DataTypes.UUID,
    field: 'student_subject_enrollment_id',
    allowNull: false
  },
  subjectId: {
    type: DataTypes.UUID,
    field: 'subject_id',
    allowNull: false
  },
  schoolId: {
    type: DataTypes.UUID,
    field: 'school_id',
    allowNull: false
  },
  marksObtained: {
    type: DataTypes.DECIMAL(5, 2),
    field: 'marks_obtained',
    defaultValue: 0.00,
    allowNull: true,
    validate: {
      isDecimal: { msg: 'Marks must be a valid number' },
      min: {
        args: [0],
        msg: 'Marks cannot be negative'
      }
    }
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'Draft',
    allowNull: true,
    validate: {
      isIn: {
        args: [['Draft', 'submitted', 'approved', 'rejected']],
        msg: 'Status must be one of: Draft, submitted, approved, rejected'
      }
    }
  },
  isPass: {
    type: DataTypes.BOOLEAN,
    field: 'is_pass',
    defaultValue: false,
    allowNull: true
  },
  pdfUrl: {
    type: DataTypes.TEXT,
    field: 'pdf_url',
    allowNull: true
  },
  createdBy: {
    type: DataTypes.STRING(100),
    field: 'created_by',
    defaultValue: 'system'
  },
  modifiedBy: {
    type: DataTypes.STRING(100),
    field: 'modified_by',
    defaultValue: 'system'
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
  },
  // Workflow fields
  rejectionComments: {
    type: DataTypes.TEXT,
    field: 'rejection_comments',
    allowNull: true
  },
  submittedBy: {
    type: DataTypes.UUID,
    field: 'submitted_by',
    allowNull: true
  },
  submittedAt: {
    type: DataTypes.DATE,
    field: 'submitted_at',
    allowNull: true
  },
  approvedBy: {
    type: DataTypes.UUID,
    field: 'approved_by',
    allowNull: true
  },
  approvedAt: {
    type: DataTypes.DATE,
    field: 'approved_at',
    allowNull: true
  },
  maxMarks: {
    type: DataTypes.DECIMAL(5, 2),
    field: 'max_marks',
    defaultValue: 100.00
  },
  isLocked: {
    type: DataTypes.BOOLEAN,
    field: 'is_locked',
    defaultValue: false
  },
  lastAutoSave: {
    type: DataTypes.DATE,
    field: 'last_auto_save',
    allowNull: true
  }
}, {
  tableName: 'marksheets',
  timestamps: false, // We manage timestamps manually
  underscored: true,
  indexes: [
    {
      fields: ['status']
    },
    {
      fields: ['subject_id']
    },
    {
      fields: ['academic_year_id']
    },
    {
      name: 'idx_marksheets_pending',
      fields: ['status'],
      where: {
        status: 'submitted'
      }
    }
  ]
});

/**
 * Instance Methods
 */

/**
 * Check if marksheet is in draft status
 * @returns {boolean}
 */
Marksheet.prototype.isDraft = function() {
  return this.status === 'Draft';
};

/**
 * Check if marksheet is submitted
 * @returns {boolean}
 */
Marksheet.prototype.isSubmitted = function() {
  return this.status === 'submitted';
};

/**
 * Check if marksheet is approved
 * @returns {boolean}
 */
Marksheet.prototype.isApproved = function() {
  return this.status === 'approved';
};

/**
 * Check if marksheet is rejected
 * @returns {boolean}
 */
Marksheet.prototype.isRejected = function() {
  return this.status === 'rejected';
};

/**
 * Check if marksheet can be edited
 * @returns {boolean}
 */
Marksheet.prototype.canEdit = function() {
  if (this.isLocked) return false;
  return this.status === 'Draft' || this.status === 'rejected';
};

/**
 * Submit marksheet for approval
 * @param {string} submittedBy - User ID who submitted
 * @returns {Promise<Marksheet>}
 */
Marksheet.prototype.submit = async function(submittedBy) {
  if (!this.canEdit()) {
    throw new Error('Cannot submit marksheet that is not in Draft or rejected status');
  }
  
  this.status = 'submitted';
  this.submittedBy = submittedBy;
  this.submittedAt = new Date();
  this.modifiedBy = submittedBy;
  this.modifiedAt = new Date();
  this.rejectionComments = null; // Clear previous rejection comments
  
  return await this.save();
};

/**
 * Approve marksheet
 * @param {string} reviewedBy - User ID who approved
 * @returns {Promise<Marksheet>}
 */
Marksheet.prototype.approve = async function(reviewedBy) {
  if (this.status !== 'submitted') {
    throw new Error('Can only approve submitted marksheets');
  }
  
  this.status = 'approved';
  this.approvedBy = reviewedBy;
  this.approvedAt = new Date();
  this.isLocked = true; // Lock after approval
  this.modifiedBy = reviewedBy;
  this.modifiedAt = new Date();
  
  return await this.save();
};

/**
 * Reject marksheet
 * @param {string} reviewedBy - User ID who rejected
 * @param {string} comments - Rejection comments
 * @returns {Promise<Marksheet>}
 */
Marksheet.prototype.reject = async function(reviewedBy, comments) {
  if (this.status !== 'submitted') {
    throw new Error('Can only reject submitted marksheets');
  }
  
  this.status = 'rejected';
  this.rejectionComments = comments;
  this.approvedBy = reviewedBy; // Track who rejected
  this.approvedAt = new Date();
  this.modifiedBy = reviewedBy;
  this.modifiedAt = new Date();
  
  return await this.save();
};

/**
 * Get all marks for this marksheet
 * @returns {Promise<Array>}
 */
Marksheet.prototype.getMarks = async function() {
  const Mark = sequelize.models.Mark;
  
  return await Mark.findAll({
    where: { marksheetId: this.id },
    include: [{
      model: sequelize.models.Subject,
      as: 'subject'
    }],
    order: [['createdAt', 'ASC']]
  });
};

/**
 * Calculate total percentage for this marksheet
 * @returns {Promise<Object>}
 */
Marksheet.prototype.calculateTotals = async function() {
  const marks = await this.getMarks();
  
  if (marks.length === 0) {
    return {
      totalMarksObtained: 0,
      totalMaxMarks: 0,
      percentage: 0,
      totalSubjects: 0
    };
  }
  
  const totalMarksObtained = marks.reduce((sum, mark) => sum + parseFloat(mark.marksObtained), 0);
  const totalMaxMarks = marks.reduce((sum, mark) => sum + parseInt(mark.maxMarks), 0);
  const percentage = totalMaxMarks > 0 ? (totalMarksObtained / totalMaxMarks) * 100 : 0;
  
  return {
    totalMarksObtained: totalMarksObtained.toFixed(2),
    totalMaxMarks,
    percentage: percentage.toFixed(2),
    totalSubjects: marks.length
  };
};

/**
 * Class Methods
 */

/**
 * Get pending marksheets for approval
 * @param {Object} options - Query options
 * @returns {Promise<Array>}
 */
Marksheet.getPending = async function(options = {}) {
  const { page = 1, limit = 50 } = options;
  const offset = (page - 1) * limit;
  
  return await this.findAndCountAll({
    where: { status: 'submitted' },
    limit,
    offset,
    order: [['createdAt', 'DESC']],
    include: options.include || []
  });
};

/**
 * Get marksheets by student enrollment
 * @param {string} enrollmentId - Academic year enrollment ID
 * @returns {Promise<Array>}
 */
Marksheet.getByEnrollment = async function(enrollmentId) {
  return await this.findAll({
    where: { academicYearEnrollmentId: enrollmentId },
    order: [['createdAt', 'DESC']]
  });
};

/**
 * Get marksheets by academic year
 * @param {string} academicYearId - Academic year ID
 * @param {Object} filters - Additional filters
 * @returns {Promise<Array>}
 */
Marksheet.getByAcademicYear = async function(academicYearId, filters = {}) {
  const where = { academicYearId, ...filters };
  
  return await this.findAll({
    where,
    order: [['createdAt', 'DESC']]
  });
};

export default Marksheet;
