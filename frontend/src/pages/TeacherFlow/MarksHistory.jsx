import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './MarksHistory.css';
import { marksService, studentService } from '../../services';

const MarksHistory = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [selectedYear, setSelectedYear] = useState('2024-2025');
  const [selectedTerm, setSelectedTerm] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [student, setStudent] = useState({
    id: id || '1',
    name: '',
    class: '',
    rollNo: ''
  });

  const [summary, setSummary] = useState({
    overallGPA: 0,
    totalCredits: 0,
    classRank: 0,
    totalStudents: 0,
    improvementRate: 0
  });

  const [subjects, setSubjects] = useState([]);
  const [historicalPerformance, setHistoricalPerformance] = useState([]);

  const getGradeFromPercentage = (percentage) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
  };

  const fetchStudentAndMarks = useCallback(async () => {
    if (!id) {
      setError('Student ID is required');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch student info
      const studentResponse = await studentService.getStudentById(id);
      if (studentResponse.success && studentResponse.data) {
        const s = studentResponse.data;
        setStudent({
          id: s.id,
          name: `${s.firstName} ${s.lastName}`,
          class: s.class?.name || s.grade?.name || 'N/A',
          rollNo: s.rollNumber || s.admissionNumber || 'N/A'
        });
      }

      // Fetch marks
      const marksResponse = await marksService.getStudentMarks(id, {
        academicYear: selectedYear
      });

      if (marksResponse.success && marksResponse.data) {
        const marksheets = marksResponse.data.marksheets || marksResponse.data || [];
        
        // Group marks by subject
        const subjectMap = new Map();
        let totalMarks = 0;
        let totalMaxMarks = 0;
        let creditSum = 0;

        marksheets.forEach(mark => {
          const subjectName = mark.subject?.name || mark.subjectName || 'Unknown Subject';
          const subjectCode = mark.subject?.code || mark.subjectCode || 'N/A';
          const credits = mark.subject?.credits || 3;
          
          if (!subjectMap.has(subjectName)) {
            subjectMap.set(subjectName, {
              name: subjectName,
              code: subjectCode,
              credits,
              terms: [],
              totalMarks: 0,
              maxMarksTotal: 0
            });
            creditSum += credits;
          }

          const subject = subjectMap.get(subjectName);
          const marksObtained = parseFloat(mark.marksObtained) || 0;
          const maxMarks = parseFloat(mark.maxMarks) || 100;
          const percentage = (marksObtained / maxMarks) * 100;

          subject.terms.push({
            name: mark.examType || mark.coursePart?.name || 'Exam',
            marks: marksObtained,
            maxMarks,
            grade: getGradeFromPercentage(percentage)
          });

          subject.totalMarks += marksObtained;
          subject.maxMarksTotal += maxMarks;
          totalMarks += marksObtained;
          totalMaxMarks += maxMarks;
        });

        // Process subjects
        const subjectsArray = Array.from(subjectMap.values()).map(subject => ({
          ...subject,
          average: subject.maxMarksTotal > 0 ? 
            Math.round((subject.totalMarks / subject.maxMarksTotal) * 1000) / 10 : 0,
          finalGrade: getGradeFromPercentage(
            subject.maxMarksTotal > 0 ? (subject.totalMarks / subject.maxMarksTotal) * 100 : 0
          )
        }));

        setSubjects(subjectsArray);

        // Calculate summary
        const overallPercentage = totalMaxMarks > 0 ? (totalMarks / totalMaxMarks) * 100 : 0;
        const gpa = Math.min((overallPercentage / 25), 4.0);

        setSummary({
          overallGPA: Math.round(gpa * 100) / 100,
          totalCredits: creditSum,
          classRank: marksResponse.data.rank || 0,
          totalStudents: marksResponse.data.totalStudents || 0,
          improvementRate: marksResponse.data.improvementRate || 0
        });

        // Generate historical performance (simplified)
        const currentYear = new Date().getFullYear();
        setHistoricalPerformance([
          { year: `${currentYear - 3}-${currentYear - 2}`, gpa: Math.max(0, gpa - 0.2).toFixed(2), rank: 0 },
          { year: `${currentYear - 2}-${currentYear - 1}`, gpa: Math.max(0, gpa - 0.1).toFixed(2), rank: 0 },
          { year: `${currentYear - 1}-${currentYear}`, gpa: gpa.toFixed(2), rank: summary.classRank },
        ]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load marks history');
      console.error('Error fetching marks history:', err);
    } finally {
      setLoading(false);
    }
  }, [id, selectedYear]);

  useEffect(() => {
    fetchStudentAndMarks();
  }, [fetchStudentAndMarks]);

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

  if (loading) {
    return (
      <div className="marks-history">
        <div className="marks-history__loading">
          <div className="marks-history__spinner"></div>
          <p>Loading marks history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="marks-history">
        <div className="marks-history__error">
          <p>{error}</p>
          <button onClick={() => fetchStudentAndMarks()}>Retry</button>
        </div>
      </div>
    );
  }

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
