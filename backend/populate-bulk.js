import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_DATABASE || 'zschool_db',
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  }
);

async function populateBulk() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Get school, academic years, subjects, and students
    const [schools] = await sequelize.query(`SELECT id FROM schools LIMIT 1`);
    const schoolId = schools[0].id;
    
    const [academicYears] = await sequelize.query(`SELECT id, year FROM academic_years ORDER BY year`);
    const [subjects] = await sequelize.query(`SELECT id, name FROM subjects`);
    const [students] = await sequelize.query(`SELECT id FROM students WHERE school_id = $1`, { bind: [schoolId] });
    
    console.log(`📊 Data counts:`);
    console.log(`   Academic Years: ${academicYears.length}`);
    console.log(`   Subjects: ${subjects.length}`);
    console.log(`   Students: ${students.length}\n`);

    // Bulk insert student enrollments
    console.log('🎓 Creating student enrollments (BULK)...');
    const enrollmentValues = [];
    for (const student of students) {
      for (const ay of academicYears) {
        const admissionDate = ay.year === '2022-2023' ? '2022-04-01' : 
                             ay.year === '2023-2024' ? '2023-04-01' : '2024-04-01';
        enrollmentValues.push(`(gen_random_uuid(), '${student.id}', '${ay.id}', '${schoolId}', '${admissionDate}', NOW())`);
      }
    }
    
    if (enrollmentValues.length > 0) {
      await sequelize.query(`
        INSERT INTO academic_year_student_enrollment 
        (id, student_id, academic_year_id, school_id, admission_date, created_at)
        VALUES ${enrollmentValues.join(',')}
        ON CONFLICT DO NOTHING
      `);
      console.log(`✅ Created ${enrollmentValues.length} enrollments\n`);
    }

    // Get all enrollments for mapping
    const [enrollments] = await sequelize.query(`
      SELECT id, student_id, academic_year_id 
      FROM academic_year_student_enrollment
    `);
    const enrollmentMap = {};
    enrollments.forEach(e => {
      enrollmentMap[`${e.student_id}_${e.academic_year_id}`] = e.id;
    });

    // Bulk insert student subject enrollments
    console.log('📚 Creating student subject enrollments (BULK)...');
    const subjectEnrollmentValues = [];
    for (const student of students) {
      for (const ay of academicYears) {
        for (const subject of subjects) {
          subjectEnrollmentValues.push(`(gen_random_uuid(), '${student.id}', '${subject.id}', '${ay.id}', NULL, '${schoolId}', NOW())`);
        }
      }
    }
    
    if (subjectEnrollmentValues.length > 0) {
      await sequelize.query(`
        INSERT INTO student_subject_enrollment 
        (id, student_id, subject_id, academic_year_id, enrollment_id, school_id, created_at)
        VALUES ${subjectEnrollmentValues.join(',')}
        ON CONFLICT DO NOTHING
      `);
      console.log(`✅ Created ${subjectEnrollmentValues.length} subject enrollments\n`);
    }

    // Get all subject enrollments
    const [subjectEnrollments] = await sequelize.query(`
      SELECT id, student_id, subject_id, academic_year_id 
      FROM student_subject_enrollment
    `);
    const subjectEnrollmentMap = {};
    subjectEnrollments.forEach(e => {
      subjectEnrollmentMap[`${e.student_id}_${e.subject_id}_${e.academic_year_id}`] = e.id;
    });

    // Bulk insert marksheets (split into batches due to size)
    console.log('📊 Creating marksheets and marks (BULK)...');
    const terms = [
      { name: 'Term 1', ms_1: 'T1' },
      { name: 'Term 2', ms_1: 'T2' },
      { name: 'Final', ms_1: 'F' }
    ];

    let totalMarksheets = 0;
    const batchSize = 1000;
    
    for (const term of terms) {
      const marksheetValues = [];
      const marksValues = [];
      
      for (const student of students) {
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
      
      // Insert marksheets in batches
      for (let i = 0; i < marksheetValues.length; i += batchSize) {
        const batch = marksheetValues.slice(i, i + batchSize);
        await sequelize.query(`
          INSERT INTO marksheets 
          (id, ms_1, academic_year_id, academic_year_enrollment_id, student_subject_enrollment_id, subject_id, school_id, marks_obtained, is_pass, status, created_at)
          VALUES ${batch.join(',')}
          ON CONFLICT DO NOTHING
        `);
        totalMarksheets += batch.length;
      }
      
      // Insert marks in batches
      for (let i = 0; i < marksValues.length; i += batchSize) {
        const batch = marksValues.slice(i, i + batchSize);
        await sequelize.query(`
          INSERT INTO marks 
          (id, student_id, subject_id, academic_year_id, term, marks_obtained, total_marks, grade, remarks, created_at)
          VALUES ${batch.join(',')}
          ON CONFLICT DO NOTHING
        `);
      }
      
      console.log(`   ✅ ${term.name}: ${marksheetValues.length} marksheets`);
    }
    
    console.log(`✅ Created ${totalMarksheets} total marksheets\n`);

    // Reduce teachers
    console.log('👨‍🏫 Reducing teachers to 15...');
    const [teachers] = await sequelize.query(`SELECT id FROM users WHERE role = 'teacher' ORDER BY created_at DESC`);
    if (teachers.length > 15) {
      const toDelete = teachers.slice(15);
      for (const teacher of toDelete) {
        await sequelize.query(`DELETE FROM users WHERE id = $1`, { bind: [teacher.id] });
      }
      console.log(`✅ Removed ${toDelete.length} extra teachers\n`);
    }

    // Final summary
    console.log('═══════════════════════════════════════════════════');
    console.log('📊 FINAL DATABASE SUMMARY');
    console.log('═══════════════════════════════════════════════════');
    
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
        (SELECT COUNT(*) FROM marks) as marks,
        (SELECT COUNT(*) FROM attendance) as attendance
    `);

    console.log('\n📈 Counts:');
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
    console.log(`   Attendance Records: ${summary[0].attendance}`);
    console.log('\n✅ All test data populated successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

populateBulk();
