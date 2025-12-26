import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { connectDB } from './config/database.js';
import { swaggerSpec } from './config/swagger.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies
app.use(morgan('dev')); // Request logging

// Debug middleware - log all requests
app.use((req, res, next) => {
  console.log(`🔥 Incoming request: ${req.method} ${req.path}`);
  next();
});

// Connect to PostgreSQL Database
connectDB();

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'ZSchool API Docs',
}));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'ZSchool Management System API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: 'PostgreSQL',
    documentation: '/api-docs',
  });
});
    
// API version info
app.get('/api', (req, res) => {
  res.json({
    message: 'ZSchool Management System API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users',
      students: '/api/students',
      sponsors: '/api/sponsors',
      dashboard: '/api/dashboard',
      attendance: '/api/attendance',
      marks: '/api/marks',
      reportCards: '/api/report-cards',
      analytics: '/api/analytics',
      schools: '/api/schools',
      grades: '/api/grades',
    },
  });
});

// API Routes
console.log('📦 Loading routes...');
import authRoutes from './routes/auth.routes.js';
import userRoutesPhase2 from './routes/user.routes.phase2.js';
import studentRoutes from './routes/student.routes.js';
import sponsorRoutes from './routes/sponsor.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import marksRoutes from './routes/marks.routes.js';
import reportCardRoutes from './routes/reportcard.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import schoolRoutes from './routes/school.routes.js';
import gradingSchemeRoutes from './routes/gradingscheme.routes.js';

console.log('🔌 Mounting routes...');
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutesPhase2);
app.use('/api/students', studentRoutes);
app.use('/api/sponsors', sponsorRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/marks', marksRoutes);
app.use('/api/report-cards', reportCardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/grading-schemes', gradingSchemeRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: err.stack,
        details: err.errors || null,
      }),
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
  });
});

// Start server
console.log('🚀 Starting server...');
const server = app.listen(PORT, () => {
  console.log('=================================');
  console.log('🚀 ZSchool Management System API');
  console.log('=================================');
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`💾 Database: PostgreSQL`);
  console.log('=================================');
  console.log('✅ Server is NOW LISTENING and ready to accept requests');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('🛑 HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('🛑 HTTP server closed');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

export default app;
