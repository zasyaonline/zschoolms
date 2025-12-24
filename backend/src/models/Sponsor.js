import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * Sponsor Model
 * Represents sponsors who provide financial support to students
 */
const Sponsor = sequelize.define('Sponsor', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Sponsor name is required',
      },
      len: {
        args: [2, 255],
        msg: 'Name must be between 2 and 255 characters',
      },
    },
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: {
      msg: 'Email already exists',
    },
    validate: {
      isEmail: {
        msg: 'Must be a valid email address',
      },
    },
  },
  phoneNumber: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'phone_number',
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  organization: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  sponsorshipType: {
    type: DataTypes.ENUM('individual', 'organization'),
    allowNull: false,
    defaultValue: 'individual',
    field: 'sponsorship_type',
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended'),
    allowNull: false,
    defaultValue: 'active',
  },
  totalSponsoredStudents: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_sponsored_students',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  state: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  postalCode: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'postal_code',
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'created_by',
    references: {
      model: 'users',
      key: 'id',
    },
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
  },
}, {
  tableName: 'sponsors',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['email'],
      unique: true,
    },
    {
      fields: ['status'],
    },
    {
      fields: ['is_active'],
    },
    {
      fields: ['country'],
    },
    {
      fields: ['sponsorship_type'],
    },
  ],
});

/**
 * Get sponsor with all mapped students
 */
Sponsor.prototype.getStudentsWithDetails = async function() {
  const StudentSponsorMapping = sequelize.models.StudentSponsorMapping;
  const Student = sequelize.models.Student;
  const User = sequelize.models.User;

  const mappings = await StudentSponsorMapping.findAll({
    where: { sponsorId: this.id },
    include: [
      {
        model: Student,
        as: 'student',
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email'],
          },
        ],
      },
    ],
  });

  return mappings;
};

/**
 * Get active sponsorships count
 */
Sponsor.prototype.getActiveCount = async function() {
  const StudentSponsorMapping = sequelize.models.StudentSponsorMapping;
  
  const count = await StudentSponsorMapping.count({
    where: {
      sponsorId: this.id,
      status: 'active',
    },
  });

  return count;
};

/**
 * Calculate total sponsorship amount
 */
Sponsor.prototype.getTotalAmount = async function() {
  const StudentSponsorMapping = sequelize.models.StudentSponsorMapping;
  
  const result = await StudentSponsorMapping.findAll({
    where: {
      sponsorId: this.id,
      status: 'active',
    },
    attributes: [
      [sequelize.fn('SUM', sequelize.col('amount')), 'total'],
    ],
    raw: true,
  });

  return parseFloat(result[0]?.total || 0);
};

export default Sponsor;
