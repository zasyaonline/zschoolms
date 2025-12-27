import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ClassSubject = sequelize.define('ClassSubject', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  class_section_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'class_sections',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  subject_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'subjects',
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
  academic_year_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'academic_years',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  teacher_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'teachers',
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
  tableName: 'class_subjects',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'modified_at'
});

/**
 * Get all class subjects for a teacher
 * @param {string} teacherId - Teacher's ID
 * @param {string|null} academicYearId - Optional academic year filter
 * @returns {Promise<Array>}
 */
ClassSubject.getByTeacher = async function(teacherId, academicYearId = null) {
  const { ClassSection, Class, Subject, AcademicYear } = sequelize.models;
  
  const where = { teacher_id: teacherId };
  if (academicYearId) {
    where.academic_year_id = academicYearId;
  }

  return this.findAll({
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
    ],
    order: [
      [{ model: Subject, as: 'subject' }, 'name', 'ASC']
    ]
  });
};

/**
 * Get all subjects for a class section
 * @param {string} classSectionId - Class section ID
 * @param {string|null} academicYearId - Optional academic year filter
 * @returns {Promise<Array>}
 */
ClassSubject.getByClassSection = async function(classSectionId, academicYearId = null) {
  const { Subject, Teacher, User } = sequelize.models;
  
  const where = { class_section_id: classSectionId };
  if (academicYearId) {
    where.academic_year_id = academicYearId;
  }

  return this.findAll({
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
 * Check if a teacher is assigned to teach a subject in a class
 * @param {string} teacherId - Teacher ID
 * @param {string} classSectionId - Class section ID
 * @param {string} subjectId - Subject ID
 * @param {string|null} academicYearId - Optional academic year filter
 * @returns {Promise<boolean>}
 */
ClassSubject.isTeacherAssigned = async function(teacherId, classSectionId, subjectId, academicYearId = null) {
  const where = {
    teacher_id: teacherId,
    class_section_id: classSectionId,
    subject_id: subjectId
  };
  if (academicYearId) {
    where.academic_year_id = academicYearId;
  }

  const count = await this.count({ where });
  return count > 0;
};

/**
 * Get unique class sections a teacher is assigned to
 * @param {string} teacherId - Teacher ID
 * @param {string|null} academicYearId - Optional academic year filter
 * @returns {Promise<Array>}
 */
ClassSubject.getTeacherClassSections = async function(teacherId, academicYearId = null) {
  const { ClassSection, Class } = sequelize.models;
  
  const where = { teacher_id: teacherId };
  if (academicYearId) {
    where.academic_year_id = academicYearId;
  }

  const classSubjects = await this.findAll({
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
      }
    ]
  });

  // Extract unique class sections
  const sectionsMap = new Map();
  for (const cs of classSubjects) {
    if (cs.classSection && !sectionsMap.has(cs.classSection.id)) {
      sectionsMap.set(cs.classSection.id, cs.classSection);
    }
  }

  return Array.from(sectionsMap.values());
};

/**
 * Get subjects a teacher teaches in a specific class section
 * @param {string} teacherId - Teacher ID
 * @param {string} classSectionId - Class section ID
 * @param {string|null} academicYearId - Optional academic year filter
 * @returns {Promise<Array>}
 */
ClassSubject.getTeacherSubjectsInSection = async function(teacherId, classSectionId, academicYearId = null) {
  const { Subject } = sequelize.models;
  
  const where = {
    teacher_id: teacherId,
    class_section_id: classSectionId
  };
  if (academicYearId) {
    where.academic_year_id = academicYearId;
  }

  return this.findAll({
    where,
    include: [
      {
        model: Subject,
        as: 'subject'
      }
    ]
  });
};

export default ClassSubject;
