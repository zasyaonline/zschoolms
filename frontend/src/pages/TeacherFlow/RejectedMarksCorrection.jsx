import { useState } from 'react';
import './RejectedMarksCorrection.css';

const RejectedMarksCorrection = () => {
  const [selectedGrade, setSelectedGrade] = useState('9A');
  const [selectedSubject, setSelectedSubject] = useState('Chemistry');
  const [currentPage, setCurrentPage] = useState(1);

  // Sample student data with rejection reasons (6 students as shown in design)
  const [students, setStudents] = useState([
    { 
      id: 24573, 
      name: 'John Doe', 
      grade: '9A', 
      subject: 'Chemistry',
      reason: 'Lorem ipsum dolor sit amet consectetur.',
      originalMarks: 89,
      correctedMarks: 85
    },
    { 
      id: 24574, 
      name: 'Jane Smith', 
      grade: '9B', 
      subject: 'Biology',
      reason: 'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      originalMarks: 92,
      correctedMarks: 88
    },
    { 
      id: 24575, 
      name: 'Emily Johnson', 
      grade: '9C', 
      subject: 'Mathematics',
      reason: 'Ut enim ad minim veniam quis nostrud exercitation ullamco.',
      originalMarks: 95,
      correctedMarks: 90
    },
    { 
      id: 24576, 
      name: 'Michael Brown', 
      grade: '9D', 
      subject: 'Physics',
      reason: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
      originalMarks: 88,
      correctedMarks: 91
    },
    { 
      id: 24577, 
      name: 'Sarah Davis', 
      grade: '9E', 
      subject: 'Literature',
      reason: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui.',
      originalMarks: 85,
      correctedMarks: 87
    },
    { 
      id: 24578, 
      name: 'David Wilson', 
      grade: '9F', 
      subject: 'History',
      reason: 'Curabitur pretium tincidunt lacus.',
      originalMarks: 90,
      correctedMarks: 93
    }
  ]);

  const handleMarksChange = (studentId, value) => {
    const numValue = value === '' ? '' : Math.max(0, Math.min(parseInt(value) || 0, 100));
    setStudents(prev => prev.map(student =>
      student.id === studentId ? { ...student, correctedMarks: numValue } : student
    ));
  };

  const handleSubmit = () => {
    // TODO: Add API call to resubmit corrected marks
    // await api.marks.resubmit(selectedGrade, selectedSubject, students);
    alert('Marks resubmitted successfully!');
  };

  return (
    <div className="rejected-marks-correction">
      <div className="rejected-marks-correction__title-container">
        <h1 className="rejected-marks-correction__title">Rejected Marks Correction</h1>
      </div>

      <div className="rejected-marks-correction__card">
        {/* Filters Row */}
        <div className="rejected-marks-correction__filters">
          <div className="rejected-marks-correction__field">
            <label className="rejected-marks-correction__label">Grade/Class</label>
            <select
              className="rejected-marks-correction__select"
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
            >
              <option value="9A">9A</option>
              <option value="9B">9B</option>
              <option value="9C">9C</option>
              <option value="9D">9D</option>
            </select>
            <svg className="rejected-marks-correction__dropdown-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M6 9L12 15L18 9" stroke="#8D8D8D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <div className="rejected-marks-correction__field">
            <label className="rejected-marks-correction__label">Subject</label>
            <select
              className="rejected-marks-correction__select"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              <option value="Chemistry">Chemistry</option>
              <option value="Biology">Biology</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Physics">Physics</option>
            </select>
            <svg className="rejected-marks-correction__dropdown-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M6 9L12 15L18 9" stroke="#8D8D8D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* Table */}
        <div className="rejected-marks-correction__table-wrapper">
          <div className="rejected-marks-correction__table">
            {/* Header */}
            <div className="rejected-marks-correction__table-header">
              <div className="rejected-marks-correction__header-content">
                <span className="rejected-marks-correction__header-text rejected-marks-correction__header-id">Id</span>
                <span className="rejected-marks-correction__header-text rejected-marks-correction__header-name">Student Name</span>
                <span className="rejected-marks-correction__header-text rejected-marks-correction__header-grade">Grade/Class</span>
                <span className="rejected-marks-correction__header-text rejected-marks-correction__header-subject">Subject</span>
                <span className="rejected-marks-correction__header-text rejected-marks-correction__header-reason">Reason for Correction</span>
                <span className="rejected-marks-correction__header-text rejected-marks-correction__header-marks">Marks</span>
                <span className="rejected-marks-correction__header-text rejected-marks-correction__header-reenter">Re-enter Marks</span>
              </div>
            </div>

            {/* Body */}
            <div className="rejected-marks-correction__table-body">
              {students.map((student, index) => (
                <div key={student.id}>
                  <div className="rejected-marks-correction__table-row">
                    <div className="rejected-marks-correction__row-content">
                      <span className="rejected-marks-correction__cell rejected-marks-correction__cell-id">{student.id}</span>
                      <span className="rejected-marks-correction__cell rejected-marks-correction__cell-name">{student.name}</span>
                      <span className="rejected-marks-correction__cell rejected-marks-correction__cell-grade">{student.grade}</span>
                      <span className="rejected-marks-correction__cell rejected-marks-correction__cell-subject">{student.subject}</span>
                      <span className="rejected-marks-correction__cell rejected-marks-correction__cell-reason">{student.reason}</span>
                      <div className="rejected-marks-correction__cell rejected-marks-correction__cell-marks">
                        <div className="rejected-marks-correction__marks-display">
                          {student.originalMarks}
                        </div>
                      </div>
                      <div className="rejected-marks-correction__cell rejected-marks-correction__cell-reenter">
                        <input
                          type="number"
                          className="rejected-marks-correction__marks-input"
                          value={student.correctedMarks}
                          onChange={(e) => handleMarksChange(student.id, e.target.value)}
                          min="0"
                          max="100"
                        />
                      </div>
                    </div>
                  </div>
                  {index < students.length - 1 && (
                    <div className="rejected-marks-correction__divider"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="rejected-marks-correction__footer">
          <button className="rejected-marks-correction__submit-btn" onClick={handleSubmit}>
            Resubmit Marks
          </button>

          <div className="rejected-marks-correction__pagination">
            <button
              className="rejected-marks-correction__page-btn rejected-marks-correction__page-btn--prev rejected-marks-correction__page-btn--disabled"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 12L6 8L10 4" stroke="#1F55A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className="rejected-marks-correction__page-btn rejected-marks-correction__page-btn--active">
              1
            </button>
            <button className="rejected-marks-correction__page-btn" onClick={() => setCurrentPage(2)}>
              2
            </button>
            <button className="rejected-marks-correction__page-btn rejected-marks-correction__page-btn--ellipsis">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="4" cy="8" r="1" fill="#1F55A6"/>
                <circle cx="8" cy="8" r="1" fill="#1F55A6"/>
                <circle cx="12" cy="8" r="1" fill="#1F55A6"/>
              </svg>
            </button>
            <button className="rejected-marks-correction__page-btn" onClick={() => setCurrentPage(10)}>
              10
            </button>
            <button
              className="rejected-marks-correction__page-btn rejected-marks-correction__page-btn--next"
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 12L10 8L6 4" stroke="#1F55A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="rejected-marks-correction__help-links">
        <a href="#" className="rejected-marks-correction__help-link">Need Help?</a>
        <a href="#" className="rejected-marks-correction__help-link">Contact Support</a>
      </div>
    </div>
  );
};

export default RejectedMarksCorrection;
