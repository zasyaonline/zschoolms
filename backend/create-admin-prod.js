import bcrypt from 'bcryptjs';
import pg from 'pg';
const { Client } = pg;

async function createAdmin() {
  // Production database connection
  const client = new Client({
    host: '63.250.52.24',
    port: 5432,
    database: 'zschool_db',
    user: 'zschool_admin',
    password: 'zschoolP@ss123', // Replace with actual password
  });

  try {
    await client.connect();
    console.log('✅ Connected to production database');

    const email = 'admin@zschool.com';
    const password = 'Admin@123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await client.query(`
      INSERT INTO users (
        id, email, password_hash, first_name, last_name, role, is_active, created_at
      ) VALUES (
        gen_random_uuid(), $1, $2, 'System', 'Administrator', 'admin', true, NOW()
      )
      ON CONFLICT (email) DO UPDATE SET password_hash = $2
      RETURNING id, email, role;
    `, [email, hashedPassword]);

    console.log('✅ Admin user created/updated:', result.rows[0]);
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

createAdmin();
