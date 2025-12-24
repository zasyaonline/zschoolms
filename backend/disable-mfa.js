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
    dialect: 'postgres',
    logging: false,
  }
);

async function disableMFA() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    const email = 'varaprasad@zasyaonline.com';

    // Disable MFA for user
    await sequelize.query(`
      UPDATE users 
      SET mfa_enabled = false,
          mfa_secret = NULL,
          mfa_code = NULL,
          mfa_expires_at = NULL
      WHERE email = :email
    `, {
      replacements: { email }
    });

    console.log('✅ MFA disabled for:', email);
    console.log('   You can now login without MFA verification');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

disableMFA();
