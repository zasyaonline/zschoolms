import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Class = sequelize.define('Class', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  level: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  shortform: {
    type: DataTypes.STRING(50),
    allowNull: true
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
  tableName: 'classes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'modified_at'
});

/**
 * Get class with all sections for an academic year
 * @param {string} classId - The class ID
 * @param {string|null} academicYearId - Optional academic year filter
 * @returns {Promise<Class|null>}
 */
Class.getWithSections = async function(classId, academicYearId = null) {
  const { ClassSection, Teacher, User } = sequelize.models;
  
  const include = [
    {
      model: ClassSection,
      as: 'sections',
      ...(academicYearId && {
        where: { academic_year_id: academicYearId }
      }),
      include: [
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
    }
  ];

  return this.findByPk(classId, { include });
};

/**
 * Get all classes with their sections
 * @param {string|null} academicYearId - Optional academic year filter
 * @returns {Promise<Array>}
 */
Class.getAllWithSections = async function(academicYearId = null) {
  const { ClassSection } = sequelize.models;
  
  const include = [
    {
      model: ClassSection,
      as: 'sections',
      ...(academicYearId && {
        where: { academic_year_id: academicYearId }
      })
    }
  ];

  return this.findAll({
    include,
    order: [['name', 'ASC']]
  });
};

export default Class;
