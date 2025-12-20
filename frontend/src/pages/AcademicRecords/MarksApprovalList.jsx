import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MarksApprovalList.css';

const MarksApprovalList = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [approvalList, setApprovalList] = useState([
    {
      id: 1,
      teacherName: 'Alex Buckmaster',
      studentName: 'John Doe',
      grade: '9A',
      subject: 'Mathematics',
      marks: 85,
      status: 'pending'
    },
    {
      id: 2,
      teacherName: 'Samantha Green',
      studentName: 'Michael Liu',
      grade: '7C',
      subject: 'Physics',
      marks: 92,
      status: 'approved'
    },
    {
      id: 3,
      teacherName: 'Emily Carter',
      studentName: 'David Smith',
      grade: '10B',
      subject: 'Chemistry',
      marks: 78,
      status: 'pending'
    },
    {
      id: 4,
      teacherName: 'Ryan Taylor',
      studentName: 'Sophia Johnson',
      grade: '9B',
      subject: 'Biology',
      marks: 88,
      status: 'declined'
    },
    {
      id: 5,
      teacherName: 'Olivia Martinez',
      studentName: 'Daniel Brown',
      grade: '8A',
      subject: 'History',
      marks: 90,
      status: 'pending'
    },
    {
      id: 6,
      teacherName: 'Ethan Wilson',
      studentName: 'Emma Garcia',
      grade: '7A',
      subject: 'Literature',
      marks: 95,
      status: 'pending'
    },
    {
      id: 7,
      teacherName: 'Mia Perez',
      studentName: 'Luke Robinson',
      grade: '6B',
      subject: 'Geography',
      marks: 83,
      status: 'pending'
    },
    {
      id: 8,
      teacherName: 'Isabella Hall',
      studentName: 'James Clark',
      grade: '11A',
      subject: 'Computer Science',
      marks: 80,
      status: 'pending'
    }
  ]);

  const handleApprove = (id) => {
    setApprovalList(approvalList.map(item =>
      item.id === id ? { ...item, status: 'approved' } : item
    ));
  };

  const handleDecline = (id) => {
    setApprovalList(approvalList.map(item =>
      item.id === id ? { ...item, status: 'declined' } : item
    ));
  };

  const handleViewReview = (id) => {
    navigate(`/marks-review/${id}`);
  };

  const filteredList = approvalList.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.teacherName.toLowerCase().includes(query) ||
      item.studentName.toLowerCase().includes(query) ||
      item.grade.toLowerCase().includes(query) ||
      item.subject.toLowerCase().includes(query) ||
      item.marks.toString().includes(query)
    );
  });

  return (
    <div className="approvals-list">
      <div className="approvals-list__header">
        <h1 className="approvals-list__title">Approvals List</h1>
      </div>

      <div className="approvals-list__content">
        <div className="approvals-list__search-bar">
          <div className="approvals-list__search">
            <svg className="approvals-list__search-icon" width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M8.25 14.25C11.5637 14.25 14.25 11.5637 14.25 8.25C14.25 4.93629 11.5637 2.25 8.25 2.25C4.93629 2.25 2.25 4.93629 2.25 8.25C2.25 11.5637 4.93629 14.25 8.25 14.25Z" stroke="#8D8D8D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15.75 15.75L12.4875 12.4875" stroke="#8D8D8D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="approvals-list__search-input"
            />
          </div>
          <button className="approvals-list__filter-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M5.25 8.25L3 10.5L5.25 12.75" stroke="#8D8D8D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18.75 8.25L21 10.5L18.75 12.75" stroke="#8D8D8D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 3V21" stroke="#8D8D8D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <div className="approvals-list__table-wrapper">
          <div className="approvals-list__table-header">
            <div className="approvals-list__table-header-cell" style={{ width: '200px' }}>Teacher Name</div>
            <div className="approvals-list__table-header-cell" style={{ width: '200px' }}>Student Name</div>
            <div className="approvals-list__table-header-cell" style={{ width: '130px' }}>Grade/Class</div>
            <div className="approvals-list__table-header-cell" style={{ width: '200px' }}>Subject</div>
            <div className="approvals-list__table-header-cell" style={{ width: '100px' }}>Marks</div>
            <div className="approvals-list__table-header-cell approvals-list__table-header-cell--center" style={{ flex: '1' }}>Actions</div>
          </div>

          <div className="approvals-list__table-body">
            {filteredList.map((item, index) => (
              <div key={item.id}>
                <div className="approvals-list__table-row">
                  <div className="approvals-list__table-cell" style={{ width: '200px' }}>{item.teacherName}</div>
                  <div className="approvals-list__table-cell" style={{ width: '200px' }}>{item.studentName}</div>
                  <div className="approvals-list__table-cell" style={{ width: '130px' }}>{item.grade}</div>
                  <div className="approvals-list__table-cell" style={{ width: '200px' }}>{item.subject}</div>
                  <div className="approvals-list__table-cell" style={{ width: '100px' }}>{item.marks}</div>
                  <div className="approvals-list__table-cell approvals-list__table-cell--actions" style={{ flex: '1' }}>
                    {item.status === 'pending' && (
                      <div className="approvals-list__actions">
                        <button
                          className="approvals-list__action-btn approvals-list__action-btn--view"
                          onClick={() => handleViewReview(item.id)}
                          title="View Details"
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M15.58 12C15.58 13.98 13.98 15.58 12 15.58C10.02 15.58 8.42 13.98 8.42 12C8.42 10.02 10.02 8.42 12 8.42C13.98 8.42 15.58 10.02 15.58 12Z" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M12 20.27C15.53 20.27 18.82 18.19 21.11 14.59C22.01 13.18 22.01 10.81 21.11 9.39997C18.82 5.79997 15.53 3.71997 12 3.71997C8.46997 3.71997 5.17997 5.79997 2.88997 9.39997C1.98997 10.81 1.98997 13.18 2.88997 14.59C5.17997 18.19 8.46997 20.27 12 20.27Z" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        <button
                          className="approvals-list__action-btn approvals-list__action-btn--approve"
                          onClick={() => handleApprove(item.id)}
                          title="Approve"
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M5 13L9 17L19 7" stroke="#1F55A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        <button
                          className="approvals-list__action-btn approvals-list__action-btn--decline"
                          onClick={() => handleDecline(item.id)}
                          title="Decline"
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6L18 18" stroke="#E00000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    )}
                    {item.status === 'approved' && (
                      <div className="approvals-list__status approvals-list__status--approved">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <path d="M5 13L9 17L19 7" stroke="#1F55A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>Approved</span>
                      </div>
                    )}
                    {item.status === 'declined' && (
                      <div className="approvals-list__status approvals-list__status--declined">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <path d="M18 6L6 18M6 6L18 18" stroke="#E00000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>Decline</span>
                      </div>
                    )}
                  </div>
                </div>
                {index < filteredList.length - 1 && <div className="approvals-list__table-divider" />}
              </div>
            ))}
          </div>
        </div>

        <div className="approvals-list__footer">
          <a href="#" className="approvals-list__footer-link">Need Help?</a>
          <a href="#" className="approvals-list__footer-link">Contact Support</a>
        </div>
      </div>
    </div>
  );
};

export default MarksApprovalList;
