import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ReportCardList.css';

const ReportCardList = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState('9A');
  const [selectedTerm, setSelectedTerm] = useState('2024-2025');
  const [reportCards, setReportCards] = useState([
    { id: 1, studentName: 'John Doe', grade: '9A', status: 'pending', academicYear: '2024-2025' },
    { id: 2, studentName: 'John Doe', grade: '8B', status: 'generated', academicYear: '2024-2025' },
    { id: 3, studentName: 'Jane Smith', grade: '9C', status: 'pending', academicYear: '2024-2025' },
    { id: 4, studentName: 'Emily Johnson', grade: '7A', status: 'generated', academicYear: '2024-2025' },
    { id: 5, studentName: 'Michael Brown', grade: '7B', status: 'generated', academicYear: '2024-2025' },
    { id: 6, studentName: 'Jessica Davis', grade: '8B', status: 'generated', academicYear: '2024-2025' },
    { id: 7, studentName: 'Chris Wilson', grade: '9C', status: 'generated', academicYear: '2024-2025' },
    { id: 8, studentName: 'Sarah Taylor', grade: '10A', status: 'generated', academicYear: '2024-2025' },
  ]);

  const handleGenerateReport = (id) => {
    setReportCards(reportCards.map(card => 
      card.id === id ? { ...card, status: 'generated' } : card
    ));
  };

  const handleBulkGenerate = () => {
    setShowBulkModal(true);
  };

  const handleConfirmBulkGenerate = () => {
    // Generate reports for all students in selected grade and term
    setReportCards(reportCards.map(card => 
      (card.grade === selectedGrade || selectedGrade === 'All') && 
      card.academicYear === selectedTerm 
        ? { ...card, status: 'generated' } 
        : card
    ));
    setShowBulkModal(false);
  };

  const handleCancelBulkGenerate = () => {
    setShowBulkModal(false);
  };

  const handleViewGeneratedPDF = () => {
    navigate('/view-generated-pdf');
  };

  const filteredReportCards = reportCards.filter(card => {
    const searchLower = searchQuery.toLowerCase();
    return (
      card.studentName.toLowerCase().includes(searchLower) ||
      card.grade.toLowerCase().includes(searchLower) ||
      card.status.toLowerCase().includes(searchLower) ||
      card.academicYear.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="report-cards">
      <div className="report-cards__title-container">
        <h1 className="report-cards__title">Report Card List</h1>
      </div>

      <div className="report-cards__card">
        <div className="report-cards__controls">
          <div className="report-cards__search">
            <svg className="report-cards__search-icon" width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M8.625 15.75C12.56 15.75 15.75 12.56 15.75 8.625C15.75 4.68997 12.56 1.5 8.625 1.5C4.68997 1.5 1.5 4.68997 1.5 8.625C1.5 12.56 4.68997 15.75 8.625 15.75Z" stroke="#8D8D8D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16.5 16.5L15 15" stroke="#8D8D8D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <input
              type="text"
              className="report-cards__search-input"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="report-cards__action-buttons">
            <button className="report-cards__filter-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M5.40002 2.10001L18.6 2.10001" stroke="#8D8D8D" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="15.6" cy="2.10001" r="2.01176" fill="#8D8D8D"/>
                <path d="M5.40002 12L18.6 12" stroke="#8D8D8D" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="8.39999" cy="12" r="2.01176" fill="#8D8D8D"/>
                <path d="M5.40002 21.9L18.6 21.9" stroke="#8D8D8D" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="15.6" cy="21.9" r="2.01176" fill="#8D8D8D"/>
              </svg>
            </button>
            <button className="report-cards__view-pdf-btn" onClick={handleViewGeneratedPDF}>
              View Generated PDF
            </button>
            <button className="report-cards__bulk-generate-btn" onClick={handleBulkGenerate}>
              Bulk Generate
            </button>
          </div>
        </div>

        <div className="report-cards__table">
          <div className="report-cards__table-header">
            <div className="report-cards__header-cell report-cards__header-cell--name">
              Student Name
            </div>
            <div className="report-cards__header-cell report-cards__header-cell--grade">
              Grade
            </div>
            <div className="report-cards__header-cell report-cards__header-cell--status">
              Status
            </div>
            <div className="report-cards__header-cell report-cards__header-cell--year">
              Academic Year
            </div>
            <div className="report-cards__header-cell report-cards__header-cell--actions">
              Actions
            </div>
          </div>

          <div className="report-cards__table-body">
            {filteredReportCards.map((card, index) => (
              <div key={card.id}>
                <div className="report-cards__table-row">
                  <div className="report-cards__cell report-cards__cell--name">
                    {card.studentName}
                  </div>
                  <div className="report-cards__cell report-cards__cell--grade">
                    {card.grade}
                  </div>
                  <div className="report-cards__cell report-cards__cell--status">
                    {card.status === 'pending' ? 'Pending' : 'Generated'}
                  </div>
                  <div className="report-cards__cell report-cards__cell--year">
                    {card.academicYear}
                  </div>
                  <div className="report-cards__cell report-cards__cell--actions">
                    {card.status === 'pending' ? (
                      <button 
                        className="report-cards__action-btn report-cards__action-btn--generate"
                        onClick={() => handleGenerateReport(card.id)}
                      >
                        Generate Report
                      </button>
                    ) : (
                      <div className="report-cards__status-badge">
                        Generated
                      </div>
                    )}

      {/* Bulk Generate Modal */}
      {showBulkModal && (
        <div className="report-cards__modal-overlay" onClick={handleCancelBulkGenerate}>
          <div className="report-cards__modal" onClick={(e) => e.stopPropagation()}>
            <div className="report-cards__modal-header">
              <h2 className="report-cards__modal-title">Generate All Report Cards (Bulk)</h2>
            </div>

            <div className="report-cards__modal-divider"></div>

            <div className="report-cards__modal-content">
              <div className="report-cards__modal-field">
                <label className="report-cards__modal-label">Grade/Class</label>
                <div className="report-cards__modal-select-wrapper">
                  <select 
                    className="report-cards__modal-select"
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                  >
                    <option value="All">All Grades</option>
                    <option value="7A">7A</option>
                    <option value="7B">7B</option>
                    <option value="8B">8B</option>
                    <option value="9A">9A</option>
                    <option value="9C">9C</option>
                    <option value="10A">10A</option>
                  </select>
                  <svg className="report-cards__modal-select-arrow" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M19.92 8.95001L13.4 15.47C12.63 16.24 11.37 16.24 10.6 15.47L4.08002 8.95001" stroke="#8D8D8D" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              <div className="report-cards__modal-field">
                <label className="report-cards__modal-label">Term</label>
                <div className="report-cards__modal-select-wrapper">
                  <select 
                    className="report-cards__modal-select"
                    value={selectedTerm}
                    onChange={(e) => setSelectedTerm(e.target.value)}
                  >
                    <option value="2023-2024">2023-2024</option>
                    <option value="2024-2025">2024-2025</option>
                    <option value="2025-2026">2025-2026</option>
                  </select>
                  <svg className="report-cards__modal-select-arrow" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M19.92 8.95001L13.4 15.47C12.63 16.24 11.37 16.24 10.6 15.47L4.08002 8.95001" stroke="#8D8D8D" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

            <div className="report-cards__modal-actions">
              <button 
                className="report-cards__modal-btn report-cards__modal-btn--generate"
                onClick={handleConfirmBulkGenerate}
              >
                Generate Reports
              </button>
              <button 
                className="report-cards__modal-btn report-cards__modal-btn--cancel"
                onClick={handleCancelBulkGenerate}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
                  </div>
                </div>
                {index < filteredReportCards.length - 1 && (
                  <div className="report-cards__divider"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="report-cards__footer">
        <a href="#" className="report-cards__footer-link">Need Help?</a>
        <a href="#" className="report-cards__footer-link">Contact Support</a>
      </div>
    </div>
  );
};

export default ReportCardList;
