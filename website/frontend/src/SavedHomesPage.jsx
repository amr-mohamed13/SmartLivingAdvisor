import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import NavBar from './components/NavBar'
import useAuth from './hooks/useAuth'
import getPropertyImage from './utils/propertyImages'
import './components/SavedHomes.css'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

function SavedHomesPage() {
  const { isAuthenticated, token, loading } = useAuth()
  const navigate = useNavigate()
  const [homes, setHomes] = useState([])
  const [status, setStatus] = useState('')

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate('/signin')
  }, [isAuthenticated, loading, navigate])

  useEffect(() => {
    async function loadHomes() {
      if (!token) return
      try {
        const response = await fetch(`${API_BASE_URL}/user/saved`, { headers: { Authorization: `Bearer ${token}` } })
        if (response.ok) {
          const data = await response.json()
          setHomes(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        console.error('Failed to load saved homes', error)
      }
    }
    loadHomes()
  }, [token])

  const handleUnsave = async (homeId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/save-property/${homeId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        setStatus('Home removed')
        setHomes((prev) => prev.filter((home) => home.id !== homeId))
      }
    } catch (error) {
      console.error('Unsave failed', error)
    }
  }

  return (
    <div className="page-shell">
      <NavBar />
      <main className="saved-page">
        <header className="saved-header">
          <div>
            <p className="eyebrow">Collections</p>
            <h1>Saved homes</h1>
          </div>
          {status && <span className="status-text">{status}</span>}
        </header>

        {homes.length === 0 ? (
          <div className="empty-card refined-card">
            <p className="muted">No saved homes yet.</p>
            <button type="button" className="primary subtle-btn" onClick={() => navigate('/search')}>
              Browse homes
            </button>
          </div>
        ) : (
          <div className="saved-grid">
            {homes.map((home) => (
              <article key={home.id} className="saved-card">
                <div className="saved-thumb">
                  <img src={getPropertyImage(home.property_type)} alt={home.property_type || 'Home'} />
                </div>
                <div className="saved-body">
                  <div className="saved-title-row">
                    <h3>${home.price?.toLocaleString?.() || home.price || 'Price on request'}</h3>
                    <button type="button" className="text-link" onClick={() => navigate(`/property/${home.id}`)}>
                      View
                    </button>
                  </div>
                  <p className="muted">{home.location || 'Location coming soon'}</p>
                  <p className="muted">{home.num_rooms ? `${home.num_rooms} bd` : ''} {home.num_bathrooms ? `• ${home.num_bathrooms} ba` : ''}</p>
                </div>
                <div className="saved-actions">
                  <button type="button" className="ghost" onClick={() => handleUnsave(home.id)}>
                    Unsave
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default SavedHomesPage
