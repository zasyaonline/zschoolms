# Deployment Guide - ZSchool Management System

Deploy your application to publicly accessible test environments while in development.

**Frontend:** Netlify  
**Backend:** Render or Railway

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Backend Deployment (Render - Recommended)](#backend-deployment-render)
3. [Backend Deployment (Railway - Alternative)](#backend-deployment-railway)
4. [Frontend Deployment (Netlify)](#frontend-deployment-netlify)
5. [Environment Variables](#environment-variables)
6. [Post-Deployment Configuration](#post-deployment-configuration)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts
- [ ] GitHub account (to connect repositories)
- [ ] Netlify account (free tier available)
- [ ] Render account OR Railway account (both have free tiers)
- [ ] PostgreSQL database (Render provides free PostgreSQL, or use your existing one)

### Prepare Your Repository
```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit changes
git commit -m "Prepare for deployment"

# Create GitHub repository and push
git remote add origin <your-github-repo-url>
git push -u origin main
```

---

## Backend Deployment (Render)

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Grant Render access to your repository

### Step 2: Create PostgreSQL Database
1. Click **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name:** `zschool-db`
   - **Database:** `zschool_db`
   - **User:** `zschool_admin`
   - **Region:** Choose closest to you
   - **Plan:** Free
3. Click **"Create Database"**
4. Wait for provisioning (2-3 minutes)
5. **Save these connection details:**
   - Internal Database URL
   - External Database URL
   - Host, Port, Database name, Username, Password

### Step 3: Run Database Migrations
```bash
# Install PostgreSQL client (if not already installed)
# Mac:
brew install postgresql

# Connect to Render database
psql <EXTERNAL_DATABASE_URL>

# Run migrations
\i backend/migrations/001-add-auth-tables.sql
\i backend/migrations/002-fix-audit-logs.sql
\i backend/migrations/003_create_students_table.sql
\i backend/migrations/004_create_sponsors_tables.sql
\i backend/migrations/005_create_attendance_table.sql
\i backend/migrations/006_create_marks_system.sql
\i backend/migrations/007_create_report_cards.sql

# Exit
\q
```

### Step 4: Deploy Backend to Render
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name:** `zschool-backend`
   - **Region:** Same as database
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free

4. **Add Environment Variables** (see [Environment Variables](#environment-variables) section)

5. Click **"Create Web Service"**

6. Wait for deployment (5-10 minutes)

7. **Copy your backend URL:** `https://zschool-backend-xxxx.onrender.com`

### Step 5: Test Backend
```bash
# Test health endpoint
curl https://zschool-backend-xxxx.onrender.com/api/health

# Should return: {"status":"ok",...}
```

---

## Backend Deployment (Railway)

### Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Grant Railway access to your repository

### Step 2: Create New Project
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your `zschoolms` repository
4. Click **"Deploy Now"**

### Step 3: Add PostgreSQL Database
1. In your project, click **"New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway will automatically create and link the database
3. Click on the database → **"Connect"** → Copy connection details

### Step 4: Configure Backend Service
1. Click on your backend service
2. Go to **"Settings"**
3. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Go to **"Variables"** tab
5. Add environment variables (see [Environment Variables](#environment-variables))

### Step 5: Run Migrations
```bash
# Railway CLI installation
npm i -g @railway/cli

# Login
railway login

# Link to project
railway link

# Connect to database
railway connect postgres

# Run migrations (same as Render)
\i backend/migrations/001-add-auth-tables.sql
# ... (all migration files)
```

### Step 6: Deploy
1. Railway auto-deploys on git push
2. Or click **"Deploy"** in the dashboard
3. Copy your backend URL from **"Settings"** → **"Domains"**

---

## Frontend Deployment (Netlify)

### Step 1: Prepare Frontend for Production

1. **Update API URL for production:**
   Create `frontend/.env.production`:
   ```env
   VITE_API_BASE_URL=https://your-backend-url.onrender.com/api
   VITE_APP_NAME=ZSchool Management System
   VITE_NODE_ENV=production
   ```

2. **Create Netlify configuration:**
   Already created: `frontend/netlify.toml`

3. **Test production build locally:**
   ```bash
   cd frontend
   npm run build
   npm run preview
   ```

### Step 2: Deploy to Netlify

#### Option A: Netlify Dashboard (Recommended)

1. Go to [netlify.com](https://netlify.com)
2. Sign up with GitHub
3. Click **"Add new site"** → **"Import an existing project"**
4. Connect to GitHub → Select your repository
5. Configure build settings:
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `frontend/dist`
6. Click **"Show advanced"** → **"New variable"**
7. Add environment variable:
   - Key: `VITE_API_BASE_URL`
   - Value: `https://your-backend-url.onrender.com/api`
8. Click **"Deploy site"**

#### Option B: Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Initialize and deploy
cd frontend
netlify init

# Follow prompts:
# - Create & configure a new site
# - Build command: npm run build
# - Publish directory: dist

# Deploy
netlify deploy --prod
```

### Step 3: Configure Custom Domain (Optional)
1. Go to **"Site settings"** → **"Domain management"**
2. Click **"Add custom domain"**
3. Follow instructions to configure DNS

### Step 4: Enable HTTPS
- Netlify automatically provisions SSL certificates
- Your site will be available at `https://your-site-name.netlify.app`

---

## Environment Variables

### Backend Environment Variables (Render/Railway)

```env
# Database (Use Render/Railway provided DATABASE_URL)
DATABASE_URL=postgresql://user:password@host:5432/dbname
DB_HOST=<from-render-or-railway>
DB_PORT=5432
DB_NAME=zschool_db
DB_USER=<from-render-or-railway>
DB_PASSWORD=<from-render-or-railway>

# Server
NODE_ENV=production
PORT=5001
FRONTEND_URL=https://your-site.netlify.app

# JWT Secrets (IMPORTANT: Generate secure secrets!)
JWT_SECRET=<generate-secure-random-string-min-32-chars>
JWT_REFRESH_SECRET=<generate-different-secure-random-string>
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Email Configuration (use real SMTP for production)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@zschool.com

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads

# Security
BCRYPT_ROUNDS=10
MFA_SECRET=<generate-secure-random-string>
```

**Generate secure secrets:**
```bash
# Generate JWT secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Run this twice for JWT_SECRET and JWT_REFRESH_SECRET
```

### Frontend Environment Variables (Netlify)

In Netlify Dashboard → Site settings → Environment variables:

```env
VITE_API_BASE_URL=https://your-backend.onrender.com/api
VITE_APP_NAME=ZSchool Management System
VITE_NODE_ENV=production
```

---

## Post-Deployment Configuration

### 1. Update Backend CORS

Make sure backend allows your Netlify domain:

In `backend/src/index.js`:
```javascript
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    'http://localhost:5173',  // Keep for local dev
    'https://your-site.netlify.app'  // Add your Netlify URL
  ],
  credentials: true,
}));
```

Push changes:
```bash
git add backend/src/index.js
git commit -m "Update CORS for production"
git push
```

### 2. Create Test Users in Production Database

```bash
# Connect to production database
psql <PRODUCTION_DATABASE_URL>

# Create test users (use the setup-users.js script)
# Or insert manually:

INSERT INTO users (username, email, password_hash, role, is_active) VALUES
('admin', 'admin@zschool.com', '<bcrypt-hash>', 'admin', true),
('teacher', 'teacher@zschool.com', '<bcrypt-hash>', 'teacher', true),
('student', 'student@zschool.com', '<bcrypt-hash>', 'student', true);
```

Or use the setup script:
```bash
# In backend directory
node create-all-users.cjs
```

### 3. Test Production Deployment

1. **Test Backend:**
   ```bash
   curl https://your-backend.onrender.com/api/health
   ```

2. **Test Frontend:**
   - Open `https://your-site.netlify.app`
   - Try logging in
   - Check browser console for errors
   - Test navigation between pages

3. **Test API Integration:**
   - Login with test credentials
   - Navigate to different pages
   - Check if data loads (currently mock data)

---

## Continuous Deployment

### Automatic Deployments

Both Render, Railway, and Netlify support automatic deployments:

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```

2. **Automatic builds trigger:**
   - Render: Monitors main branch, auto-deploys
   - Railway: Monitors main branch, auto-deploys
   - Netlify: Monitors main branch, auto-deploys

### Branch Deployments

**Netlify:** Create deploy previews for pull requests
- Enable in Site settings → Build & deploy → Deploy contexts
- Every PR gets a preview URL

---

## Monitoring & Logs

### Render
- Dashboard → Your service → **"Logs"** tab
- Real-time logs
- Historical logs available

### Railway
- Dashboard → Your service → **"Deployments"** tab → Click deployment → **"View Logs"**

### Netlify
- Dashboard → Your site → **"Deploys"** tab
- Click deployment → **"Deploy log"**
- Function logs available in **"Functions"** tab

---

## Troubleshooting

### Backend Issues

**❌ Database connection failed**
```bash
# Check DATABASE_URL is set correctly
# Verify database is running
# Check IP whitelist (Render doesn't require this)
# Test connection: psql <DATABASE_URL>
```

**❌ Port already in use**
```javascript
// Render sets PORT automatically
const PORT = process.env.PORT || 5001;
```

**❌ CORS errors**
```javascript
// Add Netlify URL to CORS origins
origin: [process.env.FRONTEND_URL, 'https://your-site.netlify.app']
```

### Frontend Issues

**❌ API calls failing**
- Check `VITE_API_BASE_URL` in Netlify environment variables
- Verify backend URL is correct
- Check browser console for CORS errors

**❌ Build failing**
```bash
# Test build locally first
cd frontend
npm run build

# Check for build errors
# Fix issues and push
```

**❌ Environment variables not working**
- Netlify variables must start with `VITE_`
- Redeploy after adding variables
- Clear cache and redeploy if needed

### Common Issues

**❌ 404 on page refresh**
- Already handled in `netlify.toml` redirect rules
- Verify `_redirects` file is in dist folder after build

**❌ Slow initial load (Cold start)**
- Render free tier sleeps after 15 min inactivity
- First request wakes it up (30-60 seconds)
- Consider paid tier for always-on service

**❌ Database migrations not applied**
- Run migrations manually using psql
- Or use migration script in backend
- Verify tables exist: `\dt` in psql

---

## Cost Estimate

### Free Tier Limits

| Service | Free Tier | Limits |
|---------|-----------|--------|
| **Render** | ✅ Yes | 750 hrs/month, sleeps after 15 min |
| **Railway** | ✅ Yes | $5 credit/month, ~500hrs |
| **Netlify** | ✅ Yes | 100GB bandwidth, 300 build minutes |
| **Render PostgreSQL** | ✅ Yes | Expires after 90 days, 1GB storage |

### Recommended for Production
- **Backend:** Render Starter ($7/mo) or Railway Hobby ($5/mo)
- **Frontend:** Netlify Pro ($19/mo) - only if you need advanced features
- **Database:** Render Standard ($7/mo) or external provider

---

## Quick Deployment Checklist

### Backend (Render/Railway)
- [ ] Create account
- [ ] Create PostgreSQL database
- [ ] Run migrations
- [ ] Create web service
- [ ] Set environment variables
- [ ] Deploy
- [ ] Test health endpoint
- [ ] Create test users

### Frontend (Netlify)
- [ ] Create `.env.production` with backend URL
- [ ] Test production build locally
- [ ] Create Netlify account
- [ ] Import repository
- [ ] Configure build settings
- [ ] Set environment variables
- [ ] Deploy
- [ ] Test login and navigation

### Post-Deployment
- [ ] Update backend CORS
- [ ] Test API integration
- [ ] Share URLs with team
- [ ] Monitor logs for errors
- [ ] Set up custom domain (optional)

---

## Deployment URLs

After deployment, save your URLs here:

```
Frontend (Netlify): https://_______________.netlify.app
Backend (Render):   https://_______________.onrender.com
API Docs:           https://_______________.onrender.com/api-docs
Database:           [Internal - not public]

Test Credentials:
- Admin: admin@zschool.com / Admin@123
- Teacher: teacher@zschool.com / Teacher@123
- Student: student@zschool.com / Student@123
```

---

## Next Steps After Deployment

1. **Share URLs with team/stakeholders**
2. **Set up monitoring** (consider services like Sentry, LogRocket)
3. **Configure custom domain** (if needed)
4. **Set up automated backups** for database
5. **Create production data seed script**
6. **Document API endpoints** in Swagger
7. **Set up error tracking**
8. **Configure email service** with real SMTP

---

**Questions or Issues?**

- Check logs in respective dashboards
- Review this guide's troubleshooting section
- Test locally first before debugging production
- Use browser DevTools Network tab to inspect API calls

---

**Last Updated:** December 25, 2025  
**Author:** ZSchool Development Team
