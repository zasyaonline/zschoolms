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

const users = [
  {
    email: 'varaprasad@zasyaonline.com',
    password: 'P@ssw0rd',
    firstName: 'Vara',
    lastName: 'Prasad',
    role: 'admin',
    mfaEnabled: false // Disable MFA for easier testing
  },
  {
    email: 'principal@zasya.online',
    password: 'P@ssw0rd',
    firstName: 'Principal',
    lastName: 'User',
    role: 'admin',
    mfaEnabled: false
  },
  {
    email: 'student@zasya.online',
    password: 'P@ssw0rd',
    firstName: 'Student',
    lastName: 'User',
    role: 'student',
    mfaEnabled: false
  }
];

async function createUsers() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    for (const userData of users) {
      try {
        // Check if user exists
        const [existing] = await sequelize.query(
          'SELECT email FROM users WHERE email = :email',
          { replacements: { email: userData.email } }
        );

        if (existing.length > 0) {
          // Update existing user
          const hashedPassword = await bcrypt.hash(userData.password, 10);
          await sequelize.query(`
            UPDATE users 
            SET password_hash = :password,
                first_name = :firstName,
                last_name = :lastName,
                role = :role,
                mfa_enabled = :mfaEnabled,
                is_active = true
            WHERE email = :email
          `, {
            replacements: {
              email: userData.email,
              password: hashedPassword,
              firstName: userData.firstName,
              lastName: userData.lastName,
              role: userData.role,
              mfaEnabled: userData.mfaEnabled
            }
          });
          console.log(`✅ Updated: ${userData.email}`);
        } else {
          // Create new user
          const hashedPassword = await bcrypt.hash(userData.password, 10);
          await sequelize.query(`
            INSERT INTO users (
              id, email, password_hash, first_name, last_name, role, 
              is_active, mfa_enabled, created_at
            ) VALUES (
              gen_random_uuid(), :email, :password, :firstName, :lastName, :role,
              true, :mfaEnabled, NOW()
            )
          `, {
            replacements: {
              email: userData.email,
              password: hashedPassword,
              firstName: userData.firstName,
              lastName: userData.lastName,
              role: userData.role,
              mfaEnabled: userData.mfaEnabled
            }
          });
          console.log(`✅ Created: ${userData.email}`);
        }
        console.log(`   Role: ${userData.role}`);
        console.log(`   Password: ${userData.password}`);
        console.log(`   MFA: ${userData.mfaEnabled ? 'Enabled' : 'Disabled'}\n`);
      } catch (error) {
        console.error(`❌ Error with ${userData.email}:`, error.message);
      }
    }

    console.log('\n=== Summary ===');
    console.log('All users have password: P@ssw0rd');
    console.log('\nUsers created/updated:');
    console.log('1. varaprasad@zasyaonline.com (admin, MFA disabled)');
    console.log('2. principal@zasya.online (admin, MFA disabled)');
    console.log('3. student@zasya.online (student, MFA disabled)');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createUsers();
