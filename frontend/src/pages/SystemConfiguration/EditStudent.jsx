import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './EditStudent.css';

const EditStudent = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    nationality: '',
    admissionNo: '',
    admissionDate: '',
    grade: '',
    section: '',
    rollNo: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    parentName: '',
    parentRelation: '',
    parentPhone: '',
    parentEmail: '',
    parentOccupation: '',
    status: 'active'
  });

  useEffect(() => {
    // Simulate fetching student data
    setTimeout(() => {
      setFormData({
        firstName: 'Emma',
        lastName: 'Wilson',
        dateOfBirth: '2008-05-15',
        gender: 'female',
        bloodGroup: 'A+',
        nationality: 'American',
        admissionNo: 'STU001',
        admissionDate: '2020-06-01',
        grade: '10',
        section: 'A',
        rollNo: '01',
        email: 'emma.wilson@school.edu',
        phone: '+1 234 567 8901',
        address: '123 Main Street, Apt 4B',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        parentName: 'Michael Wilson',
        parentRelation: 'father',
        parentPhone: '+1 234 567 8900',
        parentEmail: 'michael.wilson@email.com',
        parentOccupation: 'Software Engineer',
        status: 'active'
      });
      setLoading(false);
    }, 500);
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Add API call to update student
    // await api.students.update(id, formData);
    navigate(`/students/${id}`);
  };

  const handleCancel = () => {
    navigate(`/students/${id}`);
  };

  if (loading) {
    return (
      <div className="edit-student">
        <div className="edit-student__loading">
          <div className="edit-student__spinner"></div>
          <p>Loading student data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-student">
      <div className="edit-student__header">
        <h2 className="edit-student__title">Edit Student</h2>
        <p className="edit-student__subtitle">Update student information for {formData.firstName} {formData.lastName}</p>
      </div>

      <form className="edit-student__form" onSubmit={handleSubmit}>
        {/* Personal Information */}
        <div className="edit-student__section">
          <h3 className="edit-student__section-title">Personal Information</h3>
          
          <div className="edit-student__grid">
            <div className="edit-student__field">
              <label className="edit-student__label" htmlFor="firstName">
                First Name <span className="edit-student__required">*</span>
              </label>
              <input type="text" id="firstName" name="firstName" className="edit-student__input" 
                value={formData.firstName} onChange={handleChange} required />
            </div>
            
            <div className="edit-student__field">
              <label className="edit-student__label" htmlFor="lastName">
                Last Name <span className="edit-student__required">*</span>
              </label>
              <input type="text" id="lastName" name="lastName" className="edit-student__input" 
                value={formData.lastName} onChange={handleChange} required />
            </div>
            
            <div className="edit-student__field">
              <label className="edit-student__label" htmlFor="dateOfBirth">
                Date of Birth <span className="edit-student__required">*</span>
              </label>
              <input type="date" id="dateOfBirth" name="dateOfBirth" className="edit-student__input" 
                value={formData.dateOfBirth} onChange={handleChange} required />
            </div>
            
            <div className="edit-student__field">
              <label className="edit-student__label" htmlFor="gender">
                Gender <span className="edit-student__required">*</span>
              </label>
              <select id="gender" name="gender" className="edit-student__select" 
                value={formData.gender} onChange={handleChange} required>
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="edit-student__field">
              <label className="edit-student__label" htmlFor="bloodGroup">Blood Group</label>
              <select id="bloodGroup" name="bloodGroup" className="edit-student__select" 
                value={formData.bloodGroup} onChange={handleChange}>
                <option value="">Select blood group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
            
            <div className="edit-student__field">
              <label className="edit-student__label" htmlFor="nationality">Nationality</label>
              <input type="text" id="nationality" name="nationality" className="edit-student__input" 
                value={formData.nationality} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* Academic Information */}
        <div className="edit-student__section">
          <h3 className="edit-student__section-title">Academic Information</h3>
          
          <div className="edit-student__grid">
            <div className="edit-student__field">
              <label className="edit-student__label" htmlFor="admissionNo">Admission Number</label>
              <input type="text" id="admissionNo" name="admissionNo" className="edit-student__input edit-student__input--readonly" 
                value={formData.admissionNo} readOnly />
            </div>
            
            <div className="edit-student__field">
              <label className="edit-student__label" htmlFor="grade">
                Grade/Class <span className="edit-student__required">*</span>
              </label>
              <select id="grade" name="grade" className="edit-student__select" 
                value={formData.grade} onChange={handleChange} required>
                <option value="">Select grade</option>
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>Grade {i + 1}</option>
                ))}
              </select>
            </div>
            
            <div className="edit-student__field">
              <label className="edit-student__label" htmlFor="section">
                Section <span className="edit-student__required">*</span>
              </label>
              <select id="section" name="section" className="edit-student__select" 
                value={formData.section} onChange={handleChange} required>
                <option value="">Select section</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
                <option value="D">Section D</option>
              </select>
            </div>
            
            <div className="edit-student__field">
              <label className="edit-student__label" htmlFor="rollNo">Roll Number</label>
              <input type="text" id="rollNo" name="rollNo" className="edit-student__input" 
                value={formData.rollNo} onChange={handleChange} />
            </div>
            
            <div className="edit-student__field">
              <label className="edit-student__label" htmlFor="status">Status</label>
              <select id="status" name="status" className="edit-student__select" 
                value={formData.status} onChange={handleChange}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="edit-student__section">
          <h3 className="edit-student__section-title">Contact Information</h3>
          
          <div className="edit-student__grid">
            <div className="edit-student__field">
              <label className="edit-student__label" htmlFor="email">Email</label>
              <input type="email" id="email" name="email" className="edit-student__input" 
                value={formData.email} onChange={handleChange} />
            </div>
            
            <div className="edit-student__field">
              <label className="edit-student__label" htmlFor="phone">Phone</label>
              <input type="tel" id="phone" name="phone" className="edit-student__input" 
                value={formData.phone} onChange={handleChange} />
            </div>
            
            <div className="edit-student__field edit-student__field--full">
              <label className="edit-student__label" htmlFor="address">Address</label>
              <input type="text" id="address" name="address" className="edit-student__input" 
                value={formData.address} onChange={handleChange} />
            </div>
            
            <div className="edit-student__field">
              <label className="edit-student__label" htmlFor="city">City</label>
              <input type="text" id="city" name="city" className="edit-student__input" 
                value={formData.city} onChange={handleChange} />
            </div>
            
            <div className="edit-student__field">
              <label className="edit-student__label" htmlFor="state">State</label>
              <input type="text" id="state" name="state" className="edit-student__input" 
                value={formData.state} onChange={handleChange} />
            </div>
            
            <div className="edit-student__field">
              <label className="edit-student__label" htmlFor="zipCode">Zip Code</label>
              <input type="text" id="zipCode" name="zipCode" className="edit-student__input" 
                value={formData.zipCode} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* Parent/Guardian */}
        <div className="edit-student__section">
          <h3 className="edit-student__section-title">Parent/Guardian Information</h3>
          
          <div className="edit-student__grid">
            <div className="edit-student__field">
              <label className="edit-student__label" htmlFor="parentName">
                Name <span className="edit-student__required">*</span>
              </label>
              <input type="text" id="parentName" name="parentName" className="edit-student__input" 
                value={formData.parentName} onChange={handleChange} required />
            </div>
            
            <div className="edit-student__field">
              <label className="edit-student__label" htmlFor="parentRelation">
                Relationship <span className="edit-student__required">*</span>
              </label>
              <select id="parentRelation" name="parentRelation" className="edit-student__select" 
                value={formData.parentRelation} onChange={handleChange} required>
                <option value="">Select relationship</option>
                <option value="father">Father</option>
                <option value="mother">Mother</option>
                <option value="guardian">Guardian</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="edit-student__field">
              <label className="edit-student__label" htmlFor="parentPhone">
                Phone <span className="edit-student__required">*</span>
              </label>
              <input type="tel" id="parentPhone" name="parentPhone" className="edit-student__input" 
                value={formData.parentPhone} onChange={handleChange} required />
            </div>
            
            <div className="edit-student__field">
              <label className="edit-student__label" htmlFor="parentEmail">Email</label>
              <input type="email" id="parentEmail" name="parentEmail" className="edit-student__input" 
                value={formData.parentEmail} onChange={handleChange} />
            </div>
            
            <div className="edit-student__field">
              <label className="edit-student__label" htmlFor="parentOccupation">Occupation</label>
              <input type="text" id="parentOccupation" name="parentOccupation" className="edit-student__input" 
                value={formData.parentOccupation} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="edit-student__actions">
          <button type="button" className="btn btn--secondary" onClick={handleCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditStudent;
