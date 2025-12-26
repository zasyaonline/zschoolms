import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './MyMarksHistory.css';
import { marksService } from '../../services';

const MyMarksHistory = () => {
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState('2024-2025');
  const [selectedTerm, setSelectedTerm] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studentId, setStudentId] = useState(null);

  const [overallStats, setOverallStats] = useState({
    gpa: 0,
    rank: 0,
    totalStudents: 0,
    percentage: 0
  });

  const [subjects, setSubjects] = useState([]);
  const [gpaHistory, setGpaHistory] = useState([]);

  // Subject icon mapping
  const subjectIcons = {
    'mathematics': '📐',
    'english': '📖',
    'science': '🔬',
    'physics': '⚡',
    'chemistry': '🧪',
    'biology': '🧬',
    'history': '📜',
    'geography': '🌍',
    'computer': '💻',
    'default': '📚'
  };

  const subjectColors = {
    'mathematics': '#3B82F6',
    'english': '#10B981',
    'science': '#8B5CF6',
    'physics': '#F59E0B',
    'chemistry': '#EC4899',
    'biology': '#06B6D4',
    'history': '#EF4444',
    'geography': '#84CC16',
    'computer': '#6366F1',
    'default': '#6B7280'
  };

  // Get student ID from localStorage
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    
    if (!user) {
      navigate('/login');
      return;
    }
    
    setStudentId(user.studentId || user.id);
  }, [navigate]);

  // Fetch marks data
  const fetchMarks = useCallback(async () => {
    if (!studentId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await marksService.getStudentMarks(studentId, {
        academicYear: selectedYear
      });

      if (response.success && response.data) {
        const marksheets = response.data.marksheets || response.data || [];
        
        // Group marks by subject
        const subjectMap = new Map();
        let totalMarks = 0;
        let totalMaxMarks = 0;

        marksheets.forEach(mark => {
          const subjectName = mark.subject?.name || mark.subjectName || 'Unknown Subject';
          const subjectKey = subjectName.toLowerCase().replace(/\s+/g, '');
          
          if (!subjectMap.has(subjectKey)) {
            subjectMap.set(subjectKey, {
              id: mark.subjectId || mark.id,
              name: subjectName,
              icon: subjectIcons[subjectKey] || subjectIcons.default,
              color: subjectColors[subjectKey] || subjectColors.default,
              terms: [],
              total: 0,
              maxTotal: 0
            });
          }

          const subject = subjectMap.get(subjectKey);
          const marksObtained = parseFloat(mark.marksObtained) || 0;
          const maxMarks = parseFloat(mark.maxMarks) || 100;
          const percentage = (marksObtained / maxMarks) * 100;
          const grade = getGradeFromPercentage(percentage);

          subject.terms.push({
            term: mark.examType || mark.coursePart?.name || 'Exam',
            marks: marksObtained,
            total: maxMarks,
            grade
          });
          
          subject.total += marksObtained;
          subject.maxTotal += maxMarks;
          totalMarks += marksObtained;
          totalMaxMarks += maxMarks;
        });

        // Calculate averages and trends
        const subjectsArray = Array.from(subjectMap.values()).map(subject => ({
          ...subject,
          average: subject.maxTotal > 0 ? 
            Math.round((subject.total / subject.maxTotal) * 100) : 0,
          trend: calculateTrend(subject.terms)
        }));

        setSubjects(subjectsArray);

        // Calculate overall stats
        const overallPercentage = totalMaxMarks > 0 ? 
          ((totalMarks / totalMaxMarks) * 100).toFixed(1) : 0;
        const gpa = (parseFloat(overallPercentage) / 25).toFixed(2); // Rough GPA conversion

        setOverallStats({
          gpa: Math.min(parseFloat(gpa), 4.0),
          rank: response.data.rank || 0,
          totalStudents: response.data.totalStudents || 0,
          percentage: overallPercentage
        });

        // Generate GPA history (mock based on current data)
        setGpaHistory([
          { term: '2023 Term 1', gpa: Math.max(0, parseFloat(gpa) - 0.15).toFixed(2) },
          { term: '2023 Term 2', gpa: Math.max(0, parseFloat(gpa) - 0.10).toFixed(2) },
          { term: '2024 Term 1', gpa: Math.max(0, parseFloat(gpa) - 0.05).toFixed(2) },
          { term: '2024 Term 2', gpa: gpa },
        ]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load marks history');
      console.error('Error fetching marks:', err);
    } finally {
      setLoading(false);
    }
  }, [studentId, selectedYear]);

  useEffect(() => {
    fetchMarks();
  }, [fetchMarks]);

  const getGradeFromPercentage = (percentage) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
  };

  const calculateTrend = (terms) => {
    if (terms.length < 2) return 'stable';
    const recent = terms[terms.length - 1];
    const previous = terms[terms.length - 2];
    const recentPct = (recent.marks / recent.total) * 100;
    const prevPct = (previous.marks / previous.total) * 100;
    
    if (recentPct > prevPct + 2) return 'up';
    if (recentPct < prevPct - 2) return 'down';
    return 'stable';
  };

  const getGradeColor = (grade) => {
    if (grade === 'A+') return '#10B981';
    if (grade === 'A') return '#3B82F6';
    if (grade === 'B+') return '#8B5CF6';
    if (grade === 'B') return '#F59E0B';
    return '#6B7280';
  };

  const getTrendIcon = (trend) => {
    if (trend === 'up') return '↑';
    if (trend === 'down') return '↓';
    return '→';
  };

  if (loading) {
    return (
      <div className="my-marks-history">
        <div className="my-marks-history__loading">
          <div className="my-marks-history__spinner"></div>
          <p>Loading marks history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-marks-history">
        <div className="my-marks-history__error">
          <p>{error}</p>
          <button onClick={() => fetchMarks()}>Retry</button>
        </div>
      </div>
    );
  }
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
