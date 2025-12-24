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

async function createUser() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    const email = 'varaprasad@zasyaonline.com';
    const password = 'P@ssw0rd';
    const firstName = 'Vara';
    const lastName = 'Prasad';
    const role = 'teacher';

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('🔐 Password hashed');

    // Insert user
    const [results] = await sequelize.query(`
      INSERT INTO users (
        id,
        email,
        password_hash,
        first_name,
        last_name,
        role,
        is_active,
        created_at
      ) VALUES (
        gen_random_uuid(),
        :email,
        :password,
        :firstName,
        :lastName,
        :role,
        true,
        NOW()
      )
      RETURNING id, email, first_name, last_name, role
    `, {
      replacements: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role
      }
    });

    console.log('✅ User created successfully:');
    console.log('   Email:', email);
    console.log('   Password:', password);
    console.log('   Role:', role);
    console.log('   User ID:', results[0].id);

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating user:', error.message);
    process.exit(1);
  }
}

createUser();
