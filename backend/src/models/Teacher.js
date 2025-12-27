import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Teacher = sequelize.define('Teacher', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  school_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'schools',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  modified_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'teachers',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'modified_at',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'school_id']
    }
  ]
});

/**
 * Get teacher by user ID
 * @param {string} userId - The user ID to search for
 * @param {string|null} schoolId - Optional school ID filter
 * @returns {Promise<Teacher|null>}
 */
Teacher.findByUserId = async function(userId, schoolId = null) {
  const where = { user_id: userId };
  if (schoolId) {
    where.school_id = schoolId;
  }
  return this.findOne({ where });
};

/**
 * Get all classes this teacher is assigned to
 * @param {string} teacherId - The teacher's ID
 * @param {string|null} academicYearId - Optional academic year filter
 * @returns {Promise<Array>}
 */
Teacher.getAssignedClasses = async function(teacherId, academicYearId = null) {
  const { ClassSubject, ClassSection, Class, Subject, AcademicYear } = sequelize.models;
  
  const where = { teacher_id: teacherId };
  if (academicYearId) {
    where.academic_year_id = academicYearId;
  }

  return ClassSubject.findAll({
    where,
    include: [
      {
        model: ClassSection,
        as: 'classSection',
        include: [
          {
            model: Class,
            as: 'class'
          }
        ]
      },
      {
        model: Subject,
        as: 'subject'
      },
      {
        model: AcademicYear,
        as: 'academicYear'
      }
    ]
  });
};

/**
 * Check if teacher is assigned to a specific class section
 * @param {string} teacherId - Teacher ID
 * @param {string} classSectionId - Class section ID
 * @param {string|null} academicYearId - Optional academic year filter
 * @returns {Promise<boolean>}
 */
Teacher.isAssignedToSection = async function(teacherId, classSectionId, academicYearId = null) {
  const { ClassSubject } = sequelize.models;
  
  const where = {
    teacher_id: teacherId,
    class_section_id: classSectionId
  };
  if (academicYearId) {
    where.academic_year_id = academicYearId;
  }

  const count = await ClassSubject.count({ where });
  return count > 0;
};

/**
 * Check if teacher is class teacher for a section
 * @param {string} teacherId - Teacher ID
 * @param {string} classSectionId - Class section ID
 * @returns {Promise<boolean>}
 */
Teacher.isClassTeacherOf = async function(teacherId, classSectionId) {
  const { ClassSection } = sequelize.models;
  
  const section = await ClassSection.findOne({
    where: {
      id: classSectionId,
      class_teacher_id: teacherId
    }
  });
  return !!section;
};

export default Teacher;
