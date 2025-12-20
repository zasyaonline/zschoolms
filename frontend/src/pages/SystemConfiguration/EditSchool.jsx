import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './EditSchool.css';

const EditSchool = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    schoolName: '',
    schoolCode: '',
    schoolType: '',
    establishedYear: '',
    curriculum: '',
    status: 'active',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    email: '',
    phone: '',
    alternatePhone: '',
    website: '',
    principalName: '',
    principalEmail: '',
    principalPhone: '',
    logo: null
  });

  useEffect(() => {
    // Simulate fetching school data
    setTimeout(() => {
      setFormData({
        schoolName: 'Springfield High School',
        schoolCode: 'SHS001',
        schoolType: 'secondary',
        establishedYear: '1985',
        curriculum: 'national',
        status: 'active',
        address: '742 Evergreen Terrace',
        city: 'Springfield',
        state: 'Illinois',
        country: 'USA',
        postalCode: '62701',
        email: 'info@springfieldhigh.edu',
        phone: '+1 (555) 123-4567',
        alternatePhone: '+1 (555) 123-4568',
        website: 'www.springfieldhigh.edu',
        principalName: 'Dr. Robert Henderson',
        principalEmail: 'principal@springfieldhigh.edu',
        principalPhone: '+1 (555) 123-4569',
        logo: null
      });
      setLoading(false);
    }, 500);
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        logo: file
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Add API call to update school
    // await api.schools.update(id, formData);
    navigate('/schools');
  };

  const handleCancel = () => {
    navigate('/schools');
  };

  if (loading) {
    return (
      <div className="edit-school">
        <div className="edit-school__loading">
          <div className="edit-school__spinner"></div>
          <p>Loading school data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-school">
      <div className="edit-school__header">
        <div className="edit-school__header-left">
          <button className="edit-school__back-btn" onClick={() => navigate('/schools')}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div>
            <h1 className="edit-school__title">Edit School</h1>
            <p className="edit-school__subtitle">Update school information</p>
          </div>
        </div>
      </div>

      <form className="edit-school__form" onSubmit={handleSubmit}>
        {/* Basic Information */}
        <div className="edit-school__section">
          <h2 className="edit-school__section-title">
            <span className="edit-school__section-icon">🏫</span>
            Basic Information
          </h2>
          <div className="edit-school__grid">
            <div className="edit-school__field">
              <label className="edit-school__label">
                School Name <span className="required">*</span>
              </label>
              <input
                type="text"
                name="schoolName"
                className="edit-school__input"
                value={formData.schoolName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="edit-school__field">
              <label className="edit-school__label">
                School Code <span className="required">*</span>
              </label>
              <input
                type="text"
                name="schoolCode"
                className="edit-school__input"
                value={formData.schoolCode}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="edit-school__field">
              <label className="edit-school__label">School Type</label>
              <select
                name="schoolType"
                className="edit-school__select"
                value={formData.schoolType}
                onChange={handleInputChange}
              >
                <option value="">Select Type</option>
                <option value="primary">Primary School</option>
                <option value="secondary">Secondary School</option>
                <option value="high">High School</option>
                <option value="k12">K-12</option>
              </select>
            </div>
            <div className="edit-school__field">
              <label className="edit-school__label">Established Year</label>
              <input
                type="number"
                name="establishedYear"
                className="edit-school__input"
                value={formData.establishedYear}
                onChange={handleInputChange}
                min="1800"
                max="2024"
              />
            </div>
            <div className="edit-school__field">
              <label className="edit-school__label">Curriculum</label>
              <select
                name="curriculum"
                className="edit-school__select"
                value={formData.curriculum}
                onChange={handleInputChange}
              >
                <option value="">Select Curriculum</option>
                <option value="national">National Curriculum</option>
                <option value="cambridge">Cambridge</option>
                <option value="ib">International Baccalaureate</option>
                <option value="american">American Curriculum</option>
              </select>
            </div>
            <div className="edit-school__field">
              <label className="edit-school__label">Status</label>
              <select
                name="status"
                className="edit-school__select"
                value={formData.status}
                onChange={handleInputChange}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="edit-school__section">
          <h2 className="edit-school__section-title">
            <span className="edit-school__section-icon">📍</span>
            Address Information
          </h2>
          <div className="edit-school__grid">
            <div className="edit-school__field edit-school__field--full">
              <label className="edit-school__label">Street Address</label>
              <input
                type="text"
                name="address"
                className="edit-school__input"
                value={formData.address}
                onChange={handleInputChange}
              />
            </div>
            <div className="edit-school__field">
              <label className="edit-school__label">City</label>
              <input
                type="text"
                name="city"
                className="edit-school__input"
                value={formData.city}
                onChange={handleInputChange}
              />
            </div>
            <div className="edit-school__field">
              <label className="edit-school__label">State/Province</label>
              <input
                type="text"
                name="state"
                className="edit-school__input"
                value={formData.state}
                onChange={handleInputChange}
              />
            </div>
            <div className="edit-school__field">
              <label className="edit-school__label">Country</label>
              <input
                type="text"
                name="country"
                className="edit-school__input"
                value={formData.country}
                onChange={handleInputChange}
              />
            </div>
            <div className="edit-school__field">
              <label className="edit-school__label">Postal Code</label>
              <input
                type="text"
                name="postalCode"
                className="edit-school__input"
                value={formData.postalCode}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="edit-school__section">
          <h2 className="edit-school__section-title">
            <span className="edit-school__section-icon">📞</span>
            Contact Information
          </h2>
          <div className="edit-school__grid">
            <div className="edit-school__field">
              <label className="edit-school__label">Email Address</label>
              <input
                type="email"
                name="email"
                className="edit-school__input"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
            <div className="edit-school__field">
              <label className="edit-school__label">Phone Number</label>
              <input
                type="tel"
                name="phone"
                className="edit-school__input"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>
            <div className="edit-school__field">
              <label className="edit-school__label">Alternate Phone</label>
              <input
                type="tel"
                name="alternatePhone"
                className="edit-school__input"
                value={formData.alternatePhone}
                onChange={handleInputChange}
              />
            </div>
            <div className="edit-school__field">
              <label className="edit-school__label">Website</label>
              <input
                type="url"
                name="website"
                className="edit-school__input"
                value={formData.website}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        {/* Principal Information */}
        <div className="edit-school__section">
          <h2 className="edit-school__section-title">
            <span className="edit-school__section-icon">👤</span>
            Principal Information
          </h2>
          <div className="edit-school__grid">
            <div className="edit-school__field">
              <label className="edit-school__label">Principal Name</label>
              <input
                type="text"
                name="principalName"
                className="edit-school__input"
                value={formData.principalName}
                onChange={handleInputChange}
              />
            </div>
            <div className="edit-school__field">
              <label className="edit-school__label">Principal Email</label>
              <input
                type="email"
                name="principalEmail"
                className="edit-school__input"
                value={formData.principalEmail}
                onChange={handleInputChange}
              />
            </div>
            <div className="edit-school__field">
              <label className="edit-school__label">Principal Phone</label>
              <input
                type="tel"
                name="principalPhone"
                className="edit-school__input"
                value={formData.principalPhone}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        {/* School Logo */}
        <div className="edit-school__section">
          <h2 className="edit-school__section-title">
            <span className="edit-school__section-icon">🖼️</span>
            School Logo
          </h2>
          <div className="edit-school__upload">
            <div className="edit-school__upload-area">
              <input
                type="file"
                id="logo"
                accept="image/*"
                onChange={handleFileChange}
                className="edit-school__file-input"
              />
              <label htmlFor="logo" className="edit-school__upload-label">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <path d="M42 30V38C42 39.0609 41.5786 40.0783 40.8284 40.8284C40.0783 41.5786 39.0609 42 38 42H10C8.93913 42 7.92172 41.5786 7.17157 40.8284C6.42143 40.0783 6 39.0609 6 38V30" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M34 16L24 6L14 16" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M24 6V30" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="edit-school__upload-text">
                  {formData.logo ? formData.logo.name : 'Click to upload or drag and drop'}
                </span>
                <span className="edit-school__upload-hint">PNG, JPG or SVG (max. 2MB)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="edit-school__actions">
          <button type="button" className="edit-school__btn edit-school__btn--cancel" onClick={handleCancel}>
            Cancel
          </button>
          <button type="submit" className="edit-school__btn edit-school__btn--submit">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditSchool;
