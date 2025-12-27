import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './SponsorDashboard.css';
import api from '../../services/api';

const SponsorDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    sponsor: {},
    stats: {
      totalStudents: 0,
      activeSponsorships: 0,
      expiredSponsorships: 0,
      terminatedSponsorships: 0,
    },
    students: [],
  });

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/sponsors/me/dashboard');
      if (response.success && response.data) {
        setDashboardData(response.data);
      }
    } catch (err) {
      console.error('Error fetching sponsor dashboard:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active': return 'sponsor-dashboard__badge--success';
      case 'expired': return 'sponsor-dashboard__badge--warning';
      case 'terminated': return 'sponsor-dashboard__badge--danger';
      default: return 'sponsor-dashboard__badge--default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="sponsor-dashboard">
        <div className="sponsor-dashboard__loading">
          <div className="sponsor-dashboard__spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sponsor-dashboard">
        <div className="sponsor-dashboard__error">
          <span className="sponsor-dashboard__error-icon">⚠️</span>
          <h3>Unable to load dashboard</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchDashboardData}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sponsor-dashboard">
      {/* Header */}
      <div className="sponsor-dashboard__header">
        <div className="sponsor-dashboard__welcome">
          <h1 className="sponsor-dashboard__title">Welcome, {dashboardData.sponsor?.name || 'Sponsor'}</h1>
          <p className="sponsor-dashboard__subtitle">
            {dashboardData.sponsor?.organization || 'Individual Sponsor'} • {dashboardData.sponsor?.email}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="sponsor-dashboard__stats">
        <div className="sponsor-dashboard__stat-card sponsor-dashboard__stat-card--primary">
          <div className="sponsor-dashboard__stat-icon">👨‍🎓</div>
          <div className="sponsor-dashboard__stat-content">
            <span className="sponsor-dashboard__stat-value">{dashboardData.stats.totalStudents}</span>
            <span className="sponsor-dashboard__stat-label">Total Students</span>
          </div>
        </div>
        <div className="sponsor-dashboard__stat-card sponsor-dashboard__stat-card--success">
          <div className="sponsor-dashboard__stat-icon">✅</div>
          <div className="sponsor-dashboard__stat-content">
            <span className="sponsor-dashboard__stat-value">{dashboardData.stats.activeSponsorships}</span>
            <span className="sponsor-dashboard__stat-label">Active Sponsorships</span>
          </div>
        </div>
        <div className="sponsor-dashboard__stat-card sponsor-dashboard__stat-card--warning">
          <div className="sponsor-dashboard__stat-icon">⏳</div>
          <div className="sponsor-dashboard__stat-content">
            <span className="sponsor-dashboard__stat-value">{dashboardData.stats.expiredSponsorships}</span>
            <span className="sponsor-dashboard__stat-label">Expired</span>
          </div>
        </div>
        <div className="sponsor-dashboard__stat-card sponsor-dashboard__stat-card--neutral">
          <div className="sponsor-dashboard__stat-icon">📋</div>
          <div className="sponsor-dashboard__stat-content">
            <span className="sponsor-dashboard__stat-value">{dashboardData.stats.terminatedSponsorships}</span>
            <span className="sponsor-dashboard__stat-label">Terminated</span>
          </div>
        </div>
      </div>

      {/* Students Section */}
      <div className="sponsor-dashboard__section">
        <div className="sponsor-dashboard__section-header">
          <h2 className="sponsor-dashboard__section-title">Your Sponsored Students</h2>
          <button 
            className="btn btn-outline"
            onClick={() => navigate('/sponsor/students')}
          >
            View All
          </button>
        </div>

        {dashboardData.students.length === 0 ? (
          <div className="sponsor-dashboard__empty">
            <span className="sponsor-dashboard__empty-icon">📚</span>
            <h3>No Students Yet</h3>
            <p>You don't have any sponsored students at the moment.</p>
          </div>
        ) : (
          <div className="sponsor-dashboard__students-grid">
            {dashboardData.students.slice(0, 6).map((student, index) => (
              <div key={student.id || index} className="sponsor-dashboard__student-card">
                <div className="sponsor-dashboard__student-header">
                  <div className="sponsor-dashboard__student-avatar">
                    {getInitials(student.name)}
                  </div>
                  <div className="sponsor-dashboard__student-info">
                    <h4 className="sponsor-dashboard__student-name">{student.name}</h4>
                    <p className="sponsor-dashboard__student-class">Class: {student.class || 'N/A'}</p>
                  </div>
                  <span className={`sponsor-dashboard__badge ${getStatusBadgeClass(student.sponsorshipStatus)}`}>
                    {student.sponsorshipStatus}
                  </span>
                </div>
                <div className="sponsor-dashboard__student-details">
                  <div className="sponsor-dashboard__detail-row">
                    <span className="sponsor-dashboard__detail-label">Sponsorship Type:</span>
                    <span className="sponsor-dashboard__detail-value">{student.sponsorshipType || 'Full'}</span>
                  </div>
                  <div className="sponsor-dashboard__detail-row">
                    <span className="sponsor-dashboard__detail-label">Start Date:</span>
                    <span className="sponsor-dashboard__detail-value">{formatDate(student.startDate)}</span>
                  </div>
                  {student.endDate && (
                    <div className="sponsor-dashboard__detail-row">
                      <span className="sponsor-dashboard__detail-label">End Date:</span>
                      <span className="sponsor-dashboard__detail-value">{formatDate(student.endDate)}</span>
                    </div>
                  )}
                </div>
                <div className="sponsor-dashboard__student-actions">
                  <button 
                    className="btn btn-sm btn-outline"
                    onClick={() => navigate(`/sponsor/student/${student.id}`)}
                  >
                    View Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Notice */}
      <div className="sponsor-dashboard__notice">
        <span className="sponsor-dashboard__notice-icon">ℹ️</span>
        <div className="sponsor-dashboard__notice-content">
          <h4>Academic Progress & Reports</h4>
          <p>
            Detailed academic progress charts, attendance summaries, and downloadable report cards 
            will be available in a future update. You will receive email notifications when new 
            report cards are published for your sponsored students.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SponsorDashboard;
