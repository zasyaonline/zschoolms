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

async function ensureCourseParts(academicYear, subjects, schoolId) {
  console.log('\n📚 Ensuring course parts exist...');
  
  // Check if course parts already exist for this year
  const [existing] = await sequelize.query(`
    SELECT COUNT(*) as count FROM course_parts
    WHERE academic_year_id = $1
  `, { bind: [academicYear.id] });

  if (existing[0].count > 0) {
    console.log(`   ✅ ${existing[0].count} course parts already exist`);
    return;
  }

  // Create Term 1, Term 2, and Final for each subject
  const terms = ['Term 1', 'Term 2', 'Final'];
  const coursePartValues = [];
  
  for (const subject of subjects) {
    for (const term of terms) {
      const code = `${term.replace(' ', '')}-${subject.name.substring(0, 3).toUpperCase()}`;
      coursePartValues.push(
        `(gen_random_uuid(), '${code}', '${term}', '${academicYear.id}', '${subject.id}', '${schoolId}', NOW())`
      );
    }
  }

  await sequelize.query(`
    INSERT INTO course_parts 
    (id, code, name, academic_year_id, subject_id, school_id, created_at)
    VALUES ${coursePartValues.join(',')}
  `);

  console.log(`   ✅ Created ${coursePartValues.length} course parts (${terms.length} terms × ${subjects.length} subjects)`);
}

async function populateYear(academicYear, students, subjects, schoolId) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📅 PROCESSING ACADEMIC YEAR: ${academicYear.year}`);
  console.log('='.repeat(60));

  // Step 0: Ensure course parts exist
  await ensureCourseParts(academicYear, subjects, schoolId);

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

  const enrollmentMap = new Map();
  enrollments.forEach(e => enrollmentMap.set(e.student_id, e.id));
  console.log(`   ✅ ${enrollmentMap.size} enrollments loaded`);

  // Step 3: Create subject enrollments
  console.log('\n📚 Step 3: Creating subject enrollments...');
  
  // Check existing
  const [existingSubEnrollments] = await sequelize.query(`
    SELECT COUNT(*) as count FROM student_subject_enrollment
    WHERE academic_year_id = $1
  `, { bind: [academicYear.id] });

  const expectedCount = students.length * subjects.length;
  if (existingSubEnrollments[0].count < expectedCount) {
    const subjectEnrollmentValues = [];
    let batchCount = 0;
    
    for (const student of students) {
      const enrollmentId = enrollmentMap.get(student.id);
      if (!enrollmentId) continue;
      
      for (const subject of subjects) {
        subjectEnrollmentValues.push(
          `(gen_random_uuid(), '${enrollmentId}', '${subject.id}', '${academicYear.id}', NOW())`
        );
        
        batchCount++;
        if (batchCount >= 100) {
          await sequelize.query(`
            INSERT INTO student_subject_enrollment 
            (id, enrollment_id, subject_id, academic_year_id, created_at)
            VALUES ${subjectEnrollmentValues.join(',')}
            ON CONFLICT DO NOTHING
          `);
          console.log(`   Progress: ${batchCount}/${expectedCount}`);
          subjectEnrollmentValues.length = 0;
        }
      }
    }
    
    // Insert remaining
    if (subjectEnrollmentValues.length > 0) {
      await sequelize.query(`
        INSERT INTO student_subject_enrollment 
        (id, enrollment_id, subject_id, academic_year_id, created_at)
        VALUES ${subjectEnrollmentValues.join(',')}
        ON CONFLICT DO NOTHING
      `);
    }
    console.log(`   Progress: ${expectedCount}/${expectedCount}`);
  }
  console.log(`   ✅ ${expectedCount} subject enrollments created`);

  // Step 4: Load subject enrollment IDs
  console.log('\n📋 Step 4: Loading subject enrollment IDs...');
  const [subjectEnrollments] = await sequelize.query(`
    SELECT sse.id, sse.enrollment_id, sse.subject_id, ayse.student_id
    FROM student_subject_enrollment sse
    JOIN academic_year_student_enrollment ayse ON sse.enrollment_id = ayse.id
    WHERE sse.academic_year_id = $1
  `, { bind: [academicYear.id] });

  // Map: student_id + subject_id -> subject_enrollment_id
  const subjectEnrollmentMap = new Map();
  subjectEnrollments.forEach(se => {
    const key = `${se.student_id}_${se.subject_id}`;
    subjectEnrollmentMap.set(key, { id: se.id, enrollment_id: se.enrollment_id });
  });
  console.log(`   ✅ ${subjectEnrollmentMap.size} subject enrollments loaded`);

  // Step 5: Get course parts map for this year
  console.log('\n📋 Step 5: Loading course parts...');
  const [courseParts] = await sequelize.query(`
    SELECT id, name, subject_id FROM course_parts
    WHERE academic_year_id = $1
  `, { bind: [academicYear.id] });

  // Map: subject_id + term_name -> course_part_id
  const coursePartMap = new Map();
  courseParts.forEach(cp => {
    const key = `${cp.subject_id}_${cp.name}`;
    coursePartMap.set(key, cp.id);
  });
  console.log(`   ✅ ${coursePartMap.size} course parts loaded`);

  // Step 6: Create marksheets and marks for all terms
  console.log('\n📊 Step 6: Creating marksheets and marks...');
  
  const terms = [
    { code: 'T1', name: 'Term 1' },
    { code: 'T2', name: 'Term 2' },
    { code: 'Final', name: 'Final' }
  ];

  for (const term of terms) {
    console.log(`\n   📝 ${term.name}...`);
    
    // Check if already exists
    const [existing] = await sequelize.query(`
      SELECT COUNT(*) as count FROM marksheets
      WHERE academic_year_id = $1 AND ms_1 = $2
    `, { bind: [academicYear.id, term.code] });

    if (existing[0].count > 0) {
      console.log(`      ⏭️  ${existing[0].count} marksheets already exist, skipping...`);
      continue;
    }

    const marksheetValues = [];
    let recordCount = 0;

    for (const student of students) {
      for (const subject of subjects) {
        const key = `${student.id}_${subject.id}`;
        const subEnrollment = subjectEnrollmentMap.get(key);
        if (!subEnrollment) continue;

        const coursePartKey = `${subject.id}_${term.name}`;
        const coursePartId = coursePartMap.get(coursePartKey);
        if (!coursePartId) continue;

        const marksObtained = Math.floor(Math.random() * 60) + 40; // 40-100
        const isPass = marksObtained >= 40;

        marksheetValues.push(
          `(gen_random_uuid(), '${term.code}', '${coursePartId}', '${academicYear.id}', '${subEnrollment.enrollment_id}', '${subEnrollment.id}', '${subject.id}', '${schoolId}', ${marksObtained}, ${isPass}, 'published', NOW())`
        );

        recordCount++;
        if (recordCount >= 100) {
          // Insert batch
          await sequelize.query(`
            INSERT INTO marksheets 
            (id, ms_1, course_part_id, academic_year_id, academic_year_enrollment_id, student_subject_enrollment_id, subject_id, school_id, marks_obtained, is_pass, status, created_at)
            VALUES ${marksheetValues.join(',')}
            ON CONFLICT DO NOTHING
          `);

          console.log(`      Progress: ${recordCount} marksheets...`);
          marksheetValues.length = 0;
          recordCount = 0;
        }
      }
    }

    // Insert remaining
    if (marksheetValues.length > 0) {
      await sequelize.query(`
        INSERT INTO marksheets 
        (id, ms_1, course_part_id, academic_year_id, academic_year_enrollment_id, student_subject_enrollment_id, subject_id, school_id, marks_obtained, is_pass, status, created_at)
        VALUES ${marksheetValues.join(',')}
        ON CONFLICT DO NOTHING
      `);
    }

    // Now create marks records from marksheets
    console.log(`      Creating marks records...`);
    await sequelize.query(`
      INSERT INTO marks (id, marksheet_id, subject_id, marks_obtained, max_marks, created_at)
      SELECT gen_random_uuid(), m.id, m.subject_id, m.marks_obtained, 100, NOW()
      FROM marksheets m
      WHERE m.academic_year_id = $1 AND m.ms_1 = $2
      AND NOT EXISTS (SELECT 1 FROM marks WHERE marksheet_id = m.id AND subject_id = m.subject_id)
    `, { bind: [academicYear.id, term.code] });

    console.log(`      ✅ ${term.name} complete`);
  }

  console.log(`\n✅ COMPLETED: ${academicYear.year}\n`);
}

async function cleanupExcessUsers() {
  console.log('\n🧹 Cleaning up excess users...');
  
  // Keep only 15 teachers (delete 2)
  const [teachers] = await sequelize.query(`
    SELECT id FROM users WHERE role = 'teacher' LIMIT 2
  `);
  
  if (teachers.length > 0) {
    const teacherIds = teachers.map(t => `'${t.id}'`).join(',');
    await sequelize.query(`DELETE FROM users WHERE id IN (${teacherIds})`);
    console.log(`   ✅ Removed ${teachers.length} excess teachers`);
  }

  // Keep only 1 principal (delete 1)
  const [principals] = await sequelize.query(`
    SELECT id FROM users WHERE role = 'principal' LIMIT 1
  `);
  
  if (principals.length > 0) {
    const principalIds = principals.map(p => `'${p.id}'`).join(',');
    await sequelize.query(`DELETE FROM users WHERE id IN (${principalIds})`);
    console.log(`   ✅ Removed ${principals.length} excess principal`);
  }
}

async function main() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Load base data
    console.log('\n📋 Loading base data...');
    const [students] = await sequelize.query(`SELECT id FROM students ORDER BY created_at`);
    const [subjects] = await sequelize.query(`SELECT id, name FROM subjects ORDER BY name`);
    const [years] = await sequelize.query(`
      SELECT id, year, start_date FROM academic_years 
      WHERE year IN ('2022-2023', '2023-2024', '2024-2025')
      ORDER BY start_date
    `);
    const [schools] = await sequelize.query(`SELECT id FROM schools LIMIT 1`);
    const schoolId = schools[0].id;

    console.log(`✅ Loaded: ${students.length} students, ${subjects.length} subjects, ${years.length} academic years`);

    // Process each year sequentially
    for (const year of years) {
      await populateYear(year, students, subjects, schoolId);
    }

    // Clean up excess users
    await cleanupExcessUsers();

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL SUMMARY');
    console.log('='.repeat(60));

    const [summary] = await sequelize.query(`
      SELECT 
        (SELECT COUNT(*) FROM students) as students,
        (SELECT COUNT(*) FROM users WHERE role = 'teacher') as teachers,
        (SELECT COUNT(*) FROM users WHERE role = 'principal') as principals,
        (SELECT COUNT(*) FROM sponsors) as sponsors,
        (SELECT COUNT(*) FROM student_sponsor_mapping) as mappings,
        (SELECT COUNT(*) FROM course_parts) as course_parts,
        (SELECT COUNT(*) FROM academic_year_student_enrollment) as year_enrollments,
        (SELECT COUNT(*) FROM student_subject_enrollment) as subject_enrollments,
        (SELECT COUNT(*) FROM marksheets) as marksheets,
        (SELECT COUNT(*) FROM marks) as marks
    `);

    console.table(summary[0]);
    console.log('\n✅ ALL COMPLETE!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
