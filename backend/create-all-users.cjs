const bcrypt = require('bcryptjs');
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  { host: process.env.DB_HOST, port: process.env.DB_PORT, dialect: 'postgres', logging: false }
);

const users = [
  { email: 'varaprasad@zasyaonline.com', password: 'P@ssw0rd', firstName: 'Vara', lastName: 'Prasad', role: 'admin' },
  { email: 'principal@zasya.online', password: 'P@ssw0rd', firstName: 'Principal', lastName: 'User', role: 'admin' },
  { email: 'student@zasya.online', password: 'P@ssw0rd', firstName: 'Student', lastName: 'User', role: 'student' }
];

(async () => {
  await sequelize.authenticate();
  console.log('✅ Connected\n');
  
  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10);
    const [existing] = await sequelize.query('SELECT email FROM users WHERE email = ?', { replacements: [u.email] });
    
    if (existing.length > 0) {
      await sequelize.query('UPDATE users SET password_hash = ?, first_name = ?, last_name = ?, role = ?, mfa_enabled = false, is_active = true WHERE email = ?',
        { replacements: [hash, u.firstName, u.lastName, u.role, u.email] });
      console.log(`✅ Updated: ${u.email} (${u.role})`);
    } else {
      await sequelize.query('INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active, mfa_enabled, created_at) VALUES (gen_random_uuid(), ?, ?, ?, ?, ?, true, false, NOW())',
        { replacements: [u.email, hash, u.firstName, u.lastName, u.role] });
      console.log(`✅ Created: ${u.email} (${u.role})`);
    }
  }
  
  console.log('\n📝 All users have password: P@ssw0rd');
  await sequelize.close();
  process.exit(0);
})().catch(err => { console.error('❌', err.message); process.exit(1); });
