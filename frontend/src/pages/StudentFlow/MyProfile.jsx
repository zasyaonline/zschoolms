import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MyProfile.css';
import { studentService, attendanceService } from '../../services';

const MyProfile = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [student, setStudent] = useState({
    studentId: '',
    name: '',
    avatar: '',
    class: '',
    rollNo: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    email: '',
    phone: '',
    address: '',
    admissionDate: '',
    status: 'Active',
    parent: {
      name: '',
      relation: '',
      email: '',
      phone: '',
      occupation: ''
    }
  });

  const [academicStats, setAcademicStats] = useState({
    currentGPA: 0,
    classRank: 0,
    totalStudents: 0,
    attendanceRate: 0,
    subjectsEnrolled: 0
  });

  const [upcomingExams] = useState([
    { subject: 'Mathematics', date: '2025-01-10', time: '9:00 AM' },
    { subject: 'Science', date: '2025-01-12', time: '9:00 AM' },
    { subject: 'English', date: '2025-01-14', time: '9:00 AM' },
  ]);

  const [announcements] = useState([
    { date: '2024-12-20', title: 'Winter Break Schedule', content: 'School will remain closed from Dec 25 to Jan 2.' },
    { date: '2024-12-18', title: 'New Year Celebration', content: 'Cultural program on January 3rd.' },
  ]);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get user from localStorage
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        
        if (!user) {
          navigate('/login');
          return;
        }

        // Fetch student profile
        let studentData = null;
        
        // Try to get student by user's student ID if available
        if (user.studentId) {
          const response = await studentService.getStudentById(user.studentId);
          if (response.success) {
            studentData = response.data;
          }
        } else if (user.role === 'student') {
          // Try to get the profile through the students endpoint
          const response = await studentService.getStudents({ userId: user.id, limit: 1 });
          if (response.success && response.data?.students?.length > 0) {
            studentData = response.data.students[0];
          }
        }

        if (studentData) {
          const userData = studentData.user || {};
          setStudent({
            studentId: studentData.enrollmentNumber || studentData.id?.substring(0, 12) || 'N/A',
            name: userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Student',
            avatar: (userData.firstName?.[0] || 'S') + (userData.lastName?.[0] || ''),
            class: `Grade ${studentData.currentClass || ''}-${studentData.section || ''}`,
            rollNo: studentData.rollNumber || 'N/A',
            dateOfBirth: studentData.dateOfBirth || 'N/A',
            gender: studentData.gender || 'N/A',
            bloodGroup: studentData.bloodGroup || 'N/A',
            email: userData.email || 'N/A',
            phone: userData.phone || 'N/A',
            address: studentData.address || userData.address || 'N/A',
            admissionDate: studentData.admissionDate || 'N/A',
            status: studentData.status || 'Active',
            parent: {
              name: studentData.parent?.user?.name || studentData.parent?.name || 'N/A',
              relation: 'Parent/Guardian',
              email: studentData.parent?.user?.email || 'N/A',
              phone: studentData.parent?.user?.phone || 'N/A',
              occupation: studentData.parent?.occupation || 'N/A'
            }
          });

          // Fetch attendance summary
          try {
            const attendanceResponse = await attendanceService.getStudentAttendance(studentData.id, {
              limit: 200
            });
            if (attendanceResponse.success && attendanceResponse.data?.statistics) {
              const stats = attendanceResponse.data.statistics;
              setAcademicStats(prev => ({
                ...prev,
                attendanceRate: parseFloat(stats.attendanceRate) || 0
              }));
            }
          } catch (err) {
            console.log('Attendance stats not available');
          }
        } else {
          // Use logged-in user info as fallback
          setStudent({
            studentId: user.id?.substring(0, 12) || 'N/A',
            name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Student',
            avatar: (user.firstName?.[0] || 'S') + (user.lastName?.[0] || ''),
            class: 'N/A',
            rollNo: 'N/A',
            dateOfBirth: 'N/A',
            gender: 'N/A',
            bloodGroup: 'N/A',
            email: user.email || 'N/A',
            phone: user.phone || 'N/A',
            address: 'N/A',
            admissionDate: 'N/A',
            status: 'Active',
            parent: {
              name: 'N/A',
              relation: '',
              email: 'N/A',
              phone: 'N/A',
              occupation: 'N/A'
            }
          });
        }
      } catch (err) {
        setError(err.message || 'Failed to load profile');
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  if (loading) {
    return (
      <div className="my-profile">
        <div className="my-profile__loading">
          <div className="my-profile__spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-profile">
        <div className="my-profile__error">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="my-profile">
      <div className="my-profile__header">
        <h1 className="my-profile__title">My Profile</h1>
        <p className="my-profile__subtitle">View your information and academic performance</p>
      </div>

      {/* Profile Card */}
      <div className="my-profile__card">
        <div className="my-profile__main">
          <div className="my-profile__avatar">{student.avatar}</div>
          <div className="my-profile__info">
            <h2 className="my-profile__name">{student.name}</h2>
            <p className="my-profile__id">Student ID: {student.studentId}</p>
            <div className="my-profile__badges">
              <span className="my-profile__badge my-profile__badge--class">{student.class}</span>
              <span className="my-profile__badge my-profile__badge--roll">Roll No. {student.rollNo}</span>
            </div>
          </div>
        </div>
        <div className="my-profile__quick-links">
          <button className="my-profile__quick-link" onClick={() => navigate('/student/attendance')}>
            📊 My Attendance
          </button>
          <button className="my-profile__quick-link" onClick={() => navigate('/student/marks-history')}>
            📝 My Marks
          </button>
        </div>
      </div>

      {/* Academic Stats */}
      <div className="my-profile__stats">
        <div className="my-profile__stat">
          <span className="my-profile__stat-icon">🎓</span>
          <div>
            <span className="my-profile__stat-value">{academicStats.currentGPA}</span>
            <span className="my-profile__stat-label">Current GPA</span>
          </div>
        </div>
        <div className="my-profile__stat">
          <span className="my-profile__stat-icon">🏆</span>
          <div>
            <span className="my-profile__stat-value">{academicStats.classRank}/{academicStats.totalStudents}</span>
            <span className="my-profile__stat-label">Class Rank</span>
          </div>
        </div>
        <div className="my-profile__stat">
          <span className="my-profile__stat-icon">✓</span>
          <div>
            <span className="my-profile__stat-value">{academicStats.attendanceRate}%</span>
            <span className="my-profile__stat-label">Attendance</span>
          </div>
        </div>
        <div className="my-profile__stat">
          <span className="my-profile__stat-icon">📚</span>
          <div>
            <span className="my-profile__stat-value">{academicStats.subjectsEnrolled}</span>
            <span className="my-profile__stat-label">Subjects</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="my-profile__tabs">
        <button 
          className={`my-profile__tab ${activeTab === 'overview' ? 'my-profile__tab--active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`my-profile__tab ${activeTab === 'personal' ? 'my-profile__tab--active' : ''}`}
          onClick={() => setActiveTab('personal')}
        >
          Personal Info
        </button>
        <button 
          className={`my-profile__tab ${activeTab === 'parent' ? 'my-profile__tab--active' : ''}`}
          onClick={() => setActiveTab('parent')}
        >
          Parent/Guardian
        </button>
      </div>

      {/* Tab Content */}
      <div className="my-profile__content">
        {activeTab === 'overview' && (
          <div className="my-profile__overview">
            <div className="my-profile__grid">
              <div className="my-profile__section">
                <h3 className="my-profile__section-title">📅 Upcoming Exams</h3>
                <div className="my-profile__exams">
                  {upcomingExams.map((exam, index) => (
                    <div key={index} className="my-profile__exam-item">
                      <div className="my-profile__exam-subject">{exam.subject}</div>
                      <div className="my-profile__exam-date">
                        {exam.date} at {exam.time}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="my-profile__section">
                <h3 className="my-profile__section-title">📢 Announcements</h3>
                <div className="my-profile__announcements">
                  {announcements.map((item, index) => (
                    <div key={index} className="my-profile__announcement-item">
                      <div className="my-profile__announcement-header">
                        <span className="my-profile__announcement-title">{item.title}</span>
                        <span className="my-profile__announcement-date">{item.date}</span>
                      </div>
                      <p className="my-profile__announcement-content">{item.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'personal' && (
          <div className="my-profile__personal">
            <div className="my-profile__details-grid">
              <div className="my-profile__detail">
                <span className="my-profile__detail-label">Full Name</span>
                <span className="my-profile__detail-value">{student.name}</span>
              </div>
              <div className="my-profile__detail">
                <span className="my-profile__detail-label">Date of Birth</span>
                <span className="my-profile__detail-value">{student.dateOfBirth}</span>
              </div>
              <div className="my-profile__detail">
                <span className="my-profile__detail-label">Gender</span>
                <span className="my-profile__detail-value">{student.gender}</span>
              </div>
              <div className="my-profile__detail">
                <span className="my-profile__detail-label">Blood Group</span>
                <span className="my-profile__detail-value">{student.bloodGroup}</span>
              </div>
              <div className="my-profile__detail">
                <span className="my-profile__detail-label">Email</span>
                <span className="my-profile__detail-value">{student.email}</span>
              </div>
              <div className="my-profile__detail">
                <span className="my-profile__detail-label">Phone</span>
                <span className="my-profile__detail-value">{student.phone}</span>
              </div>
              <div className="my-profile__detail my-profile__detail--full">
                <span className="my-profile__detail-label">Address</span>
                <span className="my-profile__detail-value">{student.address}</span>
              </div>
              <div className="my-profile__detail">
                <span className="my-profile__detail-label">Admission Date</span>
                <span className="my-profile__detail-value">{student.admissionDate}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'parent' && (
          <div className="my-profile__parent">
            <div className="my-profile__parent-card">
              <div className="my-profile__parent-avatar">
                {student.parent.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="my-profile__parent-info">
                <h4 className="my-profile__parent-name">{student.parent.name}</h4>
                <p className="my-profile__parent-relation">{student.parent.relation}</p>
              </div>
            </div>
            <div className="my-profile__details-grid">
              <div className="my-profile__detail">
                <span className="my-profile__detail-label">Email</span>
                <span className="my-profile__detail-value">{student.parent.email}</span>
              </div>
              <div className="my-profile__detail">
                <span className="my-profile__detail-label">Phone</span>
                <span className="my-profile__detail-value">{student.parent.phone}</span>
              </div>
              <div className="my-profile__detail">
                <span className="my-profile__detail-label">Occupation</span>
                <span className="my-profile__detail-value">{student.parent.occupation}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyProfile;
