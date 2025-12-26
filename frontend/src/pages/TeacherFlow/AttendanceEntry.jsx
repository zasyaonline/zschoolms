import { useState, useEffect, useCallback } from 'react';
import './AttendanceEntry.css';
import { studentService, attendanceService } from '../../services';

const AttendanceEntry = () => {
  const [selectedGrade, setSelectedGrade] = useState('9A');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // YYYY-MM-DD format
  });
  const [viewMode, setViewMode] = useState('week');
  const [currentPage, setCurrentPage] = useState(1);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Generate week days based on selected date
  const getWeekDays = useCallback((dateStr) => {
    const date = new Date(dateStr);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    const monday = new Date(date.setDate(diff));
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push({
        date: d.toISOString().split('T')[0],
        display: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        isToday: d.toISOString().split('T')[0] === new Date().toISOString().split('T')[0]
      });
    }
    return days;
  }, []);

  const [weekDays, setWeekDays] = useState(() => getWeekDays(new Date().toISOString().split('T')[0]));

  // Fetch students when grade/section changes
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Parse grade and section from selectedGrade (e.g., "9A" -> class: "9", section: "A")
      const gradeMatch = selectedGrade.match(/^(\d+)([A-Za-z]?)$/);
      const classNum = gradeMatch ? gradeMatch[1] : selectedGrade;
      const section = gradeMatch && gradeMatch[2] ? gradeMatch[2] : selectedSection;

      // Fetch students by class
      const response = await studentService.getStudents({ 
        class: classNum, 
        section: section,
        page: currentPage,
        limit: 20
      });
      
      if (response.success && response.data) {
        const studentList = response.data.students || response.data || [];
        
        // Fetch existing attendance for the week
        const attendanceResponse = await attendanceService.getAttendance({
          class: classNum,
          section: section,
          startDate: weekDays[0]?.date,
          endDate: weekDays[6]?.date
        });

        const attendanceRecords = attendanceResponse.success ? 
          (attendanceResponse.data?.records || []) : [];

        // Map attendance to students
        const studentsWithAttendance = studentList.map(student => {
          const attendance = {};
          weekDays.forEach(day => {
            const record = attendanceRecords.find(
              r => r.studentId === student.id && r.date === day.date
            );
            attendance[day.date] = record ? record.status : null;
          });
          return {
            id: student.id,
            name: student.user?.name || `${student.user?.firstName || ''} ${student.user?.lastName || ''}`.trim() || 'Unknown',
            enrollmentNumber: student.enrollmentNumber,
            attendance
          };
        });

        setStudents(studentsWithAttendance);
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
  }, [selectedGrade, selectedSection, currentPage, weekDays]);

  // Update week days when date changes
  useEffect(() => {
    setWeekDays(getWeekDays(selectedDate));
  }, [selectedDate, getWeekDays]);

  // Fetch students when filters change
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const toggleAttendance = (studentId, date, type) => {
    setStudents(prev => prev.map(student => {
      if (student.id === studentId) {
        const currentStatus = student.attendance[date];
        let newStatus;

        if (type === 'present') {
          if (currentStatus === 'present') {
            newStatus = null;
          } else if (currentStatus === 'absent') {
            newStatus = 'present'; // Change to present
          } else if (currentStatus === 'late') {
            newStatus = 'present';
          } else {
            newStatus = 'present';
          }
        } else if (type === 'absent') {
          if (currentStatus === 'absent') {
            newStatus = null;
          } else if (currentStatus === 'present') {
            newStatus = 'absent'; // Change to absent
          } else if (currentStatus === 'late') {
            newStatus = 'absent';
          } else {
            newStatus = 'absent';
          }
        }

        return {
          ...student,
          attendance: {
            ...student.attendance,
            [date]: newStatus
          }
        };
      }
      return student;
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    setSuccessMessage('');

    try {
      // Parse grade and section
      const gradeMatch = selectedGrade.match(/^(\d+)([A-Za-z]?)$/);
      const classNum = gradeMatch ? gradeMatch[1] : selectedGrade;
      const section = gradeMatch && gradeMatch[2] ? gradeMatch[2] : selectedSection;

      // Collect all attendance data to submit
      const attendanceData = [];
      students.forEach(student => {
        Object.entries(student.attendance).forEach(([date, status]) => {
          if (status && status !== null) {
            attendanceData.push({
              studentId: student.id,
              date: date,
              class: classNum,
              section: section,
              status: status
            });
          }
        });
      });

      if (attendanceData.length === 0) {
        setError('No attendance data to submit. Please mark at least one student.');
        setSubmitting(false);
        return;
      }

      const response = await attendanceService.markAttendance(attendanceData);

      if (response.success) {
        setSuccessMessage('Attendance submitted successfully!');
        // Refresh the data
        fetchStudents();
      } else {
        setError(response.message || 'Failed to submit attendance');
      }
    } catch (err) {
      setError(err.message || 'Failed to submit attendance');
      console.error('Error submitting attendance:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const renderAttendanceCell = (student, day) => {
    const status = student.attendance[day.date];

    if (status === null || status === undefined) {
      return (
        <div className="attendance-entry__cell-content">
          <button
            className="attendance-entry__status-icon attendance-entry__status-icon--empty"
            onClick={() => toggleAttendance(student.id, day.date, 'present')}
            title="Mark Present"
          >
            <span className="attendance-entry__dash">-</span>
          </button>
        </div>
      );
    }

    if (status === 'present') {
      return (
        <div className="attendance-entry__cell-content">
          <button
            className="attendance-entry__status-icon attendance-entry__status-icon--present"
            onClick={() => toggleAttendance(student.id, day.date, 'absent')}
            title="Present - Click to change"
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
            onClick={() => toggleAttendance(student.id, day.date, 'present')}
            title="Absent - Click to change"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="#E00000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      );
    }

    if (status === 'late') {
      return (
        <div className="attendance-entry__cell-content">
          <button
            className="attendance-entry__status-icon attendance-entry__status-icon--late"
            onClick={() => toggleAttendance(student.id, day.date, 'present')}
            title="Late - Click to change"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="#F59E0B" strokeWidth="2"/>
              <path d="M12 7V12L15 15" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      );
    }

    if (status === 'excused') {
      return (
        <div className="attendance-entry__cell-content">
          <button
            className="attendance-entry__status-icon attendance-entry__status-icon--excused"
            onClick={() => toggleAttendance(student.id, day.date, 'present')}
            title="Excused - Click to change"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="attendance-entry">
      <div className="attendance-entry__title-container">
        <h1 className="attendance-entry__title">Attendance Entry</h1>
      </div>

      {error && (
        <div className="attendance-entry__error">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {successMessage && (
        <div className="attendance-entry__success">
          {successMessage}
          <button onClick={() => setSuccessMessage('')}>×</button>
        </div>
      )}

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
              <svg className="attendance-entry__dropdown-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M6 9L12 15L18 9" stroke="#8D8D8D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            <div className="attendance-entry__field">
              <label className="attendance-entry__label">Select Date</label>
              <input
                type="date"
                className="attendance-entry__date-input"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>

          <div className="attendance-entry__view-toggle">
            <button
              className={`attendance-entry__view-btn attendance-entry__view-btn--left ${viewMode === 'day' ? 'attendance-entry__view-btn--active' : ''}`}
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
              className={`attendance-entry__view-btn attendance-entry__view-btn--right ${viewMode === 'month' ? 'attendance-entry__view-btn--active' : ''}`}
              onClick={() => setViewMode('month')}
            >
              Month
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="attendance-entry__loading">
            <div className="attendance-entry__spinner"></div>
            <p>Loading students...</p>
          </div>
        )}

        {/* No Students Message */}
        {!loading && students.length === 0 && (
          <div className="attendance-entry__empty">
            <p>No students found for the selected class. Please select a different grade/class.</p>
          </div>
        )}

        {/* Attendance Grid */}
        {!loading && students.length > 0 && (
          <div className="attendance-entry__grid-wrapper">
            <div className="attendance-entry__grid">
              {/* Left Column - Student Names */}
              <div className="attendance-entry__students-column">
                <div className="attendance-entry__header-cell">
                  <div className="attendance-entry__header-content">
                    <span className="attendance-entry__header-text">ID</span>
                    <span className="attendance-entry__header-text">Student Name</span>
                  </div>
                </div>
                <div className="attendance-entry__students-body">
                  {students.map((student, index) => (
                    <div key={student.id}>
                      <div className="attendance-entry__student-row">
                        <span className="attendance-entry__student-id">{student.enrollmentNumber || student.id.substring(0, 8)}</span>
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
                        key={day.date}
                        className={`attendance-entry__day-header ${day.isToday ? 'attendance-entry__day-header--active' : ''}`}
                      >
                        {day.display}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="attendance-entry__days-body">
                  {students.map((student, studentIndex) => (
                    <div key={student.id}>
                      <div className="attendance-entry__attendance-row">
                        {weekDays.map((day) => (
                          <div key={day.date} className="attendance-entry__attendance-cell">
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
        )}

        {/* Footer Actions */}
        <div className="attendance-entry__footer">
          <button 
            className="attendance-entry__submit-btn" 
            onClick={handleSubmit}
            disabled={submitting || students.length === 0}
          >
            {submitting ? 'Submitting...' : 'Submit Attendance'}
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
            {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                className={`attendance-entry__page-btn ${currentPage === page ? 'attendance-entry__page-btn--active' : ''}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
            {pagination.totalPages > 5 && (
              <>
                <button className="attendance-entry__page-btn attendance-entry__page-btn--ellipsis">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="4" cy="8" r="1" fill="#1F55A6"/>
                    <circle cx="8" cy="8" r="1" fill="#1F55A6"/>
                    <circle cx="12" cy="8" r="1" fill="#1F55A6"/>
                  </svg>
                </button>
                <button 
                  className="attendance-entry__page-btn" 
                  onClick={() => setCurrentPage(pagination.totalPages)}
                >
                  {pagination.totalPages}
                </button>
              </>
            )}
            <button
              className="attendance-entry__page-btn attendance-entry__page-btn--next"
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

      <div className="attendance-entry__help-links">
        <a href="#" className="attendance-entry__help-link">Need Help?</a>
        <a href="#" className="attendance-entry__help-link">Contact Support</a>
      </div>
    </div>
  );
};

export default AttendanceEntry;
