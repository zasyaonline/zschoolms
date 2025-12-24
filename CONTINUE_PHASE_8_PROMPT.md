# Prompt for New Chat: Continue Phase 8 Implementation

Copy the content below and paste it into a new chat to continue working on Phase 8:

---

## Context: ZSchool Management System - Phase 8 Implementation

I'm working on a **ZSchool Management System** backend API built with **Node.js, Express, PostgreSQL, Sequelize ORM**.

### Project Structure
```
/Users/zasyaonline/Projects/zschoolms/
├── backend/
│   ├── src/
│   │   ├── models/        # Sequelize models
│   │   ├── services/      # Business logic
│   │   ├── controllers/   # HTTP handlers
│   │   ├── routes/        # Express routes with Swagger docs
│   │   ├── middleware/    # Auth & validation
│   │   └── index.js       # Main server file (port 5001)
│   └── migrations/        # SQL migrations
├── frontend/              # React + Vite
└── shared/
```

### Database Connection
- **Host**: 63.250.52.24:5432
- **Database**: zschool_db
- **User**: zschool_user
- **Password**: P@ssw0rd

### What's Been Completed

**Phase 7: Marks/Grading System** ✅ (100% Complete)
- **10 endpoints** fully implemented and tested
- **Files created**:
  - `/backend/src/models/Subject.js` (215 lines)
  - `/backend/src/models/Marksheet.js` (275 lines)
  - `/backend/src/models/Mark.js` (412 lines)
  - `/backend/src/services/marks.service.js` (578 lines)
  - `/backend/src/controllers/marks.controller.js` (361 lines)
  - `/backend/src/routes/marks.routes.js` (579 lines)
- **Features**:
  - Works with existing complex enrollment-based schema
  - Approval workflow: Draft → submitted → approved/rejected
  - Auto-grade calculation via database triggers
  - Bulk marks entry for multiple subjects
  - Subject statistics (avg marks, pass rate, etc.)
  - Role-based access (teacher, principal, admin, student)
- **Routes mounted**: `app.use('/api/marks', marksRoutes)` in `/backend/src/index.js`
- **Associations added** to `/backend/src/models/index.js`

### What Needs to Be Done

**Phase 8: Report Cards System** 🔄 (Infrastructure 50% - Implementation 0%)

**Database Status**:
- ✅ Migration file created: `/backend/migrations/007_create_report_cards.sql` (276 lines)
- ✅ Migration executed (partial success):
  - Created: `report_card_status_enum`, `report_type_enum`
  - Created: `report_card_attachments` table
  - Created: `report_card_distribution_log` table
  - Created: `update_report_card_status()`, `mark_email_opened()` functions
  - **Existing table**: `report_cards` already exists (13 columns)

**Existing `report_cards` Table Schema**:
```sql
Column              | Type                     | Modifiers
--------------------+--------------------------+------------
id                  | uuid                     | PK, default gen_random_uuid()
student_id          | uuid                     | NOT NULL
academic_year_id    | uuid                     | NOT NULL
school_id           | uuid                     | NOT NULL
total_marks_obtained| numeric(10,2)            | default 0.00
total_max_marks     | numeric(10,2)            | default 0.00
percentage          | numeric(5,2)             | default 0.00
final_grade         | character varying(10)    |
status              | character varying(50)    | default 'Draft'
signed_by           | uuid                     | FK to users(id)
pdf_url             | text                     |
created_at          | timestamp with time zone | default CURRENT_TIMESTAMP
modified_at         | timestamp with time zone | default CURRENT_TIMESTAMP

Indexes:
- report_cards_pkey (id)
- report_cards_student_id_academic_year_id_key (student_id, academic_year_id) UNIQUE
- idx_report_cards_academic_year (academic_year_id)
- idx_report_cards_school (school_id)
- idx_report_cards_status (status)
- idx_report_cards_student (student_id)

Foreign Keys:
- report_cards_school_id_fkey → schools(id)
- report_cards_signed_by_fkey → users(id)
- report_cards_student_id_fkey → students(id)
```

**Implementation Plan** (4 endpoints required):

1. **POST /api/report-cards/generate** - Generate report card
   - Calculate totals from approved marksheets
   - Generate PDF (use puppeteer or pdfkit)
   - Store PDF URL
   - Set status to 'Generated'
   - Authorization: teacher, admin, super_admin, principal

2. **POST /api/report-cards/:id/sign** - Sign report card
   - Update `signed_by` field
   - Update status to 'Signed'
   - Authorization: principal, admin, super_admin ONLY

3. **POST /api/report-cards/:id/distribute** - Distribute via email
   - Send email to sponsors/parents (use nodemailer)
   - Log in `report_card_distribution_log` table
   - Update status to 'Distributed'
   - Authorization: admin, super_admin, principal

4. **GET /api/report-cards/student/:studentId** - View student reports
   - Get all report cards for student
   - Include PDF URL, status, signature info
   - Authorization: all roles (students can view their own)

**Files to Create**:

1. `/backend/src/models/ReportCard.js`
   - Fields matching existing schema (13 columns)
   - Instance methods: `canSign()`, `canDistribute()`, `calculateGrade()`, `sign(userId)`, `distribute(userId, emails)`
   - Class methods: `getByStudent(studentId)`, `getByAcademicYear(academicYearId)`, `getPending()`

2. `/backend/src/models/ReportCardAttachment.js`
   - For attachments table created in migration

3. `/backend/src/models/ReportCardDistributionLog.js`
   - For distribution tracking table created in migration

4. `/backend/src/services/reportcard.service.js`
   - `generateReportCard(studentId, academicYearId, generatedBy)` - Calculate from marksheets, generate PDF
   - `signReportCard(reportCardId, principalId)` - Validate principal role, update signed_by
   - `distributeReportCard(reportCardId, distributedBy, recipientEmails)` - Send emails, log distribution
   - `getStudentReportCards(studentId, filters)` - Get all with pagination
   - `getReportCardById(reportCardId)` - Single report with attachments
   - `deleteReportCard(reportCardId, userId)` - Delete if Draft only

5. `/backend/src/controllers/reportcard.controller.js`
   - 4+ HTTP handlers with validation and error handling

6. `/backend/src/routes/reportcard.routes.js`
   - 4+ Express routes with Swagger documentation

**Update Files**:
- `/backend/src/models/index.js` - Add ReportCard associations
- `/backend/src/index.js` - Mount report card routes: `app.use('/api/report-cards', reportCardRoutes)`

### Technical Requirements

**Authentication Pattern** (from existing code):
```javascript
import { authenticate, authorize } from '../middleware/auth.js';

router.post('/generate',
  authenticate,
  authorize(['teacher', 'admin', 'super_admin', 'principal']),
  reportCardController.generateReportCard
);
```

**Service Pattern** (from marks.service.js):
```javascript
export const generateReportCard = async (studentId, academicYearId, generatedBy) => {
  const transaction = await sequelize.transaction();
  try {
    // 1. Get approved marksheets for student/academic year
    // 2. Calculate totals (sum marksObtained, sum maxMarks, calculate percentage)
    // 3. Determine final_grade based on percentage
    // 4. Generate PDF (simplified or use puppeteer)
    // 5. Store in report_cards table
    // 6. Commit transaction
    // 7. Return report card
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
```

**Model Pattern** (from Marksheet.js):
```javascript
class ReportCard extends Model {
  canSign() {
    return this.status === 'Generated' && !this.signedBy;
  }
  
  async sign(userId, transaction) {
    if (!this.canSign()) {
      throw new Error('Report card cannot be signed in current status');
    }
    this.signedBy = userId;
    this.status = 'Signed';
    await this.save({ transaction });
  }
}
```

**Swagger Documentation Pattern** (from marks.routes.js):
```javascript
/**
 * @swagger
 * /api/report-cards/generate:
 *   post:
 *     summary: Generate report card for student
 *     tags: [Report Cards]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentId
 *               - academicYearId
 *             properties:
 *               studentId:
 *                 type: string
 *                 format: uuid
 *               academicYearId:
 *                 type: string
 *                 format: uuid
 */
```

### Important Notes

1. **Work with existing schema**: The report_cards table already exists with a simpler schema (13 columns) than the migration attempted (38 columns). Use what exists.

2. **PDF Generation**: Can start with a basic implementation (HTML to PDF) and enhance later with puppeteer/pdfkit.

3. **Email Service**: Nodemailer is already installed. Check for existing email configuration in the codebase.

4. **Status Flow**: `Draft → Generated → Signed → Distributed`

5. **Unique Constraint**: One report card per student per academic year (enforced by DB constraint).

6. **Authorization**:
   - Generate: teacher, admin, super_admin, principal
   - Sign: principal, admin, super_admin ONLY
   - Distribute: admin, super_admin, principal
   - View: all roles (students can view their own)

7. **Dependencies Already Installed**:
   - nodemailer (email)
   - aws-sdk (S3 storage - optional)
   - multer, multer-s3 (file upload)
   - swagger-jsdoc, swagger-ui-express (API docs)

### Server Info
- **Port**: 5001 (not 5000)
- **Main file**: `/backend/src/index.js`
- **Start command**: `npm run dev` (from backend directory)
- **Node version**: v22.21.1

### Request

Please implement Phase 8 (Report Cards System) by creating the models, services, controllers, and routes following the patterns established in Phase 7 (Marks System). Work with the existing database schema (13-column report_cards table). Generate comprehensive Swagger documentation for all endpoints.

After implementation, restart the server and verify the endpoints are accessible. Update `/backend/src/models/index.js` with associations and mount the routes in `/backend/src/index.js`.

---

**End of prompt - paste above into new chat**
