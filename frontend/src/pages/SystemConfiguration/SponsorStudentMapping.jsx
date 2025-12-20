import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SponsorStudentMapping.css';

const SponsorStudentMapping = () => {
  const navigate = useNavigate();
  const [searchStudent, setSearchStudent] = useState('');
  const [searchSponsor, setSearchSponsor] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedSponsor, setSelectedSponsor] = useState(null);

  const [students] = useState([
    { id: 1, name: 'Emma Wilson', studentId: 'STU001', grade: 'Grade 10-A', status: 'unsponsored', avatar: null },
    { id: 2, name: 'James Miller', studentId: 'STU002', grade: 'Grade 9-B', status: 'unsponsored', avatar: null },
    { id: 3, name: 'Sarah Davis', studentId: 'STU003', grade: 'Grade 11-A', status: 'sponsored', sponsor: 'ABC Foundation', avatar: null },
    { id: 4, name: 'Michael Brown', studentId: 'STU004', grade: 'Grade 8-C', status: 'unsponsored', avatar: null },
    { id: 5, name: 'Emily Johnson', studentId: 'STU005', grade: 'Grade 10-B', status: 'sponsored', sponsor: 'XYZ Trust', avatar: null },
    { id: 6, name: 'David Lee', studentId: 'STU006', grade: 'Grade 12-A', status: 'unsponsored', avatar: null },
  ]);

  const [sponsors] = useState([
    { id: 1, name: 'ABC Foundation', type: 'Organization', sponsoredCount: 25, contact: 'contact@abcfoundation.org' },
    { id: 2, name: 'XYZ Trust', type: 'Organization', sponsoredCount: 18, contact: 'info@xyztrust.com' },
    { id: 3, name: 'John Smith', type: 'Individual', sponsoredCount: 3, contact: 'john.smith@email.com' },
    { id: 4, name: 'Global Education Fund', type: 'Organization', sponsoredCount: 42, contact: 'support@gef.org' },
    { id: 5, name: 'Mary Johnson', type: 'Individual', sponsoredCount: 5, contact: 'mary.j@email.com' },
  ]);

  const [mappings] = useState([
    { id: 1, student: 'Sarah Davis', studentId: 'STU003', sponsor: 'ABC Foundation', startDate: '2024-01-15', status: 'active' },
    { id: 2, student: 'Emily Johnson', studentId: 'STU005', sponsor: 'XYZ Trust', startDate: '2024-02-01', status: 'active' },
    { id: 3, student: 'Robert Chen', studentId: 'STU007', sponsor: 'John Smith', startDate: '2023-09-01', status: 'active' },
  ]);

  const filteredStudents = students.filter(s => 
    s.status === 'unsponsored' &&
    (s.name.toLowerCase().includes(searchStudent.toLowerCase()) ||
     s.studentId.toLowerCase().includes(searchStudent.toLowerCase()))
  );

  const filteredSponsors = sponsors.filter(s =>
    s.name.toLowerCase().includes(searchSponsor.toLowerCase())
  );

  const handleStudentSelect = (studentId) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      }
      return [...prev, studentId];
    });
  };

  const handleSponsorSelect = (sponsor) => {
    setSelectedSponsor(sponsor);
  };

  const handleCreateMapping = () => {
    if (selectedStudents.length > 0 && selectedSponsor) {
      // TODO: Add API call to create mapping
      // await api.sponsorMappings.create({ students: selectedStudents, sponsor: selectedSponsor });
      setSelectedStudents([]);
      setSelectedSponsor(null);
    }
  };

  return (
    <div className="sponsor-mapping">
      <div className="sponsor-mapping__header">
        <div className="sponsor-mapping__header-left">
          <h1 className="sponsor-mapping__title">Sponsor-Student Mapping</h1>
          <p className="sponsor-mapping__subtitle">Assign sponsors to students for financial support</p>
        </div>
        <button className="sponsor-mapping__add-sponsor-btn" onClick={() => navigate('/sponsors/add')}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Add New Sponsor
        </button>
      </div>

      <div className="sponsor-mapping__content">
        {/* Selection Panel */}
        <div className="sponsor-mapping__selection">
          {/* Students Panel */}
          <div className="sponsor-mapping__panel">
            <div className="sponsor-mapping__panel-header">
              <h3 className="sponsor-mapping__panel-title">
                <span className="sponsor-mapping__panel-icon">👤</span>
                Unsponsored Students
              </h3>
              <span className="sponsor-mapping__panel-count">{filteredStudents.length} available</span>
            </div>
            <div className="sponsor-mapping__search">
              <svg className="sponsor-mapping__search-icon" width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M8.25 14.25C11.5637 14.25 14.25 11.5637 14.25 8.25C14.25 4.93629 11.5637 2.25 8.25 2.25C4.93629 2.25 2.25 4.93629 2.25 8.25C2.25 11.5637 4.93629 14.25 8.25 14.25Z" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15.75 15.75L12.4875 12.4875" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <input
                type="text"
                placeholder="Search students..."
                className="sponsor-mapping__search-input"
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
              />
            </div>
            <div className="sponsor-mapping__list">
              {filteredStudents.map(student => (
                <div 
                  key={student.id} 
                  className={`sponsor-mapping__item ${selectedStudents.includes(student.id) ? 'sponsor-mapping__item--selected' : ''}`}
                  onClick={() => handleStudentSelect(student.id)}
                >
                  <div className="sponsor-mapping__checkbox">
                    {selectedStudents.includes(student.id) && (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M11.6667 3.5L5.25 9.91667L2.33333 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <div className="sponsor-mapping__item-avatar">
                    {student.name.charAt(0)}
                  </div>
                  <div className="sponsor-mapping__item-info">
                    <span className="sponsor-mapping__item-name">{student.name}</span>
                    <span className="sponsor-mapping__item-meta">{student.studentId} • {student.grade}</span>
                  </div>
                </div>
              ))}
              {filteredStudents.length === 0 && (
                <div className="sponsor-mapping__empty">
                  No unsponsored students found
                </div>
              )}
            </div>
          </div>

          {/* Arrow */}
          <div className="sponsor-mapping__arrow">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="20" fill="#E5E7EB"/>
              <path d="M12 20H28M28 20L22 14M28 20L22 26" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* Sponsors Panel */}
          <div className="sponsor-mapping__panel">
            <div className="sponsor-mapping__panel-header">
              <h3 className="sponsor-mapping__panel-title">
                <span className="sponsor-mapping__panel-icon">🤝</span>
                Sponsors
              </h3>
              <span className="sponsor-mapping__panel-count">{sponsors.length} total</span>
            </div>
            <div className="sponsor-mapping__search">
              <svg className="sponsor-mapping__search-icon" width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M8.25 14.25C11.5637 14.25 14.25 11.5637 14.25 8.25C14.25 4.93629 11.5637 2.25 8.25 2.25C4.93629 2.25 2.25 4.93629 2.25 8.25C2.25 11.5637 4.93629 14.25 8.25 14.25Z" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15.75 15.75L12.4875 12.4875" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <input
                type="text"
                placeholder="Search sponsors..."
                className="sponsor-mapping__search-input"
                value={searchSponsor}
                onChange={(e) => setSearchSponsor(e.target.value)}
              />
            </div>
            <div className="sponsor-mapping__list">
              {filteredSponsors.map(sponsor => (
                <div 
                  key={sponsor.id} 
                  className={`sponsor-mapping__item ${selectedSponsor?.id === sponsor.id ? 'sponsor-mapping__item--selected' : ''}`}
                  onClick={() => handleSponsorSelect(sponsor)}
                >
                  <div className="sponsor-mapping__radio">
                    {selectedSponsor?.id === sponsor.id && <div className="sponsor-mapping__radio-dot"></div>}
                  </div>
                  <div className="sponsor-mapping__item-avatar sponsor-mapping__item-avatar--sponsor">
                    {sponsor.type === 'Organization' ? '🏢' : '👤'}
                  </div>
                  <div className="sponsor-mapping__item-info">
                    <span className="sponsor-mapping__item-name">{sponsor.name}</span>
                    <span className="sponsor-mapping__item-meta">{sponsor.type} • {sponsor.sponsoredCount} students</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="sponsor-mapping__action">
          <button 
            className="sponsor-mapping__create-btn"
            disabled={selectedStudents.length === 0 || !selectedSponsor}
            onClick={handleCreateMapping}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M8.33333 17.5H3.33333C2.89131 17.5 2.46738 17.3244 2.15482 17.0118C1.84226 16.6993 1.66667 16.2754 1.66667 15.8333V4.16667C1.66667 3.72464 1.84226 3.30072 2.15482 2.98816C2.46738 2.67559 2.89131 2.5 3.33333 2.5H14.1667C14.6087 2.5 15.0326 2.67559 15.3452 2.98816C15.6577 3.30072 15.8333 3.72464 15.8333 4.16667V9.16667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12.5 15.8333L14.1667 17.5L18.3333 13.3333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Create Mapping ({selectedStudents.length} students → {selectedSponsor?.name || 'Select sponsor'})
          </button>
        </div>

        {/* Existing Mappings */}
        <div className="sponsor-mapping__existing">
          <div className="sponsor-mapping__existing-header">
            <h3 className="sponsor-mapping__existing-title">Existing Mappings</h3>
            <span className="sponsor-mapping__existing-count">{mappings.length} active mappings</span>
          </div>
          <div className="sponsor-mapping__table-wrapper">
            <table className="sponsor-mapping__table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Student ID</th>
                  <th>Sponsor</th>
                  <th>Start Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {mappings.map(mapping => (
                  <tr key={mapping.id}>
                    <td>{mapping.student}</td>
                    <td>{mapping.studentId}</td>
                    <td>{mapping.sponsor}</td>
                    <td>{new Date(mapping.startDate).toLocaleDateString()}</td>
                    <td>
                      <span className={`sponsor-mapping__status sponsor-mapping__status--${mapping.status}`}>
                        {mapping.status}
                      </span>
                    </td>
                    <td>
                      <div className="sponsor-mapping__table-actions">
                        <button className="sponsor-mapping__table-btn" title="View Details">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M1 8C1 8 3.5 3 8 3C12.5 3 15 8 15 8C15 8 12.5 13 8 13C3.5 13 1 8 1 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        <button className="sponsor-mapping__table-btn sponsor-mapping__table-btn--danger" title="End Mapping">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SponsorStudentMapping;
