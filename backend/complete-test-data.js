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

async function completeData() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Only use the 3 most recent academic years
    const [academicYears] = await sequelize.query(`
      SELECT id, year FROM academic_years 
      WHERE year IN ('2022-2023', '2023-2024', '2024-2025')
      ORDER BY year
    `);
    console.log(`📅 Using ${academicYears.length} academic years: ${academicYears.map(a => a.year).join(', ')}`);
    
    // Only use the first 6 subjects
    const [subjects] = await sequelize.query(`
      SELECT id, name FROM subjects LIMIT 6
    `);
    console.log(`📖 Using ${subjects.length} subjects: ${subjects.map(s => s.name).join(', ')}\n`);
    
    const [students] = await sequelize.query(`SELECT id FROM students`);
    const [schools] = await sequelize.query(`SELECT id FROM schools LIMIT 1`);
    const schoolId = schools[0].id;

    // Step 1: Subject Enrollments (smaller batch size)
    console.log('📚 Creating subject enrollments...');
    const batchSize = 500;
    let totalSubjectEnrollments = 0;
    
    for (let i = 0; i < students.length; i += 10) {
      const studentBatch = students.slice(i, i + 10);
      const values = [];
      
      for (const student of studentBatch) {
        for (const ay of academicYears) {
          for (const subject of subjects) {
            values.push(`(gen_random_uuid(), '${student.id}', '${subject.id}', '${ay.id}', NULL, '${schoolId}', NOW())`);
          }
        }
      }
      
      if (values.length > 0) {
        await sequelize.query(`
          INSERT INTO student_subject_enrollment 
          (id, student_id, subject_id, academic_year_id, enrollment_id, school_id, created_at)
          VALUES ${values.join(',')}
          ON CONFLICT DO NOTHING
        `);
        totalSubjectEnrollments += values.length;
        console.log(`   Progress: ${totalSubjectEnrollments}/${students.length * academicYears.length * subjects.length}`);
      }
    }
    console.log(`✅ Created ${totalSubjectEnrollments} subject enrollments\n`);

    // Get enrollment maps
    console.log('📋 Loading enrollment mappings...');
    const [enrollments] = await sequelize.query(`
      SELECT id, student_id, academic_year_id 
      FROM academic_year_student_enrollment
      WHERE academic_year_id IN ('${academicYears.map(a => a.id).join("','")}')
    `);
    const enrollmentMap = {};
    enrollments.forEach(e => {
      enrollmentMap[`${e.student_id}_${e.academic_year_id}`] = e.id;
    });

    const [subjectEnrollments] = await sequelize.query(`
      SELECT id, student_id, subject_id, academic_year_id 
      FROM student_subject_enrollment
      WHERE academic_year_id IN ('${academicYears.map(a => a.id).join("','")}')
    `);
    const subjectEnrollmentMap = {};
    subjectEnrollments.forEach(e => {
      subjectEnrollmentMap[`${e.student_id}_${e.subject_id}_${e.academic_year_id}`] = e.id;
    });
    console.log(`✅ Loaded ${enrollments.length} enrollments, ${subjectEnrollments.length} subject enrollments\n`);

    // Step 2: Create Marksheets and Marks (batch by batch)
    console.log('📊 Creating marksheets and marks...');
    const terms = [
      { name: 'Term 1', ms_1: 'T1' },
      { name: 'Term 2', ms_1: 'T2' },
      { name: 'Final', ms_1: 'F' }
    ];

    let totalMarksheets = 0;
    let totalMarks = 0;

    for (const term of terms) {
      console.log(`\n   Processing ${term.name}...`);
      
      for (let i = 0; i < students.length; i += 5) {
        const studentBatch = students.slice(i, i + 5);
        const marksheetValues = [];
        const marksValues = [];
        
        for (const student of studentBatch) {
          for (const ay of academicYears) {
            const enrollmentKey = `${student.id}_${ay.id}`;
            const academicYearEnrollmentId = enrollmentMap[enrollmentKey];
            
            if (!academicYearEnrollmentId) continue;
            
            for (const subject of subjects) {
              const subjectEnrollmentKey = `${student.id}_${subject.id}_${ay.id}`;
              const studentSubjectEnrollmentId = subjectEnrollmentMap[subjectEnrollmentKey];
              
              if (!studentSubjectEnrollmentId) continue;
              
              const marksObtained = Math.floor(Math.random() * 56) + 40;
              const isPassed = marksObtained >= 40;
              const grade = marksObtained >= 90 ? 'A+' : marksObtained >= 80 ? 'A' : 
                           marksObtained >= 70 ? 'B' : marksObtained >= 60 ? 'C' : 
                           marksObtained >= 50 ? 'D' : 'F';
              
              marksheetValues.push(`(gen_random_uuid(), '${term.ms_1}', '${ay.id}', '${academicYearEnrollmentId}', '${studentSubjectEnrollmentId}', '${subject.id}', '${schoolId}', ${marksObtained}, ${isPassed}, 'published', NOW())`);
              
              marksValues.push(`(gen_random_uuid(), '${student.id}', '${subject.id}', '${ay.id}', '${term.name}', ${marksObtained}, 100, '${grade}', '${isPassed ? 'Good performance' : 'Needs improvement'}', NOW())`);
            }
          }
        }
        
        if (marksheetValues.length > 0) {
          await sequelize.query(`
            INSERT INTO marksheets 
            (id, ms_1, academic_year_id, academic_year_enrollment_id, student_subject_enrollment_id, subject_id, school_id, marks_obtained, is_pass, status, created_at)
            VALUES ${marksheetValues.join(',')}
            ON CONFLICT DO NOTHING
          `);
          totalMarksheets += marksheetValues.length;
        }
        
        if (marksValues.length > 0) {
          await sequelize.query(`
            INSERT INTO marks 
            (id, student_id, subject_id, academic_year_id, term, marks_obtained, total_marks, grade, remarks, created_at)
            VALUES ${marksValues.join(',')}
            ON CONFLICT DO NOTHING
          `);
          totalMarks += marksValues.length;
        }
        
        console.log(`      Progress: ${totalMarksheets} marksheets, ${totalMarks} marks`);
      }
    }
    console.log(`\n✅ Created ${totalMarksheets} marksheets and ${totalMarks} marks\n`);

    // Step 3: Reduce teachers
    console.log('👨‍🏫 Cleaning up teachers...');
    const [teachers] = await sequelize.query(`SELECT id FROM users WHERE role = 'teacher' ORDER BY created_at DESC`);
    if (teachers.length > 15) {
      const toDelete = teachers.slice(15);
      for (const teacher of toDelete) {
        await sequelize.query(`DELETE FROM users WHERE id = $1`, { bind: [teacher.id] });
      }
      console.log(`✅ Removed ${toDelete.length} extra teachers (${teachers.length} → 15)\n`);
    }

    // Final Summary
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

    console.log('═══════════════════════════════════════════════════');
    console.log('✅ ALL TEST DATA POPULATED SUCCESSFULLY');
    console.log('═══════════════════════════════════════════════════\n');
    console.log(`   Teachers: ${summary[0].teachers}`);
    console.log(`   Principals: ${summary[0].principals}`);
    console.log(`   Students: ${summary[0].students}`);
    console.log(`   Sponsors: ${summary[0].sponsors}`);
    console.log(`   Student-Sponsor Mappings: ${summary[0].mappings}`);
    console.log(`   Academic Years: ${summary[0].academic_years}`);
    console.log(`   Subjects: ${summary[0].subjects}`);
    console.log(`   Student Enrollments: ${summary[0].enrollments}`);
    console.log(`   Subject Enrollments: ${summary[0].subject_enrollments}`);
    console.log(`   Marksheets: ${summary[0].marksheets}`);
    console.log(`   Marks Records: ${summary[0].marks}`);
    console.log('\n═══════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

completeData();
