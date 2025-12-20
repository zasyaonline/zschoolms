import { useLocation } from 'react-router-dom'
import './Header.css'

// Notification Icon
const NotificationIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.02 2.91C8.71 2.91 6.02 5.6 6.02 8.91V11.8C6.02 12.41 5.76 13.34 5.45 13.86L4.3 15.77C3.59 16.95 4.08 18.26 5.38 18.7C9.69 20.14 14.34 20.14 18.65 18.7C19.86 18.3 20.39 16.87 19.73 15.77L18.58 13.86C18.28 13.34 18.02 12.41 18.02 11.8V8.91C18.02 5.61 15.32 2.91 12.02 2.91Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round"/>
    <path d="M13.87 3.2C13.56 3.11 13.24 3.04 12.91 3C11.95 2.88 11.03 2.95 10.17 3.2C10.46 2.46 11.18 1.94 12.02 1.94C12.86 1.94 13.58 2.46 13.87 3.2Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15.02 19.06C15.02 20.71 13.67 22.06 12.02 22.06C11.2 22.06 10.44 21.72 9.9 21.18C9.36 20.64 9.02 19.88 9.02 19.06" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10"/>
  </svg>
)

// Message Icon
const MessageIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.5 19H8C4 19 2 18 2 13V8C2 4 4 2 8 2H16C20 2 22 4 22 8V13C22 17 20 19 16 19H15.5C15.19 19 14.89 19.15 14.7 19.4L13.2 21.4C12.54 22.28 11.46 22.28 10.8 21.4L9.3 19.4C9.14 19.18 8.77 19 8.5 19Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15.9965 11H16.0054" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M11.9955 11H12.0045" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7.99451 11H8.00349" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// Route to Breadcrumb mapping
const routeLabels = {
  '/': 'Dashboard',
  '/users': 'User List',
  '/students': 'Student List',
  '/sponsor-mapping': 'Sponsor-Student Mapping',
  '/grading-scheme-setup': 'Grading Scheme Setup',
  '/grade-scheme': 'Grade Scheme',
  '/schools': 'School Information Setup',
  '/schools/add': 'Add New School',
  '/marks-approval': 'Approvals List',
  '/marks-review': 'Marks Review',
  '/report-cards': 'Report Card List',
  '/view-generated-pdf': 'View Generated PDF',
  '/teacher/attendance': 'Attendance Entry',
  '/teacher/marks-entry': 'Marks Entry',
  '/teacher/rejected-marks': 'Rejected Marks Correction',
  '/my-profile': 'My Profile',
  '/my-attendance': 'My Attendance',
  '/my-marks': 'My Marks'
}

const categoryLabels = {
  'users': 'User Management',
  'students': 'System Configuration',
  'sponsor-mapping': 'System Configuration',
  'grading-scheme-setup': 'System Configuration',
  'grade-scheme': 'System Configuration',
  'schools': 'System Configuration',
  'marks-approval': 'Academic Records',
  'marks-review': 'Academic Records',
  'report-cards': 'Academic Records',
  'view-generated-pdf': 'Academic Records',
  'teacher': 'Teacher Portal',
  'my-profile': 'Student Portal',
  'my-attendance': 'Student Portal',
  'my-marks': 'Student Portal'
}

const Header = () => {
  const location = useLocation()
  
  // Generate breadcrumb from current path
  const getBreadcrumb = () => {
    const path = location.pathname
    const pathParts = path.split('/').filter(Boolean)
    const firstPart = pathParts[0] || 'dashboard'
    
    const category = categoryLabels[firstPart] || 'Dashboard'
    const pageLabel = routeLabels[path] || pathParts[pathParts.length - 1] || 'Dashboard'
    
    return { category, pageLabel }
  }

  const { category, pageLabel } = getBreadcrumb()
  
  // Get current date
  const getCurrentDate = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const now = new Date()
    return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`
  }

  // Get user initials for avatar placeholder
  const getUserInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const user = {
    name: 'Jackson Doe',
    role: 'Administrator',
    avatar: null // Set to image URL if available
  }

  return (
    <header className="header">
      <nav className="header__breadcrumb" aria-label="Breadcrumb">
        <span className="header__breadcrumb-item">{category}</span>
        <span className="header__breadcrumb-separator">/</span>
        <span className="header__breadcrumb-item">{pageLabel}</span>
      </nav>

      <div className="header__right">
        <span className="header__date">{getCurrentDate()}</span>

        <div className="header__icons">
          <button className="header__icon-btn" aria-label="Notifications">
            <NotificationIcon />
            <span className="header__icon-badge">3</span>
          </button>
          <button className="header__icon-btn" aria-label="Messages">
            <MessageIcon />
          </button>
        </div>

        <div className="header__divider" />

        <div className="header__avatar-section">
          <div className="header__avatar">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} />
            ) : (
              <div className="header__avatar-placeholder">
                {getUserInitials(user.name)}
              </div>
            )}
          </div>
          <div className="header__user-info">
            <span className="header__user-name">{user.name}</span>
            <span className="header__user-role">{user.role}</span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
