import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { connectDB } from './config/database.js';
import { swaggerSpec } from './config/swagger.js';

// Load environment variables
dotenv.config();

// Import Sentry configuration
import { 
  initSentry, 
  sentryRequestHandler, 
  sentryTracingHandler, 
  sentryErrorHandler,
  captureException 
} from './config/sentry.js';

// Import scheduled jobs
import { startRenewalReminderJob } from './jobs/renewal-reminder.job.js';
import { startEmailQueueJob } from './jobs/email-queue.job.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Sentry (must be before other middleware)
initSentry(app);

// Sentry request handler (must be first)
app.use(sentryRequestHandler());

// Sentry tracing handler
app.use(sentryTracingHandler());

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

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

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
      batchJobs: '/api/batch-jobs',
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
import superAdminRoutes from './routes/superadmin.routes.js';
import academicYearRoutes from './routes/academicyear.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import teacherRoutes from './routes/teacher.routes.js';
import batchJobRoutes from './routes/batchjob.routes.js';
import distributionRoutes from './routes/distribution.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import studentPortalRoutes from './routes/studentPortal.routes.js';

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
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/academic-years', academicYearRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/batch-jobs', batchJobRoutes);
app.use('/api/distribution', distributionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/student-portal', studentPortalRoutes);

// Sentry error handler (must be before other error handlers)
app.use(sentryErrorHandler());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  // Capture exception to Sentry with context
  captureException(err, {
    user: req.user ? { id: req.user.id, email: req.user.email, role: req.user.role } : null,
    tags: { path: req.path, method: req.method },
    extra: { query: req.query, body: req.body }
  });
  
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
  
  // Start scheduled jobs
  if (process.env.ENABLE_CRON_JOBS !== 'false') {
    try {
      startRenewalReminderJob();
      startEmailQueueJob();
      console.log('📅 Scheduled jobs started');
    } catch (error) {
      console.error('⚠️ Failed to start scheduled jobs:', error.message);
    }
  }
  
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
