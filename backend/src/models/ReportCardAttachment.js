import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * ReportCardAttachment Model
 * Represents attachments associated with report cards
 */
class ReportCardAttachment extends Model {}

ReportCardAttachment.init({
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
  fileName: {
    type: DataTypes.STRING(255),
    field: 'file_name',
    allowNull: false
  },
  fileUrl: {
    type: DataTypes.TEXT,
    field: 'file_url',
    allowNull: false,
    validate: {
      isUrl: {
        msg: 'File URL must be a valid URL'
      }
    }
  },
  fileType: {
    type: DataTypes.STRING(50),
    field: 'file_type',
    allowNull: true
  },
  fileSize: {
    type: DataTypes.INTEGER,
    field: 'file_size',
    allowNull: true,
    comment: 'File size in bytes'
  },
  uploadedBy: {
    type: DataTypes.UUID,
    field: 'uploaded_by',
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  uploadedAt: {
    type: DataTypes.DATE,
    field: 'uploaded_at',
    defaultValue: DataTypes.NOW,
    allowNull: false
  }
}, {
  sequelize,
  tableName: 'report_card_attachments',
  timestamps: false,
  underscored: true,
  indexes: [
    {
      fields: ['report_card_id']
    },
    {
      fields: ['uploaded_by']
    }
  ]
});

export default ReportCardAttachment;
