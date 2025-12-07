import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PropertyGallery from './components/PropertyGallery'
import PropertySummary from './components/PropertySummary'
import PropertyFacts from './components/PropertyFacts'
import PropertyLocationMap from './components/PropertyLocationMap'
import POIExplorer from './components/POIExplorer'
import RecommendedProperties from './components/RecommendedProperties'
import SimilarHomes from './components/SimilarHomes'
import SiteHeader from './components/SiteHeader'
import './components/PropertyDetails.css'
import useAuth from './hooks/useAuth'
import logo from './assets/PNG/logo.png'
import footerIllustration from './assets/PNG/footer.png'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

function PropertyDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token, isAuthenticated } = useAuth()
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isSaved, setIsSaved] = useState(false)
  const [showSignInPrompt, setShowSignInPrompt] = useState(false)

  const coordinates = useMemo(
    () => ({ lat: property?.latitude, lng: property?.longitude }),
    [property]
  )

  useEffect(() => {
    async function fetchProperty() {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`${API_BASE_URL}/api/properties/${id}`)
        if (!response.ok) throw new Error('Unable to load property')
        const data = await response.json()
        setProperty(data)
      } catch (err) {
        setError('We could not load this property right now.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchProperty()
  }, [id])

  useEffect(() => {
    async function loadSavedState() {
      if (!token) return
      try {
        const response = await fetch(`${API_BASE_URL}/user/saved`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) return
        const data = await response.json()
        const ids = Array.isArray(data) ? data.map((item) => item.id) : []
        setIsSaved(ids.includes(Number(id)))
      } catch (err) {
        console.error('Failed to load saved properties', err)
      }
    }

    loadSavedState()
  }, [id, token])

  useEffect(() => {
    async function logView() {
      if (!token || !property) return
      try {
        await fetch(`${API_BASE_URL}/user/view-property`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ property_id: Number(id) }),
        })
      } catch (err) {
        console.error('Failed to log view', err)
      }
    }

    logView()
  }, [id, property, token])

  const handleSaveProperty = async () => {
    if (!isAuthenticated || !token) {
      setShowSignInPrompt(true)
      return
    }

    try {
      if (isSaved) {
        const response = await fetch(`${API_BASE_URL}/user/save-property/${id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (!response.ok) throw new Error('Unable to remove saved property')
      } else {
        const response = await fetch(`${API_BASE_URL}/user/save-property`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ property_id: Number(id) }),
        })
        if (!response.ok) throw new Error('Unable to save property')
      }
      setIsSaved(!isSaved)
      setShowSignInPrompt(false)
    } catch (err) {
      console.error(err)
    }
  }

  const backToSearch = () => navigate(-1)

  if (loading) {
    return (
      <div className="page-shell">
        <SiteHeader />
        <div className="page-body">
          <p className="loading">Loading property...</p>
        </div>
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="page-shell">
        <SiteHeader />
        <div className="page-body">
          <p className="error-message">{error || 'This property is unavailable.'}</p>
          <button className="primary" type="button" onClick={backToSearch}>
            Go back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell">
      <SiteHeader />
      <main className="page-body">
        {/* Section 1: Property Header + Image Gallery */}
        <PropertyGallery images={property.images} propertyType={property.property_type} />
        <PropertySummary
          property={property}
          isSaved={isSaved}
          onSave={handleSaveProperty}
          showSignInPrompt={showSignInPrompt}
        />

        {/* Section 2: Property Location Map */}
        {coordinates.lat && coordinates.lng && (
          <PropertyLocationMap
            lat={coordinates.lat}
            lng={coordinates.lng}
            address={property.location || property.address}
          />
        )}

        {/* Section 3: Property Details */}
        <PropertyFacts property={property} />

        {/* Section 4: Nearest POIs Explorer */}
        {coordinates.lat && coordinates.lng && (
          <POIExplorer propertyLat={coordinates.lat} propertyLng={coordinates.lng} />
        )}

        {/* Section 5: Similar Homes in Area */}
        <SimilarHomes 
          propertyId={id} 
          location={property.location || property.address}
          city={property.city}
        />

        {/* Section 6: Recommended For You */}
        <RecommendedProperties propertyId={id} token={token} />
      </main>

      {/* Section 6: Footer */}
      <footer className="footer">
        <div className="footer-columns">
          <div>
            <h4>Explore</h4>
            <a href="#listings">Trending Homes</a>
            <a href="#services">Smart Living Score</a>
            <a href="#contact">Concierge</a>
          </div>
          <div>
            <h4>Buy / Rent</h4>
            <a href="#">Mortgage Calculator</a>
            <a href="#">Market Insights</a>
            <a href="#">Neighborhoods</a>
          </div>
          <div>
            <h4>About</h4>
            <a href="#">Our Story</a>
            <a href="#">Careers</a>
            <a href="#">Newsroom</a>
          </div>
          <div>
            <h4>Support</h4>
            <a href="#">Help Center</a>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-brand">
            <img src={logo} alt="SmartLivingAdvisor logo" />
            <p>© {new Date().getFullYear()} Maladh. All rights reserved.</p>
          </div>
          <div className="socials">
            <span className="follow-text">Follow us:</span>
            <a href="#" aria-label="Facebook">
              <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a href="#" aria-label="Instagram">
              <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a href="#" aria-label="X">
              <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
          </div>
        </div>
        <div className="footer-image-container">
          <img className="footer-illustration" src={footerIllustration} alt="SmartLivingAdvisor footer illustration" />
        </div>
      </footer>
    </div>
  )
}

export default PropertyDetailsPage
