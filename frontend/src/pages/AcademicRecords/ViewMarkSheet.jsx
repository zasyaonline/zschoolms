import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './ViewMarkSheet.css';

const ViewMarkSheet = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    // Simulate fetching data
    setTimeout(() => {
      setReportData({
        student: {
          name: 'Emma Wilson',
          studentId: 'STU001',
          class: 'Grade 10-A',
          rollNo: '001',
          dob: '2008-05-15',
          parentName: 'Robert Wilson',
          avatar: null
        },
        academicInfo: {
          academicYear: '2024-2025',
          term: 'Term 1',
          examDate: 'March 2024'
        },
        subjects: [
          { name: 'Mathematics', maxMarks: 100, marksObtained: 85, grade: 'A', remarks: 'Excellent' },
          { name: 'Science', maxMarks: 100, marksObtained: 78, grade: 'B', remarks: 'Good' },
          { name: 'English', maxMarks: 100, marksObtained: 92, grade: 'A+', remarks: 'Outstanding' },
          { name: 'Social Studies', maxMarks: 100, marksObtained: 75, grade: 'B', remarks: 'Good' },
          { name: 'Computer Science', maxMarks: 100, marksObtained: 88, grade: 'A', remarks: 'Excellent' },
          { name: 'Physical Education', maxMarks: 55, marksObtained: 52, grade: 'A+', remarks: 'Outstanding' },
        ],
        attendance: {
          totalDays: 120,
          present: 115,
          absent: 5,
          percentage: 95.8
        },
        result: {
          totalMarks: 555,
          marksObtained: 470,
          percentage: 84.68,
          grade: 'A',
          rank: 3,
          status: 'Passed'
        },
        teacherRemarks: 'Emma is an excellent student with consistent performance. She shows great enthusiasm in class and actively participates in discussions.',
        principalRemarks: 'Keep up the good work!',
        nextTermDate: 'April 15, 2024'
      });
      setLoading(false);
    }, 500);
  }, [id]);

  const handleDownload = () => {
    // TODO: Implement PDF download
    // await api.markSheets.download(id);
    alert('Download started');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEmail = () => {
    // TODO: Implement email sending
    // await api.markSheets.sendEmail(id);
    alert('Email sent successfully');
  };

  if (loading) {
    return (
      <div className="view-marksheet">
        <div className="view-marksheet__loading">
          <div className="view-marksheet__spinner"></div>
          <p>Loading report card...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="view-marksheet">
      <div className="view-marksheet__header">
        <div className="view-marksheet__header-left">
          <button className="view-marksheet__back-btn" onClick={() => navigate('/academic/report-cards')}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div>
            <h1 className="view-marksheet__title">Report Card</h1>
            <p className="view-marksheet__subtitle">
              {reportData.student.name} • {reportData.academicInfo.term} {reportData.academicInfo.academicYear}
            </p>
          </div>
        </div>
        <div className="view-marksheet__header-actions">
          <button className="view-marksheet__action-btn" onClick={handlePrint}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4.5 6.75V1.5H13.5V6.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4.5 13.5H3C2.60218 13.5 2.22064 13.342 1.93934 13.0607C1.65804 12.7794 1.5 12.3978 1.5 12V8.25C1.5 7.85218 1.65804 7.47064 1.93934 7.18934C2.22064 6.90804 2.60218 6.75 3 6.75H15C15.3978 6.75 15.7794 6.90804 16.0607 7.18934C16.342 7.47064 16.5 7.85218 16.5 8.25V12C16.5 12.3978 16.342 12.7794 16.0607 13.0607C15.7794 13.342 15.3978 13.5 15 13.5H13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13.5 10.5H4.5V16.5H13.5V10.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Print
          </button>
          <button className="view-marksheet__action-btn" onClick={handleDownload}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M15.75 11.25V14.25C15.75 14.6478 15.592 15.0294 15.3107 15.3107C15.0294 15.592 14.6478 15.75 14.25 15.75H3.75C3.35218 15.75 2.97064 15.592 2.68934 15.3107C2.40804 15.0294 2.25 14.6478 2.25 14.25V11.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5.25 7.5L9 11.25L12.75 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 11.25V2.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Download
          </button>
          <button className="view-marksheet__action-btn view-marksheet__action-btn--primary" onClick={handleEmail}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 3H15C15.825 3 16.5 3.675 16.5 4.5V13.5C16.5 14.325 15.825 15 15 15H3C2.175 15 1.5 14.325 1.5 13.5V4.5C1.5 3.675 2.175 3 3 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16.5 4.5L9 9.75L1.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Send to Parent
          </button>
        </div>
      </div>

      {/* Report Card */}
      <div className="view-marksheet__card" id="report-card">
        {/* School Header */}
        <div className="view-marksheet__school-header">
          <div className="view-marksheet__school-logo">🏫</div>
          <div className="view-marksheet__school-info">
            <h2 className="view-marksheet__school-name">Springfield International School</h2>
            <p className="view-marksheet__school-address">742 Evergreen Terrace, Springfield, IL 62701</p>
            <p className="view-marksheet__school-contact">Phone: +1 (555) 123-4567 | Email: info@springfieldhigh.edu</p>
          </div>
        </div>

        <div className="view-marksheet__report-title">
          <h3>REPORT CARD</h3>
          <p>{reportData.academicInfo.term} - Academic Year {reportData.academicInfo.academicYear}</p>
        </div>

        {/* Student Info */}
        <div className="view-marksheet__student-section">
          <div className="view-marksheet__student-photo">
            {reportData.student.avatar ? (
              <img src={reportData.student.avatar} alt={reportData.student.name} />
            ) : (
              <span>{reportData.student.name.split(' ').map(n => n[0]).join('')}</span>
            )}
          </div>
          <div className="view-marksheet__student-details">
            <div className="view-marksheet__detail-row">
              <div className="view-marksheet__detail">
                <span className="view-marksheet__detail-label">Student Name:</span>
                <span className="view-marksheet__detail-value">{reportData.student.name}</span>
              </div>
              <div className="view-marksheet__detail">
                <span className="view-marksheet__detail-label">Student ID:</span>
                <span className="view-marksheet__detail-value">{reportData.student.studentId}</span>
              </div>
            </div>
            <div className="view-marksheet__detail-row">
              <div className="view-marksheet__detail">
                <span className="view-marksheet__detail-label">Class:</span>
                <span className="view-marksheet__detail-value">{reportData.student.class}</span>
              </div>
              <div className="view-marksheet__detail">
                <span className="view-marksheet__detail-label">Roll Number:</span>
                <span className="view-marksheet__detail-value">{reportData.student.rollNo}</span>
              </div>
            </div>
            <div className="view-marksheet__detail-row">
              <div className="view-marksheet__detail">
                <span className="view-marksheet__detail-label">Date of Birth:</span>
                <span className="view-marksheet__detail-value">{new Date(reportData.student.dob).toLocaleDateString()}</span>
              </div>
              <div className="view-marksheet__detail">
                <span className="view-marksheet__detail-label">Parent/Guardian:</span>
                <span className="view-marksheet__detail-value">{reportData.student.parentName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Marks Table */}
        <div className="view-marksheet__marks-section">
          <h4 className="view-marksheet__section-title">Academic Performance</h4>
          <table className="view-marksheet__marks-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Maximum Marks</th>
                <th>Marks Obtained</th>
                <th>Grade</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {reportData.subjects.map((subject, index) => (
                <tr key={index}>
                  <td>{subject.name}</td>
                  <td>{subject.maxMarks}</td>
                  <td>{subject.marksObtained}</td>
                  <td>
                    <span className={`view-marksheet__grade view-marksheet__grade--${subject.grade.replace('+', 'plus')}`}>
                      {subject.grade}
                    </span>
                  </td>
                  <td>{subject.remarks}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td><strong>Total</strong></td>
                <td><strong>{reportData.result.totalMarks}</strong></td>
                <td><strong>{reportData.result.marksObtained}</strong></td>
                <td colSpan="2">
                  <strong>Percentage: {reportData.result.percentage}%</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Attendance & Result */}
        <div className="view-marksheet__summary-row">
          <div className="view-marksheet__attendance-box">
            <h4 className="view-marksheet__box-title">Attendance Summary</h4>
            <div className="view-marksheet__attendance-stats">
              <div className="view-marksheet__attendance-stat">
                <span className="view-marksheet__attendance-value">{reportData.attendance.totalDays}</span>
                <span className="view-marksheet__attendance-label">Total Days</span>
              </div>
              <div className="view-marksheet__attendance-stat">
                <span className="view-marksheet__attendance-value view-marksheet__attendance-value--present">{reportData.attendance.present}</span>
                <span className="view-marksheet__attendance-label">Present</span>
              </div>
              <div className="view-marksheet__attendance-stat">
                <span className="view-marksheet__attendance-value view-marksheet__attendance-value--absent">{reportData.attendance.absent}</span>
                <span className="view-marksheet__attendance-label">Absent</span>
              </div>
              <div className="view-marksheet__attendance-stat">
                <span className="view-marksheet__attendance-value">{reportData.attendance.percentage}%</span>
                <span className="view-marksheet__attendance-label">Attendance</span>
              </div>
            </div>
          </div>
          <div className="view-marksheet__result-box">
            <h4 className="view-marksheet__box-title">Result</h4>
            <div className="view-marksheet__result-content">
              <div className="view-marksheet__result-grade">{reportData.result.grade}</div>
              <div className="view-marksheet__result-details">
                <span className={`view-marksheet__result-status view-marksheet__result-status--${reportData.result.status.toLowerCase()}`}>
                  {reportData.result.status}
                </span>
                <span className="view-marksheet__result-rank">Class Rank: #{reportData.result.rank}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Remarks */}
        <div className="view-marksheet__remarks-section">
          <div className="view-marksheet__remark">
            <h4 className="view-marksheet__remark-title">Class Teacher's Remarks</h4>
            <p className="view-marksheet__remark-text">{reportData.teacherRemarks}</p>
          </div>
          <div className="view-marksheet__remark">
            <h4 className="view-marksheet__remark-title">Principal's Remarks</h4>
            <p className="view-marksheet__remark-text">{reportData.principalRemarks}</p>
          </div>
        </div>

        {/* Signatures */}
        <div className="view-marksheet__signatures">
          <div className="view-marksheet__signature">
            <div className="view-marksheet__signature-line"></div>
            <span>Class Teacher</span>
          </div>
          <div className="view-marksheet__signature">
            <div className="view-marksheet__signature-line"></div>
            <span>Principal</span>
          </div>
          <div className="view-marksheet__signature">
            <div className="view-marksheet__signature-line"></div>
            <span>Parent/Guardian</span>
          </div>
        </div>

        <div className="view-marksheet__footer">
          <p>Next term begins: {reportData.nextTermDate}</p>
          <p className="view-marksheet__disclaimer">This is a computer-generated report card.</p>
        </div>
      </div>
    </div>
  );
};

export default ViewMarkSheet;
