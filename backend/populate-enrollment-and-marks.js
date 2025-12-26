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

async function populateEnrollmentAndMarks() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully\n');

    // Step 1: Get school_id
    const [schools] = await sequelize.query(`SELECT id FROM schools LIMIT 1`);
    if (schools.length === 0) {
      console.log('❌ No school found. Creating default school...');
      const schoolId = '550e8400-e29b-41d4-a716-446655440000';
      await sequelize.query(`
        INSERT INTO schools (id, name, address, phone, email, website, established_year, created_at)
        VALUES ($1, 'ZSchool', '123 Main St', '1234567890', 'info@zschool.com', 'www.zschool.com', 2020, NOW())
        ON CONFLICT (id) DO NOTHING
      `, { bind: [schoolId] });
      console.log('✅ Default school created');
    }
    const schoolId = schools[0].id;
    console.log(`📚 Using School ID: ${schoolId}\n`);

    // Update all students with NULL school_id
    console.log('🔧 Updating students with school_id...');
    const [updateResult] = await sequelize.query(`
      UPDATE students SET school_id = $1 WHERE school_id IS NULL
    `, { bind: [schoolId] });
    console.log(`✅ Updated students with school_id\n`);

    // Step 2: Create Academic Years
    console.log('📅 Creating Academic Years...');
    const academicYears = [
      { year: '2022-2023', start_date: '2022-04-01', end_date: '2023-03-31' },
      { year: '2023-2024', start_date: '2023-04-01', end_date: '2024-03-31' },
      { year: '2024-2025', start_date: '2024-04-01', end_date: '2025-03-31' }
    ];

    const academicYearIds = [];
    for (const ay of academicYears) {
      const [existing] = await sequelize.query(
        `SELECT id FROM academic_years WHERE year = $1`,
        { bind: [ay.year] }
      );
      
      if (existing.length > 0) {
        academicYearIds.push({ year: ay.year, id: existing[0].id });
        console.log(`   ℹ️  Academic Year ${ay.year} already exists`);
      } else {
        const [result] = await sequelize.query(`
          INSERT INTO academic_years (id, year, start_date, end_date, is_current, created_at)
          VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())
          RETURNING id
        `, { bind: [ay.year, ay.start_date, ay.end_date, ay.year === '2024-2025'] });
        academicYearIds.push({ year: ay.year, id: result[0].id });
        console.log(`   ✅ Created Academic Year: ${ay.year}`);
      }
    }
    console.log(`✅ Academic Years ready: ${academicYearIds.length}\n`);

    // Step 3: Create Subjects
    console.log('📖 Creating Subjects...');
    const subjectNames = ['Mathematics', 'English', 'Science', 'Social Studies', 'Hindi', 'Computer Science'];
    const subjectIds = [];
    
    for (const subjectName of subjectNames) {
      const [existing] = await sequelize.query(
        `SELECT id FROM subjects WHERE name = $1 AND school_id = $2`,
        { bind: [subjectName, schoolId] }
      );
      
      if (existing.length > 0) {
        subjectIds.push({ name: subjectName, id: existing[0].id });
        console.log(`   ℹ️  Subject ${subjectName} already exists`);
      } else {
        const [result] = await sequelize.query(`
          INSERT INTO subjects (id, school_id, name, created_at)
          VALUES (gen_random_uuid(), $1, $2, NOW())
          RETURNING id
        `, { 
          bind: [schoolId, subjectName] 
        });
        subjectIds.push({ name: subjectName, id: result[0].id });
        console.log(`   ✅ Created Subject: ${subjectName}`);
      }
    }
    console.log(`✅ Subjects ready: ${subjectIds.length}\n`);

    // Step 4: Get all students
    console.log('👨‍🎓 Fetching Students...');
    const [students] = await sequelize.query(`SELECT id, current_class, school_id FROM students WHERE school_id IS NOT NULL`);
    console.log(`✅ Found ${students.length} students\n`);

    if (students.length === 0) {
      console.log('❌ No students found. Cannot create enrollments.');
      return;
    }
    
    // Use the school_id from students (should be same for all)
    const actualSchoolId = students[0].school_id;

    // Step 5: Create Student Enrollments for all academic years
    console.log('🎓 Creating Student Enrollments...');
    let enrollmentCount = 0;
    const enrollmentMap = {}; // Store enrollment IDs for marks creation

    for (const student of students) {
      for (const ay of academicYearIds) {
        const [existing] = await sequelize.query(
          `SELECT id FROM academic_year_student_enrollment 
           WHERE student_id = $1 AND academic_year_id = $2`,
          { bind: [student.id, ay.id] }
        );

        if (existing.length === 0) {
          const [result] = await sequelize.query(`
            INSERT INTO academic_year_student_enrollment 
            (id, student_id, academic_year_id, school_id, admission_date, created_at)
            VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())
            RETURNING id
          `, { 
            bind: [
              student.id, 
              ay.id, 
              student.school_id, 
              ay.year === '2022-2023' ? '2022-04-01' : 
              ay.year === '2023-2024' ? '2023-04-01' : '2024-04-01'
            ] 
          });
          
          const key = `${student.id}_${ay.id}`;
          enrollmentMap[key] = result[0].id;
          enrollmentCount++;
        } else {
          const key = `${student.id}_${ay.id}`;
          enrollmentMap[key] = existing[0].id;
        }
      }
    }
    console.log(`✅ Created/Found ${enrollmentCount} new enrollments (Total: ${students.length * academicYearIds.length})\n`);

    // Step 6: Create Student Subject Enrollments
    console.log('📚 Creating Student Subject Enrollments...');
    let subjectEnrollmentCount = 0;
    const subjectEnrollmentMap = {}; // Store for marks creation

    for (const student of students) {
      // Assign all subjects to all students
      for (const ay of academicYearIds) {
        const enrollmentKey = `${student.id}_${ay.id}`;
        const academicYearEnrollmentId = enrollmentMap[enrollmentKey];

        if (!academicYearEnrollmentId) continue;

        for (const subject of subjectIds) {
          const [existing] = await sequelize.query(
            `SELECT id FROM student_subject_enrollment 
             WHERE student_id = $1 AND subject_id = $2 AND academic_year_id = $3`,
            { bind: [student.id, subject.id, ay.id] }
          );

          if (existing.length === 0) {
            const [result] = await sequelize.query(`
              INSERT INTO student_subject_enrollment 
              (id, student_id, subject_id, academic_year_id, school_id, enrollment_date, created_at)
              VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
              RETURNING id
            `, { bind: [student.id, subject.id, ay.id, student.school_id] });
            
            const key = `${student.id}_${subject.id}_${ay.id}`;
            subjectEnrollmentMap[key] = result[0].id;
            subjectEnrollmentCount++;
          } else {
            const key = `${student.id}_${subject.id}_${ay.id}`;
            subjectEnrollmentMap[key] = existing[0].id;
          }
        }
      }
    }
    console.log(`✅ Created ${subjectEnrollmentCount} new subject enrollments\n`);

    // Step 7: Create Marksheets and Marks
    console.log('📊 Creating Marksheets and Marks...');
    let marksheetCount = 0;
    let marksCount = 0;

    // Create marksheets for each term (Term 1, Term 2, Final) for each year
    const terms = [
      { name: 'Term 1', ms_1: 'T1', course_part_id: null },
      { name: 'Term 2', ms_1: 'T2', course_part_id: null },
      { name: 'Final', ms_1: 'F', course_part_id: null }
    ];

    for (const student of students) {
      for (const ay of academicYearIds) {
        const enrollmentKey = `${student.id}_${ay.id}`;
        const academicYearEnrollmentId = enrollmentMap[enrollmentKey];

        if (!academicYearEnrollmentId) continue;

        for (const term of terms) {
          for (const subject of subjectIds) {
            const subjectEnrollmentKey = `${student.id}_${subject.id}_${ay.id}`;
            const studentSubjectEnrollmentId = subjectEnrollmentMap[subjectEnrollmentKey];

            if (!studentSubjectEnrollmentId) continue;

            // Generate random marks between 40-95
            const marksObtained = Math.floor(Math.random() * 56) + 40;
            const isPassed = marksObtained >= 40;

            const [existing] = await sequelize.query(
              `SELECT id FROM marksheets 
               WHERE academic_year_enrollment_id = $1 
               AND student_subject_enrollment_id = $2 
               AND ms_1 = $3`,
              { bind: [academicYearEnrollmentId, studentSubjectEnrollmentId, term.ms_1] }
            );

            if (existing.length === 0) {
              await sequelize.query(`
                INSERT INTO marksheets 
                (id, ms_1, academic_year_id, academic_year_enrollment_id, 
                 student_subject_enrollment_id, subject_id, school_id, 
                 marks_obtained, is_pass, status, created_at)
                VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, 'published', NOW())
              `, { 
                bind: [
                  term.ms_1,
                  ay.id,
                  academicYearEnrollmentId,
                  studentSubjectEnrollmentId,
                  subject.id,
                  student.school_id,
                  marksObtained,
                  isPassed
                ] 
              });
              marksheetCount++;
            }

            // Also insert into marks table
            const [existingMark] = await sequelize.query(
              `SELECT id FROM marks 
               WHERE student_id = $1 AND subject_id = $2 
               AND academic_year_id = $3 AND term = $4`,
              { bind: [student.id, subject.id, ay.id, term.name] }
            );

            if (existingMark.length === 0) {
              await sequelize.query(`
                INSERT INTO marks 
                (id, student_id, subject_id, academic_year_id, term, 
                 marks_obtained, total_marks, grade, remarks, created_at)
                VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 100, $6, $7, NOW())
              `, { 
                bind: [
                  student.id,
                  subject.id,
                  ay.id,
                  term.name,
                  marksObtained,
                  marksObtained >= 90 ? 'A+' : marksObtained >= 80 ? 'A' : marksObtained >= 70 ? 'B' : marksObtained >= 60 ? 'C' : marksObtained >= 50 ? 'D' : 'F',
                  isPassed ? 'Good performance' : 'Needs improvement'
                ] 
              });
              marksCount++;
            }
          }
        }
      }
    }
    console.log(`✅ Created ${marksheetCount} marksheets and ${marksCount} marks records\n`);

    // Step 8: Reduce teachers from 19 to 15 (delete 4)
    console.log('👨‍🏫 Cleaning up extra teachers...');
    const [teachers] = await sequelize.query(`
      SELECT id FROM users WHERE role = 'teacher' ORDER BY created_at DESC LIMIT 4
    `);
    
    if (teachers.length > 0) {
      for (const teacher of teachers) {
        await sequelize.query(`DELETE FROM users WHERE id = $1`, { bind: [teacher.id] });
      }
      console.log(`✅ Removed ${teachers.length} extra teachers (19 → 15)\n`);
    } else {
      console.log('ℹ️  No extra teachers to remove\n');
    }

    // Step 9: Summary
    console.log('═══════════════════════════════════════════════════');
    console.log('📊 TEST DATA POPULATION COMPLETE');
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

    console.log('\n📈 Final Database Counts:');
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

populateEnrollmentAndMarks();
