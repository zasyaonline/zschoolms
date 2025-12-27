import { DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';
import sequelize from '../config/database.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
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
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'password_hash',  // Map to password_hash column in database
    validate: {
      len: {
        args: [6, 255],
        msg: 'Password must be at least 6 characters',
      },
    },
  },
  firstName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'first_name',
    validate: {
      notEmpty: {
        msg: 'First name is required',
      },
      len: {
        args: [1, 50],
        msg: 'First name must be between 1 and 50 characters',
      },
    },
  },
  lastName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'last_name',
    validate: {
      notEmpty: {
        msg: 'Last name is required',
      },
      len: {
        args: [1, 50],
        msg: 'Last name must be between 1 and 50 characters',
      },
    },
  },
  role: {
    type: DataTypes.ENUM('super_admin', 'principal', 'admin', 'teacher', 'student', 'parent', 'staff', 'sponsor'),
    allowNull: false,
    defaultValue: 'student',
    validate: {
      isIn: {
        args: [['super_admin', 'principal', 'admin', 'teacher', 'student', 'parent', 'staff', 'sponsor']],
        msg: 'Invalid role. Must be one of: super_admin, principal, admin, teacher, student, parent, staff, sponsor',
      },
    },
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_login',
  },
  mfaSecret: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'mfa_secret',
  },
  mfaEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: 'mfa_enabled',
  },
  mfaCode: {
    type: DataTypes.STRING(10),
    allowNull: true,
    field: 'mfa_code',
  },
  mfaExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'mfa_expires_at',
  },
  mfaBackupCodes: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
    defaultValue: [],
    field: 'mfa_backup_codes',
  },
  mustChangePassword: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'must_change_password',
  },
  failedLoginAttempts: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'failed_login_attempts',
  },
  lockedUntil: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
    field: 'locked_until',
  },
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,  // Database doesn't have updated_at column
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['email'],
    },
    {
      fields: ['role'],
    },
    {
      fields: ['is_active'],
    },
  ],
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
  },
});

/**
 * Instance method to compare password
 */
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password_hash || this.password);
};

/**
 * Instance method to get user without password and MFA secret
 */
User.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password;
  delete values.mfaSecret;
  delete values.mfaBackupCodes;
  return values;
};

/**
 * Instance method to check if MFA is required for user role
 * MFA is MANDATORY for super_admin and principal roles
 * For other roles, MFA is optional based on mfaEnabled flag
 */
User.prototype.requiresMFA = function() {
  // Super Admin and Principal MUST use MFA - highest security requirement
  const mandatoryMFARoles = ['super_admin', 'principal'];
  if (mandatoryMFARoles.includes(this.role)) {
    return true;
  }
  
  // For other roles, check if MFA is explicitly enabled for this user
  return this.mfaEnabled === true;
};

/**
 * Class method to get user with password for authentication
 */
User.findByCredentials = async function(emailOrUsername, password) {
  const user = await User.findOne({
    where: {
      email: emailOrUsername,
      is_active: true,
    },
  });

  if (!user) {
    return null;
  }

  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
    return null;
  }

  return user;
};

// Define associations
User.associate = (models) => {
  // A user can be a student
  User.hasOne(models.Student, {
    foreignKey: 'userId',
    as: 'studentProfile',
  });
  
  // A user can be a parent to many students
  User.hasMany(models.Student, {
    foreignKey: 'parentId',
    as: 'children',
  });
  
  // A user can be a sponsor to many students
  User.hasMany(models.Student, {
    foreignKey: 'sponsorId',
    as: 'sponsoredStudents',
  });
};

export default User;
