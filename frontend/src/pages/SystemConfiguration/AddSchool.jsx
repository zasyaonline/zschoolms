import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AddSchool.css';

const AddSchool = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    phone: '',
    email: '',
    website: '',
    principalName: '',
    principalEmail: '',
    principalPhone: '',
    establishedYear: '',
    status: 'active'
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
    // TODO: Add API call to create school
    // await api.schools.create(formData);
    navigate('/configuration/school');
  };

  const handleCancel = () => {
    navigate('/configuration/school');
  };

  return (
    <div className="add-school">
      <div className="add-school__header">
        <h2 className="add-school__title">Add New School</h2>
        <p className="add-school__subtitle">Enter the school details to add to the system</p>
      </div>

      <form className="add-school__form" onSubmit={handleSubmit}>
        <div className="add-school__section">
          <h3 className="add-school__section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Basic Information
          </h3>
          
          <div className="add-school__grid">
            <div className="add-school__field add-school__field--wide">
              <label className="add-school__label" htmlFor="name">
                School Name <span className="add-school__required">*</span>
              </label>
              <input type="text" id="name" name="name" className="add-school__input" 
                placeholder="Enter school name" value={formData.name} onChange={handleChange} required />
            </div>
            
            <div className="add-school__field">
              <label className="add-school__label" htmlFor="code">
                School Code <span className="add-school__required">*</span>
              </label>
              <input type="text" id="code" name="code" className="add-school__input" 
                placeholder="e.g., SHS001" value={formData.code} onChange={handleChange} required />
            </div>
            
            <div className="add-school__field">
              <label className="add-school__label" htmlFor="type">
                School Type <span className="add-school__required">*</span>
              </label>
              <select id="type" name="type" className="add-school__select" 
                value={formData.type} onChange={handleChange} required>
                <option value="">Select type</option>
                <option value="elementary">Elementary School</option>
                <option value="middle">Middle School</option>
                <option value="high">High School</option>
                <option value="k12">K-12</option>
                <option value="college">College</option>
              </select>
            </div>
            
            <div className="add-school__field">
              <label className="add-school__label" htmlFor="establishedYear">Established Year</label>
              <input type="number" id="establishedYear" name="establishedYear" className="add-school__input" 
                placeholder="e.g., 1990" value={formData.establishedYear} onChange={handleChange} />
            </div>
            
            <div className="add-school__field">
              <label className="add-school__label" htmlFor="status">Status</label>
              <select id="status" name="status" className="add-school__select" 
                value={formData.status} onChange={handleChange}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <div className="add-school__section">
          <h3 className="add-school__section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            Address
          </h3>
          
          <div className="add-school__grid">
            <div className="add-school__field add-school__field--full">
              <label className="add-school__label" htmlFor="address">
                Street Address <span className="add-school__required">*</span>
              </label>
              <input type="text" id="address" name="address" className="add-school__input" 
                placeholder="Enter street address" value={formData.address} onChange={handleChange} required />
            </div>
            
            <div className="add-school__field">
              <label className="add-school__label" htmlFor="city">
                City <span className="add-school__required">*</span>
              </label>
              <input type="text" id="city" name="city" className="add-school__input" 
                placeholder="Enter city" value={formData.city} onChange={handleChange} required />
            </div>
            
            <div className="add-school__field">
              <label className="add-school__label" htmlFor="state">
                State/Province <span className="add-school__required">*</span>
              </label>
              <input type="text" id="state" name="state" className="add-school__input" 
                placeholder="Enter state" value={formData.state} onChange={handleChange} required />
            </div>
            
            <div className="add-school__field">
              <label className="add-school__label" htmlFor="zipCode">Zip/Postal Code</label>
              <input type="text" id="zipCode" name="zipCode" className="add-school__input" 
                placeholder="Enter zip code" value={formData.zipCode} onChange={handleChange} />
            </div>
            
            <div className="add-school__field">
              <label className="add-school__label" htmlFor="country">Country</label>
              <input type="text" id="country" name="country" className="add-school__input" 
                placeholder="Enter country" value={formData.country} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="add-school__section">
          <h3 className="add-school__section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            Contact Information
          </h3>
          
          <div className="add-school__grid">
            <div className="add-school__field">
              <label className="add-school__label" htmlFor="phone">
                Phone Number <span className="add-school__required">*</span>
              </label>
              <input type="tel" id="phone" name="phone" className="add-school__input" 
                placeholder="Enter phone number" value={formData.phone} onChange={handleChange} required />
            </div>
            
            <div className="add-school__field">
              <label className="add-school__label" htmlFor="email">
                Email Address <span className="add-school__required">*</span>
              </label>
              <input type="email" id="email" name="email" className="add-school__input" 
                placeholder="Enter email address" value={formData.email} onChange={handleChange} required />
            </div>
            
            <div className="add-school__field">
              <label className="add-school__label" htmlFor="website">Website</label>
              <input type="url" id="website" name="website" className="add-school__input" 
                placeholder="https://www.example.com" value={formData.website} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="add-school__section">
          <h3 className="add-school__section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            Principal Information
          </h3>
          
          <div className="add-school__grid">
            <div className="add-school__field">
              <label className="add-school__label" htmlFor="principalName">Principal Name</label>
              <input type="text" id="principalName" name="principalName" className="add-school__input" 
                placeholder="Enter principal name" value={formData.principalName} onChange={handleChange} />
            </div>
            
            <div className="add-school__field">
              <label className="add-school__label" htmlFor="principalEmail">Principal Email</label>
              <input type="email" id="principalEmail" name="principalEmail" className="add-school__input" 
                placeholder="Enter principal email" value={formData.principalEmail} onChange={handleChange} />
            </div>
            
            <div className="add-school__field">
              <label className="add-school__label" htmlFor="principalPhone">Principal Phone</label>
              <input type="tel" id="principalPhone" name="principalPhone" className="add-school__input" 
                placeholder="Enter principal phone" value={formData.principalPhone} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="add-school__actions">
          <button type="button" className="btn btn--secondary" onClick={handleCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            Save School
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddSchool;
