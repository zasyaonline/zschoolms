import { useState } from 'react';
import './ViewGeneratedPDF.css';

const ViewGeneratedPDF = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [pdfReports] = useState([
    { id: 1, studentName: 'John Doe', grade: '9A', academicYear: '2024-2025' },
    { id: 2, studentName: 'John Doe', grade: '9B', academicYear: '2024-2025' },
    { id: 3, studentName: 'Jane Smith', grade: '10A', academicYear: '2024-2025' },
    { id: 4, studentName: 'Emily Johnson', grade: '8B', academicYear: '2024-2025' },
    { id: 5, studentName: 'Michael Brown', grade: '7A', academicYear: '2024-2025' },
    { id: 6, studentName: 'Jessica Davis', grade: '8C', academicYear: '2024-2025' },
    { id: 7, studentName: 'Chris Wilson', grade: '9A', academicYear: '2024-2025' },
    { id: 8, studentName: 'Sarah Taylor', grade: '10B', academicYear: '2024-2025' },
  ]);

  const handlePreview = () => {
    // TODO: Open PDF preview
    // window.open(`/api/reports/${id}/preview`, '_blank');
  };

  const handleDownload = () => {
    // TODO: Download PDF
    // await api.reports.download(id);
  };

  const handleSendBulkEmail = () => {
    // TODO: Navigate to bulk email page
    // navigate('/send-bulk-email');
  };

  const filteredReports = pdfReports.filter(report => {
    const searchLower = searchQuery.toLowerCase();
    return (
      report.studentName.toLowerCase().includes(searchLower) ||
      report.grade.toLowerCase().includes(searchLower) ||
      report.academicYear.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="view-pdf">
      <div className="view-pdf__title-container">
        <h1 className="view-pdf__title">View Generated PDF</h1>
      </div>

      <div className="view-pdf__card">
        <div className="view-pdf__controls">
          <div className="view-pdf__search">
            <svg className="view-pdf__search-icon" width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M8.625 15.75C12.56 15.75 15.75 12.56 15.75 8.625C15.75 4.68997 12.56 1.5 8.625 1.5C4.68997 1.5 1.5 4.68997 1.5 8.625C1.5 12.56 4.68997 15.75 8.625 15.75Z" stroke="#8D8D8D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16.5 16.5L15 15" stroke="#8D8D8D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <input
              type="text"
              className="view-pdf__search-input"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="view-pdf__action-buttons">
            <button className="view-pdf__filter-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M5.40002 2.10001L18.6 2.10001" stroke="#8D8D8D" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="15.6" cy="2.10001" r="2.01176" fill="#8D8D8D"/>
                <path d="M5.40002 12L18.6 12" stroke="#8D8D8D" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="8.39999" cy="12" r="2.01176" fill="#8D8D8D"/>
                <path d="M5.40002 21.9L18.6 21.9" stroke="#8D8D8D" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="15.6" cy="21.9" r="2.01176" fill="#8D8D8D"/>
              </svg>
            </button>
            <button className="view-pdf__send-bulk-email-btn" onClick={handleSendBulkEmail}>
              Send Bulk Email
            </button>
          </div>
        </div>

        <div className="view-pdf__table">
          <div className="view-pdf__table-header">
            <div className="view-pdf__header-cell view-pdf__header-cell--name">
              Student Name
            </div>
            <div className="view-pdf__header-cell view-pdf__header-cell--grade">
              Grade/Class
            </div>
            <div className="view-pdf__header-cell view-pdf__header-cell--year">
              Academic Year
            </div>
            <div className="view-pdf__header-cell view-pdf__header-cell--actions">
              Actions
            </div>
          </div>

          <div className="view-pdf__table-body">
            {filteredReports.map((report, index) => (
              <div key={report.id}>
                <div className="view-pdf__table-row">
                  <div className="view-pdf__cell view-pdf__cell--name">
                    {report.studentName}
                  </div>
                  <div className="view-pdf__cell view-pdf__cell--grade">
                    {report.grade}
                  </div>
                  <div className="view-pdf__cell view-pdf__cell--year">
                    {report.academicYear}
                  </div>
                  <div className="view-pdf__cell view-pdf__cell--actions">
                    <button 
                      className="view-pdf__action-btn view-pdf__action-btn--preview"
                      onClick={() => handlePreview(report.id)}
                    >
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M11.6325 9C11.6325 10.455 10.455 11.6325 9 11.6325C7.545 11.6325 6.3675 10.455 6.3675 9C6.3675 7.545 7.545 6.3675 9 6.3675C10.455 6.3675 11.6325 7.545 11.6325 9Z" stroke="#1F55A6" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M9 15.2625C11.73 15.2625 14.2575 13.6575 15.7875 11.0625C16.3875 10.0575 16.3875 7.935 15.7875 6.93C14.2575 4.335 11.73 2.73 9 2.73C6.27 2.73 3.7425 4.335 2.2125 6.93C1.6125 7.935 1.6125 10.0575 2.2125 11.0625C3.7425 13.6575 6.27 15.2625 9 15.2625Z" stroke="#1F55A6" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Preview
                    </button>
                    <button 
                      className="view-pdf__action-btn view-pdf__action-btn--download"
                      onClick={() => handleDownload(report.id)}
                    >
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ transform: 'rotate(180deg)' }}>
                        <path d="M15.75 11.25V12.75C15.75 14.4069 14.4069 15.75 12.75 15.75H5.25C3.59315 15.75 2.25 14.4069 2.25 12.75V11.25" stroke="#1F55A6" strokeWidth="1.2" strokeLinecap="round"/>
                        <path d="M9 2.25V11.25" stroke="#1F55A6" strokeWidth="1.2" strokeLinecap="round"/>
                        <path d="M6 9L9 11.25L12 9" stroke="#1F55A6" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Download
                    </button>
                  </div>
                </div>
                {index < filteredReports.length - 1 && (
                  <div className="view-pdf__divider"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="view-pdf__footer">
        <a href="#" className="view-pdf__footer-link">Need Help?</a>
        <a href="#" className="view-pdf__footer-link">Contact Support</a>
      </div>
    </div>
  );
};

export default ViewGeneratedPDF;
