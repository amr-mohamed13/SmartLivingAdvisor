import { Link } from 'react-router-dom'
import '../App.css'
import englishLogo from '../assets/PNG/english_version.png'
import logo from '../assets/PNG/logo.png'

function SiteHeader() {
  return (
    <nav className="nav">
      <div className="nav-links">
        <a href="#listings">Buy</a>
        <a href="#listings">Rent</a>
        <a href="#services">Features</a>
        <a href="#contact">Support</a>
      </div>
      <div className="brand-center">
        <Link to="/">
          <img src={englishLogo} alt="Smart Living Advisor" />
        </Link>
      </div>
      <div className="nav-actions">
        <Link to="/signin" className="ghost">
          Sign in
        </Link>
        <Link to="/signup">
          <button className="primary">Get started</button>
        </Link>
      </div>
      <Link to="/">
        <div className="brand">
          <img src={logo} alt="Smart Living Advisor" />
        </div>
      </Link>
    </nav>
  )
}

export default SiteHeader
