# Quick Start: Deploy to Test Environment

Follow these steps to deploy ZSchool to publicly accessible URLs.

---

## 🎯 Goal
- **Frontend:** Live on Netlify (https://your-site.netlify.app)
- **Backend:** Live on Render (https://your-backend.onrender.com)
- **Time:** 30-45 minutes

---

## 📋 Quick Steps

### 1️⃣ Prepare Deployment (5 min)

```bash
# Run preparation script
./prepare-deployment.sh

# This will:
# - Generate secure JWT secrets
# - Test frontend build
# - Create checklist
# - Save secrets to .deployment-secrets.txt

# Copy the generated secrets - you'll need them!
```

### 2️⃣ Deploy Backend to Render (15 min)

1. **Go to:** [render.com](https://render.com)
2. **Sign up** with GitHub
3. **Create PostgreSQL Database:**
   - Click "New +" → "PostgreSQL"
   - Name: `zschool-db`
   - Plan: Free
   - Click "Create"
   - **Copy the connection details**

4. **Run Migrations:**
   ```bash
   # Copy the External Database URL from Render
   psql <EXTERNAL_DATABASE_URL>
   
   # Run each migration
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
   - Connect your GitHub repository
   - Name: `zschool-backend`
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: Free

6. **Add Environment Variables:**
   ```
   DATABASE_URL=<from-database-internal-url>
   NODE_ENV=production
   PORT=5001
   FRONTEND_URL=http://localhost:5173
   JWT_SECRET=<from-prepare-deployment.sh>
   JWT_REFRESH_SECRET=<from-prepare-deployment.sh>
   JWT_EXPIRES_IN=1h
   JWT_REFRESH_EXPIRES_IN=7d
   BCRYPT_ROUNDS=10
   ```

7. **Deploy** and wait 5-10 minutes
8. **Copy your backend URL:** `https://zschool-backend-xxxx.onrender.com`
9. **Test:** `curl https://your-backend-url/api/health`

### 3️⃣ Deploy Frontend to Netlify (10 min)

1. **Update `.env.production`:**
   ```bash
   # Edit frontend/.env.production
   VITE_API_BASE_URL=https://your-backend-url.onrender.com/api
   ```

2. **Go to:** [netlify.com](https://netlify.com)
3. **Sign up** with GitHub
4. **Create New Site:**
   - Click "Add new site" → "Import existing project"
   - Connect to GitHub
   - Select your repository
   - Configure:
     - Base directory: `frontend`
     - Build command: `npm run build`
     - Publish directory: `frontend/dist`
   - Add environment variable:
     - Key: `VITE_API_BASE_URL`
     - Value: `https://your-backend-url.onrender.com/api`

5. **Deploy** and wait 3-5 minutes
6. **Copy your frontend URL:** `https://your-site.netlify.app`

### 4️⃣ Update Backend CORS (5 min)

1. **Update Render environment variables:**
   - Go to your backend service on Render
   - Add/update: `FRONTEND_URL=https://your-site.netlify.app`
   - Service will auto-redeploy

2. **Or update code** (if CORS is hardcoded):
   ```javascript
   // backend/src/index.js
   app.use(cors({
     origin: [
       process.env.FRONTEND_URL,
       'https://your-site.netlify.app'
     ]
   }));
   ```
   Then commit and push.

### 5️⃣ Create Test Users (5 min)

```bash
# Connect to production database
psql <PRODUCTION_DATABASE_URL>

# Insert admin user (hash for 'Admin@123')
INSERT INTO users (username, email, password_hash, role, is_active) 
VALUES (
  'admin', 
  'admin@zschool.com', 
  '$2b$10$rN7YnZOLOc.r9xYz8WqhOuqC0vVHnKLDtO5nO.vLKO5qD5rQ3zK7G',
  'admin', 
  true
);

# Or use the setup script (requires backend URL)
# node backend/create-all-users.cjs
```

### 6️⃣ Test Everything (5 min)

1. **Open:** `https://your-site.netlify.app`
2. **Login with:** admin@zschool.com / Admin@123
3. **Check:**
   - ✅ Login works
   - ✅ Dashboard loads
   - ✅ Navigation works
   - ✅ No console errors
   - ✅ Logout works

---

## 🎉 Done!

Your app is now live:

```
🌐 Frontend: https://your-site.netlify.app
🔧 Backend:  https://your-backend.onrender.com
📚 API Docs: https://your-backend.onrender.com/api-docs

👤 Test Login:
   Email: admin@zschool.com
   Password: Admin@123
```

---

## 🔄 Future Updates

Every time you push to GitHub:
- Render auto-deploys backend
- Netlify auto-deploys frontend

No manual deployment needed!

---

## 📚 Detailed Guides

- **Full Guide:** [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **Checklist:** [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
- **Troubleshooting:** See DEPLOYMENT_GUIDE.md

---

## ⚠️ Important Notes

**Free Tier Limitations:**
- Backend sleeps after 15 min inactivity (30-60 sec wake time)
- Database expires after 90 days
- Good for testing, upgrade for production

**Security:**
- Never commit `.deployment-secrets.txt` to git
- Use strong secrets in production
- Enable 2FA on all accounts

**Next Steps:**
- Share URLs with team
- Set up monitoring
- Consider custom domain
- Plan for production upgrade
