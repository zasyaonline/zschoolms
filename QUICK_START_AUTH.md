# 🚀 Quick Start: Testing Authentication APIs

## Server Status
- ✅ Backend: http://localhost:5001
- ✅ Frontend: http://localhost:5173
- ✅ Database: Connected (zschool_db)

---

## 1. Login (No MFA)
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrUsername": "teacher@example.com", "password": "password123"}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "a1b2c3...",
    "user": { "id": "...", "role": "teacher" }
  }
}
```

---

## 2. Login (With MFA)
**Step 1:**
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrUsername": "admin@example.com", "password": "admin123"}'
```

**Response:**
```json
{
  "success": true,
  "requiresMFA": true,
  "tempToken": "eyJhbGci..."
}
```

**Step 2:**
```bash
curl -X POST http://localhost:5001/api/auth/mfa-verify \
  -H "Content-Type: application/json" \
  -d '{"tempToken": "eyJhbGci...", "totpCode": "123456"}'
```

---

## 3. Get Current User
```bash
curl http://localhost:5001/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 4. Setup MFA
```bash
curl -X POST http://localhost:5001/api/auth/mfa-setup \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response includes QR code to scan with authenticator app**

---

## 5. Enable MFA
```bash
curl -X POST http://localhost:5001/api/auth/mfa-enable \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"totpCode": "123456"}'
```

---

## 6. Refresh Token
```bash
curl -X POST http://localhost:5001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "YOUR_REFRESH_TOKEN"}'
```

---

## 7. Logout
```bash
curl -X POST http://localhost:5001/api/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "YOUR_REFRESH_TOKEN"}'
```

---

## 🔒 Rate Limits
- Login: 5 attempts / 15 min
- MFA: 10 attempts / 15 min
- API: 100 requests / 15 min

---

## 📊 Database Check
```bash
# Check users table
PGPASSWORD="P@ssw0rd" psql -h 63.250.52.24 -U zschool_user -d zschool_db \
  -c "SELECT id, username, email, role, mfa_enabled FROM users;"

# Check refresh tokens
PGPASSWORD="P@ssw0rd" psql -h 63.250.52.24 -U zschool_user -d zschool_db \
  -c "SELECT id, user_id, expires_at, is_revoked FROM refresh_tokens;"

# Check audit logs
PGPASSWORD="P@ssw0rd" psql -h 63.250.52.24 -U zschool_user -d zschool_db \
  -c "SELECT action, entity_type, status, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 10;"
```

---

## 📱 Test with Authenticator App
1. Google Authenticator (iOS/Android)
2. Microsoft Authenticator (iOS/Android)
3. Authy (iOS/Android/Desktop)

Scan QR code from `/api/auth/mfa-setup` response.

---

## ✅ Success Checklist
- [ ] Login returns access token
- [ ] Protected endpoints require auth
- [ ] MFA setup generates QR code
- [ ] Authenticator app shows 6-digit code
- [ ] MFA verification works
- [ ] Token refresh works
- [ ] Logout revokes token
- [ ] Rate limiting blocks after 5 failed attempts
- [ ] Audit logs created for all actions

---

## 🐛 Troubleshooting
**Login fails:** Check user exists and isActive=true  
**Token invalid:** Check JWT_SECRET in .env  
**MFA fails:** Verify TOTP code is current (30s window)  
**Rate limited:** Wait 15 minutes or restart server  
**DB error:** Verify connection in backend/src/config/database.js

---

## 📚 Full Documentation
- [PHASE_1_COMPLETION_REPORT.md](./PHASE_1_COMPLETION_REPORT.md)
- [PHASE_1_TESTING_GUIDE.md](./PHASE_1_TESTING_GUIDE.md)
- [PHASE_1_SUMMARY.md](./PHASE_1_SUMMARY.md)

---

**Status:** ✅ Phase 1 Complete  
**Ready for:** User acceptance testing
