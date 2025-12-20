import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MyAttendance.css';

const MyAttendance = () => {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState('december');
  const [selectedYear, setSelectedYear] = useState('2024');

  const [stats] = useState({
    totalDays: 180,
    present: 165,
    absent: 8,
    late: 7,
    attendanceRate: 91.7
  });

  const [monthlyStats] = useState({
    workingDays: 22,
    present: 20,
    absent: 1,
    late: 1
  });

  const [calendarData] = useState([
    { date: 1, day: 'Sun', status: 'holiday' },
    { date: 2, day: 'Mon', status: 'present' },
    { date: 3, day: 'Tue', status: 'present' },
    { date: 4, day: 'Wed', status: 'present' },
    { date: 5, day: 'Thu', status: 'late' },
    { date: 6, day: 'Fri', status: 'present' },
    { date: 7, day: 'Sat', status: 'holiday' },
    { date: 8, day: 'Sun', status: 'holiday' },
    { date: 9, day: 'Mon', status: 'present' },
    { date: 10, day: 'Tue', status: 'absent' },
    { date: 11, day: 'Wed', status: 'present' },
    { date: 12, day: 'Thu', status: 'present' },
    { date: 13, day: 'Fri', status: 'present' },
    { date: 14, day: 'Sat', status: 'holiday' },
    { date: 15, day: 'Sun', status: 'holiday' },
    { date: 16, day: 'Mon', status: 'present' },
    { date: 17, day: 'Tue', status: 'present' },
    { date: 18, day: 'Wed', status: 'present' },
    { date: 19, day: 'Thu', status: 'present' },
    { date: 20, day: 'Fri', status: 'present' },
    { date: 21, day: 'Sat', status: 'holiday' },
    { date: 22, day: 'Sun', status: 'holiday' },
    { date: 23, day: 'Mon', status: 'present' },
    { date: 24, day: 'Tue', status: 'present' },
    { date: 25, day: 'Wed', status: 'holiday' },
    { date: 26, day: 'Thu', status: 'present' },
    { date: 27, day: 'Fri', status: 'present' },
    { date: 28, day: 'Sat', status: 'holiday' },
    { date: 29, day: 'Sun', status: 'holiday' },
    { date: 30, day: 'Mon', status: 'present' },
    { date: 31, day: 'Tue', status: 'future' },
  ]);

  const [absenceHistory] = useState([
    { date: '2024-12-10', reason: 'Sick Leave', status: 'Approved' },
    { date: '2024-11-22', reason: 'Family Function', status: 'Approved' },
    { date: '2024-10-15', reason: 'Medical Appointment', status: 'Approved' },
    { date: '2024-09-05', reason: 'Not Feeling Well', status: 'Approved' },
  ]);

  return (
    <div className="my-attendance">
      <div className="my-attendance__header">
        <button className="my-attendance__back-btn" onClick={() => navigate('/student/profile')}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div>
          <h1 className="my-attendance__title">My Attendance</h1>
          <p className="my-attendance__subtitle">View your attendance records</p>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="my-attendance__overall">
        <div className="my-attendance__overall-header">
          <h2>Academic Year 2024-2025</h2>
          <div className="my-attendance__rate-circle">
            <svg viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#E5E7EB" strokeWidth="8"/>
              <circle 
                cx="50" 
                cy="50" 
                r="45" 
                fill="none" 
                stroke="#10B981" 
                strokeWidth="8"
                strokeDasharray={`${stats.attendanceRate * 2.83} 283`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="my-attendance__rate-text">
              <span className="my-attendance__rate-value">{stats.attendanceRate}%</span>
              <span className="my-attendance__rate-label">Attendance</span>
            </div>
          </div>
        </div>
        <div className="my-attendance__overall-stats">
          <div className="my-attendance__overall-stat">
            <span className="my-attendance__overall-value">{stats.totalDays}</span>
            <span className="my-attendance__overall-label">School Days</span>
          </div>
          <div className="my-attendance__overall-stat my-attendance__overall-stat--present">
            <span className="my-attendance__overall-value">{stats.present}</span>
            <span className="my-attendance__overall-label">Present</span>
          </div>
          <div className="my-attendance__overall-stat my-attendance__overall-stat--absent">
            <span className="my-attendance__overall-value">{stats.absent}</span>
            <span className="my-attendance__overall-label">Absent</span>
          </div>
          <div className="my-attendance__overall-stat my-attendance__overall-stat--late">
            <span className="my-attendance__overall-value">{stats.late}</span>
            <span className="my-attendance__overall-label">Late</span>
          </div>
        </div>
      </div>

      {/* Monthly View */}
      <div className="my-attendance__card">
        <div className="my-attendance__card-header">
          <h3 className="my-attendance__card-title">Monthly View</h3>
          <div className="my-attendance__filters">
            <select
              className="my-attendance__select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="december">December</option>
              <option value="november">November</option>
              <option value="october">October</option>
              <option value="september">September</option>
            </select>
            <select
              className="my-attendance__select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="2024">2024</option>
              <option value="2023">2023</option>
            </select>
          </div>
        </div>

        <div className="my-attendance__month-summary">
          <div className="my-attendance__month-stat">
            <span>{monthlyStats.workingDays}</span> Working Days
          </div>
          <div className="my-attendance__month-stat my-attendance__month-stat--present">
            <span>{monthlyStats.present}</span> Present
          </div>
          <div className="my-attendance__month-stat my-attendance__month-stat--absent">
            <span>{monthlyStats.absent}</span> Absent
          </div>
          <div className="my-attendance__month-stat my-attendance__month-stat--late">
            <span>{monthlyStats.late}</span> Late
          </div>
        </div>

        <div className="my-attendance__calendar">
          <div className="my-attendance__weekdays">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>
          <div className="my-attendance__days">
            {/* Empty cells for alignment */}
            {calendarData.map((day) => (
              <div
                key={day.date}
                className={`my-attendance__day my-attendance__day--${day.status}`}
                title={`${day.date} Dec - ${day.status.charAt(0).toUpperCase() + day.status.slice(1)}`}
              >
                <span>{day.date}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="my-attendance__legend">
          <div className="my-attendance__legend-item">
            <span className="my-attendance__legend-dot my-attendance__legend-dot--present"></span>
            Present
          </div>
          <div className="my-attendance__legend-item">
            <span className="my-attendance__legend-dot my-attendance__legend-dot--absent"></span>
            Absent
          </div>
          <div className="my-attendance__legend-item">
            <span className="my-attendance__legend-dot my-attendance__legend-dot--late"></span>
            Late
          </div>
          <div className="my-attendance__legend-item">
            <span className="my-attendance__legend-dot my-attendance__legend-dot--holiday"></span>
            Holiday
          </div>
        </div>
      </div>

      {/* Absence History */}
      <div className="my-attendance__card">
        <h3 className="my-attendance__card-title">Absence History</h3>
        <div className="my-attendance__history">
          {absenceHistory.map((item, index) => (
            <div key={index} className="my-attendance__history-item">
              <div className="my-attendance__history-date">
                <span className="my-attendance__history-day">
                  {new Date(item.date).getDate()}
                </span>
                <span className="my-attendance__history-month">
                  {new Date(item.date).toLocaleString('default', { month: 'short' })}
                </span>
              </div>
              <div className="my-attendance__history-info">
                <span className="my-attendance__history-reason">{item.reason}</span>
                <span className={`my-attendance__history-status my-attendance__history-status--${item.status.toLowerCase()}`}>
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MyAttendance;
