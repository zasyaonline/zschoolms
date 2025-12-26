import { useState, useEffect } from 'react';
import api from '../../services/api';
import { studentValidationSchema, validateForm, sanitizeFormData } from '../../utils/validation';
import './StudentList.css';

const StudentList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [activeModal, setActiveModal] = useState(null); // 'add', 'view', 'edit'
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    studentId: '',
    dateOfBirth: '',
    gradeClass: '',
    guardianName: '',
    address: '',
    contactDetails: '',
    sponsor: ''
  });
  const [validationErrors, setValidationErrors] = useState({});
  
  // State for API data
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  useEffect(() => {
    fetchStudents();
  }, [pagination.page, selectedGrade, selectedSection]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      let url = `/students?page=${pagination.page}&limit=${pagination.limit}`;
      if (selectedGrade) url += `&grade=${selectedGrade}`;
      if (selectedSection) url += `&section=${selectedSection}`;
      
      const response = await api.get(url);
      if (response.success && response.data) {
        // Map API response to component format
        const mappedStudents = (response.data.students || []).map(student => ({
          id: student.id,
          admissionNo: student.admissionNumber || student.enrollmentNumber || 'N/A',
          name: student.user ? `${student.user.firstName || ''} ${student.user.lastName || ''}`.trim() : 'Unknown',
          grade: student.currentClass || 'N/A',
          section: student.section || 'N/A',
          rollNo: student.rollNumber || 'N/A',
          parent: student.parentName || 'N/A',
          status: student.isActive ? 'active' : 'inactive'
        }));
        setStudents(mappedStudents);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || mappedStudents.length
        }));
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (student) => {
    setSelectedStudent(student);
    setActiveModal('view');
  };

  const handleEdit = (student) => {
    setSelectedStudent(student);
    // Pre-populate form with student data
    setFormData({
      fullName: student.name,
      studentId: student.admissionNo,
      dateOfBirth: '',
      gradeClass: student.grade,
      guardianName: student.parent,
      address: '',
      contactDetails: '',
      sponsor: ''
    });
    setActiveModal('edit');
  };

  const openAddModal = () => {
    setFormData({
      fullName: '',
      studentId: '',
      dateOfBirth: '',
      gradeClass: '',
      guardianName: '',
      address: '',
      contactDetails: '',
      sponsor: ''
    });
    setValidationErrors({});
    setActiveModal('add');
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedStudent(null);
    setValidationErrors({});
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    
    // Sanitize input data
    const sanitizedData = sanitizeFormData(formData);
    
    // Validate form data
    const { isValid, errors } = await validateForm(studentValidationSchema, sanitizedData);
    
    if (!isValid) {
      setValidationErrors(errors);
      return;
    }
    
    // TODO: Add API call here
    // await api.post('/students', sanitizedData);
    closeModal();
    fetchStudents(); // Refresh list
  };

  const handleDelete = async (studentId) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        // TODO: Add API call
        // await api.delete(`/students/${studentId}`);
        fetchStudents(); // Refresh list
      } catch (error) {
        console.error('Error deleting student:', error);
      }
    }
  };
      // TODO: Add API call here
      // await api.students.delete(id);
      // After successful deletion, refresh the student list
    }
  };

  return (
    <div className="student-list">
      <div className="student-list__actions">
        <div className="student-list__filters">
          <div className="student-list__search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              className="student-list__search-input"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select 
            className="student-list__filter-select"
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
          >
            <option value="">All Grades</option>
            <option value="8">Grade 8</option>
            <option value="9">Grade 9</option>
            <option value="10">Grade 10</option>
            <option value="11">Grade 11</option>
            <option value="12">Grade 12</option>
          </select>

          <select 
            className="student-list__filter-select"
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
          >
            <option value="">All Sections</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="C">Section C</option>
          </select>
        </div>

        <div className="student-list__buttons">
          <button className="btn btn--outline">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export
          </button>
          <button className="btn btn--primary" onClick={openAddModal}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Student
          </button>
        </div>
      </div>

      <div className="student-list__table-container">
        <div className="student-list__table-header">
          <div className="student-list__th student-list__th--admission">Admission No</div>
          <div className="student-list__th student-list__th--name">Student Name</div>
          <div className="student-list__th">Grade</div>
          <div className="student-list__th">Section</div>
          <div className="student-list__th">Roll No</div>
          <div className="student-list__th">Parent/Guardian</div>
          <div className="student-list__th">Status</div>
          <div className="student-list__th student-list__th--actions">Actions</div>
        </div>

        <div className="student-list__table-body">
          {loading ? (
            <div className="student-list__loading">
              <div className="student-list__spinner"></div>
              <p>Loading students...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="student-list__empty">No students found</div>
          ) : students.filter(s => 
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.admissionNo.toLowerCase().includes(searchTerm.toLowerCase())
          ).map((student, index) => (
            <div key={student.id}>
              <div className="student-list__row">
                <div className="student-list__td student-list__td--admission">{student.admissionNo}</div>
                <div className="student-list__td student-list__td--name">
                  <div className="student-list__avatar">
                    {student.name.charAt(0)}
                  </div>
                  {student.name}
                </div>
                <div className="student-list__td">{student.grade}</div>
                <div className="student-list__td">{student.section}</div>
                <div className="student-list__td">{student.rollNo}</div>
                <div className="student-list__td">{student.parent}</div>
                <div className="student-list__td">
                  <span className={`student-list__status student-list__status--${student.status}`}>
                    {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                  </span>
                </div>
                <div className="student-list__td student-list__td--actions">
                  <button 
                    className="student-list__action-btn"
                    onClick={() => handleView(student)}
                    title="View"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </button>
                  <button 
                    className="student-list__action-btn"
                    onClick={() => handleEdit(student)}
                    title="Edit"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button 
                    className="student-list__action-btn student-list__action-btn--danger"
                    onClick={() => handleDelete(student.id)}
                    title="Delete"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              </div>
              {index < students.length - 1 && <div className="student-list__divider"></div>}
            </div>
          ))}
        </div>
      </div>

      <div className="student-list__pagination">
        <span className="student-list__pagination-info">
          Showing {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} students
        </span>
        <div className="student-list__pagination-controls">
          <button 
            className="student-list__pagination-btn" 
            disabled={pagination.page === 1}
            onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <span className="student-list__pagination-current">Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit) || 1}</span>
          <button 
            className="student-list__pagination-btn"
            disabled={pagination.page * pagination.limit >= pagination.total}
            onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Add/Edit Student Modal */}
      {(activeModal === 'add' || activeModal === 'edit') && (
        <div className="student-modal-overlay" onClick={closeModal}>
          <div className="student-modal" onClick={(e) => e.stopPropagation()}>
            <div className="student-modal__header">
              <h2 className="student-modal__title">
                {activeModal === 'add' ? 'Add New Student' : 'Edit Student'}
              </h2>
            </div>
            <div className="student-modal__divider" />
            <form onSubmit={handleSaveStudent} className="student-modal__form">
              <div className="student-modal__fields">
                <div className="student-modal__field-group">
                  <label className="student-modal__floating-label">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    className={`student-modal__input ${validationErrors.fullName ? 'student-modal__input--error' : ''}`}
                    value={formData.fullName}
                    onChange={handleFormChange}
                    placeholder="John Doe"
                    required
                  />
                  {validationErrors.fullName && (
                    <span className="student-modal__error">{validationErrors.fullName}</span>
                  )}
                </div>
                <div className="student-modal__field-group">
                  <input
                    type="text"
                    name="studentId"
                    className={`student-modal__input ${validationErrors.studentId ? 'student-modal__input--error' : ''}`}
                    value={formData.studentId}
                    onChange={handleFormChange}
                    placeholder="Student ID"
                    required
                  />
                  {validationErrors.studentId && (
                    <span className="student-modal__error">{validationErrors.studentId}</span>
                  )}
                </div>
                <div className="student-modal__field-group">
                  <input
                    type="date"
                    name="dateOfBirth"
                    className={`student-modal__input student-modal__input--date ${validationErrors.dateOfBirth ? 'student-modal__input--error' : ''}`}
                    value={formData.dateOfBirth}
                    onChange={handleFormChange}
                    placeholder="Date of Birth"
                    required
                  />
                  {validationErrors.dateOfBirth && (
                    <span className="student-modal__error">{validationErrors.dateOfBirth}</span>
                  )}
                  <svg className="student-modal__calendar-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z" stroke="#8D8D8D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="student-modal__field-group">
                  <select
                    name="gradeClass"
                    className={`student-modal__input student-modal__input--select ${validationErrors.gradeClass ? 'student-modal__input--error' : ''}`}
                    value={formData.gradeClass}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Grade/Class</option>
                    <option value="Grade 8">Grade 8</option>
                    <option value="Grade 9">Grade 9</option>
                    <option value="Grade 10">Grade 10</option>
                    <option value="Grade 11">Grade 11</option>
                    <option value="Grade 12">Grade 12</option>
                  </select>
                  {validationErrors.gradeClass && (
                    <span className="student-modal__error">{validationErrors.gradeClass}</span>
                  )}
                </div>
                <div className="student-modal__field-group">
                  <input
                    type="text"
                    name="guardianName"
                    className={`student-modal__input ${validationErrors.guardianName ? 'student-modal__input--error' : ''}`}
                    value={formData.guardianName}
                    onChange={handleFormChange}
                    placeholder="Guardian Name"
                    required
                  />
                  {validationErrors.guardianName && (
                    <span className="student-modal__error">{validationErrors.guardianName}</span>
                  )}
                </div>
                <div className="student-modal__field-group">
                  <input
                    type="text"
                    name="address"
                    className={`student-modal__input ${validationErrors.address ? 'student-modal__input--error' : ''}`}
                    value={formData.address}
                    onChange={handleFormChange}
                    placeholder="Address"
                    required
                  />
                  {validationErrors.address && (
                    <span className="student-modal__error">{validationErrors.address}</span>
                  )}
                </div>
                <div className="student-modal__field-group">
                  <input
                    type="tel"
                    name="contactDetails"
                    className={`student-modal__input ${validationErrors.contactDetails ? 'student-modal__input--error' : ''}`}
                    value={formData.contactDetails}
                    onChange={handleFormChange}
                    placeholder="Contact Details"
                    required
                  />
                  {validationErrors.contactDetails && (
                    <span className="student-modal__error">{validationErrors.contactDetails}</span>
                  )}
                </div>
                <div className="student-modal__field-group">
                  <select
                    name="sponsor"
                    className={`student-modal__input student-modal__input--select ${validationErrors.sponsor ? 'student-modal__input--error' : ''}`}
                    value={formData.sponsor}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Sponsor</option>
                    <option value="Sponsor A">Sponsor A</option>
                    <option value="Sponsor B">Sponsor B</option>
                    <option value="Sponsor C">Sponsor C</option>
                  </select>
                  {validationErrors.sponsor && (
                    <span className="student-modal__error">{validationErrors.sponsor}</span>
                  )}
                </div>
              </div>
              <div className="student-modal__actions">
                <button type="submit" className="student-modal__btn student-modal__btn--primary">
                  Save
                </button>
                <button type="button" onClick={closeModal} className="student-modal__btn student-modal__btn--secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Student Modal */}
      {activeModal === 'view' && selectedStudent && (
        <div className="student-modal-overlay" onClick={closeModal}>
          <div className="student-modal student-modal--view" onClick={(e) => e.stopPropagation()}>
            <div className="student-modal__header">
              <h2 className="student-modal__title">Student Details</h2>
            </div>
            <div className="student-modal__divider" />
            <div className="student-modal__view-content">
              <div className="student-modal__info-section">
                <h3 className="student-modal__section-title">Personal Information</h3>
                <div className="student-modal__info-grid">
                  <div className="student-modal__info-item">
                    <span className="student-modal__info-label">Student Name:</span>
                    <span className="student-modal__info-value">{selectedStudent.name}</span>
                  </div>
                  <div className="student-modal__info-item">
                    <span className="student-modal__info-label">Admission No:</span>
                    <span className="student-modal__info-value">{selectedStudent.admissionNo}</span>
                  </div>
                  <div className="student-modal__info-item">
                    <span className="student-modal__info-label">Grade:</span>
                    <span className="student-modal__info-value">{selectedStudent.grade}</span>
                  </div>
                  <div className="student-modal__info-item">
                    <span className="student-modal__info-label">Section:</span>
                    <span className="student-modal__info-value">{selectedStudent.section}</span>
                  </div>
                  <div className="student-modal__info-item">
                    <span className="student-modal__info-label">Roll No:</span>
                    <span className="student-modal__info-value">{selectedStudent.rollNo}</span>
                  </div>
                  <div className="student-modal__info-item">
                    <span className="student-modal__info-label">Status:</span>
                    <span className={`student-modal__status student-modal__status--${selectedStudent.status}`}>
                      {selectedStudent.status.charAt(0).toUpperCase() + selectedStudent.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="student-modal__info-section">
                <h3 className="student-modal__section-title">Guardian Details</h3>
                <div className="student-modal__info-grid">
                  <div className="student-modal__info-item">
                    <span className="student-modal__info-label">Guardian Name:</span>
                    <span className="student-modal__info-value">{selectedStudent.parent}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="student-modal__actions">
              <button 
                onClick={() => {
                  handleEdit(selectedStudent);
                }}
                className="student-modal__btn student-modal__btn--primary"
              >
                Edit
              </button>
              <button onClick={closeModal} className="student-modal__btn student-modal__btn--secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentList;
