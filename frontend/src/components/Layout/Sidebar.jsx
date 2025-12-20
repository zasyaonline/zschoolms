import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import './Sidebar.css'

// Icon imports - we'll use inline SVGs for now
const DashboardIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10.5 17V13.5" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10.5 7V8" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const UsersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.16 10.87C9.06 10.86 8.94 10.86 8.83 10.87C6.45 10.79 4.56 8.84 4.56 6.44C4.56 3.99 6.54 2 9 2C11.45 2 13.44 3.99 13.44 6.44C13.43 8.84 11.54 10.79 9.16 10.87Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16.41 4C18.35 4 19.91 5.57 19.91 7.5C19.91 9.39 18.41 10.93 16.54 11C16.46 10.99 16.37 10.99 16.28 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4.16 14.56C1.74 16.18 1.74 18.82 4.16 20.43C6.91 22.27 11.42 22.27 14.17 20.43C16.59 18.81 16.59 16.17 14.17 14.56C11.43 12.73 6.92 12.73 4.16 14.56Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.34 20C19.06 19.85 19.74 19.56 20.3 19.13C21.86 17.96 21.86 16.03 20.3 14.86C19.75 14.44 19.08 14.16 18.37 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const StudentsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20.59 22C20.59 18.13 16.74 15 12 15C7.26 15 3.41 18.13 3.41 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const ReportsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 7V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V7C3 4 4.5 2 8 2H16C19.5 2 21 4 21 7Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14.5 4.5V6.5C14.5 7.6 15.4 8.5 16.5 8.5H18.5" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 13H12" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 17H16" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const AcademicIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 16.74V4.67C22 3.47 21.02 2.58 19.83 2.68H19.77C17.67 2.86 14.48 3.93 12.7 5.05L12.53 5.16C12.24 5.34 11.76 5.34 11.47 5.16L11.22 5.01C9.44 3.9 6.26 2.84 4.16 2.67C2.97 2.57 2 3.47 2 4.66V16.74C2 17.7 2.78 18.6 3.74 18.72L4.03 18.76C6.2 19.05 9.55 20.15 11.47 21.2L11.51 21.22C11.78 21.37 12.21 21.37 12.47 21.22C14.39 20.16 17.75 19.05 19.93 18.76L20.26 18.72C21.22 18.6 22 17.7 22 16.74Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 5.49V20.49" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7.75 8.49H5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8.5 11.49H5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const TeacherIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10.05 2.53L4.03 6.46C2.1 7.72 2.1 10.54 4.03 11.8L10.05 15.73C11.13 16.44 12.91 16.44 13.99 15.73L19.98 11.8C21.9 10.54 21.9 7.73 19.98 6.47L13.99 2.54C12.91 1.82 11.13 1.82 10.05 2.53Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5.63 13.08L5.62 17.77C5.62 19.04 6.6 20.4 7.8 20.8L10.99 21.86C11.54 22.04 12.45 22.04 13.01 21.86L16.2 20.8C17.4 20.4 18.38 19.04 18.38 17.77V13.13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21.4 15V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const SettingsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 12.88V11.12C2 10.08 2.85 9.22 3.9 9.22C5.71 9.22 6.45 7.94 5.54 6.37C5.02 5.47 5.33 4.3 6.24 3.78L7.97 2.79C8.76 2.32 9.78 2.6 10.25 3.39L10.36 3.58C11.26 5.15 12.74 5.15 13.65 3.58L13.76 3.39C14.23 2.6 15.25 2.32 16.04 2.79L17.77 3.78C18.68 4.3 18.99 5.47 18.47 6.37C17.56 7.94 18.3 9.22 20.11 9.22C21.15 9.22 22.01 10.07 22.01 11.12V12.88C22.01 13.92 21.16 14.78 20.11 14.78C18.3 14.78 17.56 16.06 18.47 17.63C18.99 18.54 18.68 19.7 17.77 20.22L16.04 21.21C15.25 21.68 14.23 21.4 13.76 20.61L13.65 20.42C12.75 18.85 11.27 18.85 10.36 20.42L10.25 20.61C9.78 21.4 8.76 21.68 7.97 21.21L6.24 20.22C5.33 19.7 5.02 18.53 5.54 17.63C6.45 16.06 5.71 14.78 3.9 14.78C2.85 14.78 2 13.92 2 12.88Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const LogoutIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.9 7.56C9.21 3.96 11.06 2.49 15.11 2.49H15.24C19.71 2.49 21.5 4.28 21.5 8.75V15.27C21.5 19.74 19.71 21.53 15.24 21.53H15.11C11.09 21.53 9.24 20.08 8.91 16.54" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15 12H3.62" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5.85 8.65L2.5 12L5.85 15.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const ArrowIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.91 19.92L15.43 13.4C16.2 12.63 16.2 11.37 15.43 10.6L8.91 4.08" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// Logo Component
const Logo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="8" fill="white"/>
    <path d="M8 16L16 8L24 16L16 24L8 16Z" fill="#1F55A6"/>
    <circle cx="16" cy="16" r="4" fill="white"/>
  </svg>
)

const menuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: DashboardIcon,
    path: '/dashboard'
  },
  {
    id: 'users',
    label: 'User Management',
    icon: UsersIcon,
    submenu: [
      { label: 'User List', path: '/users' }
    ]
  },
  {
    id: 'students',
    label: 'Students',
    icon: StudentsIcon,
    submenu: [
      { label: 'Student List', path: '/students' },
      { label: 'Sponsor Mapping', path: '/sponsor-mapping' },
      { label: 'Basic Profile', path: '/teacher/student-profile' }
    ]
  },
  {
    id: 'academic',
    label: 'Academic Records',
    icon: AcademicIcon,
    submenu: [
      { label: 'Approvals List', path: '/marks-approval' },
      { label: 'Marks Review', path: '/marks-review/1' },
      { label: 'Report Cards', path: '/report-cards' }
    ]
  },
  {
    id: 'configuration',
    label: 'Configuration',
    icon: ReportsIcon,
    submenu: [
      { label: 'School Setup', path: '/schools' },
      { label: 'Grading Scheme', path: '/grading-scheme-setup' }
    ]
  },
  {
    id: 'teacher',
    label: 'Teacher Portal',
    icon: TeacherIcon,
    submenu: [
      { label: 'Attendance Entry', path: '/teacher/attendance' },
      { label: 'Marks Entry', path: '/teacher/marks-entry' },
      { label: 'Rejected Marks', path: '/teacher/rejected-marks' }
    ]
  }
]

const Sidebar = () => {
  const location = useLocation()
  const [openMenus, setOpenMenus] = useState(['users'])

  const toggleMenu = (menuId) => {
    setOpenMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    )
  }

  const isActive = (path) => location.pathname === path
  const isMenuActive = (item) => {
    if (item.path) return isActive(item.path)
    if (item.submenu) {
      return item.submenu.some(sub => location.pathname.startsWith(sub.path))
    }
    return false
  }

  return (
    <aside className="sidebar">
      <div className="sidebar__inner">
        <div className="sidebar__top">
          {/* Header */}
          <div className="sidebar__header">
            <Logo />
            <span className="sidebar__title">Administrator</span>
          </div>

          <div className="sidebar__divider" />

          {/* Menu Items */}
          <nav className="sidebar__menu">
            {menuItems.map(item => (
              <div key={item.id}>
                {item.submenu ? (
                  <>
                    <div 
                      className={`sidebar__menu-item ${isMenuActive(item) ? 'sidebar__menu-item--active' : ''}`}
                      onClick={() => toggleMenu(item.id)}
                    >
                      <div className="sidebar__menu-content">
                        <item.icon />
                        <span className="sidebar__menu-text">{item.label}</span>
                      </div>
                      <span className={`sidebar__menu-arrow ${openMenus.includes(item.id) ? 'sidebar__menu-arrow--open' : ''}`}>
                        <ArrowIcon />
                      </span>
                    </div>
                    <div className={`sidebar__submenu ${openMenus.includes(item.id) ? 'sidebar__submenu--open' : ''}`}>
                      {item.submenu.map(sub => (
                        <NavLink 
                          key={sub.path}
                          to={sub.path}
                          className={({ isActive }) => 
                            `sidebar__submenu-item ${isActive ? 'sidebar__submenu-item--active' : ''}`
                          }
                        >
                          {sub.label}
                        </NavLink>
                      ))}
                    </div>
                  </>
                ) : (
                  <NavLink 
                    to={item.path}
                    className={({ isActive }) => 
                      `sidebar__menu-item ${isActive ? 'sidebar__menu-item--active' : ''}`
                    }
                  >
                    <div className="sidebar__menu-content">
                      <item.icon />
                      <span className="sidebar__menu-text">{item.label}</span>
                    </div>
                  </NavLink>
                )}
              </div>
            ))}
          </nav>

          <div className="sidebar__divider" />
        </div>

        {/* Footer */}
        <div className="sidebar__footer">
          <NavLink to="/settings" className="sidebar__menu-item">
            <div className="sidebar__menu-content">
              <SettingsIcon />
              <span className="sidebar__menu-text">Settings</span>
            </div>
          </NavLink>

          <div className="sidebar__divider" />

          <button className="sidebar__menu-item" onClick={() => { /* TODO: Implement logout */ }}>
            <div className="sidebar__menu-content">
              <LogoutIcon />
              <span className="sidebar__menu-text">Log out</span>
            </div>
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
