import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import './MainLayout.css'

const MainLayout = () => {
  return (
    <div className="layout">
      <div className="layout__sidebar">
        <Sidebar />
      </div>
      <main className="layout__main">
        <Header />
        <div className="layout__content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default MainLayout
