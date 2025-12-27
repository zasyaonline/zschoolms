import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * StudentSponsorMapping Model
 * Junction table mapping students to sponsors with sponsorship details
 */
const StudentSponsorMapping = sequelize.define('StudentSponsorMapping', {
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
  sponsorId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'sponsor_id',
    references: {
      model: 'sponsors',
      key: 'id',
    },
  },
  sponsorshipType: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'full',
    field: 'sponsorship_type',
    validate: {
      isIn: {
        args: [['full', 'partial', 'one-time']],
        msg: 'Sponsorship type must be: full, partial, or one-time',
      },
    },
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'start_date',
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'end_date',
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: {
        args: [0],
        msg: 'Amount must be positive',
      },
    },
  },
  currency: {
    type: DataTypes.STRING(10),
    defaultValue: 'USD',
  },
  status: {
    type: DataTypes.ENUM('active', 'expired', 'terminated'),
    allowNull: false,
    defaultValue: 'active',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
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
  // Renewal reminder tracking fields
  lastReminderSent: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_reminder_sent',
  },
  reminderCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'reminder_count',
  },
}, {
  tableName: 'student_sponsor_mapping',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['student_id'],
    },
    {
      fields: ['sponsor_id'],
    },
    {
      fields: ['status'],
    },
    {
      fields: ['start_date'],
    },
    {
      fields: ['end_date'],
    },
    {
      fields: ['student_id', 'sponsor_id'],
    },
  ],
});

/**
 * Check if sponsorship is currently active
 */
StudentSponsorMapping.prototype.isCurrentlyActive = function() {
  if (this.status !== 'active') {
    return false;
  }

  const now = new Date();
  const startDate = new Date(this.startDate);

  if (startDate > now) {
    return false; // Not started yet
  }

  if (this.endDate) {
    const endDate = new Date(this.endDate);
    if (endDate < now) {
      return false; // Already ended
    }
  }

  return true;
};

/**
 * Check if sponsorship is expiring soon (within days)
 */
StudentSponsorMapping.prototype.isExpiringSoon = function(days = 30) {
  if (!this.endDate || this.status !== 'active') {
    return false;
  }

  const now = new Date();
  const endDate = new Date(this.endDate);
  const daysUntilExpiry = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

  return daysUntilExpiry > 0 && daysUntilExpiry <= days;
};

/**
 * Calculate sponsorship duration in months
 */
StudentSponsorMapping.prototype.getDurationMonths = function() {
  const startDate = new Date(this.startDate);
  const endDate = this.endDate ? new Date(this.endDate) : new Date();

  const months =
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth());

  return Math.max(0, months);
};

export default StudentSponsorMapping;
