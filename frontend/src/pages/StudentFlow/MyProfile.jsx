import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MyProfile.css';

const MyProfile = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  
  const [student] = useState({
    studentId: 'STU-2024-001',
    name: 'Emma Wilson',
    avatar: 'EW',
    class: 'Grade 10-A',
    rollNo: '001',
    dateOfBirth: '2009-05-15',
    gender: 'Female',
    bloodGroup: 'O+',
    email: 'emma.wilson@student.school.edu',
    phone: '+1 (555) 123-4567',
    address: '123 Maple Street, Springfield, IL 62701',
    admissionDate: '2019-04-01',
    status: 'Active',
    parent: {
      name: 'Robert Wilson',
      relation: 'Father',
      email: 'robert.wilson@email.com',
      phone: '+1 (555) 987-6543',
      occupation: 'Software Engineer'
    }
  });

  const [academicStats] = useState({
    currentGPA: 3.85,
    classRank: 3,
    totalStudents: 35,
    attendanceRate: 96.5,
    subjectsEnrolled: 8
  });

  const [upcomingExams] = useState([
    { subject: 'Mathematics', date: '2024-12-20', time: '9:00 AM' },
    { subject: 'Science', date: '2024-12-22', time: '9:00 AM' },
    { subject: 'English', date: '2024-12-24', time: '9:00 AM' },
  ]);

  const [announcements] = useState([
    { date: '2024-12-15', title: 'Winter Break Schedule', content: 'School will remain closed from Dec 25 to Jan 2.' },
    { date: '2024-12-10', title: 'Science Fair Results', content: 'Congratulations to all participants!' },
  ]);

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
