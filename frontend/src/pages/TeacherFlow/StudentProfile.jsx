import { useState } from 'react';
import './StudentProfile.css';

const StudentProfile = () => {
  const [activeTab, setActiveTab] = useState('basic-info');
  const [selectedMonth, setSelectedMonth] = useState('April');
  const [selectedYear, setSelectedYear] = useState('2025');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('2024-2025');
  const [selectedExamType, setSelectedExamType] = useState('Mid Semester');

  const [student] = useState({
    fullName: 'John Doe',
    schoolName: 'Vision Academy School',
    dateOfBirth: '25 June 2005',
    studentId: '12345',
    gradeClass: '9A',
    guardian: {
      name: 'Alex Doe',
      contact: '+1 555-123-4567',
      address: '2323 Dancing Dove Lane, Long Island City, NY 11101'
    },
    sponsor: 'Sponsor Name A'
  });

  // Attendance data for April 2025
  const attendanceData = {
    month: 'April',
    year: '2025',
    totalDays: 30,
    presentDays: 28,
    attendanceRate: 92,
    calendar: [
      // Days 1-30 with status: 'present', 'absent', or 'future'
      { day: 1, status: 'present' },
      { day: 2, status: 'present' },
      { day: 3, status: 'present' },
      { day: 4, status: 'present' },
      { day: 5, status: 'present' },
      { day: 6, status: 'present' },
      { day: 7, status: 'present' },
      { day: 8, status: 'present' },
      { day: 9, status: 'present' },
      { day: 10, status: 'present' },
      { day: 11, status: 'absent' },
      { day: 12, status: 'present' },
      { day: 13, status: 'present' },
      { day: 14, status: 'present' },
      { day: 15, status: 'present' },
      { day: 16, status: 'present' },
      { day: 17, status: 'present' },
      { day: 18, status: 'present' },
      { day: 19, status: 'present' },
      { day: 20, status: 'present' },
      { day: 21, status: 'present' },
      { day: 22, status: 'present' },
      { day: 23, status: 'absent' },
      { day: 24, status: 'present' },
      { day: 25, status: 'present' },
      { day: 26, status: 'present' },
      { day: 27, status: 'present' },
      { day: 28, status: 'present' },
      { day: 29, status: 'present' },
      { day: 30, status: 'present' },
    ],
    // Empty days from previous/next month
    emptyDaysBefore: 0, // Monday starts on day 1
    emptyDaysAfter: 4 // Filling to complete the grid
  };

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const years = ['2023', '2024', '2025', '2026'];
  const academicYears = ['2022-2023', '2023-2024', '2024-2025', '2025-2026'];
  const examTypes = ['Mid Semester', 'End Semester', 'Final Exam', 'Unit Test'];

  // Marks data for the selected academic year and exam type
  const marksData = [
    { subject: 'Subject 1', theoryMarks: 84, totalMarks: 84 },
    { subject: 'Subject 2', theoryMarks: 76, totalMarks: 78 },
    { subject: 'Subject 3', theoryMarks: 90, totalMarks: 88 },
    { subject: 'Subject 4', theoryMarks: 65, totalMarks: 70 },
    { subject: 'Subject 5', theoryMarks: 92, totalMarks: 95 },
    { subject: 'Subject 6', theoryMarks: 80, totalMarks: 82 },
  ];

  const totalMarks = marksData.reduce((sum, item) => sum + item.totalMarks, 0);

  const handlePreviousMonth = () => {
    const currentIndex = months.indexOf(selectedMonth);
    if (currentIndex > 0) {
      setSelectedMonth(months[currentIndex - 1]);
    } else {
      setSelectedMonth(months[11]);
      const currentYearIndex = years.indexOf(selectedYear);
      if (currentYearIndex > 0) {
        setSelectedYear(years[currentYearIndex - 1]);
      }
    }
  };

  const handleNextMonth = () => {
    const currentIndex = months.indexOf(selectedMonth);
    if (currentIndex < 11) {
      setSelectedMonth(months[currentIndex + 1]);
    } else {
      setSelectedMonth(months[0]);
      const currentYearIndex = years.indexOf(selectedYear);
      if (currentYearIndex < years.length - 1) {
        setSelectedYear(years[currentYearIndex + 1]);
      }
    }
  };

  return (
    <div className="student-profile">
      <h1 className="student-profile__title">Student Profile</h1>

      {/* Tabs */}
      <div className="student-profile__tabs">
        <button
          className={`student-profile__tab ${activeTab === 'basic-info' ? 'student-profile__tab--active' : ''}`}
          onClick={() => setActiveTab('basic-info')}
        >
          Basic Info
        </button>
        <button
          className={`student-profile__tab ${activeTab === 'attendance' ? 'student-profile__tab--active' : ''}`}
          onClick={() => setActiveTab('attendance')}
        >
          Attendance Summary
        </button>
        <button
          className={`student-profile__tab ${activeTab === 'marks' ? 'student-profile__tab--active' : ''}`}
          onClick={() => setActiveTab('marks')}
        >
          Marks History
        </button>
        <div className="student-profile__tab-spacer"></div>
      </div>

      {/* Basic Info Tab Content */}
      {activeTab === 'basic-info' && (
        <div className="student-profile__content">
          {/* Student Information Card */}
          <div className="student-profile__card">
            <h2 className="student-profile__card-title">Student Information</h2>
            <div className="student-profile__divider"></div>

            {/* Profile Header with Avatar */}
            <div className="student-profile__profile-header">
              <div className="student-profile__avatar">
                <img 
                  src="https://www.figma.com/api/mcp/asset/e4e13628-94bf-4ddf-afed-6acdb29da771" 
                  alt={student.fullName}
                />
              </div>
              <div className="student-profile__profile-info">
                <label className="student-profile__label">Full Name</label>
                <h3 className="student-profile__name">{student.fullName}</h3>
              </div>
            </div>

            {/* Student Details */}
            <div className="student-profile__details">
              <div className="student-profile__field student-profile__field--full">
                <label className="student-profile__label">School Name</label>
                <p className="student-profile__value">{student.schoolName}</p>
              </div>

              <div className="student-profile__field-row">
                <div className="student-profile__field">
                  <label className="student-profile__label">Date of Birth</label>
                  <p className="student-profile__value">{student.dateOfBirth}</p>
                </div>
                <div className="student-profile__field">
                  <label className="student-profile__label">Student ID</label>
                  <p className="student-profile__value">{student.studentId}</p>
                </div>
                <div className="student-profile__field">
                  <label className="student-profile__label">Grade/Class</label>
                  <p className="student-profile__value">{student.gradeClass}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Guardian Information Card */}
          <div className="student-profile__card">
            <h2 className="student-profile__card-title">Guardian Information</h2>
            <div className="student-profile__divider"></div>

            <div className="student-profile__details">
              <div className="student-profile__field-row">
                <div className="student-profile__field">
                  <label className="student-profile__label">Guardian Name</label>
                  <p className="student-profile__value">{student.guardian.name}</p>
                </div>
                <div className="student-profile__field">
                  <label className="student-profile__label">Contact Details</label>
                  <p className="student-profile__value">{student.guardian.contact}</p>
                </div>
              </div>

              <div className="student-profile__field student-profile__field--full">
                <label className="student-profile__label">Address</label>
                <p className="student-profile__value">{student.guardian.address}</p>
              </div>
            </div>
          </div>

          {/* Sponsor Information Card */}
          <div className="student-profile__card">
            <h2 className="student-profile__card-title">Sponsor Information</h2>
            <div className="student-profile__divider"></div>

            <div className="student-profile__details">
              <div className="student-profile__field student-profile__field--full">
                <label className="student-profile__label">Sponsor</label>
                <p className="student-profile__value">{student.sponsor}</p>
              </div>
            </div>
          </div>

          {/* Help Links */}
          <div className="student-profile__help-links">
            <a href="#" className="student-profile__help-link">Need Help?</a>
            <a href="#" className="student-profile__help-link">Contact Support</a>
          </div>
        </div>
      )}

      {/* Attendance Summary Tab */}
      {activeTab === 'attendance' && (
        <div className="student-profile__content">
          <div className="student-profile__card">
            {/* Header with Month/Year Selectors */}
            <div className="student-profile__attendance-header">
              <h2 className="student-profile__card-title">Attendance Summary</h2>
              <div className="student-profile__date-selectors">
                <div className="student-profile__month-selector">
                  <button className="student-profile__arrow-btn" onClick={handlePreviousMonth}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M11.25 13.5L6.75 9L11.25 4.5" stroke="#1F55A6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <span className="student-profile__month-text">{selectedMonth}</span>
                  <button className="student-profile__arrow-btn" onClick={handleNextMonth}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M6.75 13.5L11.25 9L6.75 4.5" stroke="#1F55A6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
                <div className="student-profile__year-selector">
                  <span className="student-profile__year-text">{selectedYear}</span>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M4.5 6.75L9 11.25L13.5 6.75" stroke="#1F55A6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

            <div className="student-profile__divider"></div>

            {/* Attendance Stats */}
            <div className="student-profile__attendance-stats">
              <p className="student-profile__attendance-rate">
                {attendanceData.attendanceRate}% Attendance Rate of {attendanceData.month}
              </p>
              <p className="student-profile__present-days">
                Total Present Days : {attendanceData.presentDays}/{attendanceData.totalDays}
              </p>
            </div>

            {/* Calendar Grid */}
            <div className="student-profile__calendar">
              {/* Day Headers */}
              <div className="student-profile__calendar-header">
                <div className="student-profile__calendar-day-name">Monday</div>
                <div className="student-profile__calendar-day-name">Tuesday</div>
                <div className="student-profile__calendar-day-name">Wednesday</div>
                <div className="student-profile__calendar-day-name">Thursday</div>
                <div className="student-profile__calendar-day-name">Friday</div>
                <div className="student-profile__calendar-day-name">Saturday</div>
                <div className="student-profile__calendar-day-name">Sunday</div>
              </div>

              {/* Calendar Days */}
              <div className="student-profile__calendar-body">
                {attendanceData.calendar.map((day, index) => (
                  <div 
                    key={index}
                    className={`student-profile__calendar-day student-profile__calendar-day--${day.status}`}
                  >
                    {day.day.toString().padStart(2, '0')}
                  </div>
                ))}
                {/* Empty days after to complete the grid */}
                {Array.from({ length: attendanceData.emptyDaysAfter }).map((_, index) => (
                  <div 
                    key={`empty-${index}`}
                    className="student-profile__calendar-day student-profile__calendar-day--empty"
                  >
                    {(index + 1).toString().padStart(2, '0')}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Help Links */}
          <div className="student-profile__help-links">
            <a href="#" className="student-profile__help-link">Need Help?</a>
            <a href="#" className="student-profile__help-link">Contact Support</a>
          </div>
        </div>
      )}

      {/* Marks History Tab */}
      {activeTab === 'marks' && (
        <div className="student-profile__content">
          <div className="student-profile__card">
            {/* Filter Dropdowns */}
            <div className="student-profile__marks-filters">
              <div className="student-profile__filter-field">
                <label className="student-profile__filter-label">Academic Year</label>
                <select
                  className="student-profile__filter-select"
                  value={selectedAcademicYear}
                  onChange={(e) => setSelectedAcademicYear(e.target.value)}
                >
                  {academicYears.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <svg className="student-profile__filter-dropdown-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M6 9L12 15L18 9" stroke="#1F55A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              <div className="student-profile__filter-field">
                <label className="student-profile__filter-label">Exam Type</label>
                <select
                  className="student-profile__filter-select"
                  value={selectedExamType}
                  onChange={(e) => setSelectedExamType(e.target.value)}
                >
                  {examTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <svg className="student-profile__filter-dropdown-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M6 9L12 15L18 9" stroke="#1F55A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            <div className="student-profile__divider"></div>

            {/* Marks Table */}
            <div className="student-profile__marks-table-wrapper">
              {/* Table Header */}
              <div className="student-profile__marks-table-header">
                <div className="student-profile__marks-header-cell student-profile__marks-header-cell--subject">
                  Subject Name
                </div>
                <div className="student-profile__marks-header-cell student-profile__marks-header-cell--theory">
                  Theory Marks
                </div>
                <div className="student-profile__marks-header-cell student-profile__marks-header-cell--total">
                  Total Marks
                </div>
              </div>

              {/* Table Body */}
              <div className="student-profile__marks-table-body">
                {marksData.map((item, index) => (
                  <div key={index} className="student-profile__marks-row">
                    <div className="student-profile__marks-cell student-profile__marks-cell--subject">
                      {item.subject}
                    </div>
                    <div className="student-profile__marks-cell student-profile__marks-cell--theory">
                      {item.theoryMarks}
                    </div>
                    <div className="student-profile__marks-cell student-profile__marks-cell--total">
                      {item.totalMarks}
                    </div>
                  </div>
                ))}

                {/* Total Row */}
                <div className="student-profile__marks-divider"></div>
                <div className="student-profile__marks-row student-profile__marks-row--total">
                  <div className="student-profile__marks-cell student-profile__marks-cell--subject">
                    Total marks
                  </div>
                  <div className="student-profile__marks-cell student-profile__marks-cell--theory">
                  </div>
                  <div className="student-profile__marks-cell student-profile__marks-cell--total student-profile__marks-total-value">
                    {totalMarks}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="student-profile__marks-actions">
              <button className="student-profile__marks-btn student-profile__marks-btn--primary">
                Enter Marks
              </button>
              <button className="student-profile__marks-btn student-profile__marks-btn--secondary">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M9 17V11L7 13" stroke="#1F55A6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 11L11 13" stroke="#1F55A6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 10V15C22 20 20 22 15 22H9C4 22 2 20 2 15V9C2 4 4 2 9 2H14" stroke="#1F55A6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 10H18C15 10 14 9 14 6V2L22 10Z" stroke="#1F55A6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Download Report Card
              </button>
            </div>
          </div>

          {/* Help Links */}
          <div className="student-profile__help-links">
            <a href="#" className="student-profile__help-link">Need Help?</a>
            <a href="#" className="student-profile__help-link">Contact Support</a>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProfile;
