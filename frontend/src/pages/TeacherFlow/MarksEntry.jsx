import { useState } from 'react';
import './MarksEntry.css';

const MarksEntry = () => {
  const [selectedGrade, setSelectedGrade] = useState('9A');
  const [selectedSubject, setSelectedSubject] = useState('Chemistry');
  const [selectedExamType, setSelectedExamType] = useState('Mid Semester');
  const [totalMarks, setTotalMarks] = useState('100');
  const [currentPage, setCurrentPage] = useState(1);

  // Sample student data with marks (6 students as shown in design)
  const [students, setStudents] = useState([
    { id: 24573, name: 'John Doe', marks: 87 },
    { id: 24574, name: 'Jane Smith', marks: 87 },
    { id: 24575, name: 'Emily Johnson', marks: 87 },
    { id: 24576, name: 'Michael Brown', marks: 87 },
    { id: 24577, name: 'Chris Davis', marks: 87 },
    { id: 24578, name: 'Sarah Wilson', marks: 87 }
  ]);

  const handleMarksChange = (studentId, value) => {
    const numValue = value === '' ? '' : Math.max(0, Math.min(parseInt(value) || 0, parseInt(totalMarks)));
    setStudents(prev => prev.map(student =>
      student.id === studentId ? { ...student, marks: numValue } : student
    ));
  };

  const handleSubmit = () => {
    // TODO: Add API call to submit marks
    // await api.marks.submit(selectedGrade, selectedSubject, students);
    alert('Marks submitted successfully!');
  };

  return (
    <div className="marks-entry">
      <div className="marks-entry__title-container">
        <h1 className="marks-entry__title">Marks Entry</h1>
      </div>

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
              <option value="9A">9A</option>
              <option value="9B">9B</option>
              <option value="10A">10A</option>
              <option value="10B">10B</option>
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
              <option value="Chemistry">Chemistry</option>
              <option value="Physics">Physics</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Biology">Biology</option>
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
              <option value="Mid Semester">Mid Semester</option>
              <option value="Final Exam">Final Exam</option>
              <option value="Unit Test">Unit Test</option>
              <option value="Quarterly">Quarterly</option>
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

        {/* Table */}
        <div className="marks-entry__table-wrapper">
          <div className="marks-entry__table">
            {/* Header */}
            <div className="marks-entry__table-header">
              <div className="marks-entry__header-content">
                <div className="marks-entry__header-left">
                  <span className="marks-entry__header-text">Id</span>
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
                        <span className="marks-entry__student-id">{student.id}</span>
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

        {/* Footer Actions */}
        <div className="marks-entry__footer">
          <button className="marks-entry__submit-btn" onClick={handleSubmit}>
            Submit Marks
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
            <button className="marks-entry__page-btn marks-entry__page-btn--active">
              1
            </button>
            <button className="marks-entry__page-btn" onClick={() => setCurrentPage(2)}>
              2
            </button>
            <button className="marks-entry__page-btn marks-entry__page-btn--ellipsis">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="4" cy="8" r="1" fill="#1F55A6"/>
                <circle cx="8" cy="8" r="1" fill="#1F55A6"/>
                <circle cx="12" cy="8" r="1" fill="#1F55A6"/>
              </svg>
            </button>
            <button className="marks-entry__page-btn" onClick={() => setCurrentPage(10)}>
              10
            </button>
            <button
              className="marks-entry__page-btn marks-entry__page-btn--next"
              onClick={() => setCurrentPage(prev => prev + 1)}
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
