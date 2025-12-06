import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import NavBar from './components/NavBar'
import useAuth from './hooks/useAuth'
import getPropertyImage from './utils/propertyImages'
import './components/SavedHomes.css'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

function ViewedHomesPage() {
  const { isAuthenticated, token, loading } = useAuth()
  const navigate = useNavigate()
  const [homes, setHomes] = useState([])

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate('/signin')
  }, [isAuthenticated, loading, navigate])

  useEffect(() => {
    async function loadHomes() {
      if (!token) return
      try {
        const response = await fetch(`${API_BASE_URL}/user/viewed`, { headers: { Authorization: `Bearer ${token}` } })
        if (response.ok) {
          const data = await response.json()
          setHomes(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        console.error('Failed to load viewed homes', error)
      }
    }
    loadHomes()
  }, [token])

  return (
    <div className="page-shell">
      <NavBar />
      <main className="saved-page">
        <header className="saved-header">
          <div>
            <p className="eyebrow">History</p>
            <h1>Viewed homes</h1>
          </div>
        </header>

        {homes.length === 0 ? (
          <div className="empty-card refined-card">
            <p className="muted">You have not viewed any homes yet.</p>
            <button type="button" className="primary subtle-btn" onClick={() => navigate('/search')}>
              Start exploring
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
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default ViewedHomesPage
