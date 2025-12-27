import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * AcademicYear Model
 * Defines academic year periods - matches existing academic_years table
 */
const AcademicYear = sequelize.define('AcademicYear', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  year: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Academic year label, e.g., "2024-2025"',
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'start_date',
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'end_date',
  },
  isCurrent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_current',
    comment: 'Only one academic year should be current at a time',
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
  tableName: 'academic_years',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'modified_at',
});

export default AcademicYear;
