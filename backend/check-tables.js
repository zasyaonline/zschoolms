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
    logging: false
  }
);

async function checkTables() {
  try {
    await sequelize.authenticate();
    
    console.log('📊 Checking table structures...\n');
    
    // Check academic_years
    const [ayColumns] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'academic_years' 
      ORDER BY ordinal_position
    `);
    console.log('Academic Years table columns:');
    ayColumns.forEach(col => console.log(`  - ${col.column_name} (${col.data_type})`));
    
    // Check subjects
    console.log('\nSubjects table columns:');
    const [subColumns] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'subjects' 
      ORDER BY ordinal_position
    `);
    subColumns.forEach(col => console.log(`  - ${col.column_name} (${col.data_type})`));
    
    // Check students
    console.log('\nStudents table columns:');
    const [studColumns] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'students' 
      ORDER BY ordinal_position
    `);
    studColumns.forEach(col => console.log(`  - ${col.column_name} (${col.data_type})`));
    
    // Check student count
    const [count] = await sequelize.query(`SELECT COUNT(*) as count FROM students`);
    console.log(`\nTotal students: ${count[0].count}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkTables();
