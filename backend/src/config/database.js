import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT || 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 5,
      min: parseInt(process.env.DB_POOL_MIN) || 0,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE) || 10000,
    },
    dialectOptions: {
      connectTimeout: 60000,
    },
  }
);

/**
 * Test database connection
 */
export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL Connected Successfully');
    console.log(`📊 Database: ${process.env.DB_DATABASE}`);
    console.log(`🌐 Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    
    if (process.env.NODE_ENV === 'development') {
      // Sync all models in development (be careful in production)
      // await sequelize.sync({ alter: true });
      console.log('📋 Database models ready');
    }
  } catch (error) {
    console.error('❌ PostgreSQL Connection Error:', error.message);
    process.exit(1);
  }
};

/**
 * Close database connection
 */
export const closeDB = async () => {
  try {
    await sequelize.close();
    console.log('👋 Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database:', error.message);
  }
};

// Handle connection events
sequelize.beforeConnect(async (config) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔄 Connecting to database...');
  }
});

export default sequelize;
