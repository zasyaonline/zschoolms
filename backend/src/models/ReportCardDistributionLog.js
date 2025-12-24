import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * ReportCardDistributionLog Model
 * Tracks email distribution of report cards to parents/sponsors
 */
class ReportCardDistributionLog extends Model {}

ReportCardDistributionLog.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  reportCardId: {
    type: DataTypes.UUID,
    field: 'report_card_id',
    allowNull: false,
    references: {
      model: 'report_cards',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  recipientEmail: {
    type: DataTypes.STRING(255),
    field: 'recipient_email',
    allowNull: false,
    validate: {
      isEmail: {
        msg: 'Recipient email must be a valid email address'
      }
    }
  },
  recipientType: {
    type: DataTypes.STRING(50),
    field: 'recipient_type',
    allowNull: true,
    comment: 'parent, sponsor, guardian, etc.',
    validate: {
      isIn: {
        args: [['parent', 'sponsor', 'guardian', 'student', 'other']],
        msg: 'Recipient type must be one of: parent, sponsor, guardian, student, other'
      }
    }
  },
  distributedBy: {
    type: DataTypes.UUID,
    field: 'distributed_by',
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  distributedAt: {
    type: DataTypes.DATE,
    field: 'distributed_at',
    defaultValue: DataTypes.NOW,
    allowNull: false
  },
  emailStatus: {
    type: DataTypes.STRING(50),
    field: 'email_status',
    defaultValue: 'sent',
    allowNull: true,
    comment: 'sent, delivered, opened, bounced, failed',
    validate: {
      isIn: {
        args: [['sent', 'delivered', 'opened', 'bounced', 'failed']],
        msg: 'Email status must be one of: sent, delivered, opened, bounced, failed'
      }
    }
  },
  openedAt: {
    type: DataTypes.DATE,
    field: 'opened_at',
    allowNull: true
  },
  errorMessage: {
    type: DataTypes.TEXT,
    field: 'error_message',
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Additional metadata (email provider response, tracking info, etc.)'
  }
}, {
  sequelize,
  tableName: 'report_card_distribution_log',
  timestamps: false,
  underscored: true,
  indexes: [
    {
      fields: ['report_card_id']
    },
    {
      fields: ['recipient_email']
    },
    {
      fields: ['distributed_by']
    },
    {
      fields: ['email_status']
    },
    {
      fields: ['distributed_at']
    }
  ]
});

export default ReportCardDistributionLog;
