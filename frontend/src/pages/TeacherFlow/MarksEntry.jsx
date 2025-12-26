import { useState, useEffect, useCallback } from 'react';
import './MarksEntry.css';
import { studentService, marksService } from '../../services';

const MarksEntry = () => {
  const [selectedGrade, setSelectedGrade] = useState('9A');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedExamType, setSelectedExamType] = useState('Mid Semester');
  const [totalMarks, setTotalMarks] = useState('100');
  const [currentPage, setCurrentPage] = useState(1);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  
  // Subject options - could be fetched from API in the future
  const subjects = [
    { id: 'chemistry', name: 'Chemistry' },
    { id: 'physics', name: 'Physics' },
    { id: 'mathematics', name: 'Mathematics' },
    { id: 'biology', name: 'Biology' },
    { id: 'english', name: 'English' },
    { id: 'history', name: 'History' },
  ];

  const examTypes = ['Mid Semester', 'Final Exam', 'Unit Test', 'Quarterly'];

  // Fetch students when grade changes
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Parse grade and section from selectedGrade (e.g., "9A" -> class: "9", section: "A")
      const gradeMatch = selectedGrade.match(/^(\d+)([A-Za-z]?)$/);
      const classNum = gradeMatch ? gradeMatch[1] : selectedGrade;
      const section = gradeMatch && gradeMatch[2] ? gradeMatch[2] : '';

      const response = await studentService.getStudents({ 
        class: classNum, 
        section: section,
        page: currentPage,
        limit: 20
      });
      
      if (response.success && response.data) {
        const studentList = response.data.students || response.data || [];
        
        // Map students with initial marks
        const studentsWithMarks = studentList.map(student => ({
          id: student.id,
          name: student.user?.name || `${student.user?.firstName || ''} ${student.user?.lastName || ''}`.trim() || 'Unknown',
          enrollmentNumber: student.enrollmentNumber,
          marks: ''
        }));

        setStudents(studentsWithMarks);
        setPagination({
          total: response.data.pagination?.total || studentList.length,
          totalPages: response.data.pagination?.totalPages || 1
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch students');
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedGrade, currentPage]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Set default subject on mount
  useEffect(() => {
    if (subjects.length > 0 && !selectedSubject) {
      setSelectedSubject(subjects[0].id);
    }
  }, []);

  const handleMarksChange = (studentId, value) => {
    const numValue = value === '' ? '' : Math.max(0, Math.min(parseInt(value) || 0, parseInt(totalMarks)));
    setStudents(prev => prev.map(student =>
      student.id === studentId ? { ...student, marks: numValue } : student
    ));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    setSuccessMessage('');

    try {
      // Parse grade and section
      const gradeMatch = selectedGrade.match(/^(\d+)([A-Za-z]?)$/);
      const classNum = gradeMatch ? gradeMatch[1] : selectedGrade;
      const section = gradeMatch && gradeMatch[2] ? gradeMatch[2] : '';

      // Collect marks data
      const marksData = students
        .filter(s => s.marks !== '' && s.marks !== null)
        .map(student => ({
          studentId: student.id,
          subjectId: selectedSubject,
          marksObtained: parseInt(student.marks),
          maxMarks: parseInt(totalMarks),
          examType: selectedExamType,
          class: classNum,
          section: section
        }));

      if (marksData.length === 0) {
        setError('Please enter marks for at least one student.');
        setSubmitting(false);
        return;
      }

      const response = await marksService.enterMarks({
        subjectId: selectedSubject,
        examType: selectedExamType,
        marks: marksData
      });

      if (response.success) {
        setSuccessMessage('Marks submitted successfully!');
        // Clear marks after successful submission
        setStudents(prev => prev.map(s => ({ ...s, marks: '' })));
      } else {
        setError(response.message || 'Failed to submit marks');
      }
    } catch (err) {
      setError(err.message || 'Failed to submit marks');
      console.error('Error submitting marks:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="marks-entry">
      <div className="marks-entry__title-container">
        <h1 className="marks-entry__title">Marks Entry</h1>
      </div>

      {error && (
        <div className="marks-entry__error">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {successMessage && (
        <div className="marks-entry__success">
          {successMessage}
          <button onClick={() => setSuccessMessage('')}>×</button>
        </div>
      )}

      <div className="marks-entry__card">
        {/* Filters Row */}
        <div className="marks-entry__filters">
          <div className="marks-entry__field">
            <label className="marks-entry__label">Grade/Class</label>
            <select
              className="marks-entry__select"
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
            >
              <option value="7A">7A</option>
              <option value="7B">7B</option>
              <option value="8A">8A</option>
              <option value="8B">8B</option>
              <option value="9A">9A</option>
              <option value="9B">9B</option>
              <option value="10A">10A</option>
              <option value="10B">10B</option>
              <option value="11A">11A</option>
              <option value="11B">11B</option>
              <option value="12A">12A</option>
              <option value="12B">12B</option>
            </select>
            <svg className="marks-entry__dropdown-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M6 9L12 15L18 9" stroke="#8D8D8D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <div className="marks-entry__field">
            <label className="marks-entry__label">Subject</label>
            <select
              className="marks-entry__select"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
            <svg className="marks-entry__dropdown-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M6 9L12 15L18 9" stroke="#8D8D8D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <div className="marks-entry__field">
            <label className="marks-entry__label">Exam Type</label>
            <select
              className="marks-entry__select"
              value={selectedExamType}
              onChange={(e) => setSelectedExamType(e.target.value)}
            >
              {examTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <svg className="marks-entry__dropdown-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M6 9L12 15L18 9" stroke="#8D8D8D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <div className="marks-entry__field">
            <label className="marks-entry__label">Total Marks</label>
            <select
              className="marks-entry__select"
              value={totalMarks}
              onChange={(e) => setTotalMarks(e.target.value)}
            >
              <option value="100">100</option>
              <option value="50">50</option>
              <option value="75">75</option>
              <option value="150">150</option>
            </select>
            <svg className="marks-entry__dropdown-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M6 9L12 15L18 9" stroke="#8D8D8D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="marks-entry__loading">
            <div className="marks-entry__spinner"></div>
            <p>Loading students...</p>
          </div>
        )}

        {/* No Students Message */}
        {!loading && students.length === 0 && (
          <div className="marks-entry__empty">
            <p>No students found for the selected class. Please select a different grade/class.</p>
          </div>
        )}

        {/* Table */}
        {!loading && students.length > 0 && (
          <div className="marks-entry__table-wrapper">
            <div className="marks-entry__table">
              {/* Header */}
              <div className="marks-entry__table-header">
                <div className="marks-entry__header-content">
                  <div className="marks-entry__header-left">
                    <span className="marks-entry__header-text">ID</span>
                    <span className="marks-entry__header-text">Student Name</span>
                  </div>
                  <span className="marks-entry__header-text marks-entry__header-text--right">Mark Entry</span>
                </div>
              </div>

              {/* Body */}
              <div className="marks-entry__table-body">
                {students.map((student, index) => (
                  <div key={student.id}>
                    <div className="marks-entry__table-row">
                      <div className="marks-entry__row-content">
                        <div className="marks-entry__student-info">
                          <span className="marks-entry__student-id">{student.enrollmentNumber || student.id.substring(0, 8)}</span>
                          <span className="marks-entry__student-name">{student.name}</span>
                        </div>
                        <div className="marks-entry__marks-input-wrapper">
                          <input
                            type="number"
                            className="marks-entry__marks-input"
                            value={student.marks}
                            onChange={(e) => handleMarksChange(student.id, e.target.value)}
                            min="0"
                            max={totalMarks}
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                    {index < students.length - 1 && (
                      <div className="marks-entry__divider"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="marks-entry__footer">
          <button 
            className="marks-entry__submit-btn" 
            onClick={handleSubmit}
            disabled={submitting || students.length === 0}
          >
            {submitting ? 'Submitting...' : 'Submit Marks'}
          </button>

          <div className="marks-entry__pagination">
            <button
              className="marks-entry__page-btn marks-entry__page-btn--prev"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 12L6 8L10 4" stroke="#1F55A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                className={`marks-entry__page-btn ${currentPage === page ? 'marks-entry__page-btn--active' : ''}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
            {pagination.totalPages > 5 && (
              <>
                <button className="marks-entry__page-btn marks-entry__page-btn--ellipsis">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="4" cy="8" r="1" fill="#1F55A6"/>
                    <circle cx="8" cy="8" r="1" fill="#1F55A6"/>
                    <circle cx="12" cy="8" r="1" fill="#1F55A6"/>
                  </svg>
                </button>
                <button 
                  className="marks-entry__page-btn" 
                  onClick={() => setCurrentPage(pagination.totalPages)}
                >
                  {pagination.totalPages}
                </button>
              </>
            )}
            <button
              className="marks-entry__page-btn marks-entry__page-btn--next"
              disabled={currentPage >= pagination.totalPages}
              onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 12L10 8L6 4" stroke="#1F55A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="marks-entry__help-links">
        <a href="#" className="marks-entry__help-link">Need Help?</a>
        <a href="#" className="marks-entry__help-link">Contact Support</a>
      </div>
    </div>
  );
};

export default MarksEntry;
