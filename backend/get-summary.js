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

async function getSummary() {
  try {
    await sequelize.authenticate();
    
    const [summary] = await sequelize.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'teacher') as teachers,
        (SELECT COUNT(*) FROM users WHERE role = 'principal') as principals,
        (SELECT COUNT(*) FROM students) as students,
        (SELECT COUNT(*) FROM sponsors) as sponsors,
        (SELECT COUNT(*) FROM student_sponsor_mapping) as mappings,
        (SELECT COUNT(*) FROM academic_years) as academic_years,
        (SELECT COUNT(*) FROM subjects) as subjects,
        (SELECT COUNT(*) FROM academic_year_student_enrollment) as enrollments,
        (SELECT COUNT(*) FROM student_subject_enrollment) as subject_enrollments,
        (SELECT COUNT(*) FROM marksheets) as marksheets,
        (SELECT COUNT(*) FROM marks) as marks
    `);

    console.log('\n═══════════════════════════════════════════════════');
    console.log('📊 CURRENT DATABASE STATUS');
    console.log('═══════════════════════════════════════════════════\n');
    console.log(`✅ Teachers: ${summary[0].teachers}`);
    console.log(`✅ Principals: ${summary[0].principals}`);
    console.log(`✅ Students: ${summary[0].students}`);
    console.log(`✅ Sponsors: ${summary[0].sponsors}`);
    console.log(`✅ Student-Sponsor Mappings: ${summary[0].mappings}`);
    console.log(`✅ Academic Years: ${summary[0].academic_years}`);
    console.log(`✅ Subjects: ${summary[0].subjects}`);
    console.log(`✅ Student Enrollments: ${summary[0].enrollments}`);
    console.log(`⏳ Subject Enrollments: ${summary[0].subject_enrollments}`);
    console.log(`⏳ Marksheets: ${summary[0].marksheets}`);
    console.log(`⏳ Marks: ${summary[0].marks}`);
    console.log('\n═══════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

getSummary();
