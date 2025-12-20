import { useState } from 'react';
import ToggleSwitch from '../../components/common/ToggleSwitch';
import './UserList.css';

const UserList = () => {
  const [users, setUsers] = useState([
    { id: 1, name: 'John Doe', email: 'john.doe@example.com', role: 'Admin', mobile: '+1234567890', status: false, lastLogin: '2024-12-01' },
    { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', role: 'Teacher', mobile: '+1234567891', status: true, lastLogin: '2024-12-10' },
    { id: 3, name: 'Alice Johnson', email: 'alice.johnson@example.com', role: 'Student', mobile: '+1234567892', status: false, lastLogin: '2024-11-15' },
    { id: 4, name: 'Michael Brown', email: 'michael.brown@example.com', role: 'Sponsor', mobile: '+1234567893', status: true, lastLogin: '2024-12-12' },
    { id: 5, name: 'Emily Davis', email: 'emily.davis@example.com', role: 'Admin', mobile: '+1234567894', status: false, lastLogin: '2024-11-20' },
    { id: 6, name: 'Chris Wilson', email: 'chris.wilson@example.com', role: 'Teacher', mobile: '+1234567895', status: true, lastLogin: '2024-12-14' },
    { id: 7, name: 'Patricia Taylor', email: 'patricia.taylor@example.com', role: 'Student', mobile: '+1234567896', status: false, lastLogin: '2024-11-25' },
    { id: 8, name: 'David Martinez', email: 'david.martinez@example.com', role: 'Sponsor', mobile: '+1234567897', status: true, lastLogin: '2024-12-15' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeModal, setActiveModal] = useState(null); // 'add', 'edit', 'bulk'
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    role: '',
    status: false
  });

  const handleStatusChange = (userId, newStatus) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, status: newStatus } : user
    ));
  };

  const handleDelete = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(user => user.id !== userId));
    }
  };

  const handleExportCSV = () => {
    // Generate CSV data
    const headers = 'Name,Email,Mobile,Role,Status\n';
    const csvData = users.map(u => 
      `${u.name},${u.email},${u.mobile},${u.role},${u.status ? 'Active' : 'Inactive'}`
    ).join('\n');
    const blob = new Blob([headers + csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const openAddModal = () => {
    setFormData({ name: '', email: '', mobile: '', role: '', status: false });
    setSelectedUser(null);
    setActiveModal('add');
  };

  const openEditModal = (user) => {
    setFormData({ 
      name: user.name, 
      email: user.email, 
      mobile: user.mobile, 
      role: user.role,
      status: user.status || false
    });
    setSelectedUser(user);
    setActiveModal('edit');
  };

  const openBulkModal = () => {
    setActiveModal('bulk');
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedUser(null);
  };

  const handleFormChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSaveUser = (e) => {
    e.preventDefault();
    if (selectedUser) {
      // Edit existing user
      setUsers(users.map(user => 
        user.id === selectedUser.id 
          ? { ...user, ...formData }
          : user
      ));
    } else {
      // Add new user
      const newUser = {
        id: users.length + 1,
        ...formData,
        status: false,
        lastLogin: new Date().toISOString().split('T')[0]
      };
      setUsers([...users, newUser]);
    }
    closeModal();
  };

  return (
    <div className="user-list">
      <div className="user-list__header">
        <h1 className="user-list__title">User Management</h1>
      </div>

      <div className="user-list__card">
        <div className="user-list__actions">
          <div className="user-list__search">
            <svg className="user-list__search-icon" width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M8.25 14.25C11.5637 14.25 14.25 11.5637 14.25 8.25C14.25 4.93629 11.5637 2.25 8.25 2.25C4.93629 2.25 2.25 4.93629 2.25 8.25C2.25 11.5637 4.93629 14.25 8.25 14.25Z" stroke="#8D8D8D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15.75 15.75L12.4875 12.4875" stroke="#8D8D8D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <input
              type="text"
              className="user-list__search-input"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="user-list__action-buttons">
            <button className="user-list__filter-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M5.4 2.1H18.6C19.37 2.1 20 2.73 20 3.5V5.5C20 6.05 19.7 6.7 19.35 7.05L15.3 10.6C14.85 11.05 14.6 11.6 14.6 12.25V15.8C14.6 16.25 14.35 16.8 14 17.05L13 17.8C12.05 18.45 10.7 17.8 10.7 16.55V12.15C10.7 11.6 10.45 10.95 10.1 10.6L6.55 7.05C6.2 6.7 5.9 6.05 5.9 5.6V3.6C5.9 2.73 6.53 2.1 7.3 2.1H5.4Z" stroke="#8D8D8D" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <button className="user-list__btn user-list__btn--secondary" onClick={openBulkModal}>
              Bulk Upload
            </button>

            <button className="user-list__btn user-list__btn--secondary" onClick={handleExportCSV}>
              Export CSV
            </button>

            <button className="user-list__btn user-list__btn--primary" onClick={openAddModal}>
              + Add New User
            </button>
          </div>
        </div>

        <div className="user-list__table-wrapper">
          <table className="user-list__table">
            <thead>
              <tr className="user-list__table-header">
                <th style={{ width: '200px' }}>Name</th>
                <th style={{ width: '250px' }}>Email</th>
                <th style={{ width: '140px' }}>Role</th>
                <th style={{ width: '160px' }}>Last Login</th>
                <th style={{ width: '92px' }} className="user-list__table-header--center">Actions</th>
                <th style={{ width: '138px' }} className="user-list__table-header--center">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="user-list__table-row">
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{user.lastLogin}</td>
                  <td>
                    <div className="user-list__action-icons">
                      <button className="user-list__icon-btn" onClick={() => openEditModal(user)}>
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                          <path d="M10.5 2.25L3.75 9.15C3.525 9.375 3.3 9.825 3.3 10.125L3 12.6C2.925 13.2 3.375 13.65 3.975 13.575L6.45 13.275C6.75 13.275 7.125 13.05 7.35 12.825L14.1 6.075C15.075 5.1 15.525 3.975 14.1 2.55C12.675 1.125 11.475 1.275 10.5 2.25Z" stroke="#1F55A6" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M9.67505 3.07495C10.05 4.72495 11.4 6.07495 13.05 6.44995" stroke="#1F55A6" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button className="user-list__icon-btn">
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                          <path d="M11.5425 7.2825C12.8625 8.6025 12.8625 10.7475 11.5425 12.0675C10.2225 13.3875 8.0775 13.3875 6.7575 12.0675C5.4375 10.7475 5.4375 8.6025 6.7575 7.2825C8.0775 5.9625 10.2225 5.9625 11.5425 7.2825Z" stroke="#1F55A6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M9.15002 2.6925C10.8 2.6925 12.4125 3.3525 13.6125 4.5525C15.3 6.24 16.05 8.5125 15.8625 10.7475C15.675 12.9825 14.5875 15.0225 12.825 16.35C11.775 17.175 10.4625 17.625 9.15002 17.625C7.83752 17.625 6.52502 17.175 5.47502 16.35C3.71252 15.0225 2.62502 12.9825 2.43752 10.7475C2.25002 8.5125 3.00002 6.24 4.68752 4.5525C5.88752 3.3525 7.50002 2.6925 9.15002 2.6925Z" stroke="#1F55A6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button className="user-list__icon-btn user-list__icon-btn--delete" onClick={() => handleDelete(user.id)}>
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                          <path d="M15.75 4.48499C13.2525 4.23749 10.74 4.10999 8.235 4.10999C6.75 4.10999 5.265 4.18499 3.78 4.33499L2.25 4.48499" stroke="#1F55A6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M6.375 3.7275L6.54 2.745C6.66 2.0325 6.75 1.5 8.0175 1.5H9.9825C11.25 1.5 11.3475 2.0625 11.46 2.7525L11.625 3.7275" stroke="#1F55A6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M14.1375 6.85498L13.65 14.4075C13.5675 15.585 13.5 16.5 11.4075 16.5H6.5925C4.5 16.5 4.4325 15.585 4.35 14.4075L3.8625 6.85498" stroke="#1F55A6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                  <td>
                    <div className="user-list__status-cell">
                      <ToggleSwitch 
                        isActive={user.status} 
                        onChange={(newStatus) => handleStatusChange(user.id, newStatus)}
                      />
                      <span className="user-list__status-text">
                        {user.status ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="user-list__footer">
        <a href="#" className="user-list__footer-link">Need Help?</a>
        <a href="#" className="user-list__footer-link">Contact Support</a>
      </div>

      {/* Add/Edit User Modal */}
      {(activeModal === 'add' || activeModal === 'edit') && (
        <div className="user-modal-overlay" onClick={closeModal}>
          <div className="user-modal" onClick={(e) => e.stopPropagation()}>
            <div className="user-modal__header">
              <h2 className="user-modal__title">
                {activeModal === 'add' ? 'Add New User' : 'Edit User'}
              </h2>
            </div>

            <div className="user-modal__divider" />

            <form onSubmit={handleSaveUser}>
              <div className="user-modal__fields">
                <div className="user-modal__field-group">
                  <label className="user-modal__floating-label">Name</label>
                  <input
                    type="text"
                    className="user-modal__input"
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    placeholder="Name"
                    required
                  />
                </div>

                <div className="user-modal__field-group">
                  <input
                    type="email"
                    className="user-modal__input"
                    value={formData.email}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                    placeholder="Email address"
                    required
                  />
                </div>

                <div className="user-modal__field-group">
                  <input
                    type="tel"
                    className="user-modal__input"
                    value={formData.mobile}
                    onChange={(e) => handleFormChange('mobile', e.target.value)}
                    placeholder="Mobile Number"
                    required
                  />
                </div>

                <div className="user-modal__field-group">
                  <select
                    className="user-modal__input user-modal__input--select"
                    value={formData.role}
                    onChange={(e) => handleFormChange('role', e.target.value)}
                    required
                  >
                    <option value="" disabled>Select Role</option>
                    <option value="Admin">Admin</option>
                    <option value="Teacher">Teacher</option>
                    <option value="Student">Student</option>
                    <option value="Sponsor">Sponsor</option>
                  </select>
                  <svg className="user-modal__dropdown-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M19 9L12 16L5 9" stroke="#8D8D8D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>

                <div className="user-modal__status-row">
                  <label className="user-modal__status-label">Status</label>
                  <div className="user-modal__status-control">
                    <ToggleSwitch 
                      isActive={formData.status || false} 
                      onChange={(status) => handleFormChange('status', status)}
                    />
                    <span className="user-modal__status-text">
                      {formData.status ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="user-modal__actions">
                <button type="submit" className="user-modal__btn user-modal__btn--primary">
                  Save
                </button>
                <button type="button" className="user-modal__btn user-modal__btn--secondary" onClick={closeModal}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {activeModal === 'bulk' && (
        <div className="user-modal-overlay" onClick={closeModal}>
          <div className="user-modal user-modal--bulk" onClick={(e) => e.stopPropagation()}>
            <button className="user-modal__close" onClick={closeModal}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="#333333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <h2 className="user-modal__title">Bulk Upload Users</h2>
            
            <div className="user-modal__upload-area">
              <div className="user-modal__upload-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <path d="M16 32L24 24L32 32" stroke="#1F55A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M24 24V42" stroke="#1F55A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M40.78 36.78C42.66 35.58 44 33.56 44 31.22C44 27.56 41.1 24.58 37.5 24.58C37.22 24.58 36.94 24.6 36.68 24.62C36.3 18.36 31.12 13.42 24.76 13.42C18.22 13.42 12.92 18.72 12.92 25.26C12.92 25.82 12.96 26.36 13.04 26.9C7.78 27.74 3.66 32.28 3.66 37.82C3.66 43.94 8.58 48.86 14.7 48.86H40.78" stroke="#1F55A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="user-modal__upload-text">
                Drag and drop CSV file here or <span className="user-modal__upload-link">browse</span>
              </p>
              <input 
                type="file" 
                className="user-modal__upload-input" 
                accept=".csv"
                onChange={() => { /* TODO: Handle file upload */ }}
              />
            </div>

            <div className="user-modal__template">
              <button type="button" className="user-modal__btn user-modal__btn--secondary">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 13.5V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17.5 8.33333V11.6667C17.5 15 16.25 16.6667 12.5 16.6667H7.5C3.75 16.6667 2.5 15 2.5 11.6667V8.33333C2.5 5 3.75 3.33333 7.5 3.33333H12.5C16.25 3.33333 17.5 5 17.5 8.33333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12.9167 7H7.08337" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Download CSV Template
              </button>
            </div>

            <div className="user-modal__actions">
              <button type="button" className="user-modal__btn user-modal__btn--primary" onClick={closeModal}>
                Upload
              </button>
              <button type="button" className="user-modal__btn user-modal__btn--secondary" onClick={closeModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;
