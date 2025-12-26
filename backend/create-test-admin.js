import bcrypt from 'bcryptjs';
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

async function createTestAdmin() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database:', process.env.DB_DATABASE);

    const email = 'admin@zschool.com';
    const password = 'Admin@123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const [results] = await sequelize.query(`
      INSERT INTO users (
        id, email, password_hash, first_name, last_name, role, is_active, created_at
      ) VALUES (
        gen_random_uuid(), :email, :password, 'System', 'Administrator', 'admin', true, NOW()
      )
      ON CONFLICT (email) DO UPDATE SET 
        password_hash = :password
      RETURNING id, email, first_name, last_name, role
    `, {
      replacements: { email, password: hashedPassword }
    });

    console.log('\n✅ Admin user created/updated successfully!\n');
    console.log('===========================================');
    console.log('LOGIN CREDENTIALS:');
    console.log('===========================================');
    console.log('Email:    ', email);
    console.log('Password: ', password);
    console.log('Role:     ', results[0].role);
    console.log('===========================================');
    console.log('\n📍 Login at:');
    console.log('   Local:      http://localhost:5173/login');
    console.log('   Production: https://zschoolms-app.netlify.app/login');
    console.log('===========================================\n');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTestAdmin();
