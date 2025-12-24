# Swagger Documentation - Quick Reference Guide

**ZSchool Management System API Documentation**  
**Access**: http://localhost:5001/api-docs  
**Status**: ✅ 100% Complete (61/61 endpoints)

---

## 🚀 Quick Start

### Access Swagger UI
```
http://localhost:5001/api-docs
```

### Test an Endpoint

1. **Login First**:
   ```bash
   curl -X POST http://localhost:5001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"emailOrUsername": "admin@example.com", "password": "admin123"}'
   ```

2. **Copy the accessToken** from response

3. **In Swagger UI**:
   - Click the green **"Authorize"** button (top right)
   - Enter: `Bearer YOUR_ACCESS_TOKEN`
   - Click **"Authorize"** then **"Close"**

4. **Try any endpoint**:
   - Click on any endpoint to expand it
   - Click **"Try it out"**
   - Fill in parameters
   - Click **"Execute"**

---

## 📚 Available Modules

### 1. Authentication (8 endpoints) 🔐
- POST /login - Login with credentials
- POST /mfa-verify - Verify MFA code
- POST /refresh - Refresh access token
- POST /logout - Logout user
- GET /me - Get current user
- POST /mfa-setup - Setup MFA
- POST /mfa-enable - Enable MFA
- POST /mfa-disable - Disable MFA

### 2. Users (7 endpoints) 👥
- GET /users/stats - User statistics
- GET /users - List all users
- GET /users/:id - Get user by ID
- POST /users - Create user
- PUT /users/:id - Update user
- PUT /users/:id/password - Change password
- DELETE /users/:id - Delete user

### 3. Students (10 endpoints) 🎓
- POST /students - Create student
- GET /students - List students
- GET /students/:id - Get student
- GET /students/enrollment/:number - By enrollment
- PUT /students/:id - Update student
- DELETE /students/:id - Delete student
- POST /students/:id/parent - Map parent
- POST /students/:id/sponsor - Map sponsor
- POST /students/bulk-import - Bulk import
- GET /students/stats - Statistics

### 4. Sponsors (10 endpoints) 💰
- POST /sponsors - Create sponsor
- GET /sponsors - List sponsors
- GET /sponsors/:id - Get sponsor
- PUT /sponsors/:id - Update sponsor
- DELETE /sponsors/:id - Delete sponsor
- POST /sponsors/:id/students/:studentId - Map student
- DELETE /sponsors/:id/students/:studentId - Unmap student
- GET /sponsors/:id/students - Get students
- GET /sponsors/stats - Statistics
- GET /sponsors/:id/payments - Payment history

### 5. Attendance (5 endpoints) 📅
- POST /attendance - Mark attendance
- GET /attendance - Get records
- GET /attendance/:id - Get record
- PUT /attendance/:id - Update record
- GET /attendance/stats - Statistics

### 6. Marks (10 endpoints) 📝
- POST /marks/entry - Enter marks
- GET /marks/pending - Pending marksheets
- GET /marks/marksheets - All marksheets
- GET /marks/marksheets/:id - Get marksheet
- POST /marks/marksheets/:id/submit - Submit marksheet
- POST /marks/marksheets/:id/approve - Approve marksheet
- POST /marks/marksheets/:id/reject - Reject marksheet
- GET /marks/student/:studentId - Student marks
- GET /marks/subject/:subjectId/stats - Subject stats
- PUT /marks/:id - Update mark

### 7. Report Cards (7 endpoints) 📊
- POST /report-cards/generate - Generate report
- POST /report-cards/:id/sign - Sign report
- POST /report-cards/:id/distribute - Distribute via email
- GET /report-cards/student/:studentId - Student reports
- GET /report-cards/:id - Get report
- DELETE /report-cards/:id - Delete draft
- GET /report-cards - All reports

### 8. Analytics (2 endpoints) 📈
- GET /analytics/student-performance - Student analytics
- GET /analytics/school-dashboard - School dashboard

### 9. Dashboard (2 endpoints) 🏠
- GET /dashboard/metrics - Dashboard metrics
- GET /dashboard/activity - Recent activity

---

## 🔑 Authentication Flow

### Standard Login
```javascript
// 1. Login
POST /api/auth/login
Body: { "emailOrUsername": "user@example.com", "password": "pass123" }
Response: { "accessToken": "...", "refreshToken": "..." }

// 2. Use token in requests
Headers: { "Authorization": "Bearer ACCESS_TOKEN" }

// 3. Refresh when expired
POST /api/auth/refresh
Body: { "refreshToken": "REFRESH_TOKEN" }
Response: { "accessToken": "...", "refreshToken": "..." }
```

### MFA Login
```javascript
// 1. Login (MFA enabled)
POST /api/auth/login
Response: { "tempToken": "...", "requireMfa": true }

// 2. Verify MFA code
POST /api/auth/mfa-verify
Body: { "tempToken": "...", "totpCode": "123456" }
Response: { "accessToken": "...", "refreshToken": "..." }
```

---

## 👤 User Roles & Permissions

### Role Hierarchy
1. **super_admin** - Full system access
2. **admin** - School management
3. **principal** - Academic oversight
4. **teacher** - Teaching duties
5. **student** - View own data
6. **parent** - View children's data
7. **staff** - Basic access

### Common Permissions

| Action | Super Admin | Admin | Principal | Teacher | Student |
|--------|-------------|-------|-----------|---------|---------|
| Manage Users | ✅ | ✅ | ❌ | ❌ | ❌ |
| View All Students | ✅ | ✅ | ✅ | ✅ | ❌ |
| Enter Marks | ✅ | ✅ | ✅ | ✅ | ❌ |
| Approve Marks | ✅ | ✅ | ✅ | ❌ | ❌ |
| Sign Reports | ✅ | ✅ | ✅ | ❌ | ❌ |
| View Analytics | ✅ | ✅ | ✅ | ✅ | Own Only |

---

## 🔍 Common Use Cases

### Create a New Student
```bash
curl -X POST http://localhost:5001/api/students \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "2010-05-15",
    "gender": "male",
    "admissionNumber": "STU2025001",
    "schoolId": "uuid-here"
  }'
```

### Mark Attendance
```bash
curl -X POST http://localhost:5001/api/attendance \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "attendanceData": [
      {
        "studentId": "student-uuid",
        "date": "2025-12-22",
        "class": "10-A",
        "status": "present"
      }
    ]
  }'
```

### Enter Marks
```bash
curl -X POST http://localhost:5001/api/marks/entry \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "student-uuid",
    "academicYearId": "year-uuid",
    "term": "First Term",
    "marks": [
      {
        "subjectId": "subject-uuid",
        "marksObtained": 85,
        "maxMarks": 100,
        "examType": "final"
      }
    ]
  }'
```

### Generate Report Card
```bash
curl -X POST http://localhost:5001/api/report-cards/generate \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "student-uuid",
    "academicYearId": "year-uuid"
  }'
```

### View Analytics
```bash
curl -X GET 'http://localhost:5001/api/analytics/school-dashboard?academicYearId=year-uuid' \
  -H "Authorization: Bearer TOKEN"
```

---

## 📖 Response Formats

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "message": "Operation successful",
  "timestamp": "2025-12-22T10:30:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {
      // Additional error details
    }
  }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": {
    "items": [ /* array of items */ ],
    "pagination": {
      "total": 150,
      "page": 1,
      "limit": 20,
      "totalPages": 8
    }
  }
}
```

---

## 🛠️ HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET, PUT, DELETE |
| 201 | Created | Successful POST |
| 400 | Bad Request | Validation errors |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Internal error |

---

## 💡 Tips & Best Practices

### 1. Always Authenticate First
Get your access token before testing protected endpoints.

### 2. Use Pagination
For list endpoints, use `page` and `limit` parameters:
```
GET /api/students?page=1&limit=20
```

### 3. Filter Results
Most list endpoints support filtering:
```
GET /api/users?role=teacher&isActive=true
```

### 4. Sort Results
Use `sortBy` and `order` parameters:
```
GET /api/students?sortBy=createdAt&order=DESC
```

### 5. Handle Errors Gracefully
Always check the `success` field in responses.

### 6. Refresh Tokens Before Expiry
Access tokens expire. Refresh proactively.

### 7. Test in Swagger UI
Use the interactive UI to understand request/response formats.

---

## 🔗 Useful Links

- **Swagger UI**: http://localhost:5001/api-docs
- **API Base**: http://localhost:5001/api
- **Health Check**: http://localhost:5001/api/health
- **API Listing**: http://localhost:5001/api

---

## 📞 Support

### Documentation Issues
Check the Swagger UI for the most up-to-date documentation.

### Common Problems

**Problem**: 401 Unauthorized  
**Solution**: Ensure you're sending the Bearer token in Authorization header

**Problem**: 403 Forbidden  
**Solution**: Check if your user role has permission for this endpoint

**Problem**: 400 Bad Request  
**Solution**: Validate request body against schema in Swagger docs

**Problem**: Can't access Swagger UI  
**Solution**: Ensure server is running: `npm start` in backend directory

---

**Last Updated**: December 22, 2025  
**API Version**: 1.0.0  
**Server**: http://localhost:5001  
**Coverage**: 100% (61/61 endpoints documented)
