import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './AttendanceSummary.css';

const AttendanceSummary = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [selectedMonth, setSelectedMonth] = useState('december');
  const [selectedYear, setSelectedYear] = useState('2024');
  
  const [student] = useState({
    id: id || '1',
    name: 'Emma Wilson',
    class: 'Grade 10-A',
    rollNo: '001'
  });

  const [stats] = useState({
    totalDays: 22,
    present: 20,
    absent: 1,
    late: 1,
    attendanceRate: 90.9
  });

  const [monthlyData] = useState([
    { month: 'Jan', present: 20, absent: 2, late: 0, rate: 90.9 },
    { month: 'Feb', present: 18, absent: 1, late: 1, rate: 90 },
    { month: 'Mar', present: 21, absent: 1, late: 0, rate: 95.5 },
    { month: 'Apr', present: 19, absent: 2, late: 1, rate: 86.4 },
    { month: 'May', present: 22, absent: 0, late: 0, rate: 100 },
    { month: 'Jun', present: 20, absent: 1, late: 1, rate: 90.9 },
  ]);

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

  const [recentAbsences] = useState([
    { date: '2024-12-10', reason: 'Sick Leave', approved: true },
    { date: '2024-11-22', reason: 'Family Function', approved: true },
    { date: '2024-10-15', reason: 'Medical Appointment', approved: true },
  ]);

  return (
    <div className="attendance-summary">
      <div className="attendance-summary__header">
        <button className="attendance-summary__back-btn" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div>
          <h1 className="attendance-summary__title">Attendance Summary</h1>
          <p className="attendance-summary__subtitle">
            {student.name} • {student.class} • Roll No. {student.rollNo}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="attendance-summary__filters">
        <div className="attendance-summary__field">
          <label className="attendance-summary__label">Month</label>
          <select
            className="attendance-summary__select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="january">January</option>
            <option value="february">February</option>
            <option value="march">March</option>
            <option value="april">April</option>
            <option value="may">May</option>
            <option value="june">June</option>
            <option value="july">July</option>
            <option value="august">August</option>
            <option value="september">September</option>
            <option value="october">October</option>
            <option value="november">November</option>
            <option value="december">December</option>
          </select>
        </div>
        <div className="attendance-summary__field">
          <label className="attendance-summary__label">Year</label>
          <select
            className="attendance-summary__select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="2024">2024</option>
            <option value="2023">2023</option>
            <option value="2022">2022</option>
          </select>
        </div>
        <button className="attendance-summary__export-btn">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M14 10V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4.6665 6.66667L7.99984 10L11.3332 6.66667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 10V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Export Report
        </button>
      </div>

      {/* Stats */}
      <div className="attendance-summary__stats">
        <div className="attendance-summary__stat attendance-summary__stat--total">
          <div className="attendance-summary__stat-content">
            <span className="attendance-summary__stat-value">{stats.totalDays}</span>
            <span className="attendance-summary__stat-label">Working Days</span>
          </div>
        </div>
        <div className="attendance-summary__stat attendance-summary__stat--present">
          <div className="attendance-summary__stat-content">
            <span className="attendance-summary__stat-value">{stats.present}</span>
            <span className="attendance-summary__stat-label">Days Present</span>
          </div>
        </div>
        <div className="attendance-summary__stat attendance-summary__stat--absent">
          <div className="attendance-summary__stat-content">
            <span className="attendance-summary__stat-value">{stats.absent}</span>
            <span className="attendance-summary__stat-label">Days Absent</span>
          </div>
        </div>
        <div className="attendance-summary__stat attendance-summary__stat--late">
          <div className="attendance-summary__stat-content">
            <span className="attendance-summary__stat-value">{stats.late}</span>
            <span className="attendance-summary__stat-label">Days Late</span>
          </div>
        </div>
        <div className="attendance-summary__stat attendance-summary__stat--rate">
          <div className="attendance-summary__stat-content">
            <span className="attendance-summary__stat-value">{stats.attendanceRate}%</span>
            <span className="attendance-summary__stat-label">Attendance Rate</span>
          </div>
          <div className="attendance-summary__progress-ring">
            <svg viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#10B981"
                strokeWidth="3"
                strokeDasharray={`${stats.attendanceRate}, 100`}
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      <div className="attendance-summary__card">
        <h3 className="attendance-summary__card-title">December 2024</h3>
        <div className="attendance-summary__calendar">
          {calendarData.map((day) => (
            <div
              key={day.date}
              className={`attendance-summary__day attendance-summary__day--${day.status}`}
            >
              <span className="attendance-summary__day-date">{day.date}</span>
              <span className="attendance-summary__day-name">{day.day}</span>
            </div>
          ))}
        </div>
        <div className="attendance-summary__legend">
          <div className="attendance-summary__legend-item">
            <span className="attendance-summary__legend-dot attendance-summary__legend-dot--present"></span>
            Present
          </div>
          <div className="attendance-summary__legend-item">
            <span className="attendance-summary__legend-dot attendance-summary__legend-dot--absent"></span>
            Absent
          </div>
          <div className="attendance-summary__legend-item">
            <span className="attendance-summary__legend-dot attendance-summary__legend-dot--late"></span>
            Late
          </div>
          <div className="attendance-summary__legend-item">
            <span className="attendance-summary__legend-dot attendance-summary__legend-dot--holiday"></span>
            Holiday/Weekend
          </div>
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="attendance-summary__card">
        <h3 className="attendance-summary__card-title">Monthly Trend (2024)</h3>
        <div className="attendance-summary__chart">
          {monthlyData.map((data, index) => (
            <div key={index} className="attendance-summary__chart-bar">
              <div className="attendance-summary__bar-container">
                <div
                  className="attendance-summary__bar"
                  style={{ height: `${data.rate}%` }}
                >
                  <span className="attendance-summary__bar-value">{data.rate}%</span>
                </div>
              </div>
              <span className="attendance-summary__bar-label">{data.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Absences */}
      <div className="attendance-summary__card">
        <h3 className="attendance-summary__card-title">Recent Absences</h3>
        {recentAbsences.length > 0 ? (
          <div className="attendance-summary__absences">
            {recentAbsences.map((absence, index) => (
              <div key={index} className="attendance-summary__absence-item">
                <div className="attendance-summary__absence-date">
                  {absence.date}
                </div>
                <div className="attendance-summary__absence-reason">
                  {absence.reason}
                </div>
                <div className={`attendance-summary__absence-status ${absence.approved ? 'attendance-summary__absence-status--approved' : ''}`}>
                  {absence.approved ? '✓ Approved' : 'Pending'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="attendance-summary__no-data">No absences recorded</p>
        )}
      </div>
    </div>
  );
};

export default AttendanceSummary;
