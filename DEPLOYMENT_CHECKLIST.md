# 🚀 Quick Deployment Checklist

Use this checklist to deploy ZSchool Management System to test environments.

---

## 📝 Pre-Deployment

- [ ] Code is committed to GitHub
- [ ] All tests pass locally
- [ ] Frontend builds successfully (`npm run build` in frontend/)
- [ ] Backend starts without errors (`npm start` in backend/)
- [ ] Environment variables documented

---

## 🗄️ Database Setup

### Render PostgreSQL
- [ ] Created PostgreSQL database on Render
- [ ] Copied connection details (host, port, user, password, database name)
- [ ] Saved DATABASE_URL
- [ ] Connected via psql locally
- [ ] Ran all migration files (001 through 007)
- [ ] Verified tables created: `\dt` in psql
- [ ] Created test users using `backend/create-all-users.cjs`

---

## 🔧 Backend Deployment

### Render
- [ ] Created new Web Service
- [ ] Connected GitHub repository
- [ ] Set root directory to `backend`
- [ ] Set build command: `npm install`
- [ ] Set start command: `npm start`
- [ ] Added all environment variables (see `.env.production`)
- [ ] Generated JWT secrets using crypto
- [ ] Set DATABASE_URL from database
- [ ] Deployed successfully
- [ ] Copied backend URL: `https://_____.onrender.com`
- [ ] Tested health endpoint: `/api/health`
- [ ] Tested login endpoint with curl

### Railway (Alternative)
- [ ] Created new project
- [ ] Connected GitHub repository
- [ ] Added PostgreSQL database
- [ ] Configured backend service
- [ ] Set root directory to `backend`
- [ ] Added environment variables
- [ ] Deployed successfully
- [ ] Copied backend URL
- [ ] Tested endpoints

---

## 🎨 Frontend Deployment

### Netlify
- [ ] Updated `.env.production` with backend URL
- [ ] Created `netlify.toml` configuration
- [ ] Tested production build locally: `npm run build`
- [ ] Created Netlify account
- [ ] Created new site from GitHub
- [ ] Set base directory: `frontend`
- [ ] Set build command: `npm run build`
- [ ] Set publish directory: `dist`
- [ ] Added environment variable: `VITE_API_BASE_URL`
- [ ] Deployed successfully
- [ ] Copied frontend URL: `https://_____.netlify.app`
- [ ] Tested site loads
- [ ] Verified no console errors

---

## 🔐 Security Configuration

- [ ] Generated secure JWT_SECRET (32+ chars random)
- [ ] Generated secure JWT_REFRESH_SECRET (different from above)
- [ ] Generated secure MFA_SECRET
- [ ] Updated CORS in backend to include Netlify URL
- [ ] Verified HTTPS is working on both frontend and backend
- [ ] Removed any hardcoded secrets from code
- [ ] Updated `.gitignore` to exclude `.env` files

---

## ✅ Post-Deployment Testing

### Backend Tests
- [ ] Health endpoint responds: `curl https://backend-url/api/health`
- [ ] API docs accessible: `https://backend-url/api-docs`
- [ ] Database connection working (check logs)
- [ ] Login endpoint works with test credentials
- [ ] CORS allows Netlify domain

### Frontend Tests
- [ ] Site loads at Netlify URL
- [ ] Login page renders
- [ ] Can login with admin credentials
- [ ] Dashboard loads after login
- [ ] Navigation works
- [ ] API calls succeed (check Network tab)
- [ ] No CORS errors in console
- [ ] Logout works

### Integration Tests
- [ ] Login flow: login → dashboard → logout
- [ ] Protected routes require authentication
- [ ] Token storage works (localStorage)
- [ ] Page refresh maintains authentication
- [ ] Error handling works (try wrong credentials)

---

## 📝 Documentation

- [ ] Saved backend URL in project docs
- [ ] Saved frontend URL in project docs
- [ ] Saved database credentials securely
- [ ] Documented test user credentials
- [ ] Updated README with deployment URLs
- [ ] Shared URLs with team/stakeholders

---

## 🔄 Continuous Deployment Setup

- [ ] Enabled automatic deploys on git push (Render)
- [ ] Enabled automatic deploys on git push (Railway)
- [ ] Enabled automatic deploys on git push (Netlify)
- [ ] Tested by pushing a small change
- [ ] Verified auto-deploy triggered
- [ ] Checked deployment logs

---

## 📊 Monitoring Setup

- [ ] Checked Render logs for errors
- [ ] Checked Netlify deploy logs
- [ ] Set up error notifications (optional)
- [ ] Bookmarked dashboard URLs
- [ ] Tested log viewing

---

## 🎯 Final Verification

### URLs Working
```
✅ Frontend: https://_____.netlify.app
✅ Backend:  https://_____.onrender.com
✅ API Docs: https://_____.onrender.com/api-docs
```

### Test Credentials Working
```
✅ Admin:   admin@zschool.com / Admin@123
✅ Teacher: teacher@zschool.com / Teacher@123  
✅ Student: student@zschool.com / Student@123
```

### Core Features
- [ ] User can login
- [ ] User can navigate between pages
- [ ] User can logout
- [ ] API calls work
- [ ] Error handling works

---

## 🚨 Rollback Plan

If something goes wrong:

1. **Backend Issues:**
   - Check Render/Railway logs
   - Verify environment variables
   - Test database connection
   - Rollback to previous deployment in dashboard

2. **Frontend Issues:**
   - Check Netlify deploy logs
   - Verify environment variables
   - Test API URL is correct
   - Rollback to previous deploy in Netlify

3. **Database Issues:**
   - Verify migrations ran successfully
   - Check connection string
   - Restore from backup if needed

---

## 📞 Support Resources

- **Render Docs:** https://render.com/docs
- **Railway Docs:** https://docs.railway.app
- **Netlify Docs:** https://docs.netlify.com
- **Project Guide:** `DEPLOYMENT_GUIDE.md`

---

## ✨ Success!

Once all checkboxes are complete:

1. **Share the URLs:**
   ```
   Frontend: https://your-site.netlify.app
   Backend:  https://your-backend.onrender.com
   API Docs: https://your-backend.onrender.com/api-docs
   ```

2. **Test with stakeholders:**
   - Share test credentials
   - Gather feedback
   - Monitor for issues

3. **Continue development:**
   - Push changes to GitHub
   - Automatic deployments will update both sites
   - Monitor logs for any issues

---

**Date Deployed:** _____________  
**Deployed By:** _____________  
**Deployment Duration:** _____________  
**Issues Encountered:** _____________

---

**Status:** 
- [ ] Ready for testing
- [ ] Ready for stakeholder review
- [ ] Ready for development team
- [ ] Production-ready (requires paid tiers + monitoring)
