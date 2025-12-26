import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './MyAttendance.css';
import { attendanceService } from '../../services';

const MyAttendance = () => {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return now.toLocaleString('default', { month: 'long' }).toLowerCase();
  });
  const [selectedYear, setSelectedYear] = useState(() => {
    return new Date().getFullYear().toString();
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studentId, setStudentId] = useState(null);

  const [stats, setStats] = useState({
    totalDays: 0,
    present: 0,
    absent: 0,
    late: 0,
    attendanceRate: 0
  });

  const [monthlyStats, setMonthlyStats] = useState({
    workingDays: 0,
    present: 0,
    absent: 0,
    late: 0
  });

  const [calendarData, setCalendarData] = useState([]);
  const [absenceHistory, setAbsenceHistory] = useState([]);

  const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                      'july', 'august', 'september', 'october', 'november', 'december'];

  // Get student ID from localStorage
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Get studentId from user object
    setStudentId(user.studentId || user.id);
  }, [navigate]);

  // Fetch attendance data
  const fetchAttendance = useCallback(async () => {
    if (!studentId) return;

    setLoading(true);
    setError(null);

    try {
      // Calculate date range for selected month
      const monthIndex = monthNames.indexOf(selectedMonth);
      const year = parseInt(selectedYear);
      const startDate = new Date(year, monthIndex, 1);
      const endDate = new Date(year, monthIndex + 1, 0);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Fetch monthly attendance
      const response = await attendanceService.getStudentAttendance(studentId, {
        startDate: startDateStr,
        endDate: endDateStr,
        limit: 100
      });

      if (response.success && response.data) {
        const records = response.data.records || [];
        const statistics = response.data.statistics || {};

        // Calculate monthly stats
        const present = records.filter(r => r.status === 'present').length;
        const absent = records.filter(r => r.status === 'absent').length;
        const late = records.filter(r => r.status === 'late').length;
        const total = records.length;

        setMonthlyStats({
          workingDays: total,
          present,
          absent,
          late
        });

        // Build calendar data
        const daysInMonth = endDate.getDate();
        const calData = [];
        
        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(year, monthIndex, day);
          const dateStr = date.toISOString().split('T')[0];
          const dayOfWeek = date.getDay();
          
          // Check if it's a weekend (holiday)
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          
          // Find attendance record for this date
          const record = records.find(r => r.date === dateStr);
          
          let status = 'future';
          if (date > new Date()) {
            status = 'future';
          } else if (isWeekend) {
            status = 'holiday';
          } else if (record) {
            status = record.status;
          } else {
            status = 'holiday'; // Default to holiday if no record
          }

          calData.push({
            date: day,
            day: date.toLocaleDateString('en-US', { weekday: 'short' }),
            status,
            fullDate: dateStr
          });
        }

        setCalendarData(calData);

        // Set absence history
        const absences = records
          .filter(r => r.status === 'absent')
          .map(r => ({
            date: r.date,
            reason: r.remarks || 'No reason provided',
            status: 'Recorded'
          }));
        setAbsenceHistory(absences);

        // Set overall stats from API
        setStats({
          totalDays: statistics.total || total,
          present: statistics.present || present,
          absent: statistics.absent || absent,
          late: statistics.late || late,
          attendanceRate: parseFloat(statistics.attendanceRate) || 
            (total > 0 ? ((present / total) * 100).toFixed(1) : 0)
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load attendance data');
      console.error('Error fetching attendance:', err);
    } finally {
      setLoading(false);
    }
  }, [studentId, selectedMonth, selectedYear]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  if (loading) {
    return (
      <div className="my-attendance">
        <div className="my-attendance__loading">
          <div className="my-attendance__spinner"></div>
          <p>Loading attendance...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-attendance">
        <div className="my-attendance__error">
          <p>{error}</p>
          <button onClick={() => fetchAttendance()}>Retry</button>
        </div>
      </div>
    );
  }

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
