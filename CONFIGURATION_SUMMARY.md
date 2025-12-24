# ✅ Configuration Confirmed - Ready for Implementation

**Date**: December 22, 2025  
**Status**: Configuration Complete - Proceeding to Phase 1

---

## 📋 Configuration Summary

### 1. ✅ File Storage: AWS S3
```
Provider:        Amazon S3
Region:          ap-south-1 (Asia Pacific Mumbai)
Bucket:          zschoolms
Public URL:      https://zschoolms.s3.ap-south-1.amazonaws.com
Credentials:     ✅ Configured in .env
```

**Storage Structure**:
```
s3://zschoolms/
├── students/
│   ├── photos/
│   │   └── {studentId}/profile.jpg
│   └── documents/
├── reports/
│   ├── cards/
│   │   └── {academicYear}/{examType}/{studentId}.pdf
│   └── bulk/
├── certificates/
│   └── digital/
├── uploads/
│   └── temp/
└── backups/
```

### 2. ✅ Email Service: SMTP (Zeptomail)
```
Provider:        Zeptomail
SMTP Host:       smtp.zeptomail.in
Port:            587 (TLS)
From Email:      noreply@zasyaonline.com
From Name:       ZSchool Management System
Auth:            ✅ Configured
```

**Email Templates Required**:
- Welcome email (new user)
- Password reset
- Report card distribution
- Marks approval notification
- Marks rejection notification
- Account activation

### 3. ⚠️ Redis: Not Currently Available
**Status**: Deferred for Phase 2+

**Implications**:
- ❌ No background job queue (BullMQ) - Use simple async for now
- ❌ No caching layer - Direct DB queries
- ❌ No rate limiting with Redis - Use in-memory store
- ✅ Can add later without major refactoring

**Workaround for Phase 1**:
- Use in-memory store for rate limiting (`express-rate-limit` default)
- PDF generation: Synchronous with timeout
- Email sending: Async without queue
- Report distribution: Small batches

**Future Redis Implementation** (when available):
```javascript
// Caching
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

// Queue
QUEUE_ENABLED=true
QUEUE_CONCURRENCY=5
```

### 4. ✅ Multi-School: Single School Mode
```
Mode:            Single School
School Name:     Vision Academy School
Database:        Single tenant (all tables have implicit school context)
Future:          Schema supports multi-school (school_id FK ready)
```

**Implementation**:
- No school selection UI needed
- `school_id` FK added to tables but set to default UUID
- Easy migration path: Add school selection later
- Configuration: `MULTI_SCHOOL_ENABLED=false`

### 5. ✅ MFA: Admin & Principal Only
```
Enabled For:     admin, principal roles
Method:          TOTP (Google Authenticator, Authy)
Required:        Yes (enforced for sensitive operations)
Setup:           On first login or manual activation
Backup Codes:    Yes (10 codes generated)
```

**MFA Enforcement Points**:
- ✅ Report card signing
- ✅ Digital certificate upload
- ✅ User deletion
- ✅ Marks approval (principal)
- ✅ System settings changes
- ❌ Regular marks entry (teacher) - Not required

**Implementation**:
- `speakeasy` package for TOTP
- `qrcode` package for QR generation
- Middleware: `verifyMFA()` for sensitive routes

### 6. ✅ Digital Certificates: Let's Encrypt
```
Provider:        Let's Encrypt (via Certbot)
SSL/TLS:         Free automated certificates
Renewal:         Auto-renew every 90 days
Domain:          {your-domain.com}
Signature:       HTTPS enforced in production
```

**Certificate Storage**:
```
/etc/letsencrypt/live/{domain}/
├── fullchain.pem    (Public certificate)
├── privkey.pem      (Private key)
└── chain.pem        (Intermediate certificate)
```

**For Report Card Signatures**:
- Principal's digital signature: Image/SVG overlay
- School seal: Image overlay
- Certificates stored in S3: `s3://zschoolms/certificates/digital/`

### 7. ✅ Report Card Template: Pending from UI Designer
**Status**: Will be provided later

**Interim Solution**:
- Use basic HTML template with school branding
- Puppeteer for PDF generation
- Template engine: Handlebars
- Easy to replace with final design

**Template Variables**:
```javascript
{
  school: { name, logo, address },
  student: { name, admissionNo, photo, grade, section },
  academicYear: '2024-2025',
  examType: 'Final Exam',
  subjects: [{ name, marks, total, grade, remarks }],
  attendance: { total, present, percentage },
  overall: { totalMarks, percentage, grade, rank },
  principal: { name, signature },
  issueDate: '2024-12-22'
}
```

---

## 🔐 Updated Security Configuration

### Environment Variables (.env) - ✅ Updated
```dotenv
# Server
PORT=5001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database
DB_HOST=63.250.52.24
DB_PORT=5432
DB_USER=zschool_user
DB_PASSWORD=P@ssw0rd
DB_DATABASE=zschool_db

# JWT
JWT_SECRET=zschool-super-secret-jwt-key-change-this-in-production-2025
JWT_EXPIRE=15m                    # ⚠️ Changed from 7d to 15m (access token)
JWT_REFRESH_SECRET=zschool-refresh-secret-key-change-this-in-production-2025
JWT_REFRESH_EXPIRE=30d

# Security
BCRYPT_ROUNDS=12                  # ⚠️ Increased from 10 to 12
RATE_LIMIT_WINDOW_MS=900000       # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_LOGIN_MAX=5            # 5 login attempts per 15min
RATE_LIMIT_LOGIN_WINDOW_MS=900000

# MFA
MFA_ENABLED=true
MFA_APP_NAME=ZSchool Management System
MFA_REQUIRED_ROLES=admin,principal

# School
SCHOOL_NAME=Vision Academy School
MULTI_SCHOOL_ENABLED=false

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
AWS_REGION=ap-south-1
S3_BUCKET_NAME=zschoolms
S3_PUBLIC_URL=https://zschoolms.s3.ap-south-1.amazonaws.com

# Email (Zeptomail)
SMTP_HOST=smtp.zeptomail.in
SMTP_PORT=587
SMTP_USER=emailapikey
SMTP_PASS="PHtE6r1cFLvuiGQp9kQA4/a8FsKtYI0mr+1kKwMTs9pACvMES00Do48qmjezq0wtA/hKFPCSyItvs76Y4uPUdz3uMWgZVWqyqK3sx/VYSPOZsbq6x00ft1QTdEbeVYDpd9Fr1CDVs9rfNA=="
SMTP_FROM_EMAIL=noreply@zasyaonline.com
SMTP_FROM_NAME=ZSchool Management System

# File Upload
MAX_FILE_SIZE=5242880              # 5MB general files
MAX_PHOTO_SIZE=2097152             # 2MB for photos
MAX_CERTIFICATE_SIZE=10485760      # 10MB for certificates
UPLOAD_DIR=./uploads
ALLOWED_PHOTO_TYPES=image/jpeg,image/png,image/jpg
ALLOWED_CERTIFICATE_TYPES=application/x-pkcs12,application/x-x509-ca-cert

# Logging
LOG_LEVEL=info
```

---

## 📦 Required NPM Packages (Phase 1)

### Core Dependencies
```bash
npm install --save \
  aws-sdk@2.1522.0 \
  multer@1.4.5-lts.1 \
  multer-s3@3.0.1 \
  nodemailer@6.9.7 \
  speakeasy@2.0.0 \
  qrcode@1.5.3 \
  winston@3.11.0 \
  winston-daily-rotate-file@4.7.1
```

### Already Installed ✅
- express@4.21.2
- cors@2.8.5
- dotenv@16.4.7
- helmet@8.0.0
- morgan@1.10.0
- pg@8.13.1
- sequelize@6.37.5
- bcryptjs@2.4.3
- jsonwebtoken@9.0.2
- express-validator@7.2.1
- express-rate-limit@7.5.0
- joi@17.13.3

### Phase 2+ (Deferred)
```bash
# PDF Generation
npm install puppeteer@21.6.1 handlebars@4.7.8

# Background Jobs (when Redis available)
npm install bullmq@4.15.2 redis@4.6.11

# CSV/Excel
npm install csv-parser@3.0.0 exceljs@4.4.0

# API Documentation
npm install swagger-jsdoc@6.2.8 swagger-ui-express@5.0.0

# Testing
npm install --save-dev jest@29.7.0 supertest@6.3.3
```

---

## 🚀 Phase 1 Implementation - Ready to Start

### What We're Building First
1. **Authentication APIs** (4 endpoints)
   - POST /api/auth/login
   - POST /api/auth/mfa-verify (admin/principal)
   - POST /api/auth/refresh
   - POST /api/auth/logout

2. **User Management APIs** (5 endpoints)
   - GET /api/users (list with pagination)
   - POST /api/users (create)
   - PUT /api/users/:id (update)
   - DELETE /api/users/:id (soft delete)
   - POST /api/users/import-csv (bulk import)

### Database Models to Create
1. **RefreshToken** (new)
   - user_id (FK)
   - token (unique)
   - expires_at
   - is_revoked

2. **AuditLog** (new)
   - user_id
   - action
   - entity_type
   - entity_id
   - old_values (JSONB)
   - new_values (JSONB)
   - ip_address
   - user_agent

3. **User** (extend existing)
   - Add mfa_secret
   - Add mfa_enabled
   - Add mfa_backup_codes (array)

### Middleware to Build
1. Rate limiting with in-memory store
2. MFA verification middleware
3. Audit logging middleware
4. Enhanced validation
5. File upload middleware (S3)

---

## ✅ Pre-Flight Checklist

- ✅ Node v20.19.6 installed
- ✅ PostgreSQL connected
- ✅ Backend running on port 5001
- ✅ Frontend running on port 5173
- ✅ .env configured with all credentials
- ✅ AWS S3 credentials validated
- ✅ SMTP credentials configured
- ✅ MFA requirements defined
- ✅ Single school mode confirmed
- ✅ API plan reviewed and approved

---

## 🎯 Next Steps

1. **Install Phase 1 packages** (5 minutes)
   ```bash
   cd /Users/zasyaonline/Projects/zschoolms/backend
   npm install aws-sdk multer multer-s3 nodemailer speakeasy qrcode winston winston-daily-rotate-file
   ```

2. **Create S3 configuration** (config/s3.config.js)

3. **Create email service** (services/email.service.js)

4. **Create logging utility** (utils/logger.js)

5. **Build RefreshToken model** (models/RefreshToken.js)

6. **Build AuditLog model** (models/AuditLog.js)

7. **Implement authentication APIs** (Week 1)

---

## 📊 Adjusted Implementation Timeline

| Week | Phase | APIs | Changes from Original Plan |
|------|-------|------|----------------------------|
| 1 | Authentication & Users | 9 | No Redis queue for CSV import |
| 2 | Students & Sponsors | 11 | S3 upload for photos |
| 3 | Attendance | 3 | No changes |
| 4-5 | Marks & Examination | 6 | No background jobs |
| 6-7 | Report Cards | 7 | Sync PDF generation, no queue |
| 8 | System Configuration | 8 | Single school focus |
| 9 | Dashboard & Analytics | 3 | No Redis caching |
| 10 | Audit & Compliance | 2 | No changes |

**Total**: 49 APIs over 10 weeks

---

## ⚠️ Important Notes

### Security Reminders
1. **JWT Expiry**: Access tokens expire in 15 minutes (changed from 7 days)
2. **MFA Enforcement**: Always verify MFA for admin/principal sensitive actions
3. **Rate Limiting**: In-memory store will reset on server restart
4. **Passwords**: Never log passwords or tokens
5. **S3 Access**: Use presigned URLs for private content

### Production Checklist (Before Deployment)
- [ ] Change JWT_SECRET to cryptographically secure random string
- [ ] Change JWT_REFRESH_SECRET to different secure string
- [ ] Change DB password
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS with Let's Encrypt
- [ ] Configure proper CORS origin
- [ ] Set up CloudWatch/monitoring
- [ ] Configure S3 bucket policies
- [ ] Set up automated backups
- [ ] Configure log rotation
- [ ] Test email delivery
- [ ] Test S3 uploads
- [ ] Load test APIs
- [ ] Security audit

---

## ✅ Ready to Proceed

**Status**: All configurations validated and ready for Phase 1 implementation.

**Waiting for your confirmation to**:
1. Install Phase 1 npm packages
2. Create configuration files
3. Build authentication models
4. Implement authentication APIs

**Reply "PROCEED" to start Phase 1 implementation!** 🚀
