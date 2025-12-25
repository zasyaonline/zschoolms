# Deployment Instructions - Action Required

## 🔐 Generated Secrets (Save These!)

```env
JWT_SECRET=2efc00922fe59afb4c7a00469a05e21d0c7dbeb5cf1f38705eb98a650f2b54bc
JWT_REFRESH_SECRET=8e90105075341b9085b79a4e06bcab1c37c7098ec83c1c64c5b3b606e48e02ae
MFA_SECRET=011fd32340067af2f03e867a76f4dd024cdb801a53f629ca2fd3f618a6342ac0
```

⚠️ **IMPORTANT:** Copy these to a secure location NOW!

---

## 🚀 Next Steps to Deploy

### Step 1: Deploy Backend to Render

1. **Go to:** https://render.com
2. **Sign up/Login** with GitHub
3. **Create PostgreSQL Database:**
   - Click "New +" → "PostgreSQL"
   - Name: `zschool-db`
   - Database: `zschool_db`
   - Plan: Free
   - Click "Create Database"
   - **SAVE:** Connection details (especially DATABASE_URL)

4. **Run Database Migrations:**
   ```bash
   # Get External Database URL from Render
   psql <EXTERNAL_DATABASE_URL>
   
   # Run migrations
   \i backend/migrations/001-add-auth-tables.sql
   \i backend/migrations/002-fix-audit-logs.sql
   \i backend/migrations/003_create_students_table.sql
   \i backend/migrations/004_create_sponsors_tables.sql
   \i backend/migrations/005_create_attendance_table.sql
   \i backend/migrations/006_create_marks_system.sql
   \i backend/migrations/007_create_report_cards.sql
   \q
   ```

5. **Create Web Service:**
   - Click "New +" → "Web Service"
   - Connect to GitHub repository: `zschoolms`
   - Name: `zschool-backend`
   - Region: Choose closest
   - Branch: `main`
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: Free

6. **Add Environment Variables** (in Render dashboard):
   ```env
   NODE_ENV=production
   PORT=5001
   
   # Database (use Internal Database URL from step 3)
   DATABASE_URL=<paste-internal-database-url>
   
   # JWT Secrets (from above)
   JWT_SECRET=2efc00922fe59afb4c7a00469a05e21d0c7dbeb5cf1f38705eb98a650f2b54bc
   JWT_REFRESH_SECRET=8e90105075341b9085b79a4e06bcab1c37c7098ec83c1c64c5b3b606e48e02ae
   MFA_SECRET=011fd32340067af2f03e867a76f4dd024cdb801a53f629ca2fd3f618a6342ac0
   
   JWT_EXPIRES_IN=1h
   JWT_REFRESH_EXPIRES_IN=7d
   BCRYPT_ROUNDS=10
   
   # Frontend URL (will update after Netlify deployment)
   FRONTEND_URL=http://localhost:5173
   
   # Email (optional for now)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   ```

7. **Deploy** - Wait 10-15 minutes for first deploy
8. **Save Your Backend URL:** `https://zschool-backend-xxxx.onrender.com`
9. **Test:** `curl https://your-backend-url/api/health`

---

### Step 2: Deploy Frontend to Netlify

1. **Update Frontend .env.production:**
   ```bash
   # Edit: frontend/.env.production
   VITE_API_BASE_URL=https://your-backend-url.onrender.com/api
   ```

2. **Commit and push this change:**
   ```bash
   git add frontend/.env.production
   git commit -m "Update API URL for production"
   git push
   ```

3. **Go to:** https://netlify.com
4. **Sign up/Login** with GitHub
5. **Create New Site:**
   - Click "Add new site" → "Import an existing project"
   - Choose "Deploy with GitHub"
   - Select your repository
   - Configure:
     - Site name: `zschool-app` (or choose your own)
     - Branch: `main`
     - Base directory: `frontend`
     - Build command: `npm run build`
     - Publish directory: `frontend/dist`

6. **Add Environment Variable:**
   - Click "Show advanced" → "New variable"
   - Key: `VITE_API_BASE_URL`
   - Value: `https://your-backend-url.onrender.com/api`

7. **Deploy site** - Wait 3-5 minutes
8. **Save Your Frontend URL:** `https://zschool-app.netlify.app`

---

### Step 3: Update Backend CORS

1. **Go back to Render** → Your backend service
2. **Update Environment Variables:**
   - Change `FRONTEND_URL` from `http://localhost:5173` to `https://your-site.netlify.app`
   - Service will auto-redeploy

---

### Step 4: Create Test Users in Production Database

```bash
# Connect to production database
psql <EXTERNAL_DATABASE_URL>

# Run user creation script content
INSERT INTO users (username, email, password_hash, role, is_active) 
VALUES 
('admin', 'admin@zschool.com', '$2b$10$YourHashedPasswordHere', 'admin', true);

# Or use the setup script from local
# (after setting production DATABASE_URL temporarily)
```

---

### Step 5: Test Your Deployed App

1. **Open:** `https://your-site.netlify.app`
2. **Try logging in:**
   - Email: `admin@zschool.com`
   - Password: `Admin@123`
3. **Verify:**
   - ✅ Login works
   - ✅ Dashboard loads
   - ✅ No console errors
   - ✅ API calls succeed

---

## 📋 Deployment URLs

Fill in after deployment:

```
Frontend (Netlify): https://_________________________________.netlify.app
Backend (Render):   https://_________________________________.onrender.com
API Docs:           https://_________________________________.onrender.com/api-docs

Test Credentials:
- Admin: admin@zschool.com / Admin@123
```

---

## 🎉 Success Checklist

- [ ] Backend deployed to Render
- [ ] Database created and migrations run
- [ ] Frontend deployed to Netlify
- [ ] CORS updated with Netlify URL
- [ ] Test users created
- [ ] Login works end-to-end
- [ ] URLs saved and shared with team

---

**Generated:** December 25, 2025  
**Status:** Ready to deploy  
**Estimated Time:** 30-40 minutes
