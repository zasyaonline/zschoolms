# 🧪 ZSchool Management System - Pre-Production Testing Plan

**Version:** 1.0  
**Date:** December 26, 2024  
**Status:** Ready for Execution

---

## 📋 Executive Summary

This comprehensive testing plan addresses the identified issues:
1. **Data Integrity Issues** - Database inconsistencies between related tables
2. **Frontend-API Integration Issues** - Most pages use mock data instead of real API calls
3. **End-to-End Flow Validation** - Complete user journey testing

---

## 🗂️ Testing Phases Overview

| Phase | Category | Priority | Duration |
|-------|----------|----------|----------|
| 1 | Environment Setup & Health Checks | Critical | 15 min |
| 2 | Database Integrity Validation | Critical | 30 min |
| 3 | Backend API Testing | Critical | 60 min |
| 4 | Frontend-API Integration Testing | High | 45 min |
| 5 | End-to-End User Flow Testing | High | 60 min |
| 6 | Security Testing | Medium | 30 min |
| 7 | Performance Testing | Medium | 20 min |

---

## 📊 Current System State

### Database Summary
```
✅ Teachers: 16
✅ Students: 114
✅ Sponsors: 71
✅ Student-Sponsor Mappings: 104
✅ Academic Years: 7
✅ Subjects: 9
✅ Student Enrollments: 798
✅ Subject Enrollments: 3318
✅ Marksheets: 9254
✅ Marks: 9254
```

### Critical Findings
| Issue | Severity | Location |
|-------|----------|----------|
| Most frontend pages use mock data | **Critical** | StudentList, UserList, etc. |
| Empty test suite | High | backend/tests/ |
| No global state management | Medium | Frontend |
| Missing API integrations | **Critical** | 15+ pages |

---

# 🔬 PHASE 1: Environment Setup & Health Checks

## 1.1 Server Startup Verification

```bash
# Step 1: Clear all ports
lsof -ti:5001 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

# Step 2: Start Backend
cd /Users/zasyaonline/Projects/zschoolms/backend
npm start

# Expected Output:
# ✅ Server is NOW LISTENING and ready to accept requests
# ✅ PostgreSQL Connected Successfully
# 📊 Database: zschool_db
```

### ✅ Checklist - Backend Startup
- [ ] Server starts on port 5001
- [ ] Database connection successful
- [ ] Email service ready
- [ ] No uncaught exceptions

## 1.2 Backend Health Check

```bash
# Test 1: Server alive
curl -s http://localhost:5001/api/health || echo "Health endpoint missing"

# Test 2: API docs accessible
curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/api-docs

# Test 3: CORS headers
curl -s -I http://localhost:5001/api/users -H "Origin: http://localhost:5173" | grep -i "access-control"
```

### Expected Results
| Test | Expected Status |
|------|-----------------|
| Health Check | 200 OK |
| API Docs | 200 OK |
| CORS Headers | Present |

## 1.3 Frontend Startup Verification

```bash
# Start Frontend (new terminal)
cd /Users/zasyaonline/Projects/zschoolms/frontend
npm run dev

# Expected:
# VITE ready in XXX ms
# Local: http://localhost:5173/
```

### ✅ Checklist - Frontend Startup
- [ ] Vite starts on port 5173
- [ ] No build errors
- [ ] Hot reload working

---

# 🗄️ PHASE 2: Database Integrity Validation

## 2.1 Referential Integrity Checks

Execute the following SQL queries to validate data relationships:

### Test 2.1.1: Orphaned Students (No User Association)
```sql
SELECT COUNT(*) as orphaned_students
FROM students s
LEFT JOIN users u ON s.user_id = u.id
WHERE u.id IS NULL;
-- EXPECTED: 0
```

### Test 2.1.2: Students Without School
```sql
SELECT COUNT(*) as students_without_school
FROM students
WHERE school_id IS NULL;
-- EXPECTED: 0 (or documented why some are null)
```

### Test 2.1.3: Orphaned Marksheets
```sql
SELECT COUNT(*) as orphaned_marksheets
FROM marksheets m
LEFT JOIN students s ON m.student_id = s.id
WHERE s.id IS NULL;
-- EXPECTED: 0
```

### Test 2.1.4: Marks Without Marksheet
```sql
SELECT COUNT(*) as orphaned_marks
FROM marks mk
LEFT JOIN marksheets ms ON mk.marksheet_id = ms.id
WHERE ms.id IS NULL;
-- EXPECTED: 0
```

### Test 2.1.5: Student-Sponsor Mapping Integrity
```sql
-- Check for invalid student references
SELECT COUNT(*) as invalid_student_refs
FROM student_sponsor_mappings ssm
LEFT JOIN students s ON ssm.student_id = s.id
WHERE s.id IS NULL;
-- EXPECTED: 0

-- Check for invalid sponsor references
SELECT COUNT(*) as invalid_sponsor_refs
FROM student_sponsor_mappings ssm
LEFT JOIN sponsors sp ON ssm.sponsor_id = sp.id
WHERE sp.id IS NULL;
-- EXPECTED: 0
```

### Test 2.1.6: Enrollment Integrity
```sql
-- Academic Year Enrollment without valid student
SELECT COUNT(*) as invalid_enrollments
FROM academic_year_enrollments aye
LEFT JOIN students s ON aye.student_id = s.id
WHERE s.id IS NULL;
-- EXPECTED: 0

-- Subject Enrollment without valid enrollment
SELECT COUNT(*) as invalid_subject_enrollments
FROM student_subject_enrollments sse
LEFT JOIN academic_year_enrollments aye ON sse.academic_year_enrollment_id = aye.id
WHERE aye.id IS NULL;
-- EXPECTED: 0
```

## 2.2 Data Consistency Checks

### Test 2.2.1: Duplicate Enrollment Numbers
```sql
SELECT enrollment_number, COUNT(*) as count
FROM students
GROUP BY enrollment_number
HAVING COUNT(*) > 1;
-- EXPECTED: No rows returned
```

### Test 2.2.2: Duplicate User Emails
```sql
SELECT email, COUNT(*) as count
FROM users
GROUP BY email
HAVING COUNT(*) > 1;
-- EXPECTED: No rows returned
```

### Test 2.2.3: Invalid Marks (> Max Marks)
```sql
SELECT COUNT(*) as invalid_marks
FROM marks
WHERE marks_obtained > max_marks;
-- EXPECTED: 0
```

### Test 2.2.4: Future Dated Marksheets
```sql
SELECT COUNT(*) as future_marksheets
FROM marksheets
WHERE created_at > NOW();
-- EXPECTED: 0
```

### Test 2.2.5: Inactive Users with Active Sessions
```sql
SELECT COUNT(*) as sessions_for_inactive
FROM refresh_tokens rt
JOIN users u ON rt.user_id = u.id
WHERE u.is_active = false
AND rt.is_revoked = false
AND rt.expires_at > NOW();
-- EXPECTED: 0
```

## 2.3 Automated Database Integrity Script

Create and run this script:

```bash
cd /Users/zasyaonline/Projects/zschoolms/backend
node -e "
import('dotenv').then(d => d.default.config()).then(() => import('sequelize')).then(async ({Sequelize}) => {
  const seq = new Sequelize(process.env.DB_DATABASE, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false
  });
  
  console.log('\\n🔍 DATABASE INTEGRITY CHECK\\n' + '='.repeat(50));
  
  const tests = [
    { name: 'Orphaned Students', query: 'SELECT COUNT(*) as c FROM students s LEFT JOIN users u ON s.user_id = u.id WHERE u.id IS NULL' },
    { name: 'Students w/o School', query: 'SELECT COUNT(*) as c FROM students WHERE school_id IS NULL' },
    { name: 'Invalid Sponsor Mappings', query: 'SELECT COUNT(*) as c FROM student_sponsor_mappings ssm LEFT JOIN students s ON ssm.student_id = s.id WHERE s.id IS NULL' },
    { name: 'Duplicate Enrollments', query: 'SELECT COUNT(*) as c FROM (SELECT enrollment_number FROM students GROUP BY enrollment_number HAVING COUNT(*) > 1) t' },
    { name: 'Invalid Marks (>max)', query: 'SELECT COUNT(*) as c FROM marks WHERE marks_obtained > max_marks' }
  ];
  
  for (const test of tests) {
    try {
      const [result] = await seq.query(test.query);
      const count = result[0].c;
      const status = count === 0 || count === '0' ? '✅' : '❌';
      console.log(\`\${status} \${test.name}: \${count}\`);
    } catch (e) {
      console.log(\`⚠️ \${test.name}: \${e.message}\`);
    }
  }
  
  await seq.close();
  console.log('\\n' + '='.repeat(50));
});
"
```

---

# 🔌 PHASE 3: Backend API Testing

## 3.1 Authentication API Tests

### Test 3.1.1: Login Success
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@zschool.com", "password": "Admin@123"}' \
  -w "\nHTTP Status: %{http_code}\n"

# EXPECTED: 200 OK with accessToken, refreshToken, user object
```

### Test 3.1.2: Login with Invalid Credentials
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@zschool.com", "password": "wrongpassword"}' \
  -w "\nHTTP Status: %{http_code}\n"

# EXPECTED: 401 Unauthorized
```

### Test 3.1.3: Login with Missing Fields
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@zschool.com"}' \
  -w "\nHTTP Status: %{http_code}\n"

# EXPECTED: 400 Bad Request with validation error
```

### Test 3.1.4: Get Current User
```bash
# First get token
TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@zschool.com", "password": "Admin@123"}' | jq -r '.data.accessToken')

# Then test /me endpoint
curl -X GET http://localhost:5001/api/auth/me \
  -H "Authorization: Bearer $TOKEN" \
  -w "\nHTTP Status: %{http_code}\n"

# EXPECTED: 200 OK with user profile
```

### Test 3.1.5: Token Refresh
```bash
# Get refresh token
REFRESH=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@zschool.com", "password": "Admin@123"}' | jq -r '.data.refreshToken')

curl -X POST http://localhost:5001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\": \"$REFRESH\"}" \
  -w "\nHTTP Status: %{http_code}\n"

# EXPECTED: 200 OK with new accessToken
```

### Test 3.1.6: Logout
```bash
TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@zschool.com", "password": "Admin@123"}' | jq -r '.data.accessToken')

curl -X POST http://localhost:5001/api/auth/logout \
  -H "Authorization: Bearer $TOKEN" \
  -w "\nHTTP Status: %{http_code}\n"

# EXPECTED: 200 OK
```

## 3.2 Students API Tests

```bash
# Get token first
export TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@zschool.com", "password": "Admin@123"}' | jq -r '.data.accessToken')
```

### Test 3.2.1: List Students (Paginated)
```bash
curl -s "http://localhost:5001/api/students?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq '.data | length'

# EXPECTED: 10 (or fewer if less data)
```

### Test 3.2.2: Get Student Statistics
```bash
curl -s "http://localhost:5001/api/students/stats" \
  -H "Authorization: Bearer $TOKEN" | jq

# EXPECTED: Object with totalStudents, activeStudents, etc.
```

### Test 3.2.3: Get Single Student
```bash
# Get first student ID
STUDENT_ID=$(curl -s "http://localhost:5001/api/students?limit=1" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data[0].id')

curl -s "http://localhost:5001/api/students/$STUDENT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.success'

# EXPECTED: true
```

### Test 3.2.4: Student Not Found
```bash
curl -s "http://localhost:5001/api/students/00000000-0000-0000-0000-000000000000" \
  -H "Authorization: Bearer $TOKEN" \
  -w "\nHTTP Status: %{http_code}\n"

# EXPECTED: 404 Not Found
```

## 3.3 Sponsors API Tests

### Test 3.3.1: List Sponsors
```bash
curl -s "http://localhost:5001/api/sponsors?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq '.data | length'

# EXPECTED: 10 or actual count
```

### Test 3.3.2: Sponsor Statistics
```bash
curl -s "http://localhost:5001/api/sponsors/stats" \
  -H "Authorization: Bearer $TOKEN" | jq

# EXPECTED: Statistics object
```

### Test 3.3.3: Get Sponsor's Students
```bash
SPONSOR_ID=$(curl -s "http://localhost:5001/api/sponsors?limit=1" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data[0].id')

curl -s "http://localhost:5001/api/sponsors/$SPONSOR_ID/students" \
  -H "Authorization: Bearer $TOKEN" | jq

# EXPECTED: Array of sponsored students
```

## 3.4 Users API Tests

### Test 3.4.1: List Users
```bash
curl -s "http://localhost:5001/api/users" \
  -H "Authorization: Bearer $TOKEN" | jq '.data | length'
```

### Test 3.4.2: Filter Users by Role
```bash
curl -s "http://localhost:5001/api/users?role=teacher" \
  -H "Authorization: Bearer $TOKEN" | jq '.data | length'

# EXPECTED: 16 (based on database summary)
```

### Test 3.4.3: User Statistics
```bash
curl -s "http://localhost:5001/api/users/stats" \
  -H "Authorization: Bearer $TOKEN" | jq
```

## 3.5 Marks API Tests

### Test 3.5.1: Get Pending Marksheets
```bash
curl -s "http://localhost:5001/api/marks/pending" \
  -H "Authorization: Bearer $TOKEN" | jq

# EXPECTED: Array of pending marksheets
```

### Test 3.5.2: Get Student Marks
```bash
STUDENT_ID=$(curl -s "http://localhost:5001/api/students?limit=1" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data[0].id')

curl -s "http://localhost:5001/api/marks/student/$STUDENT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq

# EXPECTED: Student marks data
```

## 3.6 Dashboard & Analytics API Tests

### Test 3.6.1: Dashboard Metrics
```bash
curl -s "http://localhost:5001/api/dashboard/metrics" \
  -H "Authorization: Bearer $TOKEN" | jq

# EXPECTED: Dashboard metrics object
```

### Test 3.6.2: Student Performance Analytics
```bash
curl -s "http://localhost:5001/api/analytics/student-performance" \
  -H "Authorization: Bearer $TOKEN" | jq

# EXPECTED: Performance analytics data
```

## 3.7 Attendance API Tests

### Test 3.7.1: Get Attendance Records
```bash
curl -s "http://localhost:5001/api/attendance" \
  -H "Authorization: Bearer $TOKEN" | jq

# EXPECTED: Attendance records
```

### Test 3.7.2: Get Student Attendance
```bash
STUDENT_ID=$(curl -s "http://localhost:5001/api/students?limit=1" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data[0].id')

curl -s "http://localhost:5001/api/attendance/student/$STUDENT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq
```

## 3.8 Report Cards API Tests

### Test 3.8.1: Get Pending Report Cards
```bash
curl -s "http://localhost:5001/api/report-cards/pending" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Test 3.8.2: Get Student Report Cards
```bash
curl -s "http://localhost:5001/api/report-cards/student/$STUDENT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

# 🖥️ PHASE 4: Frontend-API Integration Testing

## 4.1 Critical Pages Analysis

### Pages Using MOCK DATA (Need API Integration)

| Page | File | Mock Data Evidence | Priority |
|------|------|-------------------|----------|
| StudentList | SystemConfiguration/StudentList.jsx | Static array in useState | **CRITICAL** |
| UserList | UserManagement/UserList.jsx | Hardcoded 8 users | **CRITICAL** |
| MarksEntry | TeacherFlow/MarksEntry.jsx | TODO comment, static data | **CRITICAL** |
| AttendanceEntry | TeacherFlow/AttendanceEntry.jsx | Static 7 students | **CRITICAL** |
| MarksApprovalList | AcademicRecords/MarksApprovalList.jsx | Static 8 entries | High |
| ReportCardList | AcademicRecords/ReportCardList.jsx | Static 8 entries | High |
| SchoolInformationList | SystemConfiguration/SchoolInformationList.jsx | Static 7 schools | Medium |

### Pages With ACTUAL API Integration

| Page | File | API Calls | Status |
|------|------|-----------|--------|
| AdminDashboard | Dashboard/AdminDashboard.jsx | /students, /sponsors, /users | **Working** |
| Login | Auth/Login.jsx | /auth/login | **Working** |

## 4.2 Frontend Integration Tests

### Test 4.2.1: Login Flow
1. Open http://localhost:5173/login
2. Enter credentials: admin@zschool.com / Admin@123
3. Click Login
4. **VERIFY**: 
   - [ ] Redirect to dashboard
   - [ ] No console errors
   - [ ] accessToken stored in localStorage
   - [ ] User info displayed in header

### Test 4.2.2: Dashboard Data Loading
1. Login as admin
2. Navigate to Dashboard
3. **VERIFY**:
   - [ ] Student count displays correctly
   - [ ] Sponsor count displays correctly
   - [ ] Teacher count displays correctly
   - [ ] No "Unable to connect to server" error

### Test 4.2.3: AdminDashboard API Integration
1. Login and navigate to Admin Dashboard
2. Open Browser DevTools (Network tab)
3. **VERIFY**:
   - [ ] Request to /api/students?limit=100 succeeds
   - [ ] Request to /api/sponsors?limit=100 succeeds
   - [ ] Request to /api/users?role=teacher&limit=100 succeeds
   - [ ] Data populates in tables

### Test 4.2.4: StudentList Mock Data Detection
1. Navigate to System Configuration > Students
2. Open DevTools Network tab
3. **EXPECTED ISSUE**: 
   - [ ] NO API calls made to /api/students
   - [ ] Static 6 students shown (not 114 from database)

### Test 4.2.5: UserList Mock Data Detection
1. Navigate to User Management > Users
2. **EXPECTED ISSUE**:
   - [ ] Shows exactly 8 hardcoded users
   - [ ] No API call to /api/users

### Test 4.2.6: Token Expiration Handling
1. Login normally
2. In localStorage, modify accessToken to be invalid
3. Refresh page
4. **VERIFY**:
   - [ ] Redirected to /login
   - [ ] All tokens cleared

### Test 4.2.7: API Error Handling
1. Stop backend server
2. Try to access dashboard
3. **VERIFY**:
   - [ ] User-friendly error message displayed
   - [ ] "Unable to connect to server" message
   - [ ] No unhandled exception

## 4.3 Browser Console Error Monitoring

During all tests, monitor for:
- [ ] No CORS errors
- [ ] No 401/403 unauthorized errors
- [ ] No undefined property access errors
- [ ] No fetch failures (when server is running)

---

# 🔄 PHASE 5: End-to-End User Flow Testing

## 5.1 Admin Flow

### Scenario 5.1.1: Complete Admin Login Flow
```
1. Go to http://localhost:5173
2. System should redirect to /login
3. Enter admin@zschool.com / Admin@123
4. Click Login
5. VERIFY: Lands on dashboard with admin menu items
```

**Expected Results:**
- [ ] Successful login
- [ ] Dashboard loads with real data
- [ ] Sidebar shows admin-specific options
- [ ] User name displayed in header

### Scenario 5.1.2: View Students (Currently Broken)
```
1. Login as admin
2. Navigate: System Configuration > Students
3. EXPECTED ISSUE: Shows mock data, not real students
```

### Scenario 5.1.3: View Sponsors
```
1. Login as admin
2. Navigate to Sponsors section
3. VERIFY: Real sponsor data from API
```

## 5.2 Teacher Flow

### Scenario 5.2.1: Teacher Login
```
1. First, get a teacher's credentials from database
2. Login with teacher account
3. VERIFY: Teacher-specific menu items visible
```

### Scenario 5.2.2: Marks Entry (Currently Broken)
```
1. Login as teacher
2. Navigate: Teacher Flow > Marks Entry
3. EXPECTED ISSUE: Shows mock data
4. TODO: Should load actual enrolled students
```

### Scenario 5.2.3: Attendance Entry (Currently Broken)
```
1. Login as teacher
2. Navigate: Teacher Flow > Attendance
3. EXPECTED ISSUE: Shows mock 7 students
4. TODO: Should load actual class students
```

## 5.3 Student Flow

### Scenario 5.3.1: Student Portal Access
```
1. Get student credentials from database
2. Login as student
3. VERIFY: Limited menu visible
4. EXPECTED ISSUES:
   - MyProfile shows mock data
   - MyAttendance shows mock data
   - MyMarksHistory shows mock data
```

## 5.4 Sponsor Flow

### Scenario 5.4.1: Sponsor Access
```
1. Login as sponsor
2. Navigate to sponsored students view
3. VERIFY: Can see assigned students
```

---

# 🔒 PHASE 6: Security Testing

## 6.1 Authentication Security

### Test 6.1.1: SQL Injection in Login
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@zschool.com\" OR 1=1--", "password": "test"}'

# EXPECTED: 401 or validation error, NOT data leak
```

### Test 6.1.2: Password Brute Force Protection
```bash
# Run 5+ rapid failed logins
for i in {1..10}; do
  curl -s -X POST http://localhost:5001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "admin@zschool.com", "password": "wrong"}' \
    -w "%{http_code}\n"
done

# EXPECTED: Should see 429 Too Many Requests after threshold
```

### Test 6.1.3: Access Protected Route Without Token
```bash
curl -s http://localhost:5001/api/students \
  -w "\nHTTP Status: %{http_code}\n"

# EXPECTED: 401 Unauthorized
```

### Test 6.1.4: Access Protected Route With Invalid Token
```bash
curl -s http://localhost:5001/api/students \
  -H "Authorization: Bearer invalid.token.here" \
  -w "\nHTTP Status: %{http_code}\n"

# EXPECTED: 401 Unauthorized
```

## 6.2 Authorization Security

### Test 6.2.1: Role-Based Access Control
```bash
# Login as a non-admin user (if available) and try admin endpoints
# First, create or identify a teacher account

# Try to delete a user as non-admin
curl -X DELETE http://localhost:5001/api/users/some-id \
  -H "Authorization: Bearer $TEACHER_TOKEN"

# EXPECTED: 403 Forbidden
```

### Test 6.2.2: Cross-User Data Access
```bash
# Try to access another user's data
# Login as student A, try to access student B's data
```

## 6.3 XSS Prevention

### Test 6.3.1: XSS in User Input
```bash
curl -X POST http://localhost:5001/api/students \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "<script>alert(\"xss\")</script>",
    "lastName": "Test"
  }'

# EXPECTED: Sanitized or rejected
```

## 6.4 CORS Validation

### Test 6.4.1: CORS from Unauthorized Origin
```bash
curl -H "Origin: http://malicious-site.com" \
  -H "Access-Control-Request-Method: GET" \
  -X OPTIONS \
  http://localhost:5001/api/students -v

# EXPECTED: No Access-Control-Allow-Origin for malicious origin
```

---

# ⚡ PHASE 7: Performance Testing

## 7.1 API Response Time Tests

### Test 7.1.1: Login Response Time
```bash
time curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@zschool.com", "password": "Admin@123"}' > /dev/null

# EXPECTED: < 500ms
```

### Test 7.1.2: List Students Response Time
```bash
time curl -s "http://localhost:5001/api/students?limit=100" \
  -H "Authorization: Bearer $TOKEN" > /dev/null

# EXPECTED: < 1000ms
```

### Test 7.1.3: Dashboard Metrics Response Time
```bash
time curl -s http://localhost:5001/api/dashboard/metrics \
  -H "Authorization: Bearer $TOKEN" > /dev/null

# EXPECTED: < 500ms
```

## 7.2 Load Testing (Optional)

```bash
# Install ab (Apache Benchmark) if not available
# Run 100 concurrent requests

ab -n 100 -c 10 -H "Authorization: Bearer $TOKEN" \
  http://localhost:5001/api/students?limit=10

# EXPECTED: 
# - 0% failed requests
# - Mean response < 500ms
```

## 7.3 Frontend Performance

### Lighthouse Audit
1. Open Chrome DevTools
2. Go to Lighthouse tab
3. Run audit for:
   - [ ] Performance (target: > 70)
   - [ ] Accessibility (target: > 80)
   - [ ] Best Practices (target: > 80)

---

# 📋 Testing Execution Checklist

## Pre-Test Setup
- [ ] Backend server stopped and restarted fresh
- [ ] Frontend dev server running
- [ ] Database connection verified
- [ ] Browser console/network tabs open

## Phase 1: Environment (/15 min)
- [ ] Backend starts successfully
- [ ] Frontend starts successfully  
- [ ] CORS configured correctly
- [ ] API docs accessible

## Phase 2: Database Integrity (/30 min)
- [ ] No orphaned students
- [ ] No orphaned marksheets
- [ ] No duplicate enrollments
- [ ] Referential integrity intact
- [ ] Data consistency verified

## Phase 3: Backend APIs (/60 min)
- [ ] Auth endpoints working
- [ ] CRUD operations verified
- [ ] Error responses correct
- [ ] Pagination working
- [ ] Filters working

## Phase 4: Frontend Integration (/45 min)
- [ ] Login flow working
- [ ] Dashboard loads real data
- [ ] Mock data pages identified
- [ ] Error handling working
- [ ] Token management correct

## Phase 5: E2E Flows (/60 min)
- [ ] Admin flow complete
- [ ] Teacher flow tested
- [ ] Student flow tested
- [ ] Sponsor flow tested

## Phase 6: Security (/30 min)
- [ ] Auth protection verified
- [ ] Rate limiting working
- [ ] RBAC enforced
- [ ] XSS prevention checked

## Phase 7: Performance (/20 min)
- [ ] API response times acceptable
- [ ] Frontend load performance OK
- [ ] No memory leaks

---

# 🔧 Automated Test Script

Run all backend API tests with this comprehensive script:

```bash
#!/bin/bash
# Save as: test-all-apis.sh

echo "=========================================="
echo "🧪 ZSchool API Test Suite"
echo "=========================================="

BASE_URL="http://localhost:5001/api"
PASS=0
FAIL=0

# Login and get token
echo -e "\n📋 Getting auth token..."
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@zschool.com", "password": "Admin@123"}')

TOKEN=$(echo $RESPONSE | jq -r '.data.accessToken // .accessToken // empty')

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get auth token"
  echo "Response: $RESPONSE"
  exit 1
fi
echo "✅ Auth token obtained"

# Test function
test_endpoint() {
  local method=$1
  local endpoint=$2
  local expected_status=$3
  local name=$4
  
  local status=$(curl -s -o /dev/null -w "%{http_code}" \
    -X $method "$BASE_URL$endpoint" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json")
  
  if [ "$status" == "$expected_status" ]; then
    echo "✅ $name (HTTP $status)"
    ((PASS++))
  else
    echo "❌ $name (Expected: $expected_status, Got: $status)"
    ((FAIL++))
  fi
}

echo -e "\n📋 Testing Auth Endpoints..."
test_endpoint "GET" "/auth/me" "200" "Get current user"

echo -e "\n📋 Testing Student Endpoints..."
test_endpoint "GET" "/students" "200" "List students"
test_endpoint "GET" "/students/stats" "200" "Student stats"

echo -e "\n📋 Testing Sponsor Endpoints..."
test_endpoint "GET" "/sponsors" "200" "List sponsors"
test_endpoint "GET" "/sponsors/stats" "200" "Sponsor stats"

echo -e "\n📋 Testing User Endpoints..."
test_endpoint "GET" "/users" "200" "List users"
test_endpoint "GET" "/users/stats" "200" "User stats"

echo -e "\n📋 Testing Dashboard Endpoints..."
test_endpoint "GET" "/dashboard/metrics" "200" "Dashboard metrics"

echo -e "\n📋 Testing Marks Endpoints..."
test_endpoint "GET" "/marks/pending" "200" "Pending marksheets"

echo -e "\n📋 Testing Attendance Endpoints..."
test_endpoint "GET" "/attendance" "200" "Get attendance"

echo -e "\n📋 Testing Report Card Endpoints..."
test_endpoint "GET" "/report-cards/pending" "200" "Pending report cards"

echo -e "\n=========================================="
echo "📊 Test Results: $PASS passed, $FAIL failed"
echo "=========================================="

if [ $FAIL -gt 0 ]; then
  exit 1
fi
```

---

# 📊 Test Results Template

## Summary
| Phase | Tests | Passed | Failed | Status |
|-------|-------|--------|--------|--------|
| Environment | | | | ⏳ |
| Database | | | | ⏳ |
| Backend APIs | | | | ⏳ |
| Frontend | | | | ⏳ |
| E2E Flows | | | | ⏳ |
| Security | | | | ⏳ |
| Performance | | | | ⏳ |
| **TOTAL** | | | | ⏳ |

## Critical Issues Found
1. 
2. 
3. 

## Recommendations
1. 
2. 
3. 

---

# 📝 Known Issues & Remediation

## Critical (Must Fix Before Production)

### Issue 1: Most Frontend Pages Use Mock Data
**Affected Pages:** StudentList, UserList, MarksEntry, AttendanceEntry, etc.
**Impact:** Users see static demo data, not real database records
**Fix:** Implement API service calls in each affected component

### Issue 2: No Automated Test Suite
**Location:** backend/tests/ (empty)
**Impact:** No regression protection
**Fix:** Add Jest/Mocha tests for critical paths

### Issue 3: Empty State Management
**Location:** frontend/src/context/, frontend/src/hooks/
**Impact:** No centralized state, data fetched repeatedly
**Fix:** Implement Context API or Zustand for shared state

## High Priority

### Issue 4: No Health Check Endpoint
**Fix:** Add GET /api/health endpoint

### Issue 5: Missing Error Boundaries in Some Routes
**Fix:** Wrap all route components

---

*End of Pre-Production Testing Plan*
