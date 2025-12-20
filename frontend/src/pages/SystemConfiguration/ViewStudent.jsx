import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './ViewStudent.css';

const ViewStudent = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');

  useEffect(() => {
    // Simulate fetching student data
    setTimeout(() => {
      setStudent({
        id: 1,
        admissionNo: 'STU001',
        firstName: 'Emma',
        lastName: 'Wilson',
        dateOfBirth: '2008-05-15',
        gender: 'Female',
        bloodGroup: 'A+',
        nationality: 'American',
        grade: 'Grade 10',
        section: 'A',
        rollNo: '01',
        admissionDate: '2020-06-01',
        email: 'emma.wilson@school.edu',
        phone: '+1 234 567 8901',
        address: '123 Main Street, Apt 4B',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        parent: {
          name: 'Michael Wilson',
          relation: 'Father',
          phone: '+1 234 567 8900',
          email: 'michael.wilson@email.com',
          occupation: 'Software Engineer'
        },
        status: 'active',
        photo: null
      });
      setLoading(false);
    }, 500);
  }, [id]);

  if (loading) {
    return (
      <div className="view-student">
        <div className="view-student__loading">
          <div className="view-student__spinner"></div>
          <p>Loading student data...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="view-student">
        <div className="view-student__not-found">
          <p>Student not found</p>
          <button className="btn btn--primary" onClick={() => navigate('/students')}>
            Back to Students
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="view-student">
      <div className="view-student__header">
        <div className="view-student__header-info">
          <div className="view-student__avatar">
            {student.firstName.charAt(0)}{student.lastName.charAt(0)}
          </div>
          <div className="view-student__header-text">
            <h2 className="view-student__name">{student.firstName} {student.lastName}</h2>
            <p className="view-student__meta">
              <span className="view-student__admission">{student.admissionNo}</span>
              <span className="view-student__separator">•</span>
              <span>{student.grade} - Section {student.section}</span>
              <span className="view-student__separator">•</span>
              <span className={`view-student__status view-student__status--${student.status}`}>
                {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
              </span>
            </p>
          </div>
        </div>
        <div className="view-student__header-actions">
          <button className="btn btn--outline" onClick={() => navigate('/students')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
            Back
          </button>
          <button className="btn btn--primary" onClick={() => navigate(`/students/${id}/edit`)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Edit
          </button>
        </div>
      </div>

      <div className="view-student__tabs">
        <button 
          className={`view-student__tab ${activeTab === 'personal' ? 'view-student__tab--active' : ''}`}
          onClick={() => setActiveTab('personal')}
        >
          Personal Info
        </button>
        <button 
          className={`view-student__tab ${activeTab === 'academic' ? 'view-student__tab--active' : ''}`}
          onClick={() => setActiveTab('academic')}
        >
          Academic Info
        </button>
        <button 
          className={`view-student__tab ${activeTab === 'parent' ? 'view-student__tab--active' : ''}`}
          onClick={() => setActiveTab('parent')}
        >
          Parent/Guardian
        </button>
        <button 
          className={`view-student__tab ${activeTab === 'documents' ? 'view-student__tab--active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          Documents
        </button>
      </div>

      <div className="view-student__content">
        {activeTab === 'personal' && (
          <div className="view-student__section">
            <h3 className="view-student__section-title">Personal Information</h3>
            <div className="view-student__grid">
              <div className="view-student__item">
                <span className="view-student__label">First Name</span>
                <span className="view-student__value">{student.firstName}</span>
              </div>
              <div className="view-student__item">
                <span className="view-student__label">Last Name</span>
                <span className="view-student__value">{student.lastName}</span>
              </div>
              <div className="view-student__item">
                <span className="view-student__label">Date of Birth</span>
                <span className="view-student__value">{new Date(student.dateOfBirth).toLocaleDateString()}</span>
              </div>
              <div className="view-student__item">
                <span className="view-student__label">Gender</span>
                <span className="view-student__value">{student.gender}</span>
              </div>
              <div className="view-student__item">
                <span className="view-student__label">Blood Group</span>
                <span className="view-student__value">{student.bloodGroup}</span>
              </div>
              <div className="view-student__item">
                <span className="view-student__label">Nationality</span>
                <span className="view-student__value">{student.nationality}</span>
              </div>
            </div>

            <h3 className="view-student__section-title" style={{ marginTop: 'var(--spacing-xl)' }}>Contact Information</h3>
            <div className="view-student__grid">
              <div className="view-student__item">
                <span className="view-student__label">Email</span>
                <span className="view-student__value">{student.email}</span>
              </div>
              <div className="view-student__item">
                <span className="view-student__label">Phone</span>
                <span className="view-student__value">{student.phone}</span>
              </div>
              <div className="view-student__item view-student__item--full">
                <span className="view-student__label">Address</span>
                <span className="view-student__value">{student.address}, {student.city}, {student.state} {student.zipCode}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'academic' && (
          <div className="view-student__section">
            <h3 className="view-student__section-title">Academic Information</h3>
            <div className="view-student__grid">
              <div className="view-student__item">
                <span className="view-student__label">Admission Number</span>
                <span className="view-student__value">{student.admissionNo}</span>
              </div>
              <div className="view-student__item">
                <span className="view-student__label">Admission Date</span>
                <span className="view-student__value">{new Date(student.admissionDate).toLocaleDateString()}</span>
              </div>
              <div className="view-student__item">
                <span className="view-student__label">Grade/Class</span>
                <span className="view-student__value">{student.grade}</span>
              </div>
              <div className="view-student__item">
                <span className="view-student__label">Section</span>
                <span className="view-student__value">{student.section}</span>
              </div>
              <div className="view-student__item">
                <span className="view-student__label">Roll Number</span>
                <span className="view-student__value">{student.rollNo}</span>
              </div>
              <div className="view-student__item">
                <span className="view-student__label">Status</span>
                <span className={`view-student__badge view-student__badge--${student.status}`}>
                  {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'parent' && (
          <div className="view-student__section">
            <h3 className="view-student__section-title">Parent/Guardian Information</h3>
            <div className="view-student__grid">
              <div className="view-student__item">
                <span className="view-student__label">Name</span>
                <span className="view-student__value">{student.parent.name}</span>
              </div>
              <div className="view-student__item">
                <span className="view-student__label">Relationship</span>
                <span className="view-student__value">{student.parent.relation}</span>
              </div>
              <div className="view-student__item">
                <span className="view-student__label">Phone</span>
                <span className="view-student__value">{student.parent.phone}</span>
              </div>
              <div className="view-student__item">
                <span className="view-student__label">Email</span>
                <span className="view-student__value">{student.parent.email}</span>
              </div>
              <div className="view-student__item">
                <span className="view-student__label">Occupation</span>
                <span className="view-student__value">{student.parent.occupation}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="view-student__section">
            <h3 className="view-student__section-title">Documents</h3>
            <div className="view-student__documents">
              <div className="view-student__document-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <p>No documents uploaded yet</p>
                <button className="btn btn--outline">Upload Document</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewStudent;
