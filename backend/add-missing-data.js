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

async function addMissingData() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database\n');

    const hashedPassword = await bcrypt.hash('Test@123', 10);

    // 1. Add 1 Principal (convert a teacher)
    console.log('👤 Creating principal...');
    const [teachers] = await sequelize.query(`
      SELECT id FROM users WHERE role = 'teacher' LIMIT 1
    `);
    
    if (teachers.length > 0) {
      await sequelize.query(`
        UPDATE users SET role = 'principal' WHERE id = $1
      `, { bind: [teachers[0].id] });
      console.log('✅ Principal created\n');
    }

    // 2. Get all students and sponsors for mapping
    const [students] = await sequelize.query(`SELECT id FROM students`);
    const [sponsors] = await sequelize.query(`SELECT id FROM sponsors`);
    
    console.log(`📚 Found ${students.length} students and ${sponsors.length} sponsors\n`);

    // 3. Create student-sponsor mappings (each sponsor gets 1-2 students)
    console.log('🔗 Creating student-sponsor mappings...');
    let mappingCount = 0;
    let studentIndex = 0;
    
    for (const sponsor of sponsors) {
      const numStudents = Math.random() < 0.5 ? 1 : 2; // 50% get 1 student, 50% get 2
      
      for (let i = 0; i < numStudents && studentIndex < students.length; i++) {
        await sequelize.query(`
          INSERT INTO student_sponsor_mapping (id, student_id, sponsor_id, start_date, created_at)
          VALUES (gen_random_uuid(), $1, $2, '2024-01-01', NOW())
          ON CONFLICT DO NOTHING
        `, { bind: [students[studentIndex].id, sponsor.id] });
        
        studentIndex++;
        mappingCount++;
      }
    }
    console.log(`✅ Created ${mappingCount} student-sponsor mappings\n`);

    // 4. Create marksheets for 3 academic years (2022-2023, 2023-2024, 2024-2025)
    console.log('📝 Creating marksheets for 3 years...');
    const academicYears = ['2022-2023', '2023-2024', '2024-2025'];
    const terms = ['Term 1', 'Term 2', 'Final'];
    let marksheetCount = 0;

    for (const student of students) {
      for (const year of academicYears) {
        for (const term of terms) {
          const [result] = await sequelize.query(`
            INSERT INTO marksheets (
              id, student_id, academic_year, term, 
              total_marks, percentage, grade, status, created_at
            ) VALUES (
              gen_random_uuid(), $1, $2, $3,
              0, 0, 'A', 'published', NOW()
            )
            RETURNING id
          `, { bind: [student.id, year, term] });
          
          if (result.length > 0) {
            marksheetCount++;
            
            // Add marks for each subject
            const subjects = ['Mathematics', 'English', 'Science', 'Social Studies', 'Hindi'];
            let totalMarks = 0;
            
            for (const subject of subjects) {
              const marks = Math.floor(Math.random() * 41) + 60; // 60-100
              totalMarks += marks;
              
              await sequelize.query(`
                INSERT INTO marks (
                  id, marksheet_id, subject, marks_obtained, 
                  total_marks, grade, status, created_at
                ) VALUES (
                  gen_random_uuid(), $1, $2, $3, 100, 
                  CASE 
                    WHEN $3 >= 90 THEN 'A+'
                    WHEN $3 >= 80 THEN 'A'
                    WHEN $3 >= 70 THEN 'B+'
                    WHEN $3 >= 60 THEN 'B'
                    ELSE 'C'
                  END,
                  'approved', NOW()
                )
              `, { bind: [result[0].id, subject, marks] });
            }
            
            // Update marksheet totals
            const percentage = (totalMarks / (subjects.length * 100)) * 100;
            const grade = percentage >= 90 ? 'A+' : 
                         percentage >= 80 ? 'A' :
                         percentage >= 70 ? 'B+' :
                         percentage >= 60 ? 'B' : 'C';
            
            await sequelize.query(`
              UPDATE marksheets 
              SET total_marks = $1, percentage = $2, grade = $3
              WHERE id = $4
            `, { bind: [totalMarks, percentage.toFixed(2), grade, result[0].id] });
          }
        }
      }
      
      if (marksheetCount % 30 === 0) {
        console.log(`  Processed ${marksheetCount} marksheets...`);
      }
    }
    
    console.log(`✅ Created ${marksheetCount} marksheets with marks\n`);

    // Final count
    console.log('📊 Final Statistics:');
    const [finalUsers] = await sequelize.query(`
      SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY role
    `);
    finalUsers.forEach(r => console.log('  ', r.role + ':', r.count));
    
    const [finalMappings] = await sequelize.query(`SELECT COUNT(*) as count FROM student_sponsor_mapping`);
    console.log('  🔗 Mappings:', finalMappings[0].count);
    
    const [finalMarksheets] = await sequelize.query(`SELECT COUNT(*) as count FROM marksheets`);
    console.log('  📝 Marksheets:', finalMarksheets[0].count);
    
    const [finalMarks] = await sequelize.query(`SELECT COUNT(*) as count FROM marks`);
    console.log('  📊 Marks:', finalMarks[0].count);

    await sequelize.close();
    console.log('\n✅ Test data population complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

addMissingData();
