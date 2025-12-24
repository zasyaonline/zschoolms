import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * ReportCard Model
 * Represents student report cards with marks summary and PDF generation
 * Status Flow: Draft → Generated → Signed → Distributed
 */
class ReportCard extends Model {
  /**
   * Check if report card can be signed
   * @returns {boolean}
   */
  canSign() {
    return this.status === 'Generated' && !this.signedBy;
  }

  /**
   * Check if report card can be distributed
   * @returns {boolean}
   */
  canDistribute() {
    return this.status === 'Signed' && this.signedBy;
  }

  /**
   * Calculate final grade based on percentage
   * @param {number} percentage - Percentage score
   * @returns {string} Grade (A+, A, B+, B, C, D, F)
   */
  static calculateGrade(percentage) {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
  }

  /**
   * Sign report card (updates signedBy and status)
   * @param {string} userId - Principal/Admin user ID
   * @param {Object} transaction - Sequelize transaction
   * @returns {Promise<void>}
   */
  async sign(userId, transaction) {
    if (!this.canSign()) {
      throw new Error(`Report card cannot be signed. Current status: ${this.status}, signedBy: ${this.signedBy}`);
    }

    this.signedBy = userId;
    this.status = 'Signed';
    await this.save({ transaction });
  }

  /**
   * Mark report card as distributed
   * @param {Object} transaction - Sequelize transaction
   * @returns {Promise<void>}
   */
  async markDistributed(transaction) {
    if (!this.canDistribute()) {
      throw new Error(`Report card cannot be distributed. Current status: ${this.status}`);
    }

    this.status = 'Distributed';
    await this.save({ transaction });
  }

  /**
   * Get all report cards for a student
   * @param {string} studentId - Student UUID
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  static async getByStudent(studentId, options = {}) {
    const where = { studentId };
    
    if (options.academicYearId) {
      where.academicYearId = options.academicYearId;
    }
    
    if (options.status) {
      where.status = options.status;
    }

    return await ReportCard.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: options.limit || 50,
      offset: options.offset || 0,
      include: options.include || []
    });
  }

  /**
   * Get all report cards for an academic year
   * @param {string} academicYearId - Academic Year UUID
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  static async getByAcademicYear(academicYearId, options = {}) {
    const where = { academicYearId };
    
    if (options.status) {
      where.status = options.status;
    }
    
    if (options.schoolId) {
      where.schoolId = options.schoolId;
    }

    return await ReportCard.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: options.limit || 100,
      offset: options.offset || 0,
      include: options.include || []
    });
  }

  /**
   * Get pending report cards (Generated status, not signed)
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  static async getPending(options = {}) {
    const where = { 
      status: 'Generated',
      signedBy: null
    };
    
    if (options.schoolId) {
      where.schoolId = options.schoolId;
    }
    
    if (options.academicYearId) {
      where.academicYearId = options.academicYearId;
    }

    return await ReportCard.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: options.limit || 50,
      offset: options.offset || 0,
      include: options.include || []
    });
  }
}

ReportCard.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  studentId: {
    type: DataTypes.UUID,
    field: 'student_id',
    allowNull: false,
    references: {
      model: 'students',
      key: 'id'
    }
  },
  academicYearId: {
    type: DataTypes.UUID,
    field: 'academic_year_id',
    allowNull: false
  },
  schoolId: {
    type: DataTypes.UUID,
    field: 'school_id',
    allowNull: false,
    references: {
      model: 'schools',
      key: 'id'
    }
  },
  totalMarksObtained: {
    type: DataTypes.DECIMAL(10, 2),
    field: 'total_marks_obtained',
    defaultValue: 0.00,
    allowNull: true,
    validate: {
      isDecimal: true,
      min: 0
    }
  },
  totalMaxMarks: {
    type: DataTypes.DECIMAL(10, 2),
    field: 'total_max_marks',
    defaultValue: 0.00,
    allowNull: true,
    validate: {
      isDecimal: true,
      min: 0
    }
  },
  percentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    allowNull: true,
    validate: {
      isDecimal: true,
      min: 0,
      max: 100
    }
  },
  finalGrade: {
    type: DataTypes.STRING(10),
    field: 'final_grade',
    allowNull: true,
    validate: {
      isIn: {
        args: [['A+', 'A', 'B+', 'B', 'C', 'D', 'F']],
        msg: 'Grade must be one of: A+, A, B+, B, C, D, F'
      }
    }
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'Draft',
    allowNull: true,
    validate: {
      isIn: {
        args: [['Draft', 'Generated', 'Signed', 'Distributed']],
        msg: 'Status must be one of: Draft, Generated, Signed, Distributed'
      }
    }
  },
  signedBy: {
    type: DataTypes.UUID,
    field: 'signed_by',
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  pdfUrl: {
    type: DataTypes.TEXT,
    field: 'pdf_url',
    allowNull: true,
    validate: {
      isUrl: {
        msg: 'PDF URL must be a valid URL'
      }
    }
  },
  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at',
    defaultValue: DataTypes.NOW,
    allowNull: false
  },
  modifiedAt: {
    type: DataTypes.DATE,
    field: 'modified_at',
    defaultValue: DataTypes.NOW,
    allowNull: false
  }
}, {
  sequelize,
  tableName: 'report_cards',
  timestamps: false, // We're using custom createdAt/modifiedAt
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['student_id', 'academic_year_id']
    },
    {
      fields: ['student_id']
    },
    {
      fields: ['academic_year_id']
    },
    {
      fields: ['school_id']
    },
    {
      fields: ['status']
    }
  ]
});

export default ReportCard;
