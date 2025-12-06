import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import NavBar from './components/NavBar'
import useAuth from './hooks/useAuth'
import './components/Profile.css'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

function ProfilePage() {
  const { isAuthenticated, token, user, loading } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '', phone: '', avatar_url: '' })
  const [status, setStatus] = useState('')
  const [savedCount, setSavedCount] = useState(0)
  const [viewedCount, setViewedCount] = useState(0)

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/signin')
    }
  }, [isAuthenticated, loading, navigate])

  useEffect(() => {
    async function loadProfile() {
      if (!token) return
      try {
        const [profileRes, savedRes, viewedRes] = await Promise.all([
          fetch(`${API_BASE_URL}/user/me`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/user/saved`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/user/viewed`, { headers: { Authorization: `Bearer ${token}` } }),
        ])

        if (profileRes.ok) {
          const data = await profileRes.json()
          setProfile({
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            avatar_url: data.avatar_url || '',
          })
        }

        if (savedRes.ok) {
          const saved = await savedRes.json()
          setSavedCount(Array.isArray(saved) ? saved.length : 0)
        }

        if (viewedRes.ok) {
          const viewed = await viewedRes.json()
          setViewedCount(Array.isArray(viewed) ? viewed.length : 0)
        }
      } catch (error) {
        console.error('Profile load failed', error)
      }
    }

    loadProfile()
  }, [token])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus('')
    try {
      const response = await fetch(`${API_BASE_URL}/user/update`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      })

      if (response.ok) {
        setStatus('Profile updated')
      } else {
        setStatus('Unable to save changes right now')
      }
    } catch (error) {
      setStatus('Network error. Please try again.')
    }
  }

  return (
    <div className="page-shell">
      <NavBar />
      <main className="profile-page">
        <header className="profile-header">
          <div>
            <p className="eyebrow">Account</p>
            <h1>{profile.name || 'Your profile'}</h1>
            <p className="muted">{profile.email}</p>
          </div>
        </header>

        <section className="profile-card">
          <h2>Contact info</h2>
          <form className="profile-form" onSubmit={handleSubmit}>
            <label>
              Name
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="Your name"
              />
            </label>
            <label>
              Email
              <input type="email" value={profile.email} disabled />
            </label>
            <label>
              Phone (optional)
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="Add a phone number"
              />
            </label>
            <label>
              Avatar URL (optional)
              <input
                type="url"
                value={profile.avatar_url}
                onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
                placeholder="Link to your avatar"
              />
            </label>
            <div className="profile-actions">
              <button type="submit" className="primary subtle-btn">Save changes</button>
              {status && <span className="status-text">{status}</span>}
            </div>
          </form>
        </section>

        <section className="profile-grid">
          <div className="profile-card compact">
            <div className="card-icon" aria-hidden>❤</div>
            <div>
              <p className="eyebrow">Saved homes</p>
              <h3>{savedCount}</h3>
              <button type="button" className="text-link" onClick={() => navigate('/saved')}>
                View saved homes
              </button>
            </div>
          </div>
          <div className="profile-card compact">
            <div className="card-icon" aria-hidden>👀</div>
            <div>
              <p className="eyebrow">Viewed homes</p>
              <h3>{viewedCount}</h3>
              <button type="button" className="text-link" onClick={() => navigate('/viewed')}>
                View history
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default ProfilePage
