# 🎯 ZSchool Management System - API Implementation Plan

**Status**: Ready for Review  
**Date**: December 22, 2025  
**Node Version**: v20.19.6 LTS  
**Database**: PostgreSQL (Connected ✅)

---

## 📊 Executive Summary

This plan outlines the complete API development strategy for ZSchool Management System with **38 API endpoints** across 8 major modules, following industry best practices with enterprise-grade security, scalability, and maintainability.

### Current Status Analysis
- ✅ Backend: Express.js with ES6 modules configured
- ✅ Database: PostgreSQL connected (63.250.52.24:5432)
- ✅ Existing: User model with basic authentication
- ✅ Frontend: 35+ React pages requiring API integration
- ⚠️ Missing: 90% of required database models and APIs

---

## 🏗️ Architecture Overview

### Technology Stack (Industry Standard)
```
Backend Framework:  Express.js 4.21.2
Database:           PostgreSQL 15+ with Sequelize ORM 6.37.5
Authentication:     JWT + Refresh Tokens
File Storage:       AWS S3 / Local (configurable)
Security:           Helmet, Rate Limiting, CORS, Input Validation
API Documentation:  OpenAPI 3.0 (Swagger)
Testing:            Jest + Supertest
Logging:            Winston + Morgan
```

### Design Principles
1. **RESTful Design**: Standard HTTP methods and status codes
2. **Stateless Architecture**: JWT-based authentication
3. **Role-Based Access Control (RBAC)**: 5 roles with granular permissions
4. **Layered Architecture**: Routes → Controllers → Services → Models
5. **Error Handling**: Centralized with custom error classes
6. **Validation**: Request validation at middleware level
7. **Audit Trail**: All critical operations logged
8. **Rate Limiting**: Protection against abuse
9. **Data Encryption**: Bcrypt for passwords, encrypted sensitive data
10. **API Versioning**: /api/v1 prefix for future compatibility

---

## 🗄️ Database Schema Design

### Core Entities & Relationships

#### 1. Users & Authentication
```sql
users
├── id (UUID, PK)
├── username (UNIQUE, NOT NULL)
├── email (UNIQUE, NOT NULL)
├── password_hash (NOT NULL)
├── first_name
├── last_name
├── role (ENUM: super_admin, admin, principal, teacher, student)
├── is_active (BOOLEAN, DEFAULT true)
├── mfa_secret (TEXT) -- For 2FA
├── mfa_enabled (BOOLEAN, DEFAULT false)
├── last_login_at (TIMESTAMP)
├── password_reset_token
├── password_reset_expires
├── created_at
├── updated_at
└── deleted_at (soft delete)

refresh_tokens
├── id (UUID, PK)
├── user_id (FK → users)
├── token (TEXT, UNIQUE)
├── expires_at
├── created_at
└── is_revoked (BOOLEAN)
```

#### 2. Schools & Configuration
```sql
schools
├── id (UUID, PK)
├── name (NOT NULL)
├── code (UNIQUE)
├── address
├── city
├── state
├── country
├── postal_code
├── phone
├── email
├── website
├── logo_url
├── principal_name
├── established_year
├── is_active
├── created_at
└── updated_at

grading_schemes
├── id (UUID, PK)
├── school_id (FK → schools)
├── name (NOT NULL)
├── description
├── is_default (BOOLEAN)
├── is_active
└── created_at

grading_scheme_rules
├── id (UUID, PK)
├── scheme_id (FK → grading_schemes)
├── grade (e.g., 'A+', 'A', 'B')
├── min_percentage (DECIMAL)
├── max_percentage (DECIMAL)
├── grade_point (DECIMAL)
├── description
└── display_order
```

#### 3. Students & Sponsors
```sql
students
├── id (UUID, PK)
├── admission_no (UNIQUE, NOT NULL)
├── user_id (FK → users, NULLABLE) -- Links to user account if student has login
├── first_name (NOT NULL)
├── last_name (NOT NULL)
├── date_of_birth
├── gender (ENUM: male, female, other)
├── blood_group
├── address
├── city
├── state
├── postal_code
├── phone
├── email
├── photo_url
├── roll_number
├── current_grade
├── current_section
├── admission_date
├── guardian_name
├── guardian_relation
├── guardian_phone
├── guardian_email
├── guardian_occupation
├── guardian_address
├── emergency_contact_name
├── emergency_contact_phone
├── medical_conditions
├── status (ENUM: active, inactive, graduated, transferred)
├── created_at
└── updated_at

sponsors
├── id (UUID, PK)
├── name (NOT NULL)
├── type (ENUM: individual, organization, foundation)
├── email
├── phone
├── country
├── address
├── contact_person
├── donation_amount (DECIMAL)
├── currency
├── notes
├── is_active
├── created_at
└── updated_at

sponsor_student_mappings
├── id (UUID, PK)
├── sponsor_id (FK → sponsors)
├── student_id (FK → students)
├── mapping_type (ENUM: full, partial)
├── start_date
├── end_date (NULLABLE)
├── amount (DECIMAL)
├── currency
├── status (ENUM: active, ended, suspended)
├── notes
├── created_at
└── updated_at
```

#### 4. Academic Structure
```sql
academic_years
├── id (UUID, PK)
├── school_id (FK → schools)
├── name (e.g., '2024-2025')
├── start_date
├── end_date
├── is_current (BOOLEAN)
└── created_at

grades
├── id (UUID, PK)
├── school_id (FK → schools)
├── name (e.g., 'Grade 10')
├── grade_level (INTEGER)
├── description
└── is_active

sections
├── id (UUID, PK)
├── grade_id (FK → grades)
├── name (e.g., 'A', 'B')
├── capacity (INTEGER)
├── room_number
└── is_active

subjects
├── id (UUID, PK)
├── school_id (FK → schools)
├── name (NOT NULL)
├── code (UNIQUE)
├── description
├── total_marks (INTEGER)
├── passing_marks (INTEGER)
├── is_active
└── created_at

grade_subjects
├── id (UUID, PK)
├── grade_id (FK → grades)
├── subject_id (FK → subjects)
├── is_optional (BOOLEAN)
└── created_at

teacher_assignments
├── id (UUID, PK)
├── teacher_id (FK → users)
├── grade_id (FK → grades)
├── section_id (FK → sections)
├── subject_id (FK → subjects)
├── academic_year_id (FK → academic_years)
├── is_class_teacher (BOOLEAN)
└── created_at
```

#### 5. Attendance Management
```sql
attendance
├── id (UUID, PK)
├── student_id (FK → students)
├── grade_id (FK → grades)
├── section_id (FK → sections)
├── academic_year_id (FK → academic_years)
├── date (DATE, NOT NULL)
├── status (ENUM: present, absent, late, excused, sick_leave, authorized_leave)
├── remarks
├── marked_by (FK → users)
├── marked_at (TIMESTAMP)
├── created_at
└── updated_at
└── UNIQUE(student_id, date)
```

#### 6. Marks & Examination
```sql
exam_types
├── id (UUID, PK)
├── school_id (FK → schools)
├── name (e.g., 'Mid Semester', 'Final Exam')
├── code
├── weightage (DECIMAL) -- Contribution to final grade
├── is_active
└── created_at

marksheets
├── id (UUID, PK)
├── academic_year_id (FK → academic_years)
├── exam_type_id (FK → exam_types)
├── grade_id (FK → grades)
├── section_id (FK → sections)
├── subject_id (FK → subjects)
├── teacher_id (FK → users)
├── status (ENUM: draft, submitted, approved, rejected)
├── submission_date
├── approved_by (FK → users, NULLABLE)
├── approved_at (TIMESTAMP, NULLABLE)
├── rejection_reason (TEXT, NULLABLE)
├── rejected_by (FK → users, NULLABLE)
├── rejected_at (TIMESTAMP, NULLABLE)
├── total_marks (INTEGER)
├── created_at
└── updated_at

marks
├── id (UUID, PK)
├── marksheet_id (FK → marksheets)
├── student_id (FK → students)
├── marks_obtained (DECIMAL)
├── is_absent (BOOLEAN, DEFAULT false)
├── remarks
├── created_at
└── updated_at
└── UNIQUE(marksheet_id, student_id)

mark_comments
├── id (UUID, PK)
├── marksheet_id (FK → marksheets)
├── comment_by (FK → users)
├── comment (TEXT)
├── created_at
└── updated_at
```

#### 7. Report Cards
```sql
report_cards
├── id (UUID, PK)
├── student_id (FK → students)
├── academic_year_id (FK → academic_years)
├── exam_type_id (FK → exam_types)
├── grade_id (FK → grades)
├── section_id (FK → sections)
├── generation_status (ENUM: pending, processing, generated, failed)
├── pdf_url (TEXT) -- S3 URL or local path
├── generated_by (FK → users)
├── generated_at (TIMESTAMP)
├── is_signed (BOOLEAN, DEFAULT false)
├── signed_by (FK → users, NULLABLE)
├── signed_at (TIMESTAMP, NULLABLE)
├── signature_certificate_id (FK → digital_certificates, NULLABLE)
├── is_distributed (BOOLEAN, DEFAULT false)
├── distributed_at (TIMESTAMP, NULLABLE)
├── created_at
└── updated_at

report_card_subjects
├── id (UUID, PK)
├── report_card_id (FK → report_cards)
├── subject_id (FK → subjects)
├── marks_obtained (DECIMAL)
├── total_marks (INTEGER)
├── grade
├── remarks
└── created_at

report_distributions
├── id (UUID, PK)
├── report_card_id (FK → report_cards)
├── recipient_email
├── recipient_type (ENUM: student, guardian, sponsor)
├── sent_at (TIMESTAMP)
├── opened_at (TIMESTAMP, NULLABLE)
├── download_count (INTEGER, DEFAULT 0)
└── created_at
```

#### 8. Security & Audit
```sql
digital_certificates
├── id (UUID, PK)
├── school_id (FK → schools)
├── certificate_name
├── issuer
├── valid_from
├── valid_until
├── certificate_file_path (TEXT) -- Encrypted storage
├── private_key_hash (TEXT) -- Encrypted
├── is_active
├── uploaded_by (FK → users)
├── created_at
└── updated_at

audit_logs
├── id (UUID, PK)
├── user_id (FK → users, NULLABLE)
├── action (e.g., 'USER_LOGIN', 'MARKS_APPROVED', 'STUDENT_CREATED')
├── entity_type (e.g., 'USER', 'MARKS', 'STUDENT')
├── entity_id (UUID, NULLABLE)
├── old_values (JSONB, NULLABLE)
├── new_values (JSONB, NULLABLE)
├── ip_address
├── user_agent
├── status (ENUM: success, failed)
├── error_message (TEXT, NULLABLE)
├── created_at
└── INDEX on (user_id, created_at)

system_settings
├── id (UUID, PK)
├── school_id (FK → schools, NULLABLE) -- NULL for global settings
├── key (VARCHAR, UNIQUE)
├── value (JSONB)
├── description
├── category (e.g., 'general', 'email', 'grading')
├── is_encrypted (BOOLEAN)
├── updated_by (FK → users)
├── created_at
└── updated_at
```

### Database Indexes (Performance Optimization)
```sql
-- Authentication
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);

-- Students
CREATE INDEX idx_students_admission_no ON students(admission_no);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_grade_section ON students(current_grade, current_section);

-- Sponsors
CREATE INDEX idx_sponsor_mappings_sponsor_id ON sponsor_student_mappings(sponsor_id);
CREATE INDEX idx_sponsor_mappings_student_id ON sponsor_student_mappings(student_id);
CREATE INDEX idx_sponsor_mappings_status ON sponsor_student_mappings(status);

-- Attendance
CREATE INDEX idx_attendance_student_date ON attendance(student_id, date);
CREATE INDEX idx_attendance_grade_section_date ON attendance(grade_id, section_id, date);

-- Marks
CREATE INDEX idx_marksheets_status ON marksheets(status);
CREATE INDEX idx_marksheets_teacher_id ON marksheets(teacher_id);
CREATE INDEX idx_marks_student_id ON marks(student_id);

-- Report Cards
CREATE INDEX idx_report_cards_student_id ON report_cards(student_id);
CREATE INDEX idx_report_cards_status ON report_cards(generation_status);

-- Audit Logs
CREATE INDEX idx_audit_logs_user_action ON audit_logs(user_id, action, created_at);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
```

---

## 🔐 Security Architecture

### Authentication & Authorization Flow
```
1. Login (POST /api/auth/login)
   ├── Email/Password validation
   ├── Bcrypt password verification
   ├── Check user active status
   ├── Generate Access Token (15min expiry)
   ├── Generate Refresh Token (30 days expiry)
   ├── Store refresh token in database
   ├── Update last_login_at
   └── Log audit event

2. MFA Verification (POST /api/auth/mfa-verify) [Super Admin/Principal only]
   ├── Validate Access Token
   ├── Verify TOTP code (Google Authenticator)
   ├── Generate new signed token
   └── Log MFA success

3. Token Refresh (POST /api/auth/refresh)
   ├── Validate Refresh Token
   ├── Check token not revoked
   ├── Generate new Access Token
   └── Return new token pair

4. Password Reset (POST /api/auth/password-reset) [Super Admin only]
   ├── Verify Super Admin role
   ├── Generate secure reset token
   ├── Store token with expiry (1 hour)
   ├── Send email notification
   └── Log reset request
```

### Role-Based Access Control (RBAC)
```javascript
Roles Hierarchy:
1. super_admin (God mode)
   └── Full system access
   └── User management
   └── System configuration
   └── Audit logs access

2. admin
   └── Student management
   └── Sponsor management
   └── Report card generation
   └── Marks approval
   └── Dashboard access

3. principal
   └── Marks approval
   └── Report card signing
   └── MFA required for sensitive actions

4. teacher
   └── Marks entry
   └── Attendance marking
   └── View assigned students
   └── Limited dashboard

5. student
   └── View own profile
   └── View own marks
   └── View own attendance
   └── Download report cards
```

### Security Middleware Stack
```javascript
1. Rate Limiting
   - Login: 5 attempts/15 minutes
   - API calls: 100 requests/15 minutes/IP
   - File uploads: 10 uploads/hour
   
2. Input Validation (Joi/Express-validator)
   - All request bodies validated
   - SQL injection prevention
   - XSS protection
   - File upload validation

3. Helmet Security Headers
   - Content Security Policy
   - HSTS
   - XSS Protection
   - Framebusting

4. CORS Configuration
   - Whitelist frontend origin
   - Credentials enabled
   - Preflight caching

5. File Upload Security
   - File type validation
   - Size limits (5MB default)
   - Virus scanning (ClamAV)
   - Sanitize filenames
```

---

## 📁 Backend Folder Structure (Industry Standard)

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js              ✅ EXISTS
│   │   ├── sequelize.config.js      ✅ EXISTS
│   │   ├── s3.config.js             ⚠️ NEW
│   │   ├── email.config.js          ⚠️ NEW
│   │   ├── swagger.config.js        ⚠️ NEW
│   │   └── constants.js             ⚠️ NEW
│   │
│   ├── models/                      
│   │   ├── index.js                 ⚠️ NEW (Import all models)
│   │   ├── User.js                  ✅ EXISTS
│   │   ├── RefreshToken.js          ⚠️ NEW
│   │   ├── School.js                ⚠️ NEW
│   │   ├── GradingScheme.js         ⚠️ NEW
│   │   ├── GradingSchemeRule.js     ⚠️ NEW
│   │   ├── Student.js               ⚠️ NEW
│   │   ├── Sponsor.js               ⚠️ NEW
│   │   ├── SponsorStudentMapping.js ⚠️ NEW
│   │   ├── AcademicYear.js          ⚠️ NEW
│   │   ├── Grade.js                 ⚠️ NEW
│   │   ├── Section.js               ⚠️ NEW
│   │   ├── Subject.js               ⚠️ NEW
│   │   ├── GradeSubject.js          ⚠️ NEW
│   │   ├── TeacherAssignment.js     ⚠️ NEW
│   │   ├── Attendance.js            ⚠️ NEW
│   │   ├── ExamType.js              ⚠️ NEW
│   │   ├── Marksheet.js             ⚠️ NEW
│   │   ├── Mark.js                  ⚠️ NEW
│   │   ├── MarkComment.js           ⚠️ NEW
│   │   ├── ReportCard.js            ⚠️ NEW
│   │   ├── ReportCardSubject.js     ⚠️ NEW
│   │   ├── ReportDistribution.js    ⚠️ NEW
│   │   ├── DigitalCertificate.js    ⚠️ NEW
│   │   ├── AuditLog.js              ⚠️ NEW
│   │   └── SystemSetting.js         ⚠️ NEW
│   │
│   ├── controllers/
│   │   ├── auth.controller.js       ⚠️ NEW
│   │   ├── user.controller.js       ✅ EXISTS
│   │   ├── dashboard.controller.js  ⚠️ NEW
│   │   ├── student.controller.js    ⚠️ NEW
│   │   ├── sponsor.controller.js    ⚠️ NEW
│   │   ├── attendance.controller.js ⚠️ NEW
│   │   ├── marks.controller.js      ⚠️ NEW
│   │   ├── reportCard.controller.js ⚠️ NEW
│   │   ├── audit.controller.js      ⚠️ NEW
│   │   ├── settings.controller.js   ⚠️ NEW
│   │   └── analytics.controller.js  ⚠️ NEW
│   │
│   ├── services/
│   │   ├── auth.service.js          ⚠️ NEW
│   │   ├── user.service.js          ⚠️ NEW
│   │   ├── student.service.js       ⚠️ NEW
│   │   ├── sponsor.service.js       ⚠️ NEW
│   │   ├── attendance.service.js    ⚠️ NEW
│   │   ├── marks.service.js         ⚠️ NEW
│   │   ├── reportCard.service.js    ⚠️ NEW
│   │   ├── pdf.service.js           ⚠️ NEW (PDF generation)
│   │   ├── signature.service.js     ⚠️ NEW (Digital signature)
│   │   ├── email.service.js         ⚠️ NEW
│   │   ├── s3.service.js            ⚠️ NEW
│   │   └── audit.service.js         ⚠️ NEW
│   │
│   ├── routes/
│   │   ├── index.js                 ⚠️ NEW (Centralized router)
│   │   ├── auth.routes.js           ⚠️ NEW
│   │   ├── user.routes.js           ✅ EXISTS
│   │   ├── dashboard.routes.js      ⚠️ NEW
│   │   ├── student.routes.js        ⚠️ NEW
│   │   ├── sponsor.routes.js        ⚠️ NEW
│   │   ├── attendance.routes.js     ⚠️ NEW
│   │   ├── marks.routes.js          ⚠️ NEW
│   │   ├── reportCard.routes.js     ⚠️ NEW
│   │   ├── audit.routes.js          ⚠️ NEW
│   │   ├── settings.routes.js       ⚠️ NEW
│   │   └── analytics.routes.js      ⚠️ NEW
│   │
│   ├── middleware/
│   │   ├── auth.js                  ✅ EXISTS
│   │   ├── validation.js            ✅ EXISTS (extend)
│   │   ├── rateLimiter.js           ⚠️ NEW
│   │   ├── fileUpload.js            ⚠️ NEW
│   │   ├── audit.js                 ⚠️ NEW (Auto-logging)
│   │   ├── mfa.js                   ⚠️ NEW
│   │   └── errorHandler.js          ⚠️ NEW (Centralized)
│   │
│   ├── validations/
│   │   ├── auth.validation.js       ⚠️ NEW
│   │   ├── user.validation.js       ⚠️ NEW
│   │   ├── student.validation.js    ⚠️ NEW
│   │   ├── sponsor.validation.js    ⚠️ NEW
│   │   ├── attendance.validation.js ⚠️ NEW
│   │   ├── marks.validation.js      ⚠️ NEW
│   │   └── common.validation.js     ⚠️ NEW
│   │
│   ├── utils/
│   │   ├── errors.js                ✅ EXISTS
│   │   ├── response.js              ✅ EXISTS
│   │   ├── logger.js                ⚠️ NEW (Winston)
│   │   ├── crypto.js                ⚠️ NEW
│   │   ├── dateHelper.js            ⚠️ NEW
│   │   ├── fileHelper.js            ⚠️ NEW
│   │   └── validators.js            ⚠️ NEW
│   │
│   ├── migrations/                  ⚠️ NEW (Sequelize migrations)
│   │   └── YYYYMMDDHHMMSS-*.js
│   │
│   ├── seeders/                     ⚠️ NEW (Initial data)
│   │   ├── 01-super-admin.js
│   │   ├── 02-schools.js
│   │   └── 03-demo-data.js
│   │
│   ├── templates/                   ⚠️ NEW
│   │   ├── email/
│   │   │   ├── password-reset.html
│   │   │   └── report-card-email.html
│   │   └── pdf/
│   │       └── report-card-template.html
│   │
│   └── index.js                     ✅ EXISTS
│
├── tests/                           ⚠️ NEW
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── uploads/                         ✅ EXISTS
│   ├── students/
│   ├── certificates/
│   └── reports/
│
├── logs/                            ⚠️ NEW
│   ├── error.log
│   ├── combined.log
│   └── audit.log
│
├── .env                             ✅ EXISTS
├── .env.example                     ⚠️ NEW
├── package.json                     ✅ EXISTS
├── nodemon.json                     ✅ EXISTS
└── README.md                        ✅ EXISTS
```

---

## 🔌 API Endpoints Implementation Plan

### Phase 1: Authentication & User Management (Week 1) 🔴 CRITICAL

#### 1.1 Authentication APIs
```javascript
POST /api/auth/login
├── Request: { email, password }
├── Validation: Email format, password strength
├── Response: { user, accessToken, refreshToken }
├── Security: Rate limit (5/15min), bcrypt verification
├── Audit: Log login attempts (success/failure)
└── Status Codes: 200, 400, 401, 429

POST /api/auth/mfa-verify
├── Request: { token (JWT), mfaCode }
├── Validation: JWT valid, TOTP code verification
├── Response: { signedToken }
├── Security: Required for super_admin/principal
├── Audit: Log MFA verifications
└── Status Codes: 200, 400, 401, 403

POST /api/auth/password-reset
├── Request: { email }
├── Validation: User exists, role = super_admin
├── Response: { message: "Reset link sent" }
├── Security: Generate secure token (crypto.randomBytes)
├── Audit: Log reset requests
├── Email: Send reset link with 1-hour expiry
└── Status Codes: 200, 400, 403, 404

POST /api/auth/refresh
├── Request: { refreshToken }
├── Validation: Token exists in DB, not expired/revoked
├── Response: { accessToken, refreshToken }
├── Security: Rotate refresh tokens
└── Status Codes: 200, 401

POST /api/auth/logout
├── Request: JWT in header
├── Action: Revoke refresh token
├── Audit: Log logout
└── Status Codes: 200, 401
```

#### 1.2 User Management APIs
```javascript
GET /api/users
├── Auth: super_admin
├── Query Params: page, limit, role, status, search
├── Response: { users[], pagination, total }
├── Performance: Indexed queries, cache results
└── Status Codes: 200, 401, 403

POST /api/users
├── Auth: super_admin
├── Request: { username, email, password, firstName, lastName, role }
├── Validation: Unique email/username, strong password
├── Response: { user }
├── Security: Hash password, send welcome email
├── Audit: Log user creation
└── Status Codes: 201, 400, 401, 403, 409

PUT /api/users/:id
├── Auth: super_admin
├── Request: { firstName, lastName, role, isActive }
├── Validation: User exists, valid role
├── Response: { user }
├── Audit: Log changes (old vs new values)
└── Status Codes: 200, 400, 401, 403, 404

DELETE /api/users/:id
├── Auth: super_admin
├── Action: Soft delete (set deleted_at)
├── Validation: Cannot delete self
├── Audit: Log deletion
└── Status Codes: 204, 401, 403, 404

POST /api/users/import-csv
├── Auth: super_admin
├── Request: FormData with CSV file
├── Validation: CSV format, required columns
├── Response: { imported: 45, failed: 2, errors[] }
├── Processing: Queue job for large files
├── Security: Validate file size (<10MB), scan for viruses
└── Status Codes: 200, 400, 401, 403
```

### Phase 2: Student & Sponsor Management (Week 2) 🟠 HIGH

```javascript
GET /api/students
├── Auth: admin, super_admin
├── Query: page, limit, grade, section, status, sponsor_status, search
├── Response: { students[], pagination }
├── Joins: Include grade, section, sponsor info
└── Status Codes: 200, 401, 403

POST /api/students
├── Auth: admin, super_admin
├── Request: {
│     admissionNo, firstName, lastName, dob, gender,
│     currentGrade, currentSection, rollNumber, photo (File),
│     guardianName, guardianPhone, guardianEmail
│   }
├── Validation: Unique admission_no, photo type/size
├── File Upload: S3 or local storage
├── Response: { student }
└── Status Codes: 201, 400, 401, 403

PUT /api/students/:id
├── Auth: admin, super_admin
├── Request: Partial student data
├── Response: { student }
├── Audit: Log changes
└── Status Codes: 200, 400, 401, 403, 404

DELETE /api/students/:id
├── Auth: super_admin
├── Action: Soft delete
├── Validation: No active marks/attendance records
└── Status Codes: 204, 400, 401, 403, 404

GET /api/students/:id
├── Auth: admin, teacher, super_admin
├── Response: { student, sponsor, grades[], attendance_summary }
├── Authorization: Teachers only see assigned students
└── Status Codes: 200, 401, 403, 404

GET /api/sponsors
├── Auth: admin, super_admin
├── Query: page, limit, type, status, country
├── Response: { sponsors[], pagination }
└── Status Codes: 200, 401, 403

POST /api/sponsors
├── Auth: admin, super_admin
├── Request: { name, type, email, phone, country, address }
├── Validation: Email format, unique name
├── Response: { sponsor }
└── Status Codes: 201, 400, 401, 403

PUT /api/sponsors/:id
DELETE /api/sponsors/:id
├── Similar to students

POST /api/sponsors/:sponsorId/map-student
├── Auth: admin, super_admin
├── Request: { studentId, mappingType, startDate, amount, currency }
├── Validation: Student exists, not already mapped to this sponsor
├── Response: { mapping }
├── Audit: Log mapping creation
└── Status Codes: 201, 400, 401, 403, 404

GET /api/sponsors/:sponsorId/students
├── Auth: admin, super_admin
├── Response: { mappings[], totalStudents, activeStudents }
└── Status Codes: 200, 401, 403, 404
```

### Phase 3: Attendance Management (Week 3) 🟡 MEDIUM

```javascript
POST /api/attendance
├── Auth: teacher
├── Request: {
│     date, gradeId, sectionId,
│     attendance: [{ studentId, status, remarks }]
│   }
├── Validation:
│   - Date not in future
│   - Teacher assigned to grade/section
│   - All students accounted for
│   - Duplicate check (date + student)
├── Transaction: Bulk insert with rollback on error
├── Response: { recorded: 35, updated: 0, errors[] }
├── Audit: Log attendance marking
└── Status Codes: 200, 400, 401, 403

GET /api/attendance/:date
├── Auth: teacher, admin
├── Query: gradeId, sectionId
├── Response: {
│     date, grade, section,
│     students: [{ student, status, remarks }],
│     summary: { total, present, absent, late }
│   }
├── Authorization: Teachers see only assigned classes
└── Status Codes: 200, 400, 401, 403, 404

GET /api/attendance/summary
├── Auth: teacher, admin
├── Query: studentId, gradeId, sectionId, startDate, endDate
├── Response: {
│     attendance_rate,
│     total_days, present_days, absent_days,
│     month_wise_breakdown[]
│   }
└── Status Codes: 200, 401, 403
```

### Phase 4: Marks & Examination (Week 4-5) 🟠 HIGH

```javascript
POST /api/marks/entry
├── Auth: teacher
├── Request: {
│     academicYearId, examTypeId, gradeId, sectionId, subjectId,
│     totalMarks, status (draft/submitted),
│     marks: [{ studentId, marksObtained, isAbsent, remarks }]
│   }
├── Validation:
│   - Teacher assigned to subject
│   - Marks within range (0-totalMarks)
│   - No duplicate entries
├── Transaction: Create marksheet + marks records
├── Response: { marksheet, marksRecorded: 30 }
├── Audit: Log marks entry
└── Status Codes: 201, 400, 401, 403

GET /api/marks/pending
├── Auth: principal, admin
├── Query: page, limit, gradeId, subjectId, teacherId
├── Response: {
│     marksheets: [{
│       id, teacher, grade, section, subject, examType,
│       totalStudents, submittedDate
│     }],
│     stats: { pending, approved, rejected }
│   }
└── Status Codes: 200, 401, 403

POST /api/marks/approve/:marksheetId
├── Auth: principal, admin
├── Request: { comments (optional) }
├── Validation: Marksheet status = submitted
├── Actions:
│   - Update status to approved
│   - Set approved_by and approved_at
│   - Trigger report card generation job
│   - Notify teacher
├── Audit: Log approval with comments
└── Status Codes: 200, 400, 401, 403, 404

POST /api/marks/reject/:marksheetId
├── Auth: principal, admin
├── Request: { rejectionReason }
├── Validation: Reason required (min 10 chars)
├── Actions:
│   - Update status to rejected
│   - Set rejected_by, rejected_at, rejection_reason
│   - Unlock marksheet for teacher edit
│   - Notify teacher with reason
├── Audit: Log rejection
└── Status Codes: 200, 400, 401, 403, 404

GET /api/marks/history
├── Auth: teacher, admin, student (own marks)
├── Query: studentId, academicYearId, examTypeId
├── Response: {
│     student, academicYear,
│     exams: [{
│       examType, subjects: [{ subject, marks, grade }],
│       totalMarks, percentage, rank
│     }]
│   }
├── Authorization: Students see only own data
└── Status Codes: 200, 401, 403, 404
```

### Phase 5: Report Cards (Week 6-7) 🔴 CRITICAL

```javascript
POST /api/report-cards/generate
├── Auth: principal, admin
├── Request: { academicYearId, examTypeId, gradeId, sectionId (optional) }
├── Validation:
│   - All marks approved for selected criteria
│   - No pending marksheets
├── Processing:
│   - Queue background job (BullMQ/Agenda)
│   - Generate PDFs per student
│   - Calculate grades, ranks, percentages
│   - Store PDFs in S3
│   - Update report_cards table
├── Response: { jobId, estimatedTime, studentsCount }
├── Audit: Log generation request
└── Status Codes: 202, 400, 401, 403

GET /api/report-cards/generation-status/:jobId
├── Auth: principal, admin
├── Response: { status, progress, completed, failed, errors[] }
└── Status Codes: 200, 401, 403, 404

POST /api/report-cards/sign
├── Auth: principal
├── Request: {
│     reportCardIds[], mfaCode,
│     certificateId (digital certificate)
│   }
├── Validation:
│   - MFA verification required
│   - Certificate valid and not expired
│   - Reports generated and not already signed
├── Processing:
│   - Apply digital signature to PDFs
│   - Update is_signed, signed_by, signed_at
│   - Re-upload signed PDFs
├── Security: 2FA mandatory
├── Response: { signed: 35, failed: 0 }
├── Audit: Log signing with certificate details
└── Status Codes: 200, 400, 401, 403

POST /api/report-cards/distribute
├── Auth: principal, admin
├── Request: {
│     reportCardIds[],
│     recipientType (guardian/sponsor/both),
│     emailTemplate (optional)
│   }
├── Validation: Reports must be signed
├── Processing:
│   - Queue bulk email job
│   - Send emails with PDF attachments or download links
│   - Track opens and downloads
│   - Update report_distributions table
├── Response: { queued: 35, estimatedTime }
├── Audit: Log distribution
└── Status Codes: 202, 400, 401, 403

GET /api/report-cards/:studentId
├── Auth: student (own), admin, principal
├── Query: academicYearId, examTypeId
├── Response: {
│     reportCards: [{
│       id, academicYear, examType, pdfUrl,
│       isSigned, signedBy, generatedAt,
│       subjects: [{ subject, marks, grade }],
│       overallGrade, percentage, rank
│     }]
│   }
├── Security: Presigned S3 URLs (15min expiry)
├── Authorization: Students see only own reports
└── Status Codes: 200, 401, 403, 404

GET /api/report-cards/download/:id
├── Auth: student, admin, principal
├── Response: Stream PDF file
├── Audit: Log download with IP
└── Status Codes: 200, 401, 403, 404
```

### Phase 6: System Configuration (Week 8) 🟡 MEDIUM

```javascript
GET /api/settings
├── Auth: super_admin
├── Query: category (optional)
├── Response: { settings: [{ key, value, category, description }] }
└── Status Codes: 200, 401, 403

PUT /api/settings
├── Auth: super_admin
├── Request: { key, value }
├── Validation: Key exists, value type matches
├── Response: { setting }
├── Audit: Log setting changes
└── Status Codes: 200, 400, 401, 403

POST /api/digital-certificates/upload
├── Auth: super_admin
├── Request: FormData { certificateName, issuer, validFrom, validUntil, certificateFile (PFX) }
├── Validation:
│   - File type (.pfx, .p12)
│   - File size < 10MB
│   - Certificate validity
├── Security:
│   - Encrypt private key
│   - Store encrypted in secure location
│   - Set file permissions
├── Response: { certificate }
├── Audit: Log certificate upload
└── Status Codes: 201, 400, 401, 403

GET /api/schools
GET /api/schools/:id
POST /api/schools
PUT /api/schools/:id
DELETE /api/schools/:id
├── Auth: super_admin
├── Standard CRUD operations
└── Manage school information

GET /api/grading-schemes
POST /api/grading-schemes
├── Auth: super_admin
├── Create/manage grading schemes with rules
└── Used in report card grade calculation
```

### Phase 7: Dashboard & Analytics (Week 9) 🟢 LOW

```javascript
GET /api/dashboard/metrics
├── Auth: super_admin, admin, teacher
├── Response: {
│     students: { total, active, inactive, newThisMonth },
│     sponsors: { total, active, totalSponsored },
│     attendance: { todayRate, weeklyAverage, monthlyTrend[] },
│     marks: { pendingApprovals, rejectedCount },
│     reports: { generatedThisMonth, signedCount },
│     recentActivities: [{ type, message, time }]
│   }
├── Performance: Cache results (5min TTL)
├── Authorization: Teachers see limited metrics
└── Status Codes: 200, 401, 403

GET /api/analytics/performance
├── Auth: admin, super_admin
├── Query: gradeId, sectionId, subjectId, startDate, endDate
├── Response: {
│     average_marks, highest_marks, lowest_marks,
│     grade_distribution: { A: 10, B: 15, C: 5 },
│     subject_wise_performance[],
│     top_performers[],
│     improvement_trend[]
│   }
└── Status Codes: 200, 401, 403

GET /api/analytics/sponsorship
├── Auth: admin, super_admin
├── Response: {
│     total_sponsorships, active_sponsors,
│     sponsorship_by_type: { individual: 45, organization: 30 },
│     country_wise_distribution[],
│     renewal_rate, average_donation
│   }
└── Status Codes: 200, 401, 403
```

### Phase 8: Audit & Compliance (Week 10) 🟡 MEDIUM

```javascript
GET /api/audit-logs
├── Auth: super_admin
├── Query: page, limit, userId, action, entityType, startDate, endDate
├── Response: {
│     logs: [{
│       id, user, action, entityType, entityId,
│       oldValues, newValues, ipAddress, timestamp
│     }],
│     pagination
│   }
├── Performance: Paginated, indexed queries
└── Status Codes: 200, 401, 403

GET /api/audit-logs/export
├── Auth: super_admin
├── Query: format (csv/json), filters
├── Response: File download
├── Processing: Queue job for large exports
└── Status Codes: 200, 401, 403
```

---

## 🧪 Testing Strategy

### Unit Tests (70% coverage minimum)
```javascript
describe('Auth Service', () => {
  test('should hash password correctly')
  test('should generate valid JWT token')
  test('should verify MFA code')
  test('should handle invalid credentials')
})

describe('Marks Service', () => {
  test('should calculate grades correctly')
  test('should handle marks validation')
  test('should reject duplicate entries')
})
```

### Integration Tests
```javascript
describe('POST /api/auth/login', () => {
  test('should login with valid credentials')
  test('should return 401 for invalid password')
  test('should rate limit after 5 failed attempts')
})
```

### End-to-End Tests
```javascript
describe('Report Card Generation Flow', () => {
  test('complete flow from marks entry to distribution')
})
```

---

## 📊 Implementation Timeline

### Week-by-Week Breakdown

| Week | Phase | APIs | Models | Priority | Status |
|------|-------|------|--------|----------|--------|
| 1 | Authentication & Users | 9 | 2 | 🔴 CRITICAL | Pending |
| 2 | Students & Sponsors | 11 | 3 | 🟠 HIGH | Pending |
| 3 | Attendance | 3 | 1 | 🟡 MEDIUM | Pending |
| 4-5 | Marks & Examination | 6 | 5 | 🟠 HIGH | Pending |
| 6-7 | Report Cards | 7 | 3 | 🔴 CRITICAL | Pending |
| 8 | System Configuration | 8 | 4 | 🟡 MEDIUM | Pending |
| 9 | Dashboard & Analytics | 3 | 0 | 🟢 LOW | Pending |
| 10 | Audit & Compliance | 2 | 1 | 🟡 MEDIUM | Pending |
| **Total** | **8 Phases** | **49 APIs** | **19 Models** | | **0% Complete** |

### Dependencies
```
Phase 1 (Auth) → All other phases
Phase 2 (Students) → Phase 3, 4, 5
Phase 4 (Marks) → Phase 5 (Report Cards)
Phase 8 (Config) → Phase 5 (Digital Signatures)
```

---

## 🔧 Additional Packages Required

```json
{
  "dependencies": {
    "bcryptjs": "^2.4.3",          ✅ EXISTS
    "jsonwebtoken": "^9.0.2",       ✅ EXISTS
    "express-validator": "^7.2.1",  ✅ EXISTS
    "express-rate-limit": "^7.5.0", ✅ EXISTS
    "joi": "^17.13.3",              ✅ EXISTS
    "multer": "^1.4.5-lts.1",       ⚠️ NEW (File uploads)
    "multer-s3": "^3.0.1",          ⚠️ NEW (S3 uploads)
    "aws-sdk": "^2.1522.0",         ⚠️ NEW (S3 client)
    "nodemailer": "^6.9.7",         ⚠️ NEW (Email)
    "speakeasy": "^2.0.0",          ⚠️ NEW (MFA/TOTP)
    "qrcode": "^1.5.3",             ⚠️ NEW (MFA QR codes)
    "puppeteer": "^21.6.1",         ⚠️ NEW (PDF generation)
    "handlebars": "^4.7.8",         ⚠️ NEW (Email/PDF templates)
    "winston": "^3.11.0",           ⚠️ NEW (Logging)
    "winston-daily-rotate-file": "^4.7.1", ⚠️ NEW
    "bullmq": "^4.15.2",            ⚠️ NEW (Background jobs)
    "redis": "^4.6.11",             ⚠️ NEW (Cache & Queue)
    "swagger-jsdoc": "^6.2.8",      ⚠️ NEW (API docs)
    "swagger-ui-express": "^5.0.0", ⚠️ NEW
    "csv-parser": "^3.0.0",         ⚠️ NEW (CSV import)
    "exceljs": "^4.4.0",            ⚠️ NEW (Excel export)
    "node-forge": "^1.3.1",         ⚠️ NEW (Digital signatures)
    "compression": "^1.7.4"         ⚠️ NEW (Response compression)
  },
  "devDependencies": {
    "jest": "^29.7.0",              ⚠️ NEW
    "supertest": "^6.3.3",          ⚠️ NEW
    "@types/jest": "^29.5.11"       ⚠️ NEW
  }
}
```

---

## 🚀 Getting Started - Step 1

### Recommended Approach
1. ✅ **Review & Approve This Plan**
2. Create database migrations for all models
3. Set up additional dependencies
4. Implement Phase 1 (Auth) first
5. Test thoroughly before moving to Phase 2
6. Continuous integration with frontend

### Questions for Clarification
1. **File Storage**: AWS S3 or local storage for photos/PDFs?
2. **Email Service**: SMTP, SendGrid, AWS SES, or other?
3. **Redis**: Available for caching/queues?
4. **Background Jobs**: BullMQ (Redis) or Agenda (MongoDB)?
5. **MFA**: Required for all principals or configurable?
6. **Report Card PDF**: Custom template or standard format?
7. **Digital Signature**: Commercial certificate or self-signed?
8. **Multi-school**: Support multiple schools or single school?

---

## 📝 Notes & Best Practices

### Security Checklist
- ✅ All passwords hashed with bcrypt (12 rounds)
- ✅ JWT tokens with short expiry (15min)
- ✅ Refresh token rotation
- ✅ Rate limiting on all endpoints
- ✅ Input validation with Joi
- ✅ SQL injection prevention (Sequelize ORM)
- ✅ XSS protection (Helmet)
- ✅ CORS whitelist
- ✅ File upload validation
- ✅ Audit logging for sensitive operations
- ✅ HTTPS enforced in production
- ✅ Environment variables for secrets

### Performance Optimization
- Database indexes on frequently queried fields
- Redis caching for dashboard metrics
- Pagination for all list endpoints
- Background jobs for heavy operations
- Response compression
- Connection pooling (configured)
- Query optimization with explain plans

### Code Quality
- ESLint configuration
- Prettier formatting
- Consistent error handling
- Meaningful variable names
- Comprehensive comments
- API versioning (/api/v1)
- Standardized response format

---

## ✅ Awaiting Your Approval

Please review this comprehensive plan and confirm:
1. ✅ Database schema design
2. ✅ API endpoint structure
3. ✅ Security measures
4. ✅ Implementation timeline
5. ✅ Technology stack
6. ❓ Answers to clarification questions

Once approved, I'll proceed with:
1. Installing required packages
2. Creating database migrations
3. Implementing Phase 1 (Authentication & Users)

**Ready to proceed? Please confirm!** 🚀
