# API Connection Fix - December 25, 2025

## ✅ Issues Resolved

1. **Created centralized API service** (`frontend/src/services/api.js`)
   - Handles all HTTP requests
   - Manages authentication headers
   - Provides better error handling
   - Uses environment variables for API URL

2. **Created authentication service** (`frontend/src/services/auth.service.js`)
   - Centralized auth methods (login, logout, forgot password, etc.)
   - Token management
   - MFA support

3. **Updated Login and ForgotPassword components**
   - Now use the new service layer instead of raw fetch
   - Better error handling
   - Consistent API calls

4. **Added environment configuration** (`frontend/.env`)
   - `VITE_API_BASE_URL=http://localhost:5001/api`
   - Centralized API URL configuration

## 🔧 Files Created/Modified

### Created:
- `/frontend/src/services/api.js` - API service layer
- `/frontend/src/services/auth.service.js` - Authentication service
- `/frontend/.env` - Environment configuration

### Modified:
- `/frontend/src/pages/Auth/Login.jsx` - Uses auth service
- `/frontend/src/pages/Auth/ForgotPassword.jsx` - Uses auth service

## 🚀 Testing the Fix

### 1. Test with Default Credentials

The backend should have these test users:

```
Email: admin@zschool.com
Password: Admin@123
Role: Admin

Email: teacher@zschool.com  
Password: Teacher@123
Role: Teacher

Email: student@zschool.com
Password: Student@123
Role: Student
```

### 2. Check Browser Console

Open the browser console (F12) and you should see:
- `[API] POST http://localhost:5001/api/auth/login` when you click login
- The actual response from the server
- No CORS errors

### 3. Expected Behaviors

**Successful Login:**
- Redirects to `/users` page
- Stores `accessToken`, `refreshToken`, and `user` in localStorage
- No error messages

**Failed Login:**
- Shows "Invalid credentials" or specific error message
- Does NOT show "Unable to connect to server"

**Connection Error:**
- Only shows "Unable to connect to server" if backend is actually down
- Check if backend is running on http://localhost:5001

## 🐛 Troubleshooting

### Still seeing "Unable to connect to server"?

1. **Check if backend is running:**
   ```bash
   curl http://localhost:5001/api/health
   ```
   Should return: `{"status":"ok",...}`

2. **Check if frontend can reach backend:**
   Open browser console and run:
   ```javascript
   fetch('http://localhost:5001/api/health')
     .then(r => r.json())
     .then(console.log)
   ```

3. **Check CORS settings:**
   The backend should allow `http://localhost:5173`
   Look for this in backend logs when you try to login

4. **Clear browser cache:**
   - Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
   - Or clear site data in DevTools

5. **Restart both servers:**
   ```bash
   # Stop all
   pkill -9 node
   
   # Start backend
   cd backend && npm start
   
   # Start frontend (new terminal)
   cd frontend && npm run dev
   ```

### CORS Errors?

Check backend `src/index.js` has:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
```

### Port Conflicts?

If port 5001 or 5173 is in use:
```bash
# Check what's using the port
lsof -ti:5001
lsof -ti:5173

# Kill the process
kill -9 <PID>
```

## 📝 Next Steps

To complete the API integration for other pages:

1. **Create service files for each module:**
   - `user.service.js` - User management APIs
   - `student.service.js` - Student management APIs
   - `teacher.service.js` - Teacher APIs
   - `attendance.service.js` - Attendance APIs
   - `marks.service.js` - Marks management APIs
   - etc.

2. **Update components to use services:**
   - Replace mock data with API calls
   - Use the centralized API service
   - Handle loading and error states

3. **Add ProtectedRoute component:**
   - Check authentication before rendering
   - Redirect to login if not authenticated
   - Handle token expiration

## 🎯 Service Layer Benefits

1. **Consistency:** All API calls use the same pattern
2. **Maintainability:** Easy to update API URL or add interceptors
3. **Error Handling:** Centralized error management
4. **Type Safety:** Can add TypeScript later
5. **Testing:** Easy to mock services for testing
6. **Token Management:** Automatic token refresh and auth headers

## 📚 Usage Example

```javascript
// Old way (direct fetch)
const response = await fetch('http://localhost:5001/api/users', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();

// New way (using service)
import { get } from './services/api';
const data = await get('/users');
```

Much cleaner and easier to maintain!
