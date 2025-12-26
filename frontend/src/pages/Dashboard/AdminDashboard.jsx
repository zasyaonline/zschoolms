import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import api from '../../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    criticalAlerts: [],
    stats: {
      totalStudents: 0,
      totalTeachers: 0,
      studentsWithoutSponsors: 0,
      activeSchools: 0,
      studentsAtRisk: 0,
      pendingApprovals: 0,
    },
    recentActivities: [],
    financialSummary: {},
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch data (backend max limit is 100, but we get totals from pagination)
      const [studentsRes, sponsorsRes, teachersRes, usersRes] = await Promise.all([
        api.get('/students?limit=100'),
        api.get('/sponsors?limit=100'),
        api.get('/users?role=teacher&limit=100'),
        api.get('/users?limit=100'),
      ]);

      // Response structure: { success: true, data: { students: [], pagination: { total: X } } }
      // api.get returns the full response object, so we access .data (not .data.data)
      const studentsData = studentsRes.data?.students || [];
      const sponsorsData = sponsorsRes.data?.sponsors || [];
      const teachersData = teachersRes.data?.users || [];
      const allUsersData = usersRes.data?.users || [];

      // Get total counts from pagination (this is the real count!)
      const totalStudents = studentsRes.data?.pagination?.total || studentsData.length;
      const totalSponsors = sponsorsRes.data?.pagination?.total || sponsorsData.length;
      const totalTeachers = teachersRes.data?.pagination?.total || teachersData.length;
      const totalUsers = usersRes.data?.pagination?.total || allUsersData.length;

      console.log('Dashboard Data:', {
        totalStudents,
        totalSponsors,
        totalTeachers,
        totalUsers,
        sampleStudent: studentsData[0],
      });

      // Calculate students without sponsors from the first 100 students
      const studentsWithoutSponsors = studentsData.filter(s => !s.sponsorId).length;
      const studentsWithSponsors = studentsData.filter(s => s.sponsorId).length;
      
      // Calculate critical alerts
      const alerts = [];
      
      if (studentsWithoutSponsors > 0) {
        alerts.push({
          id: 1,
          type: 'critical',
          icon: '💰',
          title: `${studentsWithoutSponsors} Students Need Sponsors`,
          description: 'Financial support required urgently',
          action: 'View Students',
          link: '/students',
        });
      }

      // Check for teachers (should be at least 15 based on test data)
      if (totalTeachers < 15) {
        alerts.push({
          id: 2,
          type: 'warning',
          icon: '👨‍🏫',
          title: `Only ${totalTeachers} Teachers Active`,
          description: 'May need to hire more teaching staff',
          action: 'View Teachers',
          link: '/teachers',
        });
      }

      setDashboardData({
        criticalAlerts: alerts,
        stats: {
          totalStudents,  // Use total from pagination
          totalTeachers,  // Use total from pagination
          studentsWithoutSponsors,
          activeSchools: 1, // Single school for now
          studentsAtRisk: 0, // Will be calculated from marks data
          pendingApprovals: 0,
        },
        recentActivities: generateRecentActivities(studentsData, teachersData),
        financialSummary: {
          totalSponsors,  // Use total from pagination
          studentsSponsored: studentsWithSponsors,
          coverageRate: totalStudents > 0 ? Math.round((studentsWithSponsors / totalStudents) * 100) : 0,
        },
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const generateRecentActivities = (students, teachers) => {
    const activities = [];
    if (students.length > 0) {
      activities.push({
        id: 1,
        type: 'enrollment',
        message: `${students.length} students currently enrolled`,
        time: 'Current',
      });
    }
    if (teachers.length > 0) {
      activities.push({
        id: 2,
        type: 'user',
        message: `${teachers.length} teachers active in system`,
        time: 'Current',
      });
    }
    return activities;
  };

  const COLORS = ['#4CAF50', '#F44336', '#FF9800', '#2196F3'];

  const sponsorshipData = [
    { name: 'Sponsored', value: dashboardData.financialSummary.studentsSponsored || 0, color: '#4CAF50' },
    { name: 'Need Sponsors', value: dashboardData.stats.studentsWithoutSponsors || 0, color: '#F44336' },
  ];

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="dashboard-loading">
          <div className="spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <div className="dashboard-actions">
          <button className="btn btn-primary">
            <span className="icon">📊</span> Generate Report
          </button>
          <button className="btn btn-secondary">
            <span className="icon">⚙️</span> Settings
          </button>
        </div>
      </div>

      {/* Critical Alerts Section */}
      {dashboardData.criticalAlerts.length > 0 && (
        <div className="critical-alerts-section">
          <h2 className="section-title">
            <span className="alert-badge">{dashboardData.criticalAlerts.length}</span>
            Critical Alerts Requiring Immediate Action
          </h2>
          <div className="alerts-grid">
            {dashboardData.criticalAlerts.map(alert => (
              <div key={alert.id} className={`alert-card alert-${alert.type}`}>
                <div className="alert-icon">{alert.icon}</div>
                <div className="alert-content">
                  <h3>{alert.title}</h3>
                  <p>{alert.description}</p>
                  <a href={alert.link} className="alert-action">
                    {alert.action} →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-blue">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Total Students</h3>
            <div className="stat-value">{dashboardData.stats.totalStudents}</div>
            <p className="stat-subtitle">Currently enrolled</p>
          </div>
        </div>

        <div className="stat-card stat-green">
          <div className="stat-icon">👨‍🏫</div>
          <div className="stat-content">
            <h3>Total Teachers</h3>
            <div className="stat-value">{dashboardData.stats.totalTeachers}</div>
            <p className="stat-subtitle">Active teaching staff</p>
          </div>
        </div>

        <div className="stat-card stat-red">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Need Sponsors</h3>
            <div className="stat-value">{dashboardData.stats.studentsWithoutSponsors}</div>
            <p className="stat-subtitle">Financial support required</p>
          </div>
        </div>

        <div className="stat-card stat-purple">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Sponsor Coverage</h3>
            <div className="stat-value">{dashboardData.financialSummary.coverageRate}%</div>
            <p className="stat-subtitle">Students with sponsors</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Sponsorship Overview */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Sponsorship Overview</h3>
            <button className="btn-link">View Details</button>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sponsorshipData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sponsorshipData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div className="sponsorship-summary">
              <div className="summary-item">
                <span className="label">Total Sponsors:</span>
                <span className="value">{dashboardData.financialSummary.totalSponsors}</span>
              </div>
              <div className="summary-item">
                <span className="label">Students Sponsored:</span>
                <span className="value success">{dashboardData.financialSummary.studentsSponsored}</span>
              </div>
              <div className="summary-item">
                <span className="label">Students Need Help:</span>
                <span className="value danger">{dashboardData.stats.studentsWithoutSponsors}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Quick Actions</h3>
          </div>
          <div className="quick-actions-grid">
            <a href="/students" className="quick-action-btn">
              <span className="icon">👤</span>
              <span className="label">Manage Students</span>
            </a>
            <a href="/teachers" className="quick-action-btn">
              <span className="icon">👨‍🏫</span>
              <span className="label">Manage Teachers</span>
            </a>
            <a href="/sponsors" className="quick-action-btn">
              <span className="icon">💰</span>
              <span className="label">Manage Sponsors</span>
            </a>
            <a href="/users" className="quick-action-btn">
              <span className="icon">👥</span>
              <span className="label">Manage Users</span>
            </a>
            <a href="/report-cards" className="quick-action-btn">
              <span className="icon">📊</span>
              <span className="label">Report Cards</span>
            </a>
            <a href="/analytics" className="quick-action-btn">
              <span className="icon">📈</span>
              <span className="label">Analytics</span>
            </a>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="dashboard-card">
        <div className="card-header">
          <h3>System Overview</h3>
        </div>
        <div className="activities-list">
          {dashboardData.recentActivities.map(activity => (
            <div key={activity.id} className="activity-item">
              <div className={`activity-icon ${activity.type}`}>
                {activity.type === 'enrollment' && '📚'}
                {activity.type === 'user' && '👥'}
              </div>
              <div className="activity-content">
                <p className="activity-message">{activity.message}</p>
                <span className="activity-time">{activity.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Items Summary */}
      <div className="action-items-section">
        <h2 className="section-title">Action Items Summary</h2>
        <div className="action-items-grid">
          <div className="action-item-card">
            <div className="action-number">{dashboardData.stats.studentsWithoutSponsors}</div>
            <div className="action-label">Students Need Sponsors</div>
            <a href="/students" className="action-link">Assign Sponsors →</a>
          </div>
          <div className="action-item-card">
            <div className="action-number">{dashboardData.stats.pendingApprovals}</div>
            <div className="action-label">Pending Approvals</div>
            <a href="/approvals" className="action-link">Review Now →</a>
          </div>
          <div className="action-item-card">
            <div className="action-number">{dashboardData.stats.studentsAtRisk}</div>
            <div className="action-label">Students At Risk</div>
            <a href="/students" className="action-link">View Details →</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
