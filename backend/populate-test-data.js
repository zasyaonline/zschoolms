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

// Helper functions
const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const randomGrade = () => {
  const grades = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  return grades[Math.floor(Math.random() * grades.length)];
};

const randomSection = () => {
  const sections = ['A', 'B', 'C', 'D'];
  return sections[Math.floor(Math.random() * sections.length)];
};

const randomMarks = (min = 35, max = 100) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

async function populateTestData() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database:', process.env.DB_DATABASE);

    const hashedPassword = await bcrypt.hash('Test@123', 10);
    
    // Get existing admin user
    const [adminUsers] = await sequelize.query(`SELECT id FROM users WHERE email = 'admin@zschool.com'`);
    const adminId = adminUsers[0]?.id;

    console.log('\n📝 Starting test data population...\n');

    // 1. Create Principal
    console.log('1️⃣  Creating Principal...');
    const [principalResult] = await sequelize.query(`
      INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active, created_at)
      VALUES (gen_random_uuid(), 'principal@zschool.com', :password, 'Dr. Sarah', 'Johnson', 'admin', true, NOW())
      ON CONFLICT (email) DO UPDATE SET password_hash = :password
      RETURNING id
    `, { replacements: { password: hashedPassword } });
    console.log('   ✅ Principal created');

    // 2. Create 15 Teachers
    console.log('\n2️⃣  Creating 15 Teachers...');
    const teacherNames = [
      ['Michael', 'Anderson'], ['Emily', 'Brown'], ['James', 'Davis'],
      ['Jennifer', 'Wilson'], ['Robert', 'Martinez'], ['Linda', 'Garcia'],
      ['David', 'Rodriguez'], ['Mary', 'Hernandez'], ['John', 'Lopez'],
      ['Patricia', 'Gonzalez'], ['William', 'Perez'], ['Barbara', 'Taylor'],
      ['Richard', 'Thomas'], ['Susan', 'Moore'], ['Joseph', 'Jackson']
    ];

    const teacherIds = [];
    for (let i = 0; i < teacherNames.length; i++) {
      const [firstName, lastName] = teacherNames[i];
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@zschool.com`;
      
      const [result] = await sequelize.query(`
        INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active, created_at)
        VALUES (gen_random_uuid(), :email, :password, :firstName, :lastName, 'teacher', true, NOW())
        ON CONFLICT (email) DO UPDATE SET password_hash = :password
        RETURNING id
      `, { replacements: { email, password: hashedPassword, firstName, lastName } });
      
      teacherIds.push(result[0].id);
    }
    console.log(`   ✅ ${teacherIds.length} teachers created`);

    // 3. Create 70 Sponsors
    console.log('\n3️⃣  Creating 70 Sponsors...');
    const firstNames = ['Alex', 'Chris', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn', 'Sage'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor'];
    
    const sponsorIds = [];
    for (let i = 1; i <= 70; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const name = `${firstName} ${lastName}`;
      const email = `sponsor${i}@example.com`;
      const phone = `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`;
      
      const [result] = await sequelize.query(`
        INSERT INTO sponsors (id, name, email, phone_number, created_at)
        VALUES (gen_random_uuid(), :name, :email, :phone, NOW())
        ON CONFLICT (email) DO UPDATE SET phone_number = :phone
        RETURNING id
      `, { replacements: { name, email, phone } });
      
      sponsorIds.push(result[0].id);
    }
    console.log(`   ✅ ${sponsorIds.length} sponsors created`);

    // 4. Create 100 Students
    console.log('\n4️⃣  Creating 100 Students...');
    const studentNames = [
      'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason', 'Isabella', 'William',
      'Mia', 'James', 'Charlotte', 'Benjamin', 'Amelia', 'Lucas', 'Harper', 'Henry', 'Evelyn', 'Alexander'
    ];
    
    const genders = ['male', 'female'];
    const studentIds = [];
    
    for (let i = 1; i <= 100; i++) {
      const firstName = studentNames[Math.floor(Math.random() * studentNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const email = `student${i}@zschool.com`;
      const enrollmentNumber = `ENR2024${String(i).padStart(4, '0')}`;
      const grade = randomGrade();
      const section = randomSection();
      const gender = genders[Math.floor(Math.random() * genders.length)];
      const dob = randomDate(new Date(2005, 0, 1), new Date(2015, 11, 31));
      const admissionDate = randomDate(new Date(2020, 0, 1), new Date(2024, 11, 31));
      
      // Create user account for student
      const [userResult] = await sequelize.query(`
        INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active, created_at)
        VALUES (gen_random_uuid(), :email, :password, :firstName, :lastName, 'student', true, NOW())
        ON CONFLICT (email) DO UPDATE SET password_hash = :password
        RETURNING id
      `, { replacements: { email, password: hashedPassword, firstName, lastName } });
      
      const userId = userResult[0].id;
      
      // Create student record
      const [studentResult] = await sequelize.query(`
        INSERT INTO students (
          id, user_id, enrollment_number, date_of_birth, gender,
          admission_date, current_class, section, is_active, created_at
        ) VALUES (
          gen_random_uuid(), :userId, :enrollmentNumber, :dob, :gender,
          :admissionDate, :grade, :section, true, NOW()
        )
        ON CONFLICT (enrollment_number) DO UPDATE SET current_class = :grade
        RETURNING id
      `, { 
        replacements: { 
          userId, enrollmentNumber, dob: dob.toISOString().split('T')[0],
          gender, admissionDate: admissionDate.toISOString().split('T')[0],
          grade, section
        } 
      });
      
      studentIds.push({ id: studentResult[0].id, userId, grade, section });
    }
    console.log(`   ✅ ${studentIds.length} students created`);

    // 5. Create Student-Sponsor Mappings (60% of students have sponsors)
    console.log('\n5️⃣  Creating Student-Sponsor Mappings...');
    let mappingCount = 0;
    for (let i = 0; i < 60; i++) {
      const studentId = studentIds[i].id;
      const sponsorId = sponsorIds[Math.floor(Math.random() * sponsorIds.length)];
      const startDate = randomDate(new Date(2022, 0, 1), new Date(2024, 11, 31));
      
      try {
        await sequelize.query(`
          INSERT INTO student_sponsor_mapping (student_id, sponsor_id, start_date, created_at)
          VALUES (:studentId, :sponsorId, :startDate, NOW())
          ON CONFLICT (student_id, sponsor_id) DO NOTHING
        `, { replacements: { studentId, sponsorId, startDate: startDate.toISOString().split('T')[0] } });
        mappingCount++;
      } catch (err) {
        // Skip duplicates
      }
    }
    console.log(`   ✅ ${mappingCount} student-sponsor mappings created`);

    // 6. Create Subjects first
    console.log('\n6️⃣  Creating Subjects...');
    const subjects = [
      { name: 'Mathematics', code: 'MATH', class: '10', maxMarks: 100, passingMarks: 33 },
      { name: 'Science', code: 'SCI', class: '10', maxMarks: 100, passingMarks: 33 },
      { name: 'English', code: 'ENG', class: '10', maxMarks: 100, passingMarks: 33 },
      { name: 'Social Studies', code: 'SST', class: '10', maxMarks: 100, passingMarks: 33 },
      { name: 'Hindi', code: 'HIN', class: '10', maxMarks: 100, passingMarks: 33 },
      { name: 'Computer Science', code: 'CS', class: '10', maxMarks: 100, passingMarks: 33 }
    ];
    
    const subjectIds = [];
    for (const subject of subjects) {
      try {
        const [result] = await sequelize.query(`
          INSERT INTO subjects (
            id, name, code, class, max_marks, passing_marks, is_active, created_at
          ) VALUES (
            gen_random_uuid(), :name, :code, :class, :maxMarks, :passingMarks, true, NOW()
          )
          RETURNING id
        `, {
          replacements: {
            name: subject.name,
            code: subject.code,
            class: subject.class,
            maxMarks: subject.maxMarks,
            passingMarks: subject.passingMarks
          }
        });
        subjectIds.push({ id: result[0].id, name: subject.name });
      } catch (err) {
        // Subject might already exist, skip
      }
    }
    console.log(`   ✅ ${subjectIds.length} subjects created`);

    // 7. Create Marksheets and Marks (3 years: 2022-2023, 2023-2024, 2024-2025)
    console.log('\n7️⃣  Creating Marksheets and Marks (3 years)...');
    let marksheetCount = 0;
    let marksCount = 0;
    const terms = ['term1', 'term2', 'final'];
    const academicYears = ['2022-2023', '2023-2024', '2024-2025'];
    
    for (const studentData of studentIds) {
      for (const year of academicYears) {
        for (const term of terms) {
          try {
            // Create marksheet first
            const [marksheetResult] = await sequelize.query(`
              INSERT INTO marksheets (
                id, student_id, class, section, term, academic_year, status, 
                submitted_by, submitted_at, reviewed_by, reviewed_at, created_at
              ) VALUES (
                gen_random_uuid(), :studentId, '10', 'A', :term, :year, 'approved',
                :submittedBy, NOW() - INTERVAL '30 days',
                :reviewedBy, NOW() - INTERVAL '25 days', NOW()
              )
              RETURNING id
            `, {
              replacements: {
                studentId: studentData.id,
                term: term,
                year: year,
                submittedBy: teacherIds[Math.floor(Math.random() * teacherIds.length)],
                reviewedBy: principalId
              }
            });
            const marksheetId = marksheetResult[0].id;
            marksheetCount++;
            
            // Create marks for each subject
            for (const subject of subjectIds) {
              const marksObtained = Math.floor(Math.random() * 40) + 60; // 60-100
              const grade = marksObtained >= 90 ? 'A+' : marksObtained >= 80 ? 'A' : marksObtained >= 70 ? 'B' : marksObtained >= 60 ? 'C' : 'D';
              const percentage = marksObtained;
              
              await sequelize.query(`
                INSERT INTO marks (
                  id, marksheet_id, subject_id, marks_obtained, max_marks, grade, percentage, created_at
                ) VALUES (
                  gen_random_uuid(), :marksheetId, :subjectId, :marksObtained, 100, :grade, :percentage, NOW()
                )
              `, {
                replacements: {
                  marksheetId: marksheetId,
                  subjectId: subject.id,
                  marksObtained: marksObtained,
                  grade: grade,
                  percentage: percentage
                }
              });
              marksCount++;
            }
          } catch (err) {
            // Skip duplicates or errors
            console.log(`     ⚠️  Skipped marksheet for student ${studentData.id}, ${year}, ${term}`);
          }
        }
      }
    }
    console.log(`   ✅ ${marksheetCount} marksheets created`);
    console.log(`   ✅ ${marksCount} marks entries created`);

    // 8. Create Attendance Records (last 6 months)
    console.log('\n8️⃣  Creating Attendance Records (6 months)...');
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);
    const endDate = new Date();
    
    let attendanceCount = 0;
    for (const student of studentIds) {
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        // Skip weekends
        if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
          const statuses = ['present', 'present', 'present', 'present', 'present', 'absent', 'late', 'excused'];
          const status = statuses[Math.floor(Math.random() * statuses.length)];
          const teacherId = teacherIds[Math.floor(Math.random() * teacherIds.length)];
          
          try {
            await sequelize.query(`
              INSERT INTO attendance (
                id, student_id, date, class, section, status, marked_by, created_at
              ) VALUES (
                gen_random_uuid(), :studentId, :date, '10', 'A', :status, :teacherId, NOW()
              )
              ON CONFLICT (student_id, date) DO NOTHING
            `, {
              replacements: {
                studentId: student.id,
                date: currentDate.toISOString().split('T')[0],
                status,
                teacherId
              }
            });
            attendanceCount++;
          } catch (err) {
            // Skip duplicates
          }
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    console.log(`   ✅ ${attendanceCount} attendance records created`);

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Test Data Population Complete!');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`   • 1 Principal`);
    console.log(`   • ${teacherIds.length} Teachers`);
    console.log(`   • ${studentIds.length} Students`);
    console.log(`   • ${sponsorIds.length} Sponsors`);
    console.log(`   • ${mappingCount} Student-Sponsor Mappings`);
    console.log(`   • ${marksCount} Marks Records (3 years)`);
    console.log(`   • ${attendanceCount} Attendance Records (6 months)`);
    console.log('\n🔐 Login Credentials (all users):');
    console.log('   • Password: Test@123');
    console.log('\n📧 Sample Accounts:');
    console.log('   • Principal: principal@zschool.com');
    console.log('   • Teacher: michael.anderson@zschool.com');
    console.log('   • Student: student1@zschool.com');
    console.log('   • Admin: admin@zschool.com / Admin@123');
    console.log('='.repeat(60) + '\n');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

populateTestData();
