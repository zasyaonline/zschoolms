import { useState } from 'react';
import './SchoolInformationList.css';

const SchoolInformationList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSchoolId, setEditingSchoolId] = useState(null);
  
  const [formData, setFormData] = useState({
    studentName: '',
    schoolName: '',
    address: '',
    contactInfo: '',
    academicYear: ''
  });
  
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  // Mock student list for dropdown
  const availableStudents = [
    { id: 1, name: 'Jane Doe' },
    { id: 2, name: 'John Smith' },
    { id: 3, name: 'Emily Johnson' }
  ];

  const [schools, setSchools] = useState([
    { 
      id: 1, 
      studentName: 'John Doe', 
      schoolName: 'Vision Academy School',
      grade: '9A',
      academicYear: '2024-2025',
      contactDetails: '+1 555-123-4567',
      address: '3522 West Fork Street, Missoula, MT 59801'
    },
    { 
      id: 2, 
      studentName: 'Jane Smith', 
      schoolName: 'Greenwood High',
      grade: '9B',
      academicYear: '2024-2025',
      contactDetails: '+1 555-987-6543',
      address: '1234 Oak Avenue, Springfield, IL 62701'
    },
    { 
      id: 3, 
      studentName: 'Emily Johnson', 
      schoolName: 'Lakeside Middle School',
      grade: '8C',
      academicYear: '2024-2025',
      contactDetails: '+1 555-234-5678',
      address: '567 Maple Drive, Portland, OR 97201'
    },
    { 
      id: 4, 
      studentName: 'Michael Brown', 
      schoolName: 'Riverdale Academy',
      grade: '11D',
      academicYear: '2024-2025',
      contactDetails: '+1 555-876-5432',
      address: '890 Pine Street, Austin, TX 78701'
    },
    { 
      id: 5, 
      studentName: 'Sarah Wilson', 
      schoolName: 'Northview Secondary',
      grade: '12E',
      academicYear: '2024-2025',
      contactDetails: '+1 555-345-6789',
      address: '234 Elm Road, Seattle, WA 98101'
    },
    { 
      id: 6, 
      studentName: 'David Lee', 
      schoolName: 'Hillside College',
      grade: '11B',
      academicYear: '2024-2025',
      contactDetails: '+1 555-654-3210',
      address: '456 Cedar Lane, Denver, CO 80201'
    },
    { 
      id: 7, 
      studentName: 'Anna Martinez', 
      schoolName: 'Sunset High School',
      grade: '12A',
      academicYear: '2024-2025',
      contactDetails: '+1 555-456-7890',
      address: '789 Birch Boulevard, Miami, FL 33101'
    }
  ]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddNew = () => {
    setFormData({
      studentName: '',
      schoolName: '',
      address: '',
      contactInfo: '',
      academicYear: ''
    });
    setSelectedStudent(null);
    setStudentSearchTerm('');
    setShowAddModal(true);
  };

  const handleEdit = (id) => {
    const school = schools.find(s => s.id === id);
    if (school) {
      setFormData({
        studentName: school.studentName,
        schoolName: school.schoolName,
        address: school.address || '',
        contactInfo: school.contactDetails || '',
        academicYear: school.academicYear
      });
      setSelectedStudent({ id: school.id, name: school.studentName });
      setEditingSchoolId(id);
      setShowEditModal(true);
    }
  };

  const handleAddSave = (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    
    const newSchool = {
      id: Math.max(...schools.map(s => s.id)) + 1,
      studentName: selectedStudent.name,
      ...formData,
      contactDetails: formData.contactInfo,
      grade: 'N/A' // Placeholder since grade is not in new form
    };
    setSchools([...schools, newSchool]);
    setShowAddModal(false);
    setFormData({
      studentName: '',
      schoolName: '',
      address: '',
      contactInfo: '',
      academicYear: ''
    });
    setSelectedStudent(null);
    setStudentSearchTerm('');
  };

  const handleEditSave = (e) => {
    e.preventDefault();
    if (editingSchoolId) {
      setSchools(schools.map(s => 
        s.id === editingSchoolId ? { 
          ...s, 
          studentName: selectedStudent?.name || s.studentName,
          schoolName: formData.schoolName,
          address: formData.address,
          contactDetails: formData.contactInfo,
          academicYear: formData.academicYear
        } : s
      ));
    }
    setShowEditModal(false);
    setEditingSchoolId(null);
    setFormData({
      studentName: '',
      schoolName: '',
      address: '',
      contactInfo: '',
      academicYear: ''
    });
    setSelectedStudent(null);
  };

  const handleDelete = () => {
    if (editingSchoolId) {
      setSchools(schools.filter(s => s.id !== editingSchoolId));
    }
    setShowEditModal(false);
    setEditingSchoolId(null);
    setFormData({
      studentName: '',
      schoolName: '',
      address: '',
      contactInfo: '',
      academicYear: ''
    });
    setSelectedStudent(null);
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setEditingSchoolId(null);
    setFormData({
      studentName: '',
      schoolName: '',
      address: '',
      contactInfo: '',
      academicYear: ''
    });
    setSelectedStudent(null);
    setStudentSearchTerm('');
  };

  const filteredSchools = schools.filter(school =>
    school.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.schoolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.grade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="school-info-list">
      <h2 className="school-info-list__title">School Information List</h2>

      <div className="school-info-list__card">
        {/* Search and Actions Bar */}
        <div className="school-info-list__toolbar">
          <div className="school-info-list__search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M11.5 21C16.7467 21 21 16.7467 21 11.5C21 6.25329 16.7467 2 11.5 2C6.25329 2 2 6.25329 2 11.5C2 16.7467 6.25329 21 11.5 21Z" stroke="#8D8D8D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 22L20 20" stroke="#8D8D8D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={handleSearchChange}
              className="school-info-list__search-input"
            />
          </div>

          <div className="school-info-list__actions">
            <button className="school-info-list__filter-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M5.40039 2.09961H18.6004C19.7004 2.09961 20.6004 2.99961 20.6004 4.09961V6.29961C20.6004 7.09961 20.1004 8.09961 19.6004 8.59961L15.3004 12.3996C14.7004 12.8996 14.3004 13.8996 14.3004 14.6996V18.9996C14.3004 19.5996 13.9004 20.3996 13.4004 20.6996L12.0004 21.5996C10.7004 22.3996 8.90039 21.4996 8.90039 19.8996V14.5996C8.90039 13.8996 8.50039 12.9996 8.10039 12.4996L4.30039 8.49961C3.80039 7.99961 3.40039 7.09961 3.40039 6.49961V4.19961C3.40039 2.99961 4.30039 2.09961 5.40039 2.09961Z" stroke="#8D8D8D" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className="school-info-list__add-btn" onClick={handleAddNew}>
              + Add New Information
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="school-info-list__table">
          {/* Table Header */}
          <div className="school-info-list__table-header">
            <div className="school-info-list__th school-info-list__th--student">Student Name</div>
            <div className="school-info-list__th school-info-list__th--school">School Name</div>
            <div className="school-info-list__th school-info-list__th--grade">Grade</div>
            <div className="school-info-list__th school-info-list__th--year">Academic Year</div>
            <div className="school-info-list__th school-info-list__th--contact">Contact Details</div>
            <div className="school-info-list__th school-info-list__th--actions">Actions</div>
          </div>

          {/* Table Body */}
          <div className="school-info-list__table-body">
            {filteredSchools.map((school, index) => (
              <div key={school.id}>
                <div className="school-info-list__row">
                  <div className="school-info-list__td school-info-list__td--student">{school.studentName}</div>
                  <div className="school-info-list__td school-info-list__td--school">{school.schoolName}</div>
                  <div className="school-info-list__td school-info-list__td--grade">{school.grade}</div>
                  <div className="school-info-list__td school-info-list__td--year">{school.academicYear}</div>
                  <div className="school-info-list__td school-info-list__td--contact">{school.contactDetails}</div>
                  <div className="school-info-list__td school-info-list__td--actions">
                    <button 
                      className="school-info-list__edit-btn"
                      onClick={() => handleEdit(school.id)}
                      title="Edit"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="#1F55A6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#1F55A6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
                {index < filteredSchools.length - 1 && <div className="school-info-list__divider" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="school-info-list__footer">
        <a href="#" className="school-info-list__link">Need Help?</a>
        <a href="#" className="school-info-list__link">Contact Support</a>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <>
          <div className="school-info-list__modal-backdrop" onClick={handleModalClose} />
          <div className="school-info-list__modal">
            <div className="school-info-list__modal-content">
              <div className="school-info-list__modal-header">
                <h3 className="school-info-list__modal-title">Add New School Information</h3>
              </div>

              <div className="school-info-list__modal-divider" />

              <form onSubmit={handleAddSave} className="school-info-list__modal-form">
                <div className="school-info-list__modal-fields">
                  {/* Students Section */}
                  <div className="school-info-list__students-section">
                    <label className="school-info-list__section-label">Students</label>
                    <div className="school-info-list__section-divider" />
                    
                    <div className="school-info-list__student-search-wrapper">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M11.5 21C16.7467 21 21 16.7467 21 11.5C21 6.25329 16.7467 2 11.5 2C6.25329 2 2 6.25329 2 11.5C2 16.7467 6.25329 21 11.5 21Z" stroke="#8D8D8D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M22 22L20 20" stroke="#8D8D8D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <input
                        type="text"
                        placeholder="Search student"
                        value={studentSearchTerm}
                        onChange={(e) => setStudentSearchTerm(e.target.value)}
                        className="school-info-list__student-search-input"
                      />
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M19.92 8.95l-6.52 6.52c-.77.77-2.03.77-2.8 0L4.08 8.95" stroke="#8D8D8D" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    
                    {availableStudents
                      .filter(s => s.name.toLowerCase().includes(studentSearchTerm.toLowerCase()))
                      .map(student => (
                        <div 
                          key={student.id}
                          className={`school-info-list__student-item ${
                            selectedStudent?.id === student.id ? 'school-info-list__student-item--selected' : ''
                          }`}
                          onClick={() => setSelectedStudent(student)}
                        >
                          <span>{student.name}</span>
                          {selectedStudent?.id === student.id && (
                            <div className="school-info-list__checkbox-fill">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M9 11l3 3L22 4" stroke="#1F55A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="#1F55A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          )}
                        </div>
                      ))
                    }
                  </div>

                  <div className="school-info-list__field-group">
                    <label className="school-info-list__floating-label">School Name</label>
                    <input
                      type="text"
                      name="schoolName"
                      className="school-info-list__input"
                      value={formData.schoolName}
                      onChange={handleFormChange}
                      required
                    />
                  </div>

                  <div className="school-info-list__field-group">
                    <label className="school-info-list__floating-label">Address</label>
                    <input
                      type="text"
                      name="address"
                      className="school-info-list__input"
                      value={formData.address}
                      onChange={handleFormChange}
                      required
                    />
                  </div>

                  <div className="school-info-list__field-group">
                    <label className="school-info-list__floating-label">Contact Info</label>
                    <input
                      type="tel"
                      name="contactInfo"
                      className="school-info-list__input"
                      value={formData.contactInfo}
                      onChange={handleFormChange}
                      required
                    />
                  </div>

                  <div className="school-info-list__field-group">
                    <label className="school-info-list__floating-label">Academic Year</label>
                    <input
                      type="text"
                      name="academicYear"
                      className="school-info-list__input"
                      value={formData.academicYear}
                      onChange={handleFormChange}
                      placeholder="2024-2025"
                      required
                    />
                  </div>
                </div>

                <div className="school-info-list__modal-actions">
                  <button type="submit" className="school-info-list__modal-btn school-info-list__modal-btn--save">
                    Save
                  </button>
                  <button 
                    type="button" 
                    className="school-info-list__modal-btn school-info-list__modal-btn--cancel"
                    onClick={handleModalClose}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <>
          <div className="school-info-list__modal-backdrop" onClick={handleModalClose} />
          <div className="school-info-list__modal">
            <div className="school-info-list__modal-content">
              <div className="school-info-list__modal-header">
                <h3 className="school-info-list__modal-title">Edit School Information</h3>
                <button 
                  type="button" 
                  className="school-info-list__close-btn"
                  onClick={handleModalClose}
                  aria-label="Close"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M9 3L3 9M3 3l6 6" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>

              <div className="school-info-list__modal-divider" />

              <form onSubmit={handleEditSave} className="school-info-list__modal-form">
                <div className="school-info-list__modal-fields">
                  {/* Students Section (Read-only in Edit mode) */}
                  <div className="school-info-list__students-section">
                    <label className="school-info-list__section-label">Students</label>
                    <div className="school-info-list__section-divider" />
                    
                    <div className="school-info-list__student-search-wrapper school-info-list__student-search-wrapper--disabled">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M11.5 21C16.7467 21 21 16.7467 21 11.5C21 6.25329 16.7467 2 11.5 2C6.25329 2 2 6.25329 2 11.5C2 16.7467 6.25329 21 11.5 21Z" stroke="#8D8D8D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M22 22L20 20" stroke="#8D8D8D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <input
                        type="text"
                        placeholder="Search student"
                        value={selectedStudent?.name || ''}
                        className="school-info-list__student-search-input"
                        disabled
                      />
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M19.92 8.95l-6.52 6.52c-.77.77-2.03.77-2.8 0L4.08 8.95" stroke="#8D8D8D" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    
                    <div className="school-info-list__student-item school-info-list__student-item--readonly school-info-list__student-item--selected">
                      <span>{selectedStudent?.name}</span>
                      <div className="school-info-list__checkbox-fill">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <path d="M9 11l3 3L22 4" stroke="#1F55A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="#1F55A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="school-info-list__field-group">
                    <label className="school-info-list__floating-label">School Name</label>
                    <input
                      type="text"
                      name="schoolName"
                      className="school-info-list__input"
                      value={formData.schoolName}
                      onChange={handleFormChange}
                      required
                    />
                  </div>

                  <div className="school-info-list__field-group">
                    <label className="school-info-list__floating-label">Address</label>
                    <input
                      type="text"
                      name="address"
                      className="school-info-list__input"
                      value={formData.address}
                      onChange={handleFormChange}
                      required
                    />
                  </div>

                  <div className="school-info-list__field-group">
                    <label className="school-info-list__floating-label">Contact Info</label>
                    <input
                      type="tel"
                      name="contactInfo"
                      className="school-info-list__input"
                      value={formData.contactInfo}
                      onChange={handleFormChange}
                      required
                    />
                  </div>

                  <div className="school-info-list__field-group">
                    <label className="school-info-list__floating-label">Academic Year</label>
                    <input
                      type="text"
                      name="academicYear"
                      className="school-info-list__input"
                      value={formData.academicYear}
                      onChange={handleFormChange}
                      placeholder="2024-2025"
                      required
                    />
                  </div>
                </div>

                <div className="school-info-list__modal-actions">
                  <button type="submit" className="school-info-list__modal-btn school-info-list__modal-btn--save">
                    Save
                  </button>
                  <button 
                    type="button" 
                    className="school-info-list__modal-btn school-info-list__modal-btn--delete"
                    onClick={handleDelete}
                  >
                    Delete
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M21 5.98c-3.33-.33-6.68-.5-10.02-.5-1.98 0-3.96.1-5.94.3L3 5.98" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8.5 4.97l.22-1.31C8.88 2.71 9 2 10.69 2h2.62c1.69 0 1.82.75 1.97 1.67l.22 1.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M18.85 9.14l-.65 10.07C18.09 20.78 18 22 15.21 22H8.79C6 22 5.91 20.78 5.8 19.21L5.15 9.14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10.33 16.5h3.33M9.5 12.5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SchoolInformationList;
