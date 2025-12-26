import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(process.env.DB_DATABASE, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST, 
  port: process.env.DB_PORT, 
  dialect: 'postgres', 
  logging: false
});

async function checkTables() {
  await sequelize.authenticate();
  
  const [tables] = await sequelize.query(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND (table_name LIKE '%enrollment%' OR table_name LIKE '%academic%')
    ORDER BY table_name
  `);
  
  console.log('📋 Enrollment/Academic tables:\n');
  tables.forEach(t => console.log('   ', t.table_name));
  
  const [exists] = await sequelize.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'academic_year_student_enrollment'
    ) as exists
  `);
  
  console.log('\n✓ academic_year_student_enrollment exists:', exists[0].exists);
  
  if (exists[0].exists) {
    const [cols] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'academic_year_student_enrollment' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📊 Columns:\n');
    cols.forEach(c => console.log('   ', c.column_name.padEnd(30), c.data_type.padEnd(20), 'nullable:', c.is_nullable));
    
    const [count] = await sequelize.query('SELECT COUNT(*) as count FROM academic_year_student_enrollment');
    console.log('\n📈 Records:', count[0].count);
  }
  
  await sequelize.close();
  process.exit(0);
}

checkTables().catch(e => { console.error(e); process.exit(1); });
