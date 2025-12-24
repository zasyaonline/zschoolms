# Developer Quick Start Guide - ZSchool Frontend

## 👋 Welcome Developer!

You've received the frontend package for the ZSchool Management System. This document will help you get started quickly.

---

## 📦 What You Received

- **zschoolms-frontend.zip** (151 KB)
- Contains: All UI screens, components, styles, and configuration
- **29 pages** across 7 modules (Auth, Dashboard, Users, Students, Teachers, etc.)

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Extract Package
```bash
unzip zschoolms-frontend.zip -d zschoolms-frontend
cd zschoolms-frontend
```

### Step 2: Install Dependencies
```bash
npm install
```

This installs:
- React 19
- React Router 7.11
- Axios (HTTP client)
- Yup (validation)
- DOMPurify (security)

### Step 3: Start Development Server
```bash
npm run dev
```

Open browser: `http://localhost:5173`

---

## ⚠️ IMPORTANT: Current Status

### ✅ What's Working:
- All UI pages are built and styled
- Routing is configured
- Form validation is ready
- Design system is complete

### ❌ What Needs Your Work:
- **API Integration** - All pages currently use MOCK data
- **Service Layer** - The `src/services/` folder is EMPTY
- **Token Management** - JWT storage and refresh needs implementation

---

## 🎯 YOUR MAIN TASK: API Integration

### Backend Information:
- **Base URL:** `http://localhost:5001/api`
- **Auth Endpoint:** `POST /api/auth/login`
- **Swagger Docs:** `http://localhost:5001/api-docs`

### Test User Credentials:
```
Email: varaprasad@zasyaonline.com
Password: P@ssw0rd
```

---

## 📝 Step-by-Step API Integration

### Step 1: Create API Service Layer

Create these files in `src/services/`:

**1. `src/services/api.js`** - Axios instance with JWT interceptor
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

**2. `src/services/auth.service.js`** - Authentication
```javascript
import api from './api';

export const authService = {
  async login(emailOrUsername, password) {
    const response = await api.post('/auth/login', {
      emailOrUsername,
      password
    });
    
    if (response.data.success) {
      const { token, user } = response.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      return response.data;
    }
    throw new Error(response.data.error || 'Login failed');
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  }
};
```

**3. `src/services/user.service.js`** - User CRUD
```javascript
import api from './api';

export const userService = {
  async getAll(params = {}) {
    const response = await api.get('/users', { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  async create(userData) {
    const response = await api.post('/users', userData);
    return response.data;
  },

  async update(id, userData) {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  }
};
```

**Create similar files for:**
- `student.service.js`
- `sponsor.service.js`
- `attendance.service.js`
- `marks.service.js`
- `reportcard.service.js`

### Step 2: Update Login Page

**File:** `src/pages/Auth/Login.jsx`

Find this section:
```javascript
// TODO: Replace with actual API call
// const response = await axios.post('/api/auth/login', { email, password });
```

Replace with:
```javascript
import { authService } from '../../services/auth.service';

// In handleSubmit function:
try {
  setLoading(true);
  setError('');
  
  const response = await authService.login(formData.email, formData.password);
  
  if (response.success) {
    navigate('/dashboard');
  }
} catch (err) {
  setError(err.message || 'Login failed');
} finally {
  setLoading(false);
}
```

### Step 3: Update UserList Page

**File:** `src/pages/UserManagement/UserList.jsx`

Replace mock data:
```javascript
// OLD: Mock data
const [users, setUsers] = useState([
  { id: 1, name: 'John Doe', ... }
]);
```

With API call:
```javascript
import { userService } from '../../services/user.service';

const [users, setUsers] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  loadUsers();
}, []);

const loadUsers = async () => {
  try {
    setLoading(true);
    const response = await userService.getAll();
    if (response.success) {
      setUsers(response.data);
    }
  } catch (error) {
    console.error('Failed to load users:', error);
  } finally {
    setLoading(false);
  }
};
```

### Step 4: Repeat for All Pages

Apply similar changes to:
- StudentList
- SponsorStudentMapping
- AttendanceEntry
- MarksEntry
- MarksApprovalList
- ReportCardList
- Dashboard (for metrics)

---

## 🧪 Testing Your Integration

### 1. Start Backend Server
```bash
# In separate terminal
cd /path/to/backend
npm run dev
# Backend starts on http://localhost:5001
```

### 2. Verify Backend is Running
```bash
curl http://localhost:5001/api/health
```

### 3. Test Login
1. Open `http://localhost:5173/login`
2. Enter: `varaprasad@zasyaonline.com` / `P@ssw0rd`
3. Should redirect to dashboard

### 4. Test CRUD Operations
- Create a new user
- Edit user details
- Delete user
- Verify changes persist (check database)

---

## 📚 Available Backend APIs

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/forgot-password` - Request password reset

### Users (10 endpoints)
- `GET /api/users` - List users
- `GET /api/users/:id` - Get user
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `POST /api/users/bulk-import` - CSV import

### Students (9 endpoints)
- `GET /api/students` - List students
- `GET /api/students/:id` - Get student
- `POST /api/students` - Create student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Sponsors (9 endpoints)
- `GET /api/sponsors` - List sponsors
- `POST /api/sponsors` - Create sponsor
- `POST /api/sponsors/mappings` - Create mapping

### Attendance (6 endpoints)
- `POST /api/attendance` - Mark attendance
- `GET /api/attendance` - Get attendance records

### Marks (8 endpoints)
- `POST /api/marks/entry` - Enter marks
- `GET /api/marks/pending` - Pending marksheets
- `PUT /api/marks/:id/approve` - Approve marks
- `PUT /api/marks/:id/reject` - Reject marks

### Report Cards (8 endpoints)
- `POST /api/report-cards/generate` - Generate report
- `POST /api/report-cards/:id/sign` - Sign report
- `POST /api/report-cards/:id/distribute` - Distribute via email
- `GET /api/report-cards/student/:studentId` - Get student reports

**Full API Documentation:** http://localhost:5001/api-docs

---

## 🎨 Design System Reference

All design tokens are in `src/styles/variables.css`:

### Colors
```css
--primary-color: #1F55A6    /* Blue */
--success-color: #28A745    /* Green */
--warning-color: #FFC107    /* Yellow */
--danger-color: #DC3545     /* Red */
```

### Spacing
```css
--spacing-xs: 4px
--spacing-sm: 8px
--spacing-md: 16px
--spacing-lg: 24px
--spacing-xl: 32px
```

### Typography
```css
Font: 'Inter', sans-serif
Sizes: 12px, 14px, 16px, 18px, 20px, 24px
```

---

## 🐛 Common Issues & Solutions

### Issue 1: CORS Error
**Error:** "Access to XMLHttpRequest has been blocked by CORS"

**Solution:** Backend already has CORS configured. Make sure backend is running.

### Issue 2: 401 Unauthorized
**Error:** API returns 401 status

**Solution:** 
- Check if token is saved in localStorage
- Verify token in request headers
- Try logging in again

### Issue 3: Module Not Found
**Error:** "Cannot find module './services/api'"

**Solution:** Create the services files first (Step 1 above)

### Issue 4: Vite Dev Server Not Starting
**Solution:** Try production build instead:
```bash
npm run build
cd dist
python3 -m http.server 5173
```

---

## ✅ Checklist Before Completion

- [ ] All service files created in `src/services/`
- [ ] Login page connects to API
- [ ] Token stored in localStorage
- [ ] Protected routes work (redirect to login)
- [ ] UserList loads real data from API
- [ ] Can create/edit/delete users
- [ ] StudentList loads real data
- [ ] Can create/edit/delete students
- [ ] AttendanceEntry saves to backend
- [ ] MarksEntry saves to backend
- [ ] Dashboard shows real metrics
- [ ] Loading states implemented
- [ ] Error messages displayed
- [ ] Logout works correctly

---

## 📞 Need Help?

### Documentation Files:
- `FRONTEND_SHARING_GUIDE.md` - Complete frontend guide
- `BUSINESS_LOGIC_IMPLEMENTATION_PLAN.md` - Requirements & architecture
- Backend Swagger: `http://localhost:5001/api-docs`

### Debugging:
```bash
# Check backend logs
cd backend
npm run dev
# Watch console output

# Check frontend errors
# Open browser DevTools > Console tab
```

---

## 🎯 Expected Timeline

- **Day 1:** Setup + Create service files (3-4 hours)
- **Day 2-3:** Integrate Login + Protected routes (6-8 hours)
- **Day 4-5:** Integrate User & Student pages (8-10 hours)
- **Day 6-7:** Integrate remaining pages (8-10 hours)
- **Day 8:** Testing + Bug fixes (4-6 hours)

**Total: ~1-2 weeks** depending on your pace

---

## 🎓 Learning Resources

### React + Axios
- [Axios Docs](https://axios-http.com/docs/intro)
- [React Router Docs](https://reactrouter.com/en/main)

### JWT Authentication
- [JWT.io](https://jwt.io/) - Understand JWT tokens
- [localStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

### API Testing
- Use Postman or Swagger UI to test endpoints first
- Then integrate into React components

---

## 💡 Pro Tips

1. **Test endpoints in Swagger first** before integrating
2. **Use browser DevTools** to inspect API requests/responses
3. **Add loading states** for better UX
4. **Handle errors gracefully** with try-catch
5. **Use async/await** for cleaner code
6. **Add console.logs** while developing, remove before commit
7. **Test logout flow** - ensure token is cleared
8. **Commit frequently** - after each working feature

---

**Good luck! 🚀**

You've got all the UI ready - now just connect it to the backend!

---

**Version:** 1.0  
**Last Updated:** December 24, 2024  
**Contact:** Refer to main project documentation
