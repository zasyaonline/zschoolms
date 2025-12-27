import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ClassSection = sequelize.define('ClassSection', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  class_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'classes',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  section: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  academic_year_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'academic_years',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  class_teacher_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'teachers',
      key: 'id'
    },
    onDelete: 'SET NULL'
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
  tableName: 'class_sections',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'modified_at',
  indexes: [
    {
      unique: true,
      fields: ['class_id', 'section', 'academic_year_id']
    }
  ]
});

/**
 * Get section with full details
 * @param {string} sectionId - The section ID
 * @returns {Promise<ClassSection|null>}
 */
ClassSection.getWithDetails = async function(sectionId) {
  const { Class, AcademicYear, Teacher, User } = sequelize.models;
  
  return this.findByPk(sectionId, {
    include: [
      {
        model: Class,
        as: 'class'
      },
      {
        model: AcademicYear,
        as: 'academicYear'
      },
      {
        model: Teacher,
        as: 'classTeacher',
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'first_name', 'last_name', 'email']
          }
        ]
      }
    ]
  });
};

/**
 * Get all subjects taught in this section
 * @param {string} sectionId - Section ID
 * @param {string|null} academicYearId - Optional academic year filter
 * @returns {Promise<Array>}
 */
ClassSection.getSubjects = async function(sectionId, academicYearId = null) {
  const { ClassSubject, Subject, Teacher, User } = sequelize.models;

  const where = { class_section_id: sectionId };
  if (academicYearId) {
    where.academic_year_id = academicYearId;
  }

  return ClassSubject.findAll({
    where,
    include: [
      {
        model: Subject,
        as: 'subject'
      },
      {
        model: Teacher,
        as: 'teacher',
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'first_name', 'last_name', 'email']
          }
        ]
      }
    ]
  });
};

/**
 * Get display name (e.g., "Class 5 - Section A")
 * @param {string} sectionId - Section ID
 * @returns {Promise<string>}
 */
ClassSection.getDisplayName = async function(sectionId) {
  const { Class } = sequelize.models;
  
  const section = await this.findByPk(sectionId, {
    include: [{ model: Class, as: 'class' }]
  });
  
  if (!section) return 'Unknown';
  return `${section.class?.name || 'Unknown'} - Section ${section.section}`;
};

export default ClassSection;
