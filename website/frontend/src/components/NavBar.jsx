import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import englishLogo from '../assets/PNG/english_version.png'
import logo from '../assets/PNG/logo.png'
import useAuth from '../hooks/useAuth'
import '../App.css'

function NavBar() {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const initials = user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    setMenuOpen(false)
    await logout()
  }

  const handleProfileNav = (path) => {
    setMenuOpen(false)
    navigate(path)
  }

  return (
    <nav className="nav refined-nav">
      <div className="nav-links">
        <a href="#listings">Buy</a>
        <a href="#listings">Rent</a>
        <a href="#services">Features</a>
        <a href="#contact">Support</a>
      </div>

      <div className="brand-center">
        <Link to="/" className="brand-link">
          <img src={englishLogo} alt="SmartLivingAdvisor" />
        </Link>
      </div>

      <div className="nav-actions">
        {!isAuthenticated ? (
          <>
            <Link to="/signin" className="ghost">Sign in</Link>
            <Link to="/signup">
              <button className="primary subtle-btn">Get started</button>
            </Link>
          </>
        ) : (
          <div className="nav-profile" ref={menuRef}>
            <button
              type="button"
              className="avatar-button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="User menu"
            >
              <div className="avatar-chip">{initials}</div>
            </button>
            {menuOpen && (
              <div className="nav-dropdown">
                <div className="nav-user">
                  <img src={logo} alt="SmartLivingAdvisor" />
                  <div>
                    <p className="nav-user-name">{user?.name || 'Welcome back'}</p>
                    <p className="nav-user-email">{user?.email}</p>
                  </div>
                </div>
                <button type="button" onClick={() => handleProfileNav('/profile')}>Profile</button>
                <button type="button" onClick={() => handleProfileNav('/saved')}>Saved Homes</button>
                <button type="button" onClick={() => handleProfileNav('/viewed')}>Viewed Homes</button>
                <button type="button" className="logout" onClick={handleLogout}>Logout</button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

export default NavBar
