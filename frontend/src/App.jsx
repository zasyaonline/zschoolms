import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';

// Auth pages (not lazy loaded for faster initial load)
import Login from './pages/Auth/Login';
import ForgotPassword from './pages/Auth/ForgotPassword';

// Lazy load pages for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));
const UserList = lazy(() => import('./pages/UserManagement/UserList'));
const StudentList = lazy(() => import('./pages/SystemConfiguration/StudentList'));
const SponsorStudentMapping = lazy(() => import('./pages/SystemConfiguration/SponsorStudentMapping'));
const GradingSchemeSetup = lazy(() => import('./pages/SystemConfiguration/GradingSchemeSetup'));
const SchoolInformationList = lazy(() => import('./pages/SystemConfiguration/SchoolInformationList'));
const MarksApprovalList = lazy(() => import('./pages/AcademicRecords/MarksApprovalList'));
const MarksReview = lazy(() => import('./pages/AcademicRecords/MarksReview'));
const ReportCardList = lazy(() => import('./pages/AcademicRecords/ReportCardList'));
const ViewGeneratedPDF = lazy(() => import('./pages/AcademicRecords/ViewGeneratedPDF'));
const ViewMarkSheet = lazy(() => import('./pages/AcademicRecords/ViewMarkSheet'));
const AttendanceEntry = lazy(() => import('./pages/TeacherFlow/AttendanceEntry'));
const MarksEntry = lazy(() => import('./pages/TeacherFlow/MarksEntry'));
const RejectedMarksCorrection = lazy(() => import('./pages/TeacherFlow/RejectedMarksCorrection'));
const TeacherStudentProfile = lazy(() => import('./pages/TeacherFlow/StudentProfile'));
const TeacherAttendanceSummary = lazy(() => import('./pages/TeacherFlow/AttendanceSummary'));
const TeacherMarksHistory = lazy(() => import('./pages/TeacherFlow/MarksHistory'));
const MyProfile = lazy(() => import('./pages/StudentFlow/MyProfile'));
const MyAttendance = lazy(() => import('./pages/StudentFlow/MyAttendance'));
const MyMarksHistory = lazy(() => import('./pages/StudentFlow/MyMarksHistory'));

// Sponsor Flow
const SponsorDashboard = lazy(() => import('./pages/SponsorFlow/SponsorDashboard'));

// Auth helper - check if user is authenticated
const isAuthenticated = () => {
  const token = localStorage.getItem('accessToken');
  return !!token;
};

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Public Route wrapper (redirect to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  if (isAuthenticated()) {
    return <Navigate to="/users" replace />;
  }
  return children;
};

// Loading component
const LoadingFallback = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    fontSize: '16px',
    color: '#666'
  }}>
    <div>
      <div style={{
        width: '40px',
        height: '40px',
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #667eea',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 16px'
      }} />
      <div>Loading...</div>
    </div>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Public Auth Routes */}
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        <Route path="/forgot-password" element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        } />

        {/* Protected Routes with MainLayout */}
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          {/* Default redirect */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          
          {/* Dashboard */}
          <Route path="dashboard" element={
            <ErrorBoundary>
              <Suspense fallback={<LoadingFallback />}>
                <Dashboard />
              </Suspense>
            </ErrorBoundary>
          } />
          
          {/* User Management */}
          <Route path="users" element={
            <ErrorBoundary>
              <Suspense fallback={<LoadingFallback />}>
                <UserList />
              </Suspense>
            </ErrorBoundary>
          } />
          
          {/* System Configuration - Students */}
          <Route path="students" element={
            <ErrorBoundary>
              <Suspense fallback={<LoadingFallback />}>
                <StudentList />
              </Suspense>
            </ErrorBoundary>
          } />
          <Route path="sponsor-mapping" element={
            <ErrorBoundary>
              <Suspense fallback={<LoadingFallback />}>
                <SponsorStudentMapping />
              </Suspense>
            </ErrorBoundary>
          } />
          
          {/* System Configuration - Grading */}
          <Route path="grading-scheme-setup" element={
            <ErrorBoundary>
              <Suspense fallback={<LoadingFallback />}>
                <GradingSchemeSetup />
              </Suspense>
            </ErrorBoundary>
          } />
          
          {/* System Configuration - Schools */}
          <Route path="schools" element={
            <ErrorBoundary>
              <Suspense fallback={<LoadingFallback />}>
                <SchoolInformationList />
              </Suspense>
            </ErrorBoundary>
          } />
          
          {/* Academic Records */}
          <Route path="marks-approval" element={
            <ErrorBoundary>
              <Suspense fallback={<LoadingFallback />}>
                <MarksApprovalList />
              </Suspense>
            </ErrorBoundary>
          } />
          <Route path="marks-review/:id" element={
            <ErrorBoundary>
              <Suspense fallback={<LoadingFallback />}>
                <MarksReview />
              </Suspense>
            </ErrorBoundary>
          } />
          <Route path="report-cards" element={
            <ErrorBoundary>
              <Suspense fallback={<LoadingFallback />}>
                <ReportCardList />
              </Suspense>
            </ErrorBoundary>
          } />
          <Route path="view-generated-pdf" element={
            <ErrorBoundary>
              <Suspense fallback={<LoadingFallback />}>
                <ViewGeneratedPDF />
              </Suspense>
            </ErrorBoundary>
          } />
          <Route path="mark-sheet/:id" element={
            <ErrorBoundary>
              <Suspense fallback={<LoadingFallback />}>
                <ViewMarkSheet />
              </Suspense>
            </ErrorBoundary>
          } />
          
          {/* Teacher Flow */}
          <Route path="teacher/attendance" element={
            <ErrorBoundary>
              <Suspense fallback={<LoadingFallback />}>
                <AttendanceEntry />
              </Suspense>
            </ErrorBoundary>
          } />
          <Route path="teacher/marks-entry" element={
            <ErrorBoundary>
              <Suspense fallback={<LoadingFallback />}>
                <MarksEntry />
              </Suspense>
            </ErrorBoundary>
          } />
          <Route path="teacher/rejected-marks" element={
            <ErrorBoundary>
              <Suspense fallback={<LoadingFallback />}>
                <RejectedMarksCorrection />
              </Suspense>
            </ErrorBoundary>
          } />
          <Route path="teacher/student-profile" element={
            <ErrorBoundary>
              <Suspense fallback={<LoadingFallback />}>
                <TeacherStudentProfile />
              </Suspense>
            </ErrorBoundary>
          } />
          <Route path="teacher/student/:id" element={
            <ErrorBoundary>
              <Suspense fallback={<LoadingFallback />}>
                <TeacherStudentProfile />
              </Suspense>
            </ErrorBoundary>
          } />
          <Route path="teacher/student/:id/attendance" element={
            <ErrorBoundary>
              <Suspense fallback={<LoadingFallback />}>
                <TeacherAttendanceSummary />
              </Suspense>
            </ErrorBoundary>
          } />
          <Route path="teacher/student/:id/marks" element={
            <ErrorBoundary>
              <Suspense fallback={<LoadingFallback />}>
                <TeacherMarksHistory />
              </Suspense>
            </ErrorBoundary>
          } />
          
          {/* Student Flow */}
          <Route path="student/profile" element={
            <ErrorBoundary>
              <Suspense fallback={<LoadingFallback />}>
                <MyProfile />
              </Suspense>
            </ErrorBoundary>
          } />
          <Route path="student/attendance" element={
            <ErrorBoundary>
              <Suspense fallback={<LoadingFallback />}>
                <MyAttendance />
              </Suspense>
            </ErrorBoundary>
          } />
          <Route path="student/marks" element={
            <ErrorBoundary>
              <Suspense fallback={<LoadingFallback />}>
                <MyMarksHistory />
              </Suspense>
            </ErrorBoundary>
          } />
          
          {/* Sponsor Flow */}
          <Route path="sponsor/dashboard" element={
            <ErrorBoundary>
              <Suspense fallback={<LoadingFallback />}>
                <SponsorDashboard />
              </Suspense>
            </ErrorBoundary>
          } />
          <Route path="sponsor/students" element={
            <ErrorBoundary>
              <Suspense fallback={<LoadingFallback />}>
                <SponsorDashboard />
              </Suspense>
            </ErrorBoundary>
          } />
        </Route>
      </Routes>
    </ErrorBoundary>
  )
}

export default App
