import { useState } from 'react';
import './AttendanceEntry.css';

const AttendanceEntry = () => {
  const [selectedGrade, setSelectedGrade] = useState('9A');
  const [selectedDate, setSelectedDate] = useState('Nov 7, 2024');
  const [viewMode, setViewMode] = useState('week'); // day, week, month
  const [currentPage, setCurrentPage] = useState(1);

  // Sample student data with weekly attendance (7 students as shown in design)
  const [students, setStudents] = useState([
    {
      id: 24573,
      name: 'John Doe',
      attendance: {
        'Mon, Nov 1': 'present',
        'Tue, Nov 2': 'present',
        'Wed, Nov 3': 'present',
        'Thu, Nov 4': 'absent',
        'Fri, Nov 5': 'both',
        'Sat, Nov 6': 'both',
        'Sun, Nov 7': null
      }
    },
    {
      id: 24574,
      name: 'Jane Smith',
      attendance: {
        'Mon, Nov 1': 'present',
        'Tue, Nov 2': 'present',
        'Wed, Nov 3': 'present',
        'Thu, Nov 4': 'present',
        'Fri, Nov 5': 'both',
        'Sat, Nov 6': 'both',
        'Sun, Nov 7': null
      }
    },
    {
      id: 24575,
      name: 'Emily Johnson',
      attendance: {
        'Mon, Nov 1': 'present',
        'Tue, Nov 2': 'present',
        'Wed, Nov 3': 'present',
        'Thu, Nov 4': 'present',
        'Fri, Nov 5': 'both',
        'Sat, Nov 6': 'both',
        'Sun, Nov 7': null
      }
    },
    {
      id: 24576,
      name: 'Michael Brown',
      attendance: {
        'Mon, Nov 1': 'present',
        'Tue, Nov 2': 'absent',
        'Wed, Nov 3': 'present',
        'Thu, Nov 4': 'present',
        'Fri, Nov 5': 'both',
        'Sat, Nov 6': 'both',
        'Sun, Nov 7': null
      }
    },
    {
      id: 24577,
      name: 'Chris Davis',
      attendance: {
        'Mon, Nov 1': 'present',
        'Tue, Nov 2': 'present',
        'Wed, Nov 3': 'present',
        'Thu, Nov 4': 'present',
        'Fri, Nov 5': 'both',
        'Sat, Nov 6': 'both',
        'Sun, Nov 7': null
      }
    },
    {
      id: 24578,
      name: 'Sarah Wilson',
      attendance: {
        'Mon, Nov 1': 'present',
        'Tue, Nov 2': 'present',
        'Wed, Nov 3': 'present',
        'Thu, Nov 4': 'present',
        'Fri, Nov 5': 'both',
        'Sat, Nov 6': 'both',
        'Sun, Nov 7': null
      }
    },
    {
      id: 24579,
      name: 'David Lee',
      attendance: {
        'Mon, Nov 1': 'absent',
        'Tue, Nov 2': 'present',
        'Wed, Nov 3': 'present',
        'Thu, Nov 4': 'present',
        'Fri, Nov 5': 'both',
        'Sat, Nov 6': 'both',
        'Sun, Nov 7': null
      }
    }
  ]);

  const weekDays = [
    'Mon, Nov 1',
    'Tue, Nov 2',
    'Wed, Nov 3',
    'Thu, Nov 4',
    'Fri, Nov 5',
    'Sat, Nov 6',
    'Sun, Nov 7'
  ];

  const toggleAttendance = (studentId, day, type) => {
    setStudents(prev => prev.map(student => {
      if (student.id === studentId) {
        const currentStatus = student.attendance[day];
        let newStatus;

        if (type === 'present') {
          if (currentStatus === 'present') {
            newStatus = null;
          } else if (currentStatus === 'absent') {
            newStatus = 'both';
          } else if (currentStatus === 'both') {
            newStatus = 'absent';
          } else {
            newStatus = 'present';
          }
        } else if (type === 'absent') {
          if (currentStatus === 'absent') {
            newStatus = null;
          } else if (currentStatus === 'present') {
            newStatus = 'both';
          } else if (currentStatus === 'both') {
            newStatus = 'present';
          } else {
            newStatus = 'absent';
          }
        }

        return {
          ...student,
          attendance: {
            ...student.attendance,
            [day]: newStatus
          }
        };
      }
      return student;
    }));
  };

  const handleSubmit = () => {
    // TODO: Add API call to submit attendance
    // await api.attendance.submit(selectedGrade, selectedSubject, students);
    alert('Attendance submitted successfully!');
  };

  const renderAttendanceCell = (student, day) => {
    const status = student.attendance[day];

    if (status === null || day === 'Sun, Nov 7') {
      return (
        <div className="attendance-entry__cell-content">
          <span className="attendance-entry__dash">-</span>
        </div>
      );
    }

    if (status === 'both') {
      return (
        <div className="attendance-entry__cell-content attendance-entry__cell-content--both">
          <button
            className="attendance-entry__status-icon attendance-entry__status-icon--present"
            onClick={() => toggleAttendance(student.id, day, 'present')}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17L4 12" stroke="#1F55A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            className="attendance-entry__status-icon attendance-entry__status-icon--absent"
            onClick={() => toggleAttendance(student.id, day, 'absent')}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="#E00000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      );
    }

    if (status === 'present') {
      return (
        <div className="attendance-entry__cell-content">
          <button
            className="attendance-entry__status-icon attendance-entry__status-icon--present"
            onClick={() => toggleAttendance(student.id, day, 'present')}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17L4 12" stroke="#1F55A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      );
    }

    if (status === 'absent') {
      return (
        <div className="attendance-entry__cell-content">
          <button
            className="attendance-entry__status-icon attendance-entry__status-icon--absent"
            onClick={() => toggleAttendance(student.id, day, 'absent')}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="#E00000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      );
    }
  };

  return (
    <div className="attendance-entry">
      <div className="attendance-entry__title-container">
        <h1 className="attendance-entry__title">Attendance Entry</h1>
      </div>

      <div className="attendance-entry__card">
        {/* Controls Row */}
        <div className="attendance-entry__controls">
          <div className="attendance-entry__filters">
            <div className="attendance-entry__field">
              <label className="attendance-entry__label">Grade/Class</label>
              <select
                className="attendance-entry__select"
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
              >
                <option value="9A">9A</option>
                <option value="9B">9B</option>
                <option value="10A">10A</option>
                <option value="10B">10B</option>
              </select>
              <svg className="attendance-entry__dropdown-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M6 9L12 15L18 9" stroke="#8D8D8D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            <div className="attendance-entry__field">
              <label className="attendance-entry__label">Select Date</label>
              <input
                type="text"
                className="attendance-entry__date-input"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
              <svg className="attendance-entry__calendar-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="#1F55A6" strokeWidth="2" fill="none"/>
                <path d="M16 2V6M8 2V6M3 10H21" stroke="#1F55A6" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
          </div>

          <div className="attendance-entry__view-toggle">
            <button
              className={`attendance-entry__view-btn attendance-entry__view-btn--left ${viewMode === 'day' ? '' : ''}`}
              onClick={() => setViewMode('day')}
            >
              Day
            </button>
            <button
              className={`attendance-entry__view-btn attendance-entry__view-btn--middle ${viewMode === 'week' ? 'attendance-entry__view-btn--active' : ''}`}
              onClick={() => setViewMode('week')}
            >
              Week
            </button>
            <button
              className={`attendance-entry__view-btn attendance-entry__view-btn--right ${viewMode === 'month' ? '' : ''}`}
              onClick={() => setViewMode('month')}
            >
              Month
            </button>
          </div>
        </div>

        {/* Attendance Grid */}
        <div className="attendance-entry__grid-wrapper">
          <div className="attendance-entry__grid">
            {/* Left Column - Student Names */}
            <div className="attendance-entry__students-column">
              <div className="attendance-entry__header-cell">
                <div className="attendance-entry__header-content">
                  <span className="attendance-entry__header-text">Id</span>
                  <span className="attendance-entry__header-text">Student Name</span>
                </div>
              </div>
              <div className="attendance-entry__students-body">
                {students.map((student, index) => (
                  <div key={student.id}>
                    <div className="attendance-entry__student-row">
                      <span className="attendance-entry__student-id">{student.id}</span>
                      <span className="attendance-entry__student-name">{student.name}</span>
                    </div>
                    {index < students.length - 1 && (
                      <div className="attendance-entry__divider"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column - Attendance Days */}
            <div className="attendance-entry__days-column">
              <div className="attendance-entry__header-cell attendance-entry__header-cell--days">
                <div className="attendance-entry__header-content attendance-entry__header-content--days">
                  {weekDays.map((day) => (
                    <span
                      key={day}
                      className={`attendance-entry__day-header ${day === 'Thu, Nov 4' ? 'attendance-entry__day-header--active' : ''}`}
                    >
                      {day}
                    </span>
                  ))}
                </div>
              </div>
              <div className="attendance-entry__days-body">
                {students.map((student, studentIndex) => (
                  <div key={student.id}>
                    <div className="attendance-entry__attendance-row">
                      {weekDays.map((day) => (
                        <div key={day} className="attendance-entry__attendance-cell">
                          {renderAttendanceCell(student, day)}
                        </div>
                      ))}
                    </div>
                    {studentIndex < students.length - 1 && (
                      <div className="attendance-entry__divider"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="attendance-entry__footer">
          <button className="attendance-entry__submit-btn" onClick={handleSubmit}>
            Submit Attendance
          </button>

          <div className="attendance-entry__pagination">
            <button
              className="attendance-entry__page-btn attendance-entry__page-btn--prev"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 12L6 8L10 4" stroke="#1F55A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className="attendance-entry__page-btn attendance-entry__page-btn--active">
              1
            </button>
            <button className="attendance-entry__page-btn" onClick={() => setCurrentPage(2)}>
              2
            </button>
            <button className="attendance-entry__page-btn attendance-entry__page-btn--ellipsis">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="4" cy="8" r="1" fill="#1F55A6"/>
                <circle cx="8" cy="8" r="1" fill="#1F55A6"/>
                <circle cx="12" cy="8" r="1" fill="#1F55A6"/>
              </svg>
            </button>
            <button className="attendance-entry__page-btn" onClick={() => setCurrentPage(10)}>
              10
            </button>
            <button
              className="attendance-entry__page-btn attendance-entry__page-btn--next"
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 12L10 8L6 4" stroke="#1F55A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="attendance-entry__help-links">
        <a href="#" className="attendance-entry__help-link">Need Help?</a>
        <a href="#" className="attendance-entry__help-link">Contact Support</a>
      </div>
    </div>
  );
};

export default AttendanceEntry;
