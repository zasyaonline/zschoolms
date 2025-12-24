# ZSchool Management System - Implementation Plan
## Remaining APIs Development Roadmap

**Last Updated:** December 22, 2025  
**Current Progress:** 13/39 APIs Complete (33%)  
**Remaining:** 26 APIs (67%)

---

## 📊 Current Status

### ✅ Completed Phases
- **Phase 1:** Authentication (3 endpoints) - 100% Complete
- **Phase 2:** User Management (5 endpoints) - 100% Complete  
- **Phase 3:** Student Management (5 endpoints) - 100% Complete
- **Swagger Documentation:** Auth endpoints documented, UI operational

---

## 🎯 Implementation Roadmap (Phases 4-10)

### **PHASE 4: Sponsors Management** 🔴 Priority 1
**Timeline:** 2-3 hours  
**Dependencies:** User Management (completed), Student Management (completed)  
**Complexity:** Medium

#### APIs to Implement (6 endpoints):
1. `GET /api/sponsors` - List all sponsors (paginated, with student count)
2. `POST /api/sponsors` - Create new sponsor
3. `PUT /api/sponsors/{id}` - Update sponsor details
4. `DELETE /api/sponsors/{id}` - Delete sponsor (soft delete)
5. `POST /api/sponsors/{sponsorId}/map-student` - Map sponsor to student
6. `GET /api/sponsors/{sponsorId}/students` - View sponsor's students

#### Technical Requirements:
**Database:**
- ✅ `sponsor_id` column already exists in students table
- ⏳ Create `sponsors` table with fields:
  - `id` (UUID, PK)
  - `name` (VARCHAR 255)
  - `email` (VARCHAR 100, unique)
  - `phone_number` (VARCHAR 20)
  - `country` (VARCHAR 100)
  - `organization` (VARCHAR 255, nullable)
  - `sponsorship_type` (ENUM: 'individual', 'organization')
  - `status` (ENUM: 'active', 'inactive', 'suspended')
  - `total_sponsored_students` (INTEGER, default 0)
  - `notes` (TEXT, nullable)
  - `created_by` (UUID, FK to users)
  - `is_active` (BOOLEAN, default true)
  - `created_at`, `updated_at` (TIMESTAMP)
- ⏳ Create `student_sponsor_mapping` table:
  - `id` (UUID, PK)
  - `student_id` (UUID, FK to students)
  - `sponsor_id` (UUID, FK to sponsors)
  - `sponsorship_type` (ENUM: 'full', 'partial', 'one-time')
  - `start_date` (DATE)
  - `end_date` (DATE, nullable)
  - `amount` (DECIMAL 10,2, nullable)
  - `status` (ENUM: 'active', 'expired', 'terminated')
  - `created_by` (UUID, FK to users)
  - `created_at`, `updated_at`

**Code Files:**
- `/backend/src/models/Sponsor.js` - Sequelize model
- `/backend/src/models/StudentSponsorMapping.js` - Mapping model
- `/backend/src/services/sponsor.service.js` - Business logic (10 functions)
- `/backend/src/controllers/sponsor.controller.js` - HTTP handlers (6 functions)
- `/backend/src/routes/sponsor.routes.js` - Express routes with Swagger docs
- `/backend/migrations/004_create_sponsors_tables.sql` - DB migration

**Key Features:**
- Track sponsor details and contact information
- Support individual and organization sponsors
- Map multiple students to one sponsor
- Calculate and cache student counts
- Sponsorship date tracking (start/end)
- Sponsorship types (full/partial/one-time)
- Audit logging for all operations

---

### **PHASE 5: Dashboard Metrics** 🟡 Priority 2
**Timeline:** 1 hour  
**Dependencies:** Students, Sponsors (if Phase 4 complete)  
**Complexity:** Low

#### APIs to Implement (1 endpoint):
1. `GET /api/dashboard/metrics` - Fetch dashboard cards

#### Response Structure:
```json
{
  "success": true,
  "data": {
    "students": {
      "total": 150,
      "active": 145,
      "inactive": 5,
      "newThisMonth": 12
    },
    "sponsors": {
      "total": 45,
      "active": 42,
      "inactive": 3,
      "averageStudentsPerSponsor": 3.2
    },
    "attendance": {
      "todayPresent": 138,
      "todayAbsent": 7,
      "attendanceRate": "95.2%"
    },
    "pendingApprovals": {
      "marksheets": 8,
      "reportCards": 3
    },
    "recentActivity": [...]
  }
}
```

**Technical Requirements:**
- Aggregate queries across multiple tables
- Cache results (5-minute TTL)
- Role-based data filtering
- No new database tables required

**Code Files:**
- `/backend/src/services/dashboard.service.js`
- `/backend/src/controllers/dashboard.controller.js`
- `/backend/src/routes/dashboard.routes.js`

---

### **PHASE 6: Attendance Management** 🟡 Priority 2
**Timeline:** 2 hours  
**Dependencies:** Students (completed)  
**Complexity:** Medium

#### APIs to Implement (2 endpoints):
1. `POST /api/attendance` - Mark daily attendance for class
2. `GET /api/attendance/{date}` - Get attendance records

#### Technical Requirements:
**Database:**
- Create `attendance` table:
  - `id` (UUID, PK)
  - `student_id` (UUID, FK to students)
  - `date` (DATE, not null)
  - `class` (VARCHAR 20)
  - `section` (VARCHAR 20)
  - `status` (ENUM: 'present', 'absent', 'late', 'excused')
  - `marked_by` (UUID, FK to users - teacher)
  - `remarks` (TEXT, nullable)
  - `created_at`, `updated_at`
  - UNIQUE constraint on (student_id, date)

**Code Files:**
- `/backend/src/models/Attendance.js`
- `/backend/src/services/attendance.service.js`
- `/backend/src/controllers/attendance.controller.js`
- `/backend/src/routes/attendance.routes.js`
- `/backend/migrations/005_create_attendance_table.sql`

**Key Features:**
- Bulk attendance marking (entire class at once)
- Date-based queries with class/section filters
- Calculate attendance statistics (present/absent/rate)
- Prevent duplicate entries for same student/date
- Teacher role validation

---

### **PHASE 7: Marks/Grading System** 🟠 Priority 3
**Timeline:** 3-4 hours  
**Dependencies:** Students (completed), Attendance (recommended)  
**Complexity:** High

#### APIs to Implement (4 endpoints):
1. `POST /api/marks/entry` - Submit marks (draft or final)
2. `GET /api/marks/pending` - List pending marksheets for approval
3. `POST /api/marks/approve/{marksheetId}` - Approve marksheet (locks)
4. `POST /api/marks/reject/{marksheetId}` - Reject with reason (unlocks)

#### Technical Requirements:
**Database:**
- Create `subjects` table:
  - `id` (UUID, PK)
  - `name` (VARCHAR 100)
  - `code` (VARCHAR 20, unique)
  - `class` (VARCHAR 20)
  - `max_marks` (INTEGER)
  - `passing_marks` (INTEGER)
  - `is_active` (BOOLEAN)

- Create `marksheets` table:
  - `id` (UUID, PK)
  - `student_id` (UUID, FK to students)
  - `class` (VARCHAR 20)
  - `section` (VARCHAR 20)
  - `term` (ENUM: 'term1', 'term2', 'final')
  - `academic_year` (VARCHAR 10, e.g., '2025-2026')
  - `status` (ENUM: 'draft', 'submitted', 'approved', 'rejected')
  - `submitted_by` (UUID, FK to users - teacher)
  - `submitted_at` (TIMESTAMP)
  - `reviewed_by` (UUID, FK to users - principal/admin)
  - `reviewed_at` (TIMESTAMP)
  - `rejection_reason` (TEXT)
  - `created_at`, `updated_at`

- Create `marks` table:
  - `id` (UUID, PK)
  - `marksheet_id` (UUID, FK to marksheets)
  - `subject_id` (UUID, FK to subjects)
  - `marks_obtained` (DECIMAL 5,2)
  - `max_marks` (INTEGER)
  - `grade` (VARCHAR 5)
  - `remarks` (TEXT)

**Code Files:**
- `/backend/src/models/Subject.js`
- `/backend/src/models/Marksheet.js`
- `/backend/src/models/Mark.js`
- `/backend/src/services/marks.service.js`
- `/backend/src/controllers/marks.controller.js`
- `/backend/src/routes/marks.routes.js`
- `/backend/migrations/006_create_marks_system.sql`

**Key Features:**
- Draft mode (save without submitting)
- Submit for approval (locks editing)
- Approval workflow (Principal/Admin only)
- Rejection with reason (unlocks for teacher)
- Auto-calculate grades based on grading scheme
- Prevent edits once approved
- Bulk marks entry by class/subject

---

### **PHASE 8: Report Cards** 🔴 Priority 3
**Timeline:** 4-5 hours  
**Dependencies:** Marks System (Phase 7), AWS S3 setup  
**Complexity:** Very High

#### APIs to Implement (4 endpoints):
1. `POST /api/report-cards/generate` - Generate PDFs (background job)
2. `POST /api/report-cards/sign` - Apply digital signature (with 2FA)
3. `POST /api/report-cards/distribute` - Bulk email to sponsors
4. `GET /api/report-cards/{studentId}` - Get student's report cards

#### Technical Requirements:
**Database:**
- Create `report_cards` table:
  - `id` (UUID, PK)
  - `student_id` (UUID, FK to students)
  - `marksheet_id` (UUID, FK to marksheets)
  - `term` (ENUM: 'term1', 'term2', 'final')
  - `academic_year` (VARCHAR 10)
  - `pdf_url` (VARCHAR 500) - S3 URL
  - `pdf_key` (VARCHAR 500) - S3 object key
  - `status` (ENUM: 'generating', 'generated', 'signed', 'distributed')
  - `generated_at` (TIMESTAMP)
  - `signed_at` (TIMESTAMP)
  - `signed_by` (UUID, FK to users - Principal)
  - `signature_certificate_id` (UUID)
  - `distributed_at` (TIMESTAMP)
  - `email_sent` (BOOLEAN, default false)
  - `email_opened` (BOOLEAN, default false)
  - `created_at`, `updated_at`

**External Dependencies:**
- AWS S3 for PDF storage
- PDF generation library (e.g., `pdfkit`, `puppeteer`)
- Digital signature library (e.g., `node-signpdf`)
- Background job queue (e.g., `bull`, `agenda`)
- Email service (already have nodemailer)

**Code Files:**
- `/backend/src/models/ReportCard.js`
- `/backend/src/services/reportcard.service.js`
- `/backend/src/services/pdf-generator.service.js`
- `/backend/src/services/digital-signature.service.js`
- `/backend/src/services/email-distribution.service.js`
- `/backend/src/controllers/reportcard.controller.js`
- `/backend/src/routes/reportcard.routes.js`
- `/backend/src/jobs/reportcard-generator.job.js`
- `/backend/migrations/007_create_report_cards_table.sql`

**Key Features:**
- Batch PDF generation (async job)
- Custom school letterhead/branding
- Digital signature with certificate
- MFA verification before signing
- Bulk email with tracking (opened/not opened)
- S3 secure URLs with expiration
- Regeneration capability

---

### **PHASE 9: Analytics & Reports** 🟢 Priority 4
**Timeline:** 2-3 hours  
**Dependencies:** All data models (Students, Marks, Attendance, Sponsors)  
**Complexity:** Medium

#### APIs to Implement (2 endpoints):
1. `GET /api/analytics/performance` - Student performance trends
2. `GET /api/analytics/sponsorship` - Sponsorship metrics

#### Response Examples:

**Performance Analytics:**
```json
{
  "termComparison": {
    "term1": { "average": 78.5, "passRate": 92 },
    "term2": { "average": 82.3, "passRate": 95 }
  },
  "subjectWise": [
    { "subject": "Math", "average": 75, "topScorer": {...} },
    { "subject": "Science", "average": 82, "topScorer": {...} }
  ],
  "classWise": [...],
  "topPerformers": [...]
}
```

**Sponsorship Analytics:**
```json
{
  "totalSponsored": 145,
  "activeSponsorships": 142,
  "expiringThisMonth": 8,
  "countryDistribution": {...},
  "sponsorshipTypes": {
    "full": 120,
    "partial": 22,
    "one-time": 3
  }
}
```

**Technical Requirements:**
- Complex aggregate queries
- Caching layer (Redis recommended, or memory cache)
- Chart-ready data format
- Date range filtering
- Export to CSV/Excel capability

**Code Files:**
- `/backend/src/services/analytics.service.js`
- `/backend/src/controllers/analytics.controller.js`
- `/backend/src/routes/analytics.routes.js`

---

### **PHASE 10: System Management** 🟢 Priority 5
**Timeline:** 3 hours  
**Dependencies:** Audit logging (already implemented)  
**Complexity:** Medium

#### APIs to Implement (6 endpoints):
1. `GET /api/audit-logs` - List audit logs (paginated, filtered)
2. `GET /api/settings` - Get system settings
3. `PUT /api/settings` - Update system settings
4. `POST /api/digital-certificates/upload` - Upload/renew certificate
5. *(Analytics endpoints moved to Phase 9)*

#### Technical Requirements:
**Database:**
- Create `system_settings` table:
  - `id` (UUID, PK)
  - `key` (VARCHAR 100, unique)
  - `value` (TEXT)
  - `category` (ENUM: 'school', 'grading', 'email', 'security')
  - `data_type` (ENUM: 'string', 'number', 'boolean', 'json')
  - `description` (TEXT)
  - `is_editable` (BOOLEAN)
  - `updated_by` (UUID, FK to users)
  - `updated_at` (TIMESTAMP)

- Create `digital_certificates` table:
  - `id` (UUID, PK)
  - `certificate_type` (ENUM: 'signing', 'ssl')
  - `file_path` (VARCHAR 500) - encrypted storage
  - `passphrase_hash` (VARCHAR 255)
  - `issuer` (VARCHAR 255)
  - `subject` (VARCHAR 255)
  - `valid_from` (TIMESTAMP)
  - `valid_until` (TIMESTAMP)
  - `is_active` (BOOLEAN)
  - `uploaded_by` (UUID, FK to users)
  - `created_at`, `updated_at`

**Settings Categories:**
- **School Info:** name, address, logo, contact
- **Grading Schemes:** grade boundaries, calculation method
- **Email Config:** SMTP settings, templates
- **Security:** password policy, MFA settings, session timeout

**Code Files:**
- `/backend/src/services/settings.service.js`
- `/backend/src/services/certificate.service.js`
- `/backend/src/controllers/auditlog.controller.js` (new)
- `/backend/src/controllers/settings.controller.js`
- `/backend/src/controllers/certificate.controller.js`
- `/backend/src/routes/auditlog.routes.js`
- `/backend/src/routes/settings.routes.js`
- `/backend/src/routes/certificate.routes.js`
- `/backend/migrations/008_create_system_tables.sql`

**Key Features:**
- Audit log viewer with advanced filtering
- Settings validation before save
- Encrypted certificate storage
- Certificate expiration monitoring
- Settings history/versioning
- Export audit logs to CSV

---

## 📋 Implementation Checklist Template

For each phase, follow this checklist:

### Pre-Implementation
- [ ] Review API requirements and acceptance criteria
- [ ] Design database schema (ERD)
- [ ] Define data models and relationships
- [ ] Plan service layer functions
- [ ] List required validations

### Database
- [ ] Create migration SQL file
- [ ] Add tables with proper constraints
- [ ] Create indexes for performance
- [ ] Add foreign keys and relationships
- [ ] Execute migration and verify

### Backend Code
- [ ] Create Sequelize model(s)
- [ ] Add model associations in `models/index.js`
- [ ] Implement service layer functions
- [ ] Create controller HTTP handlers
- [ ] Build Express routes with middleware
- [ ] Add Swagger JSDoc annotations
- [ ] Mount routes in `src/index.js`

### Testing
- [ ] Write test script (similar to `test-student-apis.sh`)
- [ ] Test all CRUD operations
- [ ] Test error scenarios (404, 400, 403)
- [ ] Verify role-based access control
- [ ] Check audit log entries
- [ ] Test pagination and filtering
- [ ] Verify Swagger documentation accuracy

### Documentation
- [ ] Update Swagger schemas
- [ ] Add API examples to documentation
- [ ] Update BACKEND_SETUP_GUIDE.md
- [ ] Create phase completion document

---

## 🚀 Recommended Execution Order

### Week 1: Core Features
1. **Day 1-2:** Phase 4 - Sponsors Management (critical for student features)
2. **Day 3:** Phase 5 - Dashboard Metrics (quick win, uses existing data)
3. **Day 4:** Phase 6 - Attendance Management (independent feature)

### Week 2: Academic Features
4. **Day 5-6:** Phase 7 - Marks/Grading System (complex, foundational)
5. **Day 7-9:** Phase 8 - Report Cards (most complex, depends on Phase 7)

### Week 3: Analytics & Admin
6. **Day 10-11:** Phase 9 - Analytics & Reports (requires all data)
7. **Day 12-13:** Phase 10 - System Management (admin tools)

---

## 🛠️ Technical Considerations

### External Services Setup Required:
1. **AWS S3** - For report card PDF storage
   - Create bucket with proper CORS
   - Set up IAM user with limited permissions
   - Configure bucket lifecycle policies

2. **Background Jobs** (Optional but Recommended)
   - Install Bull or Agenda for job queue
   - Set up Redis for Bull (or MongoDB for Agenda)
   - Create worker process for PDF generation

3. **Caching Layer** (Optional but Recommended)
   - Redis for analytics caching
   - Cache dashboard metrics (5-min TTL)
   - Cache frequently accessed data

4. **PDF Generation**
   - Choose library: PDFKit (code-based) or Puppeteer (HTML-based)
   - Create report card template
   - Test performance with batch generation

5. **Digital Signatures**
   - Install certificate management library
   - Set up secure certificate storage
   - Implement signature verification

### Performance Optimization:
- Add database indexes on frequently queried columns
- Implement pagination on all list endpoints
- Use database views for complex analytics queries
- Add rate limiting on resource-intensive endpoints
- Optimize N+1 queries with proper `include` statements

### Security Considerations:
- Encrypt sensitive data (certificates, passphrases)
- Implement row-level security for multi-tenant setup
- Add CSRF protection for state-changing operations
- Validate file uploads (type, size, content)
- Sanitize all user inputs
- Use parameterized queries (Sequelize handles this)

---

## 📦 Dependencies to Install

```bash
# Phase 4-6 (Basic features)
# Already installed: sequelize, pg

# Phase 7-8 (Reports & PDFs)
npm install --save pdfkit puppeteer node-signpdf aws-sdk bull

# Phase 9 (Analytics)
npm install --save redis ioredis node-cache

# Phase 10 (System Management)
npm install --save multer archiver bcryptjs
```

---

## 📈 Estimated Timeline Summary

| Phase | APIs | Complexity | Time | Priority |
|-------|------|------------|------|----------|
| Phase 4: Sponsors | 6 | Medium | 2-3h | P1 🔴 |
| Phase 5: Dashboard | 1 | Low | 1h | P2 🟡 |
| Phase 6: Attendance | 2 | Medium | 2h | P2 🟡 |
| Phase 7: Marks/Grading | 4 | High | 3-4h | P3 🟠 |
| Phase 8: Report Cards | 4 | Very High | 4-5h | P3 🔴 |
| Phase 9: Analytics | 2 | Medium | 2-3h | P4 🟢 |
| Phase 10: System Mgmt | 6 | Medium | 3h | P5 🟢 |
| **TOTAL** | **25** | - | **17-21h** | - |

**Total Development Time:** 17-21 hours (2-3 weeks at 8 hours/day)

---

## 🎯 Success Criteria

Each phase is considered complete when:
- ✅ All API endpoints implemented and tested
- ✅ Database migrations executed successfully
- ✅ Swagger documentation updated and accurate
- ✅ Role-based access control verified
- ✅ Audit logging working for all operations
- ✅ Test script created and passing
- ✅ Error handling comprehensive (400, 401, 403, 404, 500)
- ✅ Performance acceptable (< 500ms for standard queries)
- ✅ Code reviewed and follows project standards

---

## 📝 Next Immediate Actions

1. **Review this plan** - Confirm priorities and timelines
2. **Choose starting phase** - Recommend Phase 4 (Sponsors)
3. **Set up external services** - AWS S3, Redis (if needed)
4. **Begin implementation** - Start with database design
5. **Iterate and test** - Complete one phase before moving to next

---

## 🤝 Ready to Start?

Which phase would you like to begin with?
- **Recommended:** Phase 4 - Sponsors Management (critical dependency)
- **Quick Win:** Phase 5 - Dashboard Metrics (1 hour, uses existing data)
- **Your Choice:** Let me know your preference!

