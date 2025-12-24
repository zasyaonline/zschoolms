# ZSchool Management System - Business Logic Implementation Plan

## Document Version: 1.0
## Date: December 23, 2024

---

## Executive Summary

This document provides a comprehensive gap analysis between the customer proposal requirements and the current implementation status of the ZSchool Management System. It outlines what has been built, what remains to be implemented, and provides a detailed roadmap for completing the business logic.

---

## 1. CURRENT IMPLEMENTATION STATUS

### 1.1 ✅ Completed Infrastructure

| Component | Status | Details |
|-----------|--------|---------|
| **Database Schema** | ✅ Complete | PostgreSQL with all tables created |
| **Backend APIs** | ✅ Complete | 61 endpoints with Swagger documentation |
| **Frontend UI** | ✅ Complete | React 19 with all pages built |
| **Authentication** | ✅ Complete | JWT-based with MFA support |
| **File Storage** | ✅ Configured | AWS S3 bucket ready |
| **Email Service** | ✅ Configured | Zeptomail SMTP integrated |

### 1.2 ✅ Completed Models

| Model | Purpose | Associations |
|-------|---------|--------------|
| `User` | All system users (Admin, Teacher, Student, Sponsor) | RefreshToken, AuditLog, Student |
| `Student` | Student records | User, Sponsor, Attendance, Marks |
| `Sponsor` | Sponsor entities | StudentSponsorMapping, Creator |
| `StudentSponsorMapping` | Many-to-many sponsor-student | Student, Sponsor |
| `Attendance` | Daily attendance records | Student, Teacher |
| `Marksheet` | Exam marksheets | Subject, Marks |
| `Mark` | Individual student marks | Marksheet, Subject |
| `Subject` | School subjects | Marks |
| `ReportCard` | Student report cards | Student, Signer, Attachments |
| `ReportCardAttachment` | PDF attachments | ReportCard |
| `ReportCardDistributionLog` | Email distribution tracking | ReportCard |
| `AuditLog` | System audit trail | User |
| `RefreshToken` | JWT refresh tokens | User |

### 1.3 ✅ Completed Services (Backend)

| Service | Features Implemented |
|---------|----------------------|
| `auth.service.js` | Login, logout, token refresh, password reset |
| `user.service.js` | CRUD, role management, bulk import |
| `student.service.js` | CRUD, enrollment, profile management |
| `sponsor.service.js` | CRUD, student mapping |
| `attendance.service.js` | Mark, retrieve, statistics |
| `marks.service.js` | Entry, approval workflow, rejection |
| `reportcard.service.js` | Generate, sign, distribute |
| `analytics.service.js` | Performance metrics, trends |
| `dashboard.service.js` | Dashboard statistics |
| `email.service.js` | Welcome, password reset, notifications |

### 1.4 ✅ Completed Frontend Pages

| Module | Pages |
|--------|-------|
| **Auth** | Login, ForgotPassword |
| **Dashboard** | Main dashboard with stats |
| **User Management** | UserList |
| **System Configuration** | StudentList, AddStudent, EditStudent, ViewStudent, SponsorStudentMapping, GradingSchemeSetup, SchoolInformationList |
| **Academic Records** | MarksApprovalList, MarksReview, ReportCardList, ViewMarkSheet, SendBulkEmail, ViewGeneratedPDF |
| **Teacher Flow** | AttendanceEntry, MarksEntry, RejectedMarksCorrection, StudentProfile |
| **Student Flow** | MyProfile, MyAttendance, MyMarksHistory |

---

## 2. GAP ANALYSIS

### 2.1 🔴 Critical Missing Features (Core Business Logic)

#### 2.1.1 Principal's Digital Signature System
**Proposal Requirement:** "All official report cards are cryptographically signed by the principal upon final approval, ensuring authenticity, non-repudiation, and legal validity"

| Component | Current Status | Required Implementation |
|-----------|---------------|------------------------|
| Signature Upload | ❌ Not implemented | Upload PKCS12/X509 certificate |
| Signature Storage | ❌ Not implemented | Secure storage with encryption |
| PDF Signing | ❌ Placeholder only | node-signpdf integration |
| Signature Verification | ❌ Not implemented | Certificate chain validation |
| MFA for Signing | ❌ Not implemented | 2FA requirement for sign action |

#### 2.1.2 Automated PDF Report Card Generation
**Proposal Requirement:** "System automatically generates secure, tamper-proof PDF report cards"

| Component | Current Status | Required Implementation |
|-----------|---------------|------------------------|
| PDF Generation | ❌ Placeholder URL | puppeteer/pdfkit implementation |
| Template System | ❌ Not implemented | School branding, layout |
| Marks Aggregation | ✅ Partial | Complete calculation logic |
| S3 Upload | ❌ Not connected | Actual S3 integration |
| Immutability | ❌ Not enforced | S3 Object Lock configuration |

#### 2.1.3 Sponsorship Renewal Automation
**Proposal Requirement:** "Automated system tracks renewal dates and dispatches reminder and overdue emails"

| Component | Current Status | Required Implementation |
|-----------|---------------|------------------------|
| Renewal Date Tracking | ❌ Not implemented | Add renewal_date to sponsor model |
| Reminder Scheduler | ❌ Not implemented | Cron job / Bull queue |
| Email Templates | ❌ Not implemented | Reminder, overdue, confirmation emails |
| Manual Payment Recording | ❌ Not implemented | Payment tracking API |

#### 2.1.4 Bulk Email Distribution
**Proposal Requirement:** "Robust module for sending personalized emails with PDF report card attachments in bulk"

| Component | Current Status | Required Implementation |
|-----------|---------------|------------------------|
| Batch Processing | ✅ Basic | Enhance with Bull queue |
| PDF Attachment | ❌ Not implemented | S3 file attachment |
| Delivery Tracking | ✅ Basic | Enhanced status tracking |
| Error Handling/Retry | ❌ Not implemented | Retry logic with backoff |
| Rate Limiting | ❌ Not implemented | SMTP rate limiting |

### 2.2 🟡 Partial Implementations (Need Enhancement)

#### 2.2.1 Role-Based Access Control (RBAC)
**Current Status:** Basic role check in middleware
**Missing:**
- [ ] Permission-based access (granular permissions per action)
- [ ] Super Admin vs Admin differentiation
- [ ] Teacher data firewall (no sponsor access)
- [ ] Dynamic permission assignment

#### 2.2.2 Immutable Records
**Proposal Requirement:** "Approved marks, generated report cards cannot be edited or deleted"

**Current Status:** Status-based workflow exists
**Missing:**
- [ ] Database-level constraints for approved records
- [ ] Trigger functions to prevent deletion
- [ ] Financial record immutability
- [ ] Audit log write-only enforcement

#### 2.2.3 Dashboard Analytics
**Current Status:** Static mock data
**Missing:**
- [ ] Real-time data integration
- [ ] Total Students from DB
- [ ] Active Sponsors count
- [ ] Pending approvals count
- [ ] Attendance rate calculation
- [ ] Recent activities from audit log

### 2.3 🟢 Frontend-Backend Integration (Not Connected)

| Page | Backend API | Integration Status |
|------|------------|-------------------|
| Dashboard | `/api/dashboard/metrics` | ❌ Mock data |
| UserList | `/api/users/*` | ❌ Mock data |
| StudentList | `/api/students/*` | ❌ Mock data |
| SponsorStudentMapping | `/api/sponsors/mappings/*` | ❌ Mock data |
| MarksApprovalList | `/api/marks/pending` | ❌ Mock data |
| ReportCardList | `/api/report-cards/*` | ❌ Mock data |
| AttendanceEntry | `/api/attendance/*` | ❌ Mock data |
| MarksEntry | `/api/marks/entry` | ❌ Mock data |

---

## 3. IMPLEMENTATION ROADMAP

### Phase 1: Frontend-Backend Integration (Priority: HIGH)
**Estimated Duration: 2 weeks**

#### 1.1 API Service Layer (Week 1)
```
frontend/src/services/
├── api.js              # Axios instance with interceptors
├── auth.service.js     # Authentication API calls
├── user.service.js     # User CRUD operations
├── student.service.js  # Student CRUD operations
├── sponsor.service.js  # Sponsor management
├── attendance.service.js # Attendance APIs
├── marks.service.js    # Marks entry/approval
└── reportcard.service.js # Report card management
```

**Tasks:**
- [ ] Create axios instance with JWT interceptor
- [ ] Implement token refresh logic
- [ ] Create service files for each module
- [ ] Add error handling and toast notifications
- [ ] Update all pages to use real APIs

#### 1.2 Page Integration (Week 2)
- [ ] Dashboard: Connect to `/api/dashboard/metrics`
- [ ] UserList: Full CRUD operations
- [ ] StudentList: Full CRUD operations
- [ ] SponsorStudentMapping: Mapping operations
- [ ] MarksApprovalList: Real pending marksheets
- [ ] AttendanceEntry: Save attendance
- [ ] MarksEntry: Submit marks

### Phase 2: Digital Signature System (Priority: CRITICAL)
**Estimated Duration: 1.5 weeks**

#### 2.1 Certificate Management
**New Files:**
```
backend/src/
├── services/
│   └── signature.service.js
├── controllers/
│   └── signature.controller.js
├── routes/
│   └── signature.routes.js
└── utils/
    └── certificate.utils.js
```

**Database Changes:**
```sql
CREATE TABLE digital_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    certificate_type VARCHAR(50), -- 'principal_signature'
    certificate_blob BYTEA,        -- Encrypted certificate
    certificate_password_hash VARCHAR(255),
    issued_at TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Tasks:**
- [ ] Install `node-signpdf` package
- [ ] Create certificate upload API
- [ ] Implement certificate encryption (AES-256)
- [ ] Create certificate validation service
- [ ] Add MFA requirement for signing operations

#### 2.2 PDF Signing Integration
- [ ] Modify `reportcard.service.js` to sign PDFs
- [ ] Create signing workflow with MFA verification
- [ ] Store signed PDF in S3
- [ ] Add signature verification endpoint

### Phase 3: PDF Report Card Generation (Priority: HIGH)
**Estimated Duration: 1.5 weeks**

#### 3.1 PDF Generation Service
**New Files:**
```
backend/src/
├── services/
│   └── pdf-generator.service.js
├── templates/
│   └── report-card.html
└── utils/
    └── pdf.utils.js
```

**Tasks:**
- [ ] Install `puppeteer` for PDF generation
- [ ] Create HTML template for report card
- [ ] Implement template rendering with data
- [ ] Add school branding support (logo, colors)
- [ ] Implement watermark for draft/unsigned cards
- [ ] Upload generated PDFs to S3
- [ ] Configure S3 Object Lock for immutability

#### 3.2 Batch Generation
- [ ] Implement Bull queue for background processing
- [ ] Create batch generation endpoint (entire class)
- [ ] Add progress tracking
- [ ] Implement notification on completion

### Phase 4: Sponsorship Renewal Automation (Priority: MEDIUM)
**Estimated Duration: 1 week**

#### 4.1 Database Changes
```sql
ALTER TABLE sponsors ADD COLUMN renewal_date DATE;
ALTER TABLE sponsors ADD COLUMN last_renewal_reminder TIMESTAMP;
ALTER TABLE sponsors ADD COLUMN renewal_status VARCHAR(50); -- 'active', 'pending', 'overdue'

CREATE TABLE sponsorship_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsor_id UUID REFERENCES sponsors(id),
    student_id UUID REFERENCES students(id),
    amount DECIMAL(10,2),
    payment_date DATE,
    recorded_by UUID REFERENCES users(id),
    payment_method VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### 4.2 Renewal Service
**New Files:**
```
backend/src/
├── services/
│   └── renewal.service.js
├── jobs/
│   └── renewal-reminder.job.js
└── templates/
    ├── renewal-reminder.html
    ├── renewal-overdue.html
    └── renewal-confirmation.html
```

**Tasks:**
- [ ] Create cron job for daily renewal check
- [ ] Implement reminder emails (30, 14, 7 days before)
- [ ] Implement overdue emails (1, 7, 14 days after)
- [ ] Create payment recording API
- [ ] Add renewal confirmation email

### Phase 5: Enhanced RBAC (Priority: HIGH)
**Estimated Duration: 1 week**

#### 5.1 Permission System
```sql
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE,
    description TEXT,
    module VARCHAR(50)
);

CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR(50),
    permission_id UUID REFERENCES permissions(id),
    UNIQUE(role, permission_id)
);
```

**Permission Examples:**
```javascript
const PERMISSIONS = {
  // User Management
  'users.create': 'Create new users',
  'users.read': 'View user list',
  'users.update': 'Edit user details',
  'users.delete': 'Delete users',
  
  // Student Management
  'students.create': 'Add new students',
  'students.read': 'View student list',
  'students.update': 'Edit student details',
  'students.delete': 'Remove students',
  
  // Sponsor Management (blocked for teachers)
  'sponsors.read': 'View sponsor information',
  'sponsors.manage': 'Manage sponsor mappings',
  
  // Marks
  'marks.entry': 'Enter marks',
  'marks.approve': 'Approve marksheets',
  
  // Report Cards
  'reports.generate': 'Generate report cards',
  'reports.sign': 'Sign report cards',
  'reports.distribute': 'Distribute report cards',
  
  // System
  'system.configure': 'System configuration',
  'audit.view': 'View audit logs'
};
```

**Role-Permission Matrix:**
| Permission | Super Admin | Principal | Admin | Teacher | Student |
|------------|-------------|-----------|-------|---------|---------|
| users.create | ✅ | ❌ | ❌ | ❌ | ❌ |
| users.read | ✅ | ✅ | ✅ | ❌ | ❌ |
| students.read | ✅ | ✅ | ✅ | ✅ | ❌ |
| sponsors.read | ✅ | ✅ | ✅ | ❌ | ❌ |
| marks.entry | ❌ | ❌ | ❌ | ✅ | ❌ |
| marks.approve | ✅ | ✅ | ✅ | ❌ | ❌ |
| reports.sign | ❌ | ✅ | ❌ | ❌ | ❌ |
| system.configure | ✅ | ❌ | ❌ | ❌ | ❌ |

#### 5.2 Middleware Enhancement
- [ ] Create permission middleware
- [ ] Apply to all routes
- [ ] Add frontend permission checks
- [ ] Implement role-based sidebar menu

### Phase 6: Immutable Records Enforcement (Priority: MEDIUM)
**Estimated Duration: 3 days**

#### 6.1 Database Triggers
```sql
-- Prevent modification of approved marksheets
CREATE OR REPLACE FUNCTION prevent_approved_marksheet_update()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'approved' THEN
        RAISE EXCEPTION 'Cannot modify approved marksheet';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_marksheet_immutability
BEFORE UPDATE ON marksheets
FOR EACH ROW
EXECUTE FUNCTION prevent_approved_marksheet_update();

-- Prevent deletion of signed report cards
CREATE OR REPLACE FUNCTION prevent_signed_report_deletion()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IN ('Signed', 'Distributed') THEN
        RAISE EXCEPTION 'Cannot delete signed report card';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_report_immutability
BEFORE DELETE ON report_cards
FOR EACH ROW
EXECUTE FUNCTION prevent_signed_report_deletion();
```

#### 6.2 Application-Level Enforcement
- [ ] Add immutability checks in services
- [ ] Return appropriate error messages
- [ ] Log all modification attempts

### Phase 7: Real-time Dashboard (Priority: MEDIUM)
**Estimated Duration: 3 days**

**Tasks:**
- [ ] Connect Dashboard to real API data
- [ ] Implement refresh mechanism
- [ ] Add attendance rate calculation
- [ ] Show pending approvals count
- [ ] Display recent activities from audit log
- [ ] Add upcoming events (from school calendar - if exists)

---

## 4. WORKFLOW IMPLEMENTATIONS

### 4.1 Flow 1: Super Admin Workflow ✅ Partially Complete

| Step | Status | Notes |
|------|--------|-------|
| Secure Login with MFA | ✅ | MFA exists but optional |
| System Health Dashboard | ❌ | Need to add system metrics |
| User Account Management | ✅ | CRUD complete |
| CSV Import | ✅ | Implemented |
| Role Assignment | ✅ | Basic implementation |
| System Configuration | ❌ | Need to build config pages |
| Digital Signature Management | ❌ | Critical - needs implementation |
| Audit Logs Review | ❌ | API exists, no UI |

### 4.2 Flow 2: Teacher Workflow ✅ Mostly Complete

| Step | Status | Notes |
|------|--------|-------|
| Teacher Login | ✅ | Works |
| Mark Daily Attendance | ✅ | UI + API complete |
| Enter Marks | ✅ | UI + API complete |
| Handle Rejected Marks | ✅ | UI + API complete |
| Post-Approval Confirmation | ❌ | Email notification needed |

### 4.3 Flow 3: Principal Marks Approval & Signing 🔴 Critical Gaps

| Step | Status | Notes |
|------|--------|-------|
| Login & Dashboard | ✅ | Works |
| Review Pending Marksheets | ✅ | API + UI exist |
| Approve/Reject Marks | ✅ | Works |
| Apply Digital Signature | ❌ | CRITICAL - needs implementation |
| Monitor Report Generation | ❌ | Needs PDF generation |

### 4.4 Flow 4: Automated Report Card Generation 🔴 Major Gaps

| Step | Status | Notes |
|------|--------|-------|
| Trigger after Principal signs | ❌ | Needs automation |
| System Validation | ❌ | Needs implementation |
| Background Job | ❌ | Needs Bull queue |
| Data Aggregation | ✅ | Partial - exists |
| PDF Generation | ❌ | Placeholder only |
| Digital Signature Embedding | ❌ | Needs node-signpdf |
| S3 Upload | ✅ | Config exists, not connected |
| Completion Notification | ❌ | Needs email trigger |

### 4.5 Flow 5: Bulk Email Distribution 🟡 Needs Enhancement

| Step | Status | Notes |
|------|--------|-------|
| Admin Initiates | ✅ | UI exists |
| Prepare for Sending | ✅ | Basic logic |
| Admin Confirms | ❌ | Needs confirmation UI |
| Background Processing | ❌ | Needs Bull queue |
| Sending & Tracking | ✅ | Basic exists |
| Error Handling | ❌ | Needs retry logic |
| Completion Summary | ❌ | Needs dashboard UI |

### 4.6 Flow 6: New Sponsor Welcome 🟡 Partial

| Step | Status | Notes |
|------|--------|-------|
| Admin Data Entry | ✅ | API + UI exist |
| System Validation | ✅ | Exists |
| Welcome Email | ❌ | Template needed |
| Admin Confirmation | ❌ | UI feedback needed |

### 4.7 Flow 7: Sponsor-Student Mapping ✅ Mostly Complete

| Step | Status | Notes |
|------|--------|-------|
| Admin Initiates | ✅ | UI exists |
| Select Student | ✅ | Works |
| Configure Details | ✅ | Works |
| Confirm Mapping | ✅ | API exists |
| Notification Email | ❌ | Template needed |

### 4.8 Flow 8: Sponsorship Renewal 🔴 Not Implemented

| Step | Status | Notes |
|------|--------|-------|
| Automated Reminders | ❌ | Needs cron job |
| Overdue Notices | ❌ | Needs implementation |
| Manual Sponsor Action | ❌ | Email-based (external) |
| Record Payment | ❌ | Needs payment API |
| System Update & Confirm | ❌ | Needs implementation |

### 4.9 Flow 9: Student Portal ✅ Complete

| Step | Status | Notes |
|------|--------|-------|
| Student Login | ✅ | Works |
| Student Dashboard | ✅ | UI exists |
| Access Records | ✅ | MyMarksHistory |
| View Profile | ✅ | MyProfile page |
| View Attendance | ✅ | MyAttendance |
| Read-only Access | ✅ | Enforced |

---

## 5. TECHNICAL DEPENDENCIES

### 5.1 New NPM Packages Required

```json
{
  "dependencies": {
    "puppeteer": "^21.0.0",      // PDF generation
    "node-signpdf": "^3.0.0",    // PDF digital signing
    "bull": "^4.11.0",           // Job queue
    "node-cron": "^3.0.0",       // Scheduled jobs
    "ioredis": "^5.3.0"          // Redis for Bull queue
  }
}
```

### 5.2 Infrastructure Requirements

| Service | Purpose | Status |
|---------|---------|--------|
| Redis | Bull queue backend | ❌ Need to setup |
| AWS S3 | PDF storage | ✅ Configured |
| PostgreSQL | Database | ✅ Running |
| Zeptomail | Email delivery | ✅ Configured |

### 5.3 Configuration Additions (.env)

```env
# Redis (for job queue)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# PDF Generation
PDF_TEMPLATE_PATH=./templates
PUPPETEER_EXECUTABLE_PATH=

# Digital Signature
SIGNATURE_ENCRYPTION_KEY=<32-byte-key>
```

---

## 6. PRIORITY MATRIX

| Feature | Business Impact | Effort | Priority | Phase |
|---------|-----------------|--------|----------|-------|
| Frontend-Backend Integration | HIGH | MEDIUM | 1 | Phase 1 |
| Digital Signature System | CRITICAL | HIGH | 2 | Phase 2 |
| PDF Report Generation | HIGH | MEDIUM | 3 | Phase 3 |
| Enhanced RBAC | HIGH | MEDIUM | 4 | Phase 5 |
| Sponsorship Renewal | MEDIUM | MEDIUM | 5 | Phase 4 |
| Immutable Records | MEDIUM | LOW | 6 | Phase 6 |
| Real-time Dashboard | LOW | LOW | 7 | Phase 7 |

---

## 7. IMPLEMENTATION TIMELINE

```
Week 1-2:   Phase 1 - Frontend-Backend Integration
Week 3-4:   Phase 2 - Digital Signature System
Week 4-5:   Phase 3 - PDF Report Card Generation
Week 5-6:   Phase 4 - Sponsorship Renewal + Phase 5 RBAC
Week 6:     Phase 6 - Immutable Records + Phase 7 Dashboard
Week 7:     Testing, Bug Fixes, UAT
Week 8:     Production Deployment
```

**Total Estimated Duration: 8 weeks**

---

## 8. TESTING REQUIREMENTS

### 8.1 Unit Tests
- [ ] Service layer tests
- [ ] Controller tests
- [ ] Model validation tests
- [ ] Utility function tests

### 8.2 Integration Tests
- [ ] API endpoint tests
- [ ] Database transaction tests
- [ ] Email delivery tests
- [ ] S3 upload tests

### 8.3 E2E Tests
- [ ] Complete workflow tests
- [ ] Role-based access tests
- [ ] Report card generation flow
- [ ] Bulk email distribution

---

## 9. NEXT IMMEDIATE ACTIONS

### For Today's Session:
1. **Set up API service layer** in frontend
2. **Create axios instance** with JWT interceptor
3. **Integrate Dashboard** with real API data
4. **Integrate UserList** with CRUD operations

### For This Week:
1. Complete frontend-backend integration for all pages
2. Implement proper error handling and loading states
3. Add toast notifications for user feedback
4. Test all CRUD operations

---

## 10. APPENDIX

### A. File Structure for New Implementations

```
backend/src/
├── jobs/
│   ├── index.js
│   ├── renewal-reminder.job.js
│   └── report-generation.job.js
├── services/
│   ├── pdf-generator.service.js
│   ├── signature.service.js
│   └── renewal.service.js
├── templates/
│   ├── report-card.html
│   ├── renewal-reminder.html
│   └── welcome-sponsor.html
└── utils/
    ├── certificate.utils.js
    └── pdf.utils.js

frontend/src/services/
├── api.js
├── auth.service.js
├── user.service.js
├── student.service.js
├── sponsor.service.js
├── attendance.service.js
├── marks.service.js
└── reportcard.service.js
```

### B. API Endpoints Summary (Existing + New)

**Existing (61 endpoints):**
- Auth: 8 endpoints
- Users: 10 endpoints
- Students: 9 endpoints
- Sponsors: 9 endpoints
- Attendance: 6 endpoints
- Marks: 8 endpoints
- Report Cards: 8 endpoints
- Dashboard: 2 endpoints
- Analytics: 5 endpoints

**New (to be added):**
- Signature Management: 5 endpoints
- Renewal Management: 4 endpoints
- Payment Recording: 3 endpoints
- System Configuration: 5 endpoints

---

**Document prepared for:** ZSchool Management System Development Team
**Approved by:** [Pending Review]
