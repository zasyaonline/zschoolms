/**
 * Database Integrity Checker
 * Run: node check-db-integrity.js
 * 
 * This script validates data integrity across all database tables
 */

import dotenv from 'dotenv';
import { Sequelize, QueryTypes } from 'sequelize';

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

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  pass: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  fail: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.blue}━━━ ${msg} ━━━${colors.reset}`)
};

let passed = 0;
let failed = 0;
let warnings = 0;

async function runQuery(query, name) {
  try {
    const [result] = await sequelize.query(query, { type: QueryTypes.SELECT });
    return result;
  } catch (error) {
    log.fail(`${name}: Query failed - ${error.message}`);
    failed++;
    return null;
  }
}

async function checkIntegrity(name, query, expectedValue = 0, isWarning = false) {
  const result = await runQuery(query, name);
  
  if (result === null) return;
  
  const count = parseInt(result.count || result.c || 0);
  
  if (count === expectedValue) {
    log.pass(`${name}: ${count}`);
    passed++;
  } else if (isWarning) {
    log.warn(`${name}: ${count} (expected ${expectedValue})`);
    warnings++;
  } else {
    log.fail(`${name}: ${count} (expected ${expectedValue})`);
    failed++;
  }
}

async function getCount(tableName) {
  const result = await runQuery(`SELECT COUNT(*) as count FROM ${tableName}`, tableName);
  return result ? parseInt(result.count) : 0;
}

async function runIntegrityChecks() {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 DATABASE INTEGRITY CHECK');
  console.log('='.repeat(60));
  console.log(`Database: ${process.env.DB_DATABASE}`);
  console.log(`Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
  console.log(`Date: ${new Date().toISOString()}`);

  // ================================================================
  // TABLE COUNTS
  // ================================================================
  log.section('Table Record Counts');
  
  const tables = [
    'users', 'students', 'sponsors', 'student_sponsor_mappings',
    'academic_years', 'subjects', 'academic_year_enrollments',
    'student_subject_enrollments', 'marksheets', 'marks',
    'attendance', 'report_cards', 'refresh_tokens', 'audit_logs'
  ];
  
  for (const table of tables) {
    try {
      const count = await getCount(table);
      log.info(`${table}: ${count} records`);
    } catch (e) {
      log.warn(`${table}: Table may not exist or is empty`);
    }
  }

  // ================================================================
  // REFERENTIAL INTEGRITY
  // ================================================================
  log.section('Referential Integrity Checks');

  // Students without associated users
  await checkIntegrity(
    'Orphaned students (no user)',
    `SELECT COUNT(*) as count FROM students s 
     LEFT JOIN users u ON s.user_id = u.id 
     WHERE u.id IS NULL AND s.user_id IS NOT NULL`
  );

  // Students without school (might be valid)
  await checkIntegrity(
    'Students without school_id',
    `SELECT COUNT(*) as count FROM students WHERE school_id IS NULL`,
    0,
    true // Warning only
  );

  // Marksheets without valid students
  await checkIntegrity(
    'Orphaned marksheets (no student)',
    `SELECT COUNT(*) as count FROM marksheets m 
     LEFT JOIN students s ON m.student_id = s.id 
     WHERE s.id IS NULL AND m.student_id IS NOT NULL`
  );

  // Marks without valid marksheets
  await checkIntegrity(
    'Orphaned marks (no marksheet)',
    `SELECT COUNT(*) as count FROM marks mk 
     LEFT JOIN marksheets ms ON mk.marksheet_id = ms.id 
     WHERE ms.id IS NULL AND mk.marksheet_id IS NOT NULL`
  );

  // Student-Sponsor mappings with invalid students
  await checkIntegrity(
    'Invalid sponsor mappings (no student)',
    `SELECT COUNT(*) as count FROM student_sponsor_mappings ssm 
     LEFT JOIN students s ON ssm.student_id = s.id 
     WHERE s.id IS NULL`
  );

  // Student-Sponsor mappings with invalid sponsors
  await checkIntegrity(
    'Invalid sponsor mappings (no sponsor)',
    `SELECT COUNT(*) as count FROM student_sponsor_mappings ssm 
     LEFT JOIN sponsors sp ON ssm.sponsor_id = sp.id 
     WHERE sp.id IS NULL`
  );

  // Academic year enrollments without students
  await checkIntegrity(
    'Orphaned academic enrollments',
    `SELECT COUNT(*) as count FROM academic_year_enrollments aye 
     LEFT JOIN students s ON aye.student_id = s.id 
     WHERE s.id IS NULL`
  );

  // Subject enrollments without academic enrollment
  await checkIntegrity(
    'Orphaned subject enrollments',
    `SELECT COUNT(*) as count FROM student_subject_enrollments sse 
     LEFT JOIN academic_year_enrollments aye ON sse.academic_year_enrollment_id = aye.id 
     WHERE aye.id IS NULL`
  );

  // Report cards without students
  await checkIntegrity(
    'Orphaned report cards',
    `SELECT COUNT(*) as count FROM report_cards rc 
     LEFT JOIN students s ON rc.student_id = s.id 
     WHERE s.id IS NULL AND rc.student_id IS NOT NULL`
  );

  // Attendance without students
  await checkIntegrity(
    'Orphaned attendance records',
    `SELECT COUNT(*) as count FROM attendance a 
     LEFT JOIN students s ON a.student_id = s.id 
     WHERE s.id IS NULL AND a.student_id IS NOT NULL`
  );

  // ================================================================
  // DATA CONSISTENCY
  // ================================================================
  log.section('Data Consistency Checks');

  // Duplicate enrollment numbers
  await checkIntegrity(
    'Duplicate enrollment numbers',
    `SELECT COUNT(*) as count FROM (
       SELECT enrollment_number FROM students 
       WHERE enrollment_number IS NOT NULL
       GROUP BY enrollment_number HAVING COUNT(*) > 1
     ) t`
  );

  // Duplicate user emails
  await checkIntegrity(
    'Duplicate user emails',
    `SELECT COUNT(*) as count FROM (
       SELECT email FROM users 
       WHERE email IS NOT NULL
       GROUP BY email HAVING COUNT(*) > 1
     ) t`
  );

  // Invalid marks (marks > max_marks)
  await checkIntegrity(
    'Invalid marks (exceeds maximum)',
    `SELECT COUNT(*) as count FROM marks 
     WHERE marks_obtained > max_marks`
  );

  // Negative marks
  await checkIntegrity(
    'Negative marks',
    `SELECT COUNT(*) as count FROM marks 
     WHERE marks_obtained < 0`
  );

  // Future dated records
  await checkIntegrity(
    'Future dated marksheets',
    `SELECT COUNT(*) as count FROM marksheets 
     WHERE created_at > NOW()`
  );

  // Inactive users with active refresh tokens
  await checkIntegrity(
    'Active sessions for inactive users',
    `SELECT COUNT(*) as count FROM refresh_tokens rt
     JOIN users u ON rt.user_id = u.id
     WHERE u.is_active = false 
     AND rt.is_revoked = false 
     AND rt.expires_at > NOW()`
  );

  // ================================================================
  // BUSINESS LOGIC VALIDATION
  // ================================================================
  log.section('Business Logic Validation');

  // Students with multiple active sponsors (might be valid)
  const multiSponsors = await runQuery(
    `SELECT COUNT(*) as count FROM (
       SELECT student_id, COUNT(*) as sponsor_count
       FROM student_sponsor_mappings
       WHERE status = 'active'
       GROUP BY student_id
       HAVING COUNT(*) > 1
     ) t`,
    'Multiple active sponsors'
  );
  if (multiSponsors && parseInt(multiSponsors.count) > 0) {
    log.warn(`Students with multiple active sponsors: ${multiSponsors.count}`);
    warnings++;
  } else {
    log.pass('Students with multiple active sponsors: 0');
    passed++;
  }

  // Marksheets with status conflicts
  await checkIntegrity(
    'Approved marksheets without approval date',
    `SELECT COUNT(*) as count FROM marksheets 
     WHERE status = 'approved' AND approved_at IS NULL`,
    0,
    true
  );

  // Students with enrollment but no marks
  const noMarks = await runQuery(
    `SELECT COUNT(DISTINCT sse.id) as count 
     FROM student_subject_enrollments sse
     LEFT JOIN marksheets m ON sse.id = m.student_subject_enrollment_id
     WHERE m.id IS NULL`,
    'Enrollments without marks'
  );
  if (noMarks) {
    log.info(`Subject enrollments without marks: ${noMarks.count} (may be pending)`);
  }

  // ================================================================
  // DATA QUALITY
  // ================================================================
  log.section('Data Quality Checks');

  // Users without names
  await checkIntegrity(
    'Users without first name',
    `SELECT COUNT(*) as count FROM users 
     WHERE first_name IS NULL OR first_name = ''`,
    0,
    true
  );

  // Students without enrollment numbers
  await checkIntegrity(
    'Students without enrollment number',
    `SELECT COUNT(*) as count FROM students 
     WHERE enrollment_number IS NULL OR enrollment_number = ''`
  );

  // Sponsors without email
  await checkIntegrity(
    'Sponsors without email',
    `SELECT COUNT(*) as count FROM sponsors 
     WHERE email IS NULL OR email = ''`,
    0,
    true
  );

  // ================================================================
  // SUMMARY
  // ================================================================
  console.log('\n' + '='.repeat(60));
  console.log('📊 INTEGRITY CHECK SUMMARY');
  console.log('='.repeat(60));
  console.log(`${colors.green}✅ Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${failed}${colors.reset}`);
  console.log(`${colors.yellow}⚠️  Warnings: ${warnings}${colors.reset}`);
  console.log('='.repeat(60));

  if (failed === 0) {
    console.log(`\n${colors.green}🎉 DATABASE INTEGRITY CHECK PASSED${colors.reset}\n`);
  } else {
    console.log(`\n${colors.red}⚠️  DATABASE HAS INTEGRITY ISSUES - Review above${colors.reset}\n`);
  }

  await sequelize.close();
  process.exit(failed > 0 ? 1 : 0);
}

// Run the checks
runIntegrityChecks().catch(async (error) => {
  console.error(`\n${colors.red}Fatal error: ${error.message}${colors.reset}`);
  await sequelize.close();
  process.exit(1);
});
