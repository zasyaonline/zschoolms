import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * Student Model
 * Represents student information and relationships
 */
const Student = sequelize.define('Student', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id',
    },
    comment: 'Associated user account ID',
  },
  enrollmentNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: 'enrollment_number',
    comment: 'Unique enrollment/registration number',
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'date_of_birth',
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other'),
    allowNull: false,
  },
  bloodGroup: {
    type: DataTypes.STRING(10),
    allowNull: true,
    field: 'blood_group',
  },
  admissionDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'admission_date',
  },
  currentClass: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'current_class',
    comment: 'Current grade/class',
  },
  section: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: 'Class section (A, B, C, etc.)',
  },
  rollNumber: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'roll_number',
  },
  parentId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'parent_id',
    references: {
      model: 'users',
      key: 'id',
    },
    comment: 'Parent/guardian user ID',
  },
  sponsorId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'sponsor_id',
    references: {
      model: 'users',
      key: 'id',
    },
    comment: 'Sponsor user ID (if applicable)',
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Residential address',
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  state: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  pincode: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  emergencyContact: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'emergency_contact',
    comment: 'Emergency contact phone number',
  },
  emergencyContactName: {
    type: DataTypes.STRING(200),
    allowNull: true,
    field: 'emergency_contact_name',
  },
  medicalInfo: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'medical_info',
    comment: 'Medical conditions, allergies, etc.',
  },
  previousSchool: {
    type: DataTypes.STRING(200),
    allowNull: true,
    field: 'previous_school',
  },
  transferCertificate: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'transfer_certificate',
    comment: 'TC document URL',
  },
  birthCertificate: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'birth_certificate',
    comment: 'Birth certificate document URL',
  },
  photo: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Student photo URL',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Additional remarks/notes',
  },
}, {
  tableName: 'students',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['enrollment_number'],
    },
    {
      fields: ['user_id'],
    },
    {
      fields: ['parent_id'],
    },
    {
      fields: ['sponsor_id'],
    },
    {
      fields: ['current_class', 'section'],
    },
    {
      fields: ['is_active'],
    },
  ],
});

/**
 * Instance method to get full student details with relationships
 */
Student.prototype.getFullDetails = async function() {
  const User = sequelize.models.User;
  
  const [user, parent, sponsor] = await Promise.all([
    User.findByPk(this.userId, {
      attributes: ['id', 'email', 'firstName', 'lastName', 'isActive'],
    }),
    this.parentId ? User.findByPk(this.parentId, {
      attributes: ['id', 'email', 'firstName', 'lastName', 'isActive'],
    }) : null,
    this.sponsorId ? User.findByPk(this.sponsorId, {
      attributes: ['id', 'email', 'firstName', 'lastName', 'isActive'],
    }) : null,
  ]);

  return {
    ...this.toJSON(),
    user,
    parent,
    sponsor,
  };
};

/**
 * Generate enrollment number
 * Format: STU-YYYY-XXXXX
 */
Student.generateEnrollmentNumber = async function() {
  const year = new Date().getFullYear();
  const count = await Student.count({
    where: {
      enrollmentNumber: {
        [sequelize.Sequelize.Op.like]: `STU-${year}-%`,
      },
    },
  });
  
  const nextNumber = (count + 1).toString().padStart(5, '0');
  return `STU-${year}-${nextNumber}`;
};

// Define associations
Student.associate = (models) => {
  // Each student belongs to a user
  Student.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user',
  });
  
  // Each student belongs to a parent (user)
  Student.belongsTo(models.User, {
    foreignKey: 'parentId',
    as: 'parent',
  });
  
  // Each student belongs to a sponsor (user)
  Student.belongsTo(models.User, {
    foreignKey: 'sponsorId',
    as: 'sponsor',
  });
};

export default Student;
