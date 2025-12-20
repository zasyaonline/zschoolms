import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AddStudent.css';

const AddStudent = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    nationality: '',
    religion: '',
    
    // Academic Information
    admissionNo: '',
    admissionDate: '',
    grade: '',
    section: '',
    rollNo: '',
    previousSchool: '',
    
    // Contact Information
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    
    // Parent/Guardian Information
    parentName: '',
    parentRelation: '',
    parentPhone: '',
    parentEmail: '',
    parentOccupation: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Add API call to create student
    // await api.students.create(formData);
    navigate('/students');
  };

  const handleCancel = () => {
    navigate('/students');
  };

  return (
    <div className="add-student">
      <div className="add-student__header">
        <h2 className="add-student__title">Add New Student</h2>
        <p className="add-student__subtitle">Fill in the student details to create a new enrollment</p>
      </div>

      <form className="add-student__form" onSubmit={handleSubmit}>
        {/* Personal Information */}
        <div className="add-student__section">
          <h3 className="add-student__section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            Personal Information
          </h3>
          
          <div className="add-student__grid">
            <div className="add-student__field">
              <label className="add-student__label" htmlFor="firstName">
                First Name <span className="add-student__required">*</span>
              </label>
              <input type="text" id="firstName" name="firstName" className="add-student__input" 
                placeholder="Enter first name" value={formData.firstName} onChange={handleChange} required />
            </div>
            
            <div className="add-student__field">
              <label className="add-student__label" htmlFor="lastName">
                Last Name <span className="add-student__required">*</span>
              </label>
              <input type="text" id="lastName" name="lastName" className="add-student__input" 
                placeholder="Enter last name" value={formData.lastName} onChange={handleChange} required />
            </div>
            
            <div className="add-student__field">
              <label className="add-student__label" htmlFor="dateOfBirth">
                Date of Birth <span className="add-student__required">*</span>
              </label>
              <input type="date" id="dateOfBirth" name="dateOfBirth" className="add-student__input" 
                value={formData.dateOfBirth} onChange={handleChange} required />
            </div>
            
            <div className="add-student__field">
              <label className="add-student__label" htmlFor="gender">
                Gender <span className="add-student__required">*</span>
              </label>
              <select id="gender" name="gender" className="add-student__select" 
                value={formData.gender} onChange={handleChange} required>
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="add-student__field">
              <label className="add-student__label" htmlFor="bloodGroup">Blood Group</label>
              <select id="bloodGroup" name="bloodGroup" className="add-student__select" 
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
            
            <div className="add-student__field">
              <label className="add-student__label" htmlFor="nationality">Nationality</label>
              <input type="text" id="nationality" name="nationality" className="add-student__input" 
                placeholder="Enter nationality" value={formData.nationality} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* Academic Information */}
        <div className="add-student__section">
          <h3 className="add-student__section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
            Academic Information
          </h3>
          
          <div className="add-student__grid">
            <div className="add-student__field">
              <label className="add-student__label" htmlFor="admissionNo">
                Admission Number <span className="add-student__required">*</span>
              </label>
              <input type="text" id="admissionNo" name="admissionNo" className="add-student__input" 
                placeholder="Enter admission number" value={formData.admissionNo} onChange={handleChange} required />
            </div>
            
            <div className="add-student__field">
              <label className="add-student__label" htmlFor="admissionDate">
                Admission Date <span className="add-student__required">*</span>
              </label>
              <input type="date" id="admissionDate" name="admissionDate" className="add-student__input" 
                value={formData.admissionDate} onChange={handleChange} required />
            </div>
            
            <div className="add-student__field">
              <label className="add-student__label" htmlFor="grade">
                Grade/Class <span className="add-student__required">*</span>
              </label>
              <select id="grade" name="grade" className="add-student__select" 
                value={formData.grade} onChange={handleChange} required>
                <option value="">Select grade</option>
                <option value="1">Grade 1</option>
                <option value="2">Grade 2</option>
                <option value="3">Grade 3</option>
                <option value="4">Grade 4</option>
                <option value="5">Grade 5</option>
                <option value="6">Grade 6</option>
                <option value="7">Grade 7</option>
                <option value="8">Grade 8</option>
                <option value="9">Grade 9</option>
                <option value="10">Grade 10</option>
                <option value="11">Grade 11</option>
                <option value="12">Grade 12</option>
              </select>
            </div>
            
            <div className="add-student__field">
              <label className="add-student__label" htmlFor="section">
                Section <span className="add-student__required">*</span>
              </label>
              <select id="section" name="section" className="add-student__select" 
                value={formData.section} onChange={handleChange} required>
                <option value="">Select section</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
                <option value="D">Section D</option>
              </select>
            </div>
            
            <div className="add-student__field">
              <label className="add-student__label" htmlFor="rollNo">Roll Number</label>
              <input type="text" id="rollNo" name="rollNo" className="add-student__input" 
                placeholder="Enter roll number" value={formData.rollNo} onChange={handleChange} />
            </div>
            
            <div className="add-student__field">
              <label className="add-student__label" htmlFor="previousSchool">Previous School</label>
              <input type="text" id="previousSchool" name="previousSchool" className="add-student__input" 
                placeholder="Enter previous school name" value={formData.previousSchool} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="add-student__section">
          <h3 className="add-student__section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            Contact Information
          </h3>
          
          <div className="add-student__grid">
            <div className="add-student__field">
              <label className="add-student__label" htmlFor="email">Email Address</label>
              <input type="email" id="email" name="email" className="add-student__input" 
                placeholder="Enter email address" value={formData.email} onChange={handleChange} />
            </div>
            
            <div className="add-student__field">
              <label className="add-student__label" htmlFor="phone">Phone Number</label>
              <input type="tel" id="phone" name="phone" className="add-student__input" 
                placeholder="Enter phone number" value={formData.phone} onChange={handleChange} />
            </div>
            
            <div className="add-student__field add-student__field--full">
              <label className="add-student__label" htmlFor="address">Address</label>
              <input type="text" id="address" name="address" className="add-student__input" 
                placeholder="Enter full address" value={formData.address} onChange={handleChange} />
            </div>
            
            <div className="add-student__field">
              <label className="add-student__label" htmlFor="city">City</label>
              <input type="text" id="city" name="city" className="add-student__input" 
                placeholder="Enter city" value={formData.city} onChange={handleChange} />
            </div>
            
            <div className="add-student__field">
              <label className="add-student__label" htmlFor="state">State</label>
              <input type="text" id="state" name="state" className="add-student__input" 
                placeholder="Enter state" value={formData.state} onChange={handleChange} />
            </div>
            
            <div className="add-student__field">
              <label className="add-student__label" htmlFor="zipCode">Zip Code</label>
              <input type="text" id="zipCode" name="zipCode" className="add-student__input" 
                placeholder="Enter zip code" value={formData.zipCode} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* Parent/Guardian Information */}
        <div className="add-student__section">
          <h3 className="add-student__section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Parent/Guardian Information
          </h3>
          
          <div className="add-student__grid">
            <div className="add-student__field">
              <label className="add-student__label" htmlFor="parentName">
                Parent/Guardian Name <span className="add-student__required">*</span>
              </label>
              <input type="text" id="parentName" name="parentName" className="add-student__input" 
                placeholder="Enter parent/guardian name" value={formData.parentName} onChange={handleChange} required />
            </div>
            
            <div className="add-student__field">
              <label className="add-student__label" htmlFor="parentRelation">
                Relationship <span className="add-student__required">*</span>
              </label>
              <select id="parentRelation" name="parentRelation" className="add-student__select" 
                value={formData.parentRelation} onChange={handleChange} required>
                <option value="">Select relationship</option>
                <option value="father">Father</option>
                <option value="mother">Mother</option>
                <option value="guardian">Guardian</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="add-student__field">
              <label className="add-student__label" htmlFor="parentPhone">
                Phone Number <span className="add-student__required">*</span>
              </label>
              <input type="tel" id="parentPhone" name="parentPhone" className="add-student__input" 
                placeholder="Enter phone number" value={formData.parentPhone} onChange={handleChange} required />
            </div>
            
            <div className="add-student__field">
              <label className="add-student__label" htmlFor="parentEmail">Email Address</label>
              <input type="email" id="parentEmail" name="parentEmail" className="add-student__input" 
                placeholder="Enter email address" value={formData.parentEmail} onChange={handleChange} />
            </div>
            
            <div className="add-student__field">
              <label className="add-student__label" htmlFor="parentOccupation">Occupation</label>
              <input type="text" id="parentOccupation" name="parentOccupation" className="add-student__input" 
                placeholder="Enter occupation" value={formData.parentOccupation} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="add-student__actions">
          <button type="button" className="btn btn--secondary" onClick={handleCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            Save Student
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddStudent;
