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

async function populateYear(academicYear, students, subjects, schoolId) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📅 PROCESSING ACADEMIC YEAR: ${academicYear.year}`);
  console.log('='.repeat(60));

  // Step 1: Get or verify student enrollments for this year
  console.log('\n🎓 Step 1: Student Enrollments for this year...');
  const [existingEnrollments] = await sequelize.query(`
    SELECT COUNT(*) as count FROM academic_year_student_enrollment
    WHERE academic_year_id = $1
  `, { bind: [academicYear.id] });

  if (existingEnrollments[0].count < students.length) {
    console.log(`   Creating ${students.length - existingEnrollments[0].count} missing enrollments...`);
    const enrollmentValues = [];
    for (const student of students) {
      const admissionDate = academicYear.year === '2022-2023' ? '2022-04-01' : 
                           academicYear.year === '2023-2024' ? '2023-04-01' : '2024-04-01';
      enrollmentValues.push(`(gen_random_uuid(), '${student.id}', '${academicYear.id}', '${schoolId}', '${admissionDate}', NOW())`);
    }
    
    await sequelize.query(`
      INSERT INTO academic_year_student_enrollment 
      (id, student_id, academic_year_id, school_id, admission_date, created_at)
      VALUES ${enrollmentValues.join(',')}
      ON CONFLICT DO NOTHING
    `);
  }
  console.log(`   ✅ ${students.length} student enrollments ready`);

  // Step 2: Get enrollment map for this year
  console.log('\n📋 Step 2: Loading enrollment IDs...');
  const [enrollments] = await sequelize.query(`
    SELECT id, student_id FROM academic_year_student_enrollment
    WHERE academic_year_id = $1
  `, { bind: [academicYear.id] });
  
  const enrollmentMap = {};
  enrollments.forEach(e => {
    enrollmentMap[e.student_id] = e.id;
  });
  console.log(`   ✅ ${enrollments.length} enrollments loaded`);

  // Step 3: Create subject enrollments for this year
  console.log('\n📚 Step 3: Creating subject enrollments...');
  let subjectEnrollmentCount = 0;
  const batchSize = 100;
  
  for (let i = 0; i < students.length; i += batchSize) {
    const studentBatch = students.slice(i, i + batchSize);
    const values = [];
    
    for (const student of studentBatch) {
      for (const subject of subjects) {
        values.push(`(gen_random_uuid(), '${student.id}', '${subject.id}', '${academicYear.id}', NULL, '${schoolId}', NOW())`);
      }
    }
    
    await sequelize.query(`
      INSERT INTO student_subject_enrollment 
      (id, student_id, subject_id, academic_year_id, enrollment_id, school_id, created_at)
      VALUES ${values.join(',')}
      ON CONFLICT DO NOTHING
    `);
    subjectEnrollmentCount += values.length;
    console.log(`   Progress: ${subjectEnrollmentCount}/${students.length * subjects.length}`);
  }
  console.log(`   ✅ ${subjectEnrollmentCount} subject enrollments created`);

  // Step 4: Get subject enrollment map for this year
  console.log('\n📋 Step 4: Loading subject enrollment IDs...');
  const [subjectEnrollments] = await sequelize.query(`
    SELECT id, student_id, subject_id FROM student_subject_enrollment
    WHERE academic_year_id = $1
  `, { bind: [academicYear.id] });
  
  const subjectEnrollmentMap = {};
  subjectEnrollments.forEach(e => {
    subjectEnrollmentMap[`${e.student_id}_${e.subject_id}`] = e.id;
  });
  console.log(`   ✅ ${subjectEnrollments.length} subject enrollments loaded`);

  // Step 5: Create marks and marksheets for all terms
  console.log('\n📊 Step 5: Creating marksheets and marks...');
  const terms = [
    { name: 'Term 1', ms_1: 'T1' },
    { name: 'Term 2', ms_1: 'T2' },
    { name: 'Final', ms_1: 'F' }
  ];

  let totalMarksheets = 0;
  let totalMarks = 0;

  for (const term of terms) {
    console.log(`\n   📝 ${term.name}...`);
    
    for (let i = 0; i < students.length; i += 20) {
      const studentBatch = students.slice(i, i + 20);
      const marksheetValues = [];
      const marksValues = [];
      
      for (const student of studentBatch) {
        const academicYearEnrollmentId = enrollmentMap[student.id];
        if (!academicYearEnrollmentId) continue;
        
        for (const subject of subjects) {
          const studentSubjectEnrollmentId = subjectEnrollmentMap[`${student.id}_${subject.id}`];
          if (!studentSubjectEnrollmentId) continue;
          
          const marksObtained = Math.floor(Math.random() * 56) + 40;
          const isPassed = marksObtained >= 40;
          const grade = marksObtained >= 90 ? 'A+' : marksObtained >= 80 ? 'A' : 
                       marksObtained >= 70 ? 'B' : marksObtained >= 60 ? 'C' : 
                       marksObtained >= 50 ? 'D' : 'F';
          
          marksheetValues.push(`(gen_random_uuid(), '${term.ms_1}', '${academicYear.id}', '${academicYearEnrollmentId}', '${studentSubjectEnrollmentId}', '${subject.id}', '${schoolId}', ${marksObtained}, ${isPassed}, 'published', NOW())`);
          
          marksValues.push(`(gen_random_uuid(), '${student.id}', '${subject.id}', '${academicYear.id}', '${term.name}', ${marksObtained}, 100, '${grade}', '${isPassed ? 'Good performance' : 'Needs improvement'}', NOW())`);
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
      
      if ((i + 20) % 40 === 0) {
        console.log(`      Progress: ${totalMarksheets} marksheets, ${totalMarks} marks`);
      }
    }
    console.log(`      ✅ ${term.name} completed`);
  }
  
  console.log(`\n   ✅ Year ${academicYear.year} completed: ${totalMarksheets} marksheets, ${totalMarks} marks`);
  
  return { marksheets: totalMarksheets, marks: totalMarks };
}

async function main() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Get required data
    console.log('📋 Loading base data...');
    const [schools] = await sequelize.query(`SELECT id FROM schools LIMIT 1`);
    const schoolId = schools[0].id;
    
    const [academicYears] = await sequelize.query(`
      SELECT id, year FROM academic_years 
      WHERE year IN ('2022-2023', '2023-2024', '2024-2025')
      ORDER BY year
    `);
    
    const [subjects] = await sequelize.query(`
      SELECT id, name FROM subjects 
      WHERE name IN ('Mathematics', 'English', 'Science', 'Social Studies', 'Hindi', 'Computer Science')
    `);
    
    const [students] = await sequelize.query(`
      SELECT id FROM students WHERE school_id = $1
    `, { bind: [schoolId] });
    
    console.log(`✅ Loaded: ${students.length} students, ${subjects.length} subjects, ${academicYears.length} academic years\n`);

    // Process each year
    const results = {
      totalMarksheets: 0,
      totalMarks: 0,
      yearResults: []
    };

    for (const academicYear of academicYears) {
      const yearResult = await populateYear(academicYear, students, subjects, schoolId);
      results.totalMarksheets += yearResult.marksheets;
      results.totalMarks += yearResult.marks;
      results.yearResults.push({
        year: academicYear.year,
        ...yearResult
      });
    }

    // Clean up teachers and principals
    console.log('\n👨‍🏫 Cleaning up extra staff...');
    const [teachers] = await sequelize.query(`SELECT id FROM users WHERE role = 'teacher' ORDER BY created_at DESC`);
    if (teachers.length > 15) {
      const toDelete = teachers.slice(15);
      for (const teacher of toDelete) {
        await sequelize.query(`DELETE FROM users WHERE id = $1`, { bind: [teacher.id] });
      }
      console.log(`   ✅ Reduced teachers: ${teachers.length} → 15`);
    }

    const [principals] = await sequelize.query(`SELECT id FROM users WHERE role = 'principal' ORDER BY created_at DESC`);
    if (principals.length > 1) {
      const toDelete = principals.slice(1);
      for (const principal of toDelete) {
        await sequelize.query(`DELETE FROM users WHERE id = $1`, { bind: [principal.id] });
      }
      console.log(`   ✅ Reduced principals: ${principals.length} → 1`);
    }

    // Final summary
    const [summary] = await sequelize.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'teacher') as teachers,
        (SELECT COUNT(*) FROM users WHERE role = 'principal') as principals,
        (SELECT COUNT(*) FROM students) as students,
        (SELECT COUNT(*) FROM sponsors) as sponsors,
        (SELECT COUNT(*) FROM student_sponsor_mapping) as mappings,
        (SELECT COUNT(*) FROM academic_year_student_enrollment WHERE academic_year_id IN (
          SELECT id FROM academic_years WHERE year IN ('2022-2023', '2023-2024', '2024-2025')
        )) as enrollments,
        (SELECT COUNT(*) FROM student_subject_enrollment WHERE academic_year_id IN (
          SELECT id FROM academic_years WHERE year IN ('2022-2023', '2023-2024', '2024-2025')
        )) as subject_enrollments,
        (SELECT COUNT(*) FROM marksheets WHERE academic_year_id IN (
          SELECT id FROM academic_years WHERE year IN ('2022-2023', '2023-2024', '2024-2025')
        )) as marksheets,
        (SELECT COUNT(*) FROM marks WHERE academic_year_id IN (
          SELECT id FROM academic_years WHERE year IN ('2022-2023', '2023-2024', '2024-2025')
        )) as marks
    `);

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TEST DATA POPULATED SUCCESSFULLY');
    console.log('='.repeat(60));
    console.log('\n📊 FINAL DATABASE SUMMARY:');
    console.log(`   👨‍🏫 Teachers: ${summary[0].teachers}`);
    console.log(`   🏫 Principals: ${summary[0].principals}`);
    console.log(`   👨‍🎓 Students: ${summary[0].students}`);
    console.log(`   👨‍👩‍👧‍👦 Sponsors: ${summary[0].sponsors}`);
    console.log(`   🔗 Student-Sponsor Mappings: ${summary[0].mappings}`);
    console.log(`   📅 Student Enrollments (3 years): ${summary[0].enrollments}`);
    console.log(`   📚 Subject Enrollments (3 years): ${summary[0].subject_enrollments}`);
    console.log(`   📊 Marksheets (3 years × 3 terms): ${summary[0].marksheets}`);
    console.log(`   📝 Marks Records (3 years × 3 terms): ${summary[0].marks}`);
    
    console.log('\n📈 Per Year Breakdown:');
    results.yearResults.forEach(yr => {
      console.log(`   ${yr.year}: ${yr.marksheets} marksheets, ${yr.marks} marks`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Test data population completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

main();
