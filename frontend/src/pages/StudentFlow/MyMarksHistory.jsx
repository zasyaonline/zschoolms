import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MyMarksHistory.css';

const MyMarksHistory = () => {
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState('2024-2025');
  const [selectedTerm, setSelectedTerm] = useState('all');

  const [overallStats] = useState({
    gpa: 3.75,
    rank: 5,
    totalStudents: 42,
    percentage: 87.5
  });

  const [subjects] = useState([
    {
      id: 1,
      name: 'Mathematics',
      icon: '📐',
      color: '#3B82F6',
      terms: [
        { term: 'Term 1', marks: 88, total: 100, grade: 'A' },
        { term: 'Term 2', marks: 92, total: 100, grade: 'A+' },
        { term: 'Final', marks: 90, total: 100, grade: 'A+' },
      ],
      average: 90,
      trend: 'up'
    },
    {
      id: 2,
      name: 'English',
      icon: '📖',
      color: '#10B981',
      terms: [
        { term: 'Term 1', marks: 82, total: 100, grade: 'A' },
        { term: 'Term 2', marks: 85, total: 100, grade: 'A' },
        { term: 'Final', marks: 84, total: 100, grade: 'A' },
      ],
      average: 84,
      trend: 'up'
    },
    {
      id: 3,
      name: 'Science',
      icon: '🔬',
      color: '#8B5CF6',
      terms: [
        { term: 'Term 1', marks: 91, total: 100, grade: 'A+' },
        { term: 'Term 2', marks: 89, total: 100, grade: 'A' },
        { term: 'Final', marks: 90, total: 100, grade: 'A+' },
      ],
      average: 90,
      trend: 'stable'
    },
    {
      id: 4,
      name: 'Social Studies',
      icon: '🌍',
      color: '#F59E0B',
      terms: [
        { term: 'Term 1', marks: 85, total: 100, grade: 'A' },
        { term: 'Term 2', marks: 87, total: 100, grade: 'A' },
        { term: 'Final', marks: 86, total: 100, grade: 'A' },
      ],
      average: 86,
      trend: 'up'
    },
    {
      id: 5,
      name: 'Computer Science',
      icon: '💻',
      color: '#EC4899',
      terms: [
        { term: 'Term 1', marks: 94, total: 100, grade: 'A+' },
        { term: 'Term 2', marks: 96, total: 100, grade: 'A+' },
        { term: 'Final', marks: 95, total: 100, grade: 'A+' },
      ],
      average: 95,
      trend: 'up'
    },
  ]);

  const [gpaHistory] = useState([
    { term: '2023 Term 1', gpa: 3.6 },
    { term: '2023 Term 2', gpa: 3.65 },
    { term: '2024 Term 1', gpa: 3.7 },
    { term: '2024 Term 2', gpa: 3.75 },
  ]);

  const getGradeColor = (grade) => {
    if (grade === 'A+') return '#10B981';
    if (grade === 'A') return '#3B82F6';
    if (grade === 'B+') return '#8B5CF6';
    if (grade === 'B') return '#F59E0B';
    return '#6B7280';
  };

  const getTrendIcon = (trend) => {
    if (trend === 'up') return '📈';
    if (trend === 'down') return '📉';
    return '➡️';
  };

  return (
    <div className="my-marks">
      <div className="my-marks__header">
        <button className="my-marks__back-btn" onClick={() => navigate('/student/profile')}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div>
          <h1 className="my-marks__title">My Marks History</h1>
          <p className="my-marks__subtitle">Track your academic performance</p>
        </div>
      </div>

      {/* Overall Performance */}
      <div className="my-marks__overview">
        <div className="my-marks__gpa-card">
          <div className="my-marks__gpa-circle">
            <svg viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#E5E7EB" strokeWidth="10"/>
              <circle 
                cx="60" 
                cy="60" 
                r="52" 
                fill="none" 
                stroke="url(#gpaGradient)" 
                strokeWidth="10"
                strokeDasharray={`${(overallStats.gpa / 4) * 327} 327`}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
              />
              <defs>
                <linearGradient id="gpaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6"/>
                  <stop offset="100%" stopColor="#8B5CF6"/>
                </linearGradient>
              </defs>
            </svg>
            <div className="my-marks__gpa-text">
              <span className="my-marks__gpa-value">{overallStats.gpa}</span>
              <span className="my-marks__gpa-label">GPA</span>
            </div>
          </div>
        </div>
        
        <div className="my-marks__stats">
          <div className="my-marks__stat-card">
            <div className="my-marks__stat-icon my-marks__stat-icon--rank">🏆</div>
            <div className="my-marks__stat-info">
              <span className="my-marks__stat-value">{overallStats.rank}/{overallStats.totalStudents}</span>
              <span className="my-marks__stat-label">Class Rank</span>
            </div>
          </div>
          <div className="my-marks__stat-card">
            <div className="my-marks__stat-icon my-marks__stat-icon--percent">📊</div>
            <div className="my-marks__stat-info">
              <span className="my-marks__stat-value">{overallStats.percentage}%</span>
              <span className="my-marks__stat-label">Overall Score</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="my-marks__filters">
        <select
          className="my-marks__select"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
        >
          <option value="2024-2025">2024-2025</option>
          <option value="2023-2024">2023-2024</option>
        </select>
        <select
          className="my-marks__select"
          value={selectedTerm}
          onChange={(e) => setSelectedTerm(e.target.value)}
        >
          <option value="all">All Terms</option>
          <option value="term1">Term 1</option>
          <option value="term2">Term 2</option>
          <option value="final">Final</option>
        </select>
      </div>

      {/* Subject Cards */}
      <div className="my-marks__subjects">
        {subjects.map((subject) => (
          <div key={subject.id} className="my-marks__subject-card">
            <div className="my-marks__subject-header">
              <div className="my-marks__subject-icon" style={{ backgroundColor: `${subject.color}20` }}>
                <span>{subject.icon}</span>
              </div>
              <div className="my-marks__subject-info">
                <h3 className="my-marks__subject-name">{subject.name}</h3>
                <span className="my-marks__subject-average">
                  Average: {subject.average}% {getTrendIcon(subject.trend)}
                </span>
              </div>
              <div 
                className="my-marks__subject-grade"
                style={{ backgroundColor: getGradeColor(subject.terms[subject.terms.length - 1].grade) }}
              >
                {subject.terms[subject.terms.length - 1].grade}
              </div>
            </div>
            <div className="my-marks__subject-terms">
              {subject.terms.map((term, index) => (
                <div key={index} className="my-marks__term">
                  <span className="my-marks__term-name">{term.term}</span>
                  <div className="my-marks__term-progress">
                    <div 
                      className="my-marks__term-bar"
                      style={{ 
                        width: `${(term.marks / term.total) * 100}%`,
                        backgroundColor: subject.color
                      }}
                    ></div>
                  </div>
                  <span className="my-marks__term-marks">{term.marks}/{term.total}</span>
                  <span 
                    className="my-marks__term-grade"
                    style={{ color: getGradeColor(term.grade) }}
                  >
                    {term.grade}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* GPA Trend */}
      <div className="my-marks__card">
        <h3 className="my-marks__card-title">GPA Trend</h3>
        <div className="my-marks__gpa-chart">
          {gpaHistory.map((item, index) => (
            <div key={index} className="my-marks__gpa-bar-container">
              <div className="my-marks__gpa-bar-wrapper">
                <div 
                  className="my-marks__gpa-bar"
                  style={{ height: `${(item.gpa / 4) * 100}%` }}
                >
                  <span className="my-marks__gpa-bar-value">{item.gpa}</span>
                </div>
              </div>
              <span className="my-marks__gpa-bar-label">{item.term}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="my-marks__actions">
        <button className="my-marks__action-btn">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 17V14M7 17V10M11 17V6M15 17V2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          View Report Cards
        </button>
        <button className="my-marks__action-btn my-marks__action-btn--outline">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 16L4 4M4 4L8 8M4 4L0 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform="rotate(90 10 10)"/>
          </svg>
          Download PDF
        </button>
      </div>
    </div>
  );
};

export default MyMarksHistory;
