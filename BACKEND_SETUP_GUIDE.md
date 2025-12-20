# Backend Setup Guide - Node.js + Express

This guide covers setting up a Node.js backend in the same workspace as your React frontend.

## 📋 Table of Contents

1. [Monorepo vs Separate Repos](#monorepo-vs-separate-repos)
2. [Recommended Approach](#recommended-approach)
3. [Project Structure](#project-structure)
4. [Step-by-Step Setup](#step-by-step-setup)
5. [Development Workflow](#development-workflow)
6. [Deployment Considerations](#deployment-considerations)

---

## Monorepo vs Separate Repos

### Option 1: Monorepo (Same Workspace) ✅ RECOMMENDED

**Advantages:**
- ✅ Single repository for version control
- ✅ Shared dependencies and configurations
- ✅ Easy local development (single clone)
- ✅ Unified CI/CD pipeline
- ✅ Easier code sharing between frontend and backend
- ✅ Single package.json for root-level tools
- ✅ Simplified developer onboarding

**Disadvantages:**
- ⚠️ Larger repository size
- ⚠️ Need clear separation between frontend/backend
- ⚠️ Requires proper tooling (npm workspaces or similar)

**Best For:**
- Small to medium teams
- Tightly coupled frontend/backend
- Rapid iteration and development
- Single deployment pipeline

### Option 2: Separate Repositories

**Advantages:**
- ✅ Complete isolation
- ✅ Independent versioning
- ✅ Different deployment cycles
- ✅ Clearer ownership boundaries

**Disadvantages:**
- ⚠️ Multiple repositories to manage
- ⚠️ Complex local setup (clone 2 repos)
- ⚠️ Harder to share code
- ⚠️ Duplicate configurations
- ⚠️ Multiple CI/CD pipelines

**Best For:**
- Large teams with separate frontend/backend teams
- Microservices architecture
- Different release schedules
- API-first development

---

## Recommended Approach

**For ZSchool MS: Use Monorepo with npm Workspaces**

This approach provides:
- Single repository for all code
- Separate `package.json` for frontend and backend
- Shared root-level configurations
- Independent dependency management
- Easy local development

---

## Project Structure

### Current Structure
```
zschoolms/
├── src/                    # Frontend code
├── public/
├── package.json            # Frontend dependencies
├── vite.config.js
└── ...other frontend files
```

### Proposed Monorepo Structure
```
zschoolms/
├── frontend/               # React + Vite application
│   ├── src/
│   ├── public/
│   ├── package.json       # Frontend dependencies
│   ├── vite.config.js
│   └── ...
│
├── backend/               # Node.js + Express API
│   ├── src/
│   │   ├── config/       # Database, env configs
│   │   ├── controllers/  # Route handlers
│   │   ├── models/       # Database models
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Auth, validation, error handling
│   │   ├── utils/        # Helpers, validation schemas
│   │   ├── services/     # Business logic
│   │   └── index.js      # Entry point
│   ├── tests/            # Backend tests
│   ├── package.json      # Backend dependencies
│   └── .env.example
│
├── shared/               # Shared code (optional)
│   ├── types/           # TypeScript types
│   ├── constants/       # Shared constants
│   └── utils/           # Shared utilities
│
├── package.json          # Root workspace config
├── .gitignore           # Updated for backend
├── README.md            # Updated project readme
└── docs/                # All documentation
    ├── BACKEND_SETUP_GUIDE.md
    ├── TESTING_EXECUTION_REPORT.md
    └── ...
```

---

## Step-by-Step Setup

### Step 1: Restructure Current Project

```bash
# From project root
mkdir frontend backend shared

# Move frontend files
mv src public index.html vite.config.js eslint.config.js frontend/
mv package.json package-lock.json frontend/

# Keep documentation at root
# Keep .git, .gitignore at root
```

### Step 2: Create Root Package.json (Workspace Manager)

Create `package.json` at root:

```json
{
  "name": "zschoolms",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "frontend",
    "backend"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\"",
    "dev:frontend": "npm run dev --workspace=frontend",
    "dev:backend": "npm run dev --workspace=backend",
    "build": "npm run build --workspace=frontend && npm run build --workspace=backend",
    "build:frontend": "npm run build --workspace=frontend",
    "build:backend": "npm run build --workspace=backend",
    "test": "npm run test --workspace=frontend && npm run test --workspace=backend",
    "lint": "npm run lint --workspace=frontend && npm run lint --workspace=backend"
  },
  "devDependencies": {
    "concurrently": "^9.1.0"
  }
}
```

### Step 3: Initialize Backend

```bash
cd backend

# Create package.json
npm init -y

# Install core dependencies
npm install express cors dotenv helmet morgan mongoose

# Install dev dependencies
npm install -D nodemon @eslint/js eslint

# Create directory structure
mkdir -p src/{config,controllers,models,routes,middleware,utils,services}
mkdir tests
```

### Step 4: Create Backend Package.json

Edit `backend/package.json`:

```json
{
  "name": "zschoolms-backend",
  "version": "1.0.0",
  "description": "ZSchool Management System Backend API",
  "main": "src/index.js",
  "type": "module",
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js",
    "test": "echo \"Tests not yet implemented\"",
    "lint": "eslint src/**/*.js"
  },
  "dependencies": {
    "express": "^4.21.2",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "helmet": "^8.0.0",
    "morgan": "^1.10.0",
    "mongoose": "^8.9.3",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "express-validator": "^7.2.1",
    "express-rate-limit": "^7.5.0"
  },
  "devDependencies": {
    "nodemon": "^3.1.9",
    "@eslint/js": "^9.18.0",
    "eslint": "^9.18.0"
  }
}
```

### Step 5: Create Backend Entry Point

Create `backend/src/index.js`:

```javascript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan('dev')); // Request logging

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes (to be added)
// app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/students', studentRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});

export default app;
```

### Step 6: Create Environment File

Create `backend/.env.example`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/zschoolms
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/zschoolms

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# Security
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads
```

Copy to `.env`:
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your actual values
```

### Step 7: Update .gitignore

Add to root `.gitignore`:

```gitignore
# Backend specific
backend/.env
backend/node_modules
backend/dist
backend/uploads
backend/logs
backend/*.log

# Keep existing frontend ignores
frontend/node_modules
frontend/dist
frontend/.env
frontend/.env.local

# Root
node_modules/
.DS_Store
*.log
.vscode/settings.json
```

### Step 8: Create Database Configuration

Create `backend/src/config/database.js`:

```javascript
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Mongoose 8.x+ doesn't need these options anymore
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1); // Exit with failure
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB Disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error(`❌ MongoDB Error: ${err.message}`);
});

export default connectDB;
```

Update `backend/src/index.js` to connect to database:

```javascript
import connectDB from './config/database.js';

// Add after dotenv.config():
// Connect to database
await connectDB();
```

### Step 9: Create Example Model

Create `backend/src/models/User.js`:

```javascript
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    match: [/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/, 'Invalid phone number']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // Don't return password in queries by default
  },
  role: {
    type: String,
    enum: ['admin', 'teacher', 'student', 'parent', 'sponsor'],
    default: 'student',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
  this.password = await bcrypt.hash(this.password, rounds);
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile
userSchema.methods.toPublicJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

const User = mongoose.model('User', userSchema);

export default User;
```

### Step 10: Create Example Route

Create `backend/src/routes/users.js`:

```javascript
import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// GET /api/users - Get all users
router.get('/', async (req, res, next) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort('-createdAt');
    
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/:id - Get single user
router.get('/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/users - Create new user
router.post('/', async (req, res, next) => {
  try {
    const user = await User.create(req.body);
    
    res.status(201).json({
      success: true,
      data: user.toPublicJSON()
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Email already exists'
      });
    }
    next(error);
  }
});

// PUT /api/users/:id - Update user
router.put('/:id', async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/users/:id - Delete user
router.delete('/:id', async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
});

export default router;
```

Update `backend/src/index.js` to use the route:

```javascript
import userRoutes from './routes/users.js';

// Add before error handling middleware:
app.use('/api/users', userRoutes);
```

---

## Development Workflow

### Option A: Run Both Servers Separately

**Terminal 1 - Frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
# Runs on http://localhost:5000
```

### Option B: Run Both with Concurrently (Recommended)

**From Root:**
```bash
# Install workspaces
npm install

# Run both servers
npm run dev
```

This will start both frontend and backend in a single terminal with colored output.

### Testing Backend API

```bash
# Health check
curl http://localhost:5000/api/health

# Get all users
curl http://localhost:5000/api/users

# Create user
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "mobile": "1234567890",
    "password": "password123",
    "role": "student"
  }'
```

### Frontend API Integration

Update frontend to use backend API. Create `frontend/src/services/api.js`:

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor (add auth token)
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

// Response interceptor (handle errors)
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default api;
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

---

## Deployment Considerations

### Option 1: Deploy Together (Monolith)

**Advantages:**
- Single deployment process
- Simpler infrastructure
- Lower hosting costs

**Platforms:**
- Heroku (with buildpacks)
- Railway
- Render

**Setup:**
```json
// Root package.json - add:
{
  "scripts": {
    "build": "npm run build:frontend && npm run build:backend",
    "start": "node backend/src/index.js",
    "heroku-postbuild": "npm run build"
  }
}
```

Serve frontend from backend:
```javascript
// backend/src/index.js - add before routes:
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../frontend/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
  });
}
```

### Option 2: Deploy Separately (Recommended for Production)

**Frontend:**
- Vercel
- Netlify
- Cloudflare Pages

**Backend:**
- Railway
- Render
- AWS EC2 / ECS
- DigitalOcean

**Database:**
- MongoDB Atlas (free tier available)
- AWS DocumentDB
- Self-hosted MongoDB

**Advantages:**
- Independent scaling
- Better separation of concerns
- Platform-specific optimizations

---

## Next Steps After Setup

1. **Implement Authentication**
   - Create `backend/src/routes/auth.js`
   - JWT token generation/validation
   - Login/logout endpoints
   - Password reset flow

2. **Create All Models**
   - Student model
   - School model
   - Grade model
   - Marks model
   - Attendance model

3. **Add Middleware**
   - Authentication middleware
   - Authorization middleware (role-based)
   - Validation middleware (express-validator)
   - Error handling middleware

4. **Write Tests**
   - Install Jest or Vitest
   - Unit tests for models
   - Integration tests for routes
   - E2E tests with Supertest

5. **Add Documentation**
   - API documentation with Swagger
   - Postman collection
   - Environment setup guide

---

## Useful Commands

```bash
# Install all workspace dependencies
npm install

# Add dependency to frontend
npm install axios --workspace=frontend

# Add dependency to backend
npm install mongoose --workspace=backend

# Run scripts in specific workspace
npm run dev --workspace=backend
npm run build --workspace=frontend

# Clean install
rm -rf node_modules frontend/node_modules backend/node_modules
npm install
```

---

## Resources

- **Express.js**: https://expressjs.com/
- **Mongoose**: https://mongoosejs.com/
- **JWT**: https://jwt.io/
- **MongoDB Atlas**: https://www.mongodb.com/cloud/atlas
- **npm Workspaces**: https://docs.npmjs.com/cli/v8/using-npm/workspaces

---

**Last Updated**: December 20, 2025  
**Status**: Frontend complete, ready for backend setup
