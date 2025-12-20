import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './MarksHistory.css';

const MarksHistory = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [selectedYear, setSelectedYear] = useState('2024-2025');
  const [selectedTerm, setSelectedTerm] = useState('all');
  
  const [student] = useState({
    id: id || '1',
    name: 'Emma Wilson',
    class: 'Grade 10-A',
    rollNo: '001'
  });

  const [summary] = useState({
    overallGPA: 3.85,
    totalCredits: 32,
    classRank: 3,
    totalStudents: 35,
    improvementRate: 5.2
  });

  const [subjects] = useState([
    {
      name: 'Mathematics',
      code: 'MATH101',
      credits: 4,
      terms: [
        { name: 'Term 1', marks: 92, grade: 'A+', maxMarks: 100 },
        { name: 'Mid-Term', marks: 88, grade: 'A', maxMarks: 100 },
        { name: 'Term 2', marks: 95, grade: 'A+', maxMarks: 100 },
      ],
      average: 91.7,
      finalGrade: 'A+'
    },
    {
      name: 'Science',
      code: 'SCI101',
      credits: 4,
      terms: [
        { name: 'Term 1', marks: 88, grade: 'A', maxMarks: 100 },
        { name: 'Mid-Term', marks: 85, grade: 'A', maxMarks: 100 },
        { name: 'Term 2', marks: 90, grade: 'A', maxMarks: 100 },
      ],
      average: 87.7,
      finalGrade: 'A'
    },
    {
      name: 'English',
      code: 'ENG101',
      credits: 4,
      terms: [
        { name: 'Term 1', marks: 85, grade: 'A', maxMarks: 100 },
        { name: 'Mid-Term', marks: 82, grade: 'A', maxMarks: 100 },
        { name: 'Term 2', marks: 87, grade: 'A', maxMarks: 100 },
      ],
      average: 84.7,
      finalGrade: 'A'
    },
    {
      name: 'History',
      code: 'HIS101',
      credits: 3,
      terms: [
        { name: 'Term 1', marks: 90, grade: 'A', maxMarks: 100 },
        { name: 'Mid-Term', marks: 88, grade: 'A', maxMarks: 100 },
        { name: 'Term 2', marks: 92, grade: 'A+', maxMarks: 100 },
      ],
      average: 90,
      finalGrade: 'A'
    },
    {
      name: 'Geography',
      code: 'GEO101',
      credits: 3,
      terms: [
        { name: 'Term 1', marks: 78, grade: 'B+', maxMarks: 100 },
        { name: 'Mid-Term', marks: 80, grade: 'A', maxMarks: 100 },
        { name: 'Term 2', marks: 82, grade: 'A', maxMarks: 100 },
      ],
      average: 80,
      finalGrade: 'A'
    },
  ]);

  const [historicalPerformance] = useState([
    { year: '2021-2022', gpa: 3.65, rank: 8 },
    { year: '2022-2023', gpa: 3.72, rank: 6 },
    { year: '2023-2024', gpa: 3.78, rank: 4 },
    { year: '2024-2025', gpa: 3.85, rank: 3 },
  ]);

  const getGradeClass = (grade) => {
    const gradeMap = {
      'A+': 'aplus',
      'A': 'a',
      'B+': 'bplus',
      'B': 'b',
      'C': 'c',
      'D': 'd',
      'F': 'f'
    };
    return gradeMap[grade] || 'default';
  };

  return (
    <div className="marks-history">
      <div className="marks-history__header">
        <button className="marks-history__back-btn" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div>
          <h1 className="marks-history__title">Marks History</h1>
          <p className="marks-history__subtitle">
            {student.name} • {student.class} • Roll No. {student.rollNo}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="marks-history__filters">
        <div className="marks-history__field">
          <label className="marks-history__label">Academic Year</label>
          <select
            className="marks-history__select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="2024-2025">2024-2025</option>
            <option value="2023-2024">2023-2024</option>
            <option value="2022-2023">2022-2023</option>
          </select>
        </div>
        <div className="marks-history__field">
          <label className="marks-history__label">Term</label>
          <select
            className="marks-history__select"
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
          >
            <option value="all">All Terms</option>
            <option value="term1">Term 1</option>
            <option value="midterm">Mid-Term</option>
            <option value="term2">Term 2</option>
            <option value="final">Final</option>
          </select>
        </div>
        <button className="marks-history__export-btn">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M14 10V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4.6665 6.66667L7.99984 10L11.3332 6.66667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 10V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Download Report
        </button>
      </div>

      {/* Summary */}
      <div className="marks-history__summary">
        <div className="marks-history__summary-card marks-history__summary-card--gpa">
          <span className="marks-history__summary-value">{summary.overallGPA}</span>
          <span className="marks-history__summary-label">Overall GPA</span>
          <div className="marks-history__summary-trend marks-history__summary-trend--up">
            ↑ {summary.improvementRate}%
          </div>
        </div>
        <div className="marks-history__summary-card">
          <span className="marks-history__summary-value">{summary.classRank}/{summary.totalStudents}</span>
          <span className="marks-history__summary-label">Class Rank</span>
        </div>
        <div className="marks-history__summary-card">
          <span className="marks-history__summary-value">{summary.totalCredits}</span>
          <span className="marks-history__summary-label">Credits Earned</span>
        </div>
        <div className="marks-history__summary-card">
          <span className="marks-history__summary-value">{subjects.length}</span>
          <span className="marks-history__summary-label">Subjects</span>
        </div>
      </div>

      {/* Subject-wise Marks */}
      <div className="marks-history__card">
        <h3 className="marks-history__card-title">Subject-wise Performance</h3>
        <div className="marks-history__subjects">
          {subjects.map((subject, index) => (
            <div key={index} className="marks-history__subject">
              <div className="marks-history__subject-header">
                <div>
                  <h4 className="marks-history__subject-name">{subject.name}</h4>
                  <span className="marks-history__subject-code">{subject.code} • {subject.credits} Credits</span>
                </div>
                <span className={`marks-history__final-grade marks-history__final-grade--${getGradeClass(subject.finalGrade)}`}>
                  {subject.finalGrade}
                </span>
              </div>
              <div className="marks-history__terms">
                {subject.terms.map((term, termIndex) => (
                  <div key={termIndex} className="marks-history__term">
                    <span className="marks-history__term-name">{term.name}</span>
                    <div className="marks-history__term-marks">
                      <div className="marks-history__progress-bar">
                        <div 
                          className="marks-history__progress-fill"
                          style={{ width: `${(term.marks / term.maxMarks) * 100}%` }}
                        ></div>
                      </div>
                      <span className="marks-history__term-score">{term.marks}/{term.maxMarks}</span>
                    </div>
                    <span className={`marks-history__term-grade marks-history__term-grade--${getGradeClass(term.grade)}`}>
                      {term.grade}
                    </span>
                  </div>
                ))}
              </div>
              <div className="marks-history__subject-footer">
                <span>Average: <strong>{subject.average}%</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Historical Performance */}
      <div className="marks-history__card">
        <h3 className="marks-history__card-title">Year-over-Year Performance</h3>
        <div className="marks-history__historical">
          {historicalPerformance.map((year, index) => (
            <div key={index} className="marks-history__year-card">
              <span className="marks-history__year-label">{year.year}</span>
              <div className="marks-history__year-stats">
                <div className="marks-history__year-stat">
                  <span className="marks-history__year-value">{year.gpa}</span>
                  <span className="marks-history__year-desc">GPA</span>
                </div>
                <div className="marks-history__year-stat">
                  <span className="marks-history__year-value">#{year.rank}</span>
                  <span className="marks-history__year-desc">Rank</span>
                </div>
              </div>
              {index < historicalPerformance.length - 1 && (
                <div className="marks-history__year-arrow">→</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="marks-history__actions">
        <button className="marks-history__btn" onClick={() => navigate(`/teacher/student-profile/${student.id}`)}>
          View Full Profile
        </button>
        <button className="marks-history__btn marks-history__btn--primary">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3.33333V12.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3.33337 8H12.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Generate Report Card
        </button>
      </div>
    </div>
  );
};

export default MarksHistory;
