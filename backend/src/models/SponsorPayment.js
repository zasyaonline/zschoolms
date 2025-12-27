import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * SponsorPayment Model
 * Records sponsor payments for renewals with receipt generation
 */
const SponsorPayment = sequelize.define('SponsorPayment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  sponsorshipId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'sponsorship_id',
    references: {
      model: 'student_sponsor_mapping',
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
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0,
    },
  },
  currency: {
    type: DataTypes.STRING(10),
    defaultValue: 'USD',
  },
  paymentDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'payment_date',
  },
  transactionReference: {
    type: DataTypes.STRING(100),
    field: 'transaction_reference',
  },
  paymentMethod: {
    type: DataTypes.STRING(50),
    field: 'payment_method',
    validate: {
      isIn: [['bank_transfer', 'cheque', 'cash', 'online', 'mobile_money', 'other']],
    },
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'confirmed',
    validate: {
      isIn: [['pending', 'confirmed', 'rejected', 'refunded']],
    },
  },
  receiptNumber: {
    type: DataTypes.STRING(50),
    unique: true,
    field: 'receipt_number',
  },
  receiptGeneratedAt: {
    type: DataTypes.DATE,
    field: 'receipt_generated_at',
  },
  receiptS3Key: {
    type: DataTypes.STRING(500),
    field: 'receipt_s3_key',
  },
  notes: {
    type: DataTypes.TEXT,
  },
  verifiedBy: {
    type: DataTypes.UUID,
    field: 'verified_by',
    references: {
      model: 'users',
      key: 'id',
    },
  },
  verifiedAt: {
    type: DataTypes.DATE,
    field: 'verified_at',
  },
  isRenewalPayment: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_renewal_payment',
  },
  previousEndDate: {
    type: DataTypes.DATEONLY,
    field: 'previous_end_date',
  },
  newEndDate: {
    type: DataTypes.DATEONLY,
    field: 'new_end_date',
  },
  createdBy: {
    type: DataTypes.UUID,
    field: 'created_by',
    references: {
      model: 'users',
      key: 'id',
    },
  },
}, {
  tableName: 'sponsor_payments',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['sponsorship_id'] },
    { fields: ['sponsor_id'] },
    { fields: ['payment_date'] },
    { fields: ['status'] },
    { fields: ['receipt_number'] },
  ],
});

/**
 * Generate a unique receipt number
 * Format: RCP-YYYYMMDD-XXXX
 */
SponsorPayment.generateReceiptNumber = async function() {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
  
  // Get count of receipts generated today
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);
  
  const count = await this.count({
    where: {
      createdAt: {
        [sequelize.Sequelize.Op.between]: [todayStart, todayEnd],
      },
    },
  });
  
  const sequence = String(count + 1).padStart(4, '0');
  return `RCP-${dateStr}-${sequence}`;
};

/**
 * Check if payment is for a renewal
 */
SponsorPayment.prototype.isRenewal = function() {
  return this.isRenewalPayment && this.previousEndDate && this.newEndDate;
};

/**
 * Get formatted amount with currency
 */
SponsorPayment.prototype.getFormattedAmount = function() {
  return `${this.currency} ${parseFloat(this.amount).toLocaleString()}`;
};

export default SponsorPayment;
