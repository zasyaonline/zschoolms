import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * AcademicYearEnrollment Model
 * Maps students to academic years with grade/section info
 * Matches existing academic_year_enrollments table
 */
const AcademicYearEnrollment = sequelize.define('AcademicYearEnrollment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  studentId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'student_id',
    references: {
      model: 'students',
      key: 'id',
    },
  },
  academicYearId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'academic_year_id',
    references: {
      model: 'academic_years',
      key: 'id',
    },
  },
  schoolId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'school_id',
    references: {
      model: 'schools',
      key: 'id',
    },
  },
  grade: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Grade/Class level, e.g., "10", "12"',
  },
  section: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: 'Section within grade, e.g., "A", "B"',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'created_by',
  },
  modifiedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'modified_by',
  },
}, {
  tableName: 'academic_year_enrollments',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'modified_at',
  indexes: [
    { fields: ['student_id'] },
    { fields: ['academic_year_id'] },
    { fields: ['school_id'] },
    { unique: true, fields: ['student_id', 'academic_year_id'] },
  ],
});

export default AcademicYearEnrollment;
