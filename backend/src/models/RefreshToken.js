import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * RefreshToken Model
 * Stores refresh tokens for JWT authentication
 * Related to User model (one-to-many)
 */
class RefreshToken extends Model {}

RefreshToken.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    token: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    is_revoked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    ip_address: {
      type: DataTypes.STRING(45), // IPv6 support
      allowNull: true,
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'RefreshToken',
    tableName: 'refresh_tokens',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['token'],
      },
      {
        fields: ['user_id'],
      },
      {
        fields: ['expires_at'],
      },
      {
        fields: ['is_revoked'],
      },
    ],
  }
);

/**
 * Check if token is expired
 * @returns {boolean}
 */
RefreshToken.prototype.isExpired = function () {
  return new Date() > this.expires_at;
};

/**
 * Check if token is valid (not expired and not revoked)
 * @returns {boolean}
 */
RefreshToken.prototype.isValid = function () {
  return !this.is_revoked && !this.isExpired();
};

/**
 * Revoke token
 * @returns {Promise<RefreshToken>}
 */
RefreshToken.prototype.revoke = async function () {
  this.is_revoked = true;
  return await this.save();
};

/**
 * Static method to clean up expired tokens
 * @returns {Promise<number>} Number of deleted tokens
 */
RefreshToken.cleanupExpired = async function () {
  const result = await RefreshToken.destroy({
    where: {
      expires_at: {
        [sequelize.Sequelize.Op.lt]: new Date(),
      },
    },
  });
  return result;
};

/**
 * Static method to revoke all user tokens
 * @param {string} userId - User UUID
 * @returns {Promise<number>} Number of revoked tokens
 */
RefreshToken.revokeAllUserTokens = async function (userId) {
  const [affectedRows] = await RefreshToken.update(
    { is_revoked: true },
    {
      where: {
        user_id: userId,
        is_revoked: false,
      },
    }
  );
  return affectedRows;
};

/**
 * Static method to get active tokens for user
 * @param {string} userId - User UUID
 * @returns {Promise<Array>}
 */
RefreshToken.getActiveTokens = async function (userId) {
  return await RefreshToken.findAll({
    where: {
      user_id: userId,
      is_revoked: false,
      expires_at: {
        [sequelize.Sequelize.Op.gt]: new Date(),
      },
    },
    order: [['created_at', 'DESC']],
  });
};

export default RefreshToken;
