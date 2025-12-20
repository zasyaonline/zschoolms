import { useState } from 'react';
import './Dashboard.css';

const Dashboard = () => {
  // Generate chart data once to avoid impure function calls during render
  const [chartData] = useState(() => 
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => ({
      day,
      presentHeight: 60 + Math.random() * 35,
      absentHeight: 5 + Math.random() * 10
    }))
  );
  
  const stats = [
    { 
      label: 'Total Students', 
      value: '1,250', 
      change: '+12%', 
      trend: 'up',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      color: 'blue'
    },
    { 
      label: 'Total Teachers', 
      value: '85', 
      change: '+5%', 
      trend: 'up',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      ),
      color: 'green'
    },
    { 
      label: 'Active Classes', 
      value: '48', 
      change: '0%', 
      trend: 'neutral',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
          <path d="M6 12v5c3 3 9 3 12 0v-5"/>
        </svg>
      ),
      color: 'purple'
    },
    { 
      label: 'Attendance Rate', 
      value: '94.5%', 
      change: '+2.3%', 
      trend: 'up',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      ),
      color: 'orange'
    }
  ];

  const recentActivities = [
    { id: 1, type: 'enrollment', message: 'New student Emma Wilson enrolled in Grade 10', time: '5 minutes ago' },
    { id: 2, type: 'marks', message: 'Math exam marks uploaded for Grade 9-A', time: '1 hour ago' },
    { id: 3, type: 'attendance', message: 'Attendance marked for Grade 11-B', time: '2 hours ago' },
    { id: 4, type: 'report', message: 'Report cards generated for Grade 12', time: '3 hours ago' },
    { id: 5, type: 'user', message: 'New teacher Dr. James Smith added', time: '5 hours ago' },
  ];

  const upcomingEvents = [
    { id: 1, title: 'Parent-Teacher Meeting', date: 'Dec 15, 2024', time: '10:00 AM' },
    { id: 2, title: 'Annual Sports Day', date: 'Dec 20, 2024', time: '9:00 AM' },
    { id: 3, title: 'Winter Break Begins', date: 'Dec 23, 2024', time: 'All Day' },
    { id: 4, title: 'Final Exams Start', date: 'Jan 5, 2025', time: '8:00 AM' },
  ];

  const quickActions = [
    { label: 'Student List', icon: '👤', path: '/students' },
    { label: 'Mark Attendance', icon: '✓', path: '/teacher/attendance' },
    { label: 'Enter Marks', icon: '📝', path: '/teacher/marks' },
    { label: 'Report Cards', icon: '📊', path: '/report-cards' },
  ];

  return (
    <div className="dashboard">
      {/* Stats Cards */}
      <div className="dashboard__stats">
        {stats.map((stat, index) => (
          <div key={index} className={`dashboard__stat-card dashboard__stat-card--${stat.color}`}>
            <div className="dashboard__stat-icon">
              {stat.icon}
            </div>
            <div className="dashboard__stat-content">
              <span className="dashboard__stat-label">{stat.label}</span>
              <span className="dashboard__stat-value">{stat.value}</span>
              <span className={`dashboard__stat-change dashboard__stat-change--${stat.trend}`}>
                {stat.trend === 'up' && '↑'} 
                {stat.trend === 'down' && '↓'}
                {stat.change} from last month
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="dashboard__grid">
        {/* Recent Activities */}
        <div className="dashboard__card dashboard__card--activities">
          <div className="dashboard__card-header">
            <h3 className="dashboard__card-title">Recent Activities</h3>
            <button className="dashboard__card-action">View All</button>
          </div>
          <div className="dashboard__activities">
            {recentActivities.map(activity => (
              <div key={activity.id} className="dashboard__activity">
                <div className={`dashboard__activity-icon dashboard__activity-icon--${activity.type}`}>
                  {activity.type === 'enrollment' && '👤'}
                  {activity.type === 'marks' && '📝'}
                  {activity.type === 'attendance' && '✓'}
                  {activity.type === 'report' && '📊'}
                  {activity.type === 'user' && '👥'}
                </div>
                <div className="dashboard__activity-content">
                  <p className="dashboard__activity-message">{activity.message}</p>
                  <span className="dashboard__activity-time">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="dashboard__sidebar">
          {/* Quick Actions */}
          <div className="dashboard__card">
            <div className="dashboard__card-header">
              <h3 className="dashboard__card-title">Quick Actions</h3>
            </div>
            <div className="dashboard__quick-actions">
              {quickActions.map((action, index) => (
                <button key={index} className="dashboard__quick-action">
                  <span className="dashboard__quick-action-icon">{action.icon}</span>
                  <span className="dashboard__quick-action-label">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="dashboard__card">
            <div className="dashboard__card-header">
              <h3 className="dashboard__card-title">Upcoming Events</h3>
              <button className="dashboard__card-action">View Calendar</button>
            </div>
            <div className="dashboard__events">
              {upcomingEvents.map(event => (
                <div key={event.id} className="dashboard__event">
                  <div className="dashboard__event-date">
                    <span className="dashboard__event-day">{event.date.split(',')[0].split(' ')[1]}</span>
                    <span className="dashboard__event-month">{event.date.split(',')[0].split(' ')[0]}</span>
                  </div>
                  <div className="dashboard__event-content">
                    <p className="dashboard__event-title">{event.title}</p>
                    <span className="dashboard__event-time">{event.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Overview Chart Placeholder */}
      <div className="dashboard__card dashboard__card--chart">
        <div className="dashboard__card-header">
          <h3 className="dashboard__card-title">Attendance Overview</h3>
          <div className="dashboard__chart-filters">
            <button className="dashboard__chart-filter dashboard__chart-filter--active">Week</button>
            <button className="dashboard__chart-filter">Month</button>
            <button className="dashboard__chart-filter">Year</button>
          </div>
        </div>
        <div className="dashboard__chart-placeholder">
          <div className="dashboard__chart-bars">
            {chartData.map((data) => (
              <div key={data.day} className="dashboard__chart-bar-group">
                <div 
                  className="dashboard__chart-bar dashboard__chart-bar--present" 
                  style={{ height: `${data.presentHeight}%` }}
                ></div>
                <div 
                  className="dashboard__chart-bar dashboard__chart-bar--absent" 
                  style={{ height: `${data.absentHeight}%` }}
                ></div>
                <span className="dashboard__chart-label">{data.day}</span>
              </div>
            ))}
          </div>
          <div className="dashboard__chart-legend">
            <span className="dashboard__legend-item">
              <span className="dashboard__legend-dot dashboard__legend-dot--present"></span>
              Present
            </span>
            <span className="dashboard__legend-item">
              <span className="dashboard__legend-dot dashboard__legend-dot--absent"></span>
              Absent
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
