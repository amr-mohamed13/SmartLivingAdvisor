import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import PropertyGallery from './PropertyGallery'
import PropertySummary from './PropertySummary'
import PropertyFacts from './PropertyFacts'
import MapArea from './MapArea'
import SimilarHomes from './SimilarHomes'
import './PropertyModal.css'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

function PropertyModal({ property, onClose }) {
  const navigate = useNavigate()
  const { isAuthenticated, token } = useAuth()
  const [fullProperty, setFullProperty] = useState(property)
  const [loading, setLoading] = useState(!property)
  const [error, setError] = useState(null)
  const [isSaved, setIsSaved] = useState(false)
  const [showSignInPrompt, setShowSignInPrompt] = useState(false)

  // Fetch full property details if we only have basic info
  useEffect(() => {
    if (!property?.no) return

    async function fetchProperty() {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`${API_BASE_URL}/api/properties/${property.no}`)
        if (!response.ok) throw new Error('Unable to load property')
        const data = await response.json()
        setFullProperty(data)
      } catch (err) {
        console.error('Error loading property:', err)
        setError('Unable to load full property details')
        // Use the property we have even if fetch fails
        setFullProperty(property)
      } finally {
        setLoading(false)
      }
    }

    // Only fetch if we don't have full details
    if (!property.images && !property.description) {
      fetchProperty()
    } else {
      setFullProperty(property)
      setLoading(false)
    }
  }, [property])

  useEffect(() => {
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  // Check if property is saved on load
  useEffect(() => {
    if (isAuthenticated && token && fullProperty?.no) {
      checkSavedStatus()
    }
  }, [isAuthenticated, token, fullProperty?.no])

  const checkSavedStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/saved-properties`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const savedIds = await response.json()
        setIsSaved(savedIds.includes(fullProperty.no))
      }
    } catch (err) {
      console.error('Failed to check saved status:', err)
    }
  }

  // Log view when modal opens
  useEffect(() => {
    if (isAuthenticated && token && fullProperty?.no) {
      logView()
    }
  }, [isAuthenticated, token, fullProperty?.no])

  const logView = async () => {
    try {
      await fetch(`${API_BASE_URL}/user/view-property`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ property_id: fullProperty.no })
      })
    } catch (err) {
      console.error('Failed to log view:', err)
    }
  }

  const handleSaveProperty = async () => {
    if (!isAuthenticated) {
      onClose()
      navigate('/signin', { state: { from: { pathname: window.location.pathname } } })
      return
    }

    try {
      if (isSaved) {
        // Unsave property
        const response = await fetch(`${API_BASE_URL}/user/save-property/${fullProperty.no}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
        
        if (response.ok) {
          setIsSaved(false)
        } else {
          throw new Error('Unable to unsave property')
        }
      } else {
        // Save property
        const response = await fetch(`${API_BASE_URL}/user/save-property`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ property_id: fullProperty.no }),
        })
        
        if (response.ok) {
          setIsSaved(true)
        } else {
          throw new Error('Unable to save property')
        }
      }
    } catch (err) {
      console.error(err)
      alert('Failed to save property. Please try again.')
    }
  }

  const coordinates = useMemo(
    () => ({ lat: fullProperty?.latitude, lng: fullProperty?.longitude }),
    [fullProperty]
  )

  if (loading) {
    return (
      <div className="property-modal-overlay" onClick={onClose}>
        <div className="property-modal" onClick={(e) => e.stopPropagation()}>
          <div className="property-modal-loading">
            <p>Loading property details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error && !fullProperty) {
    return (
      <div className="property-modal-overlay" onClick={onClose}>
        <div className="property-modal" onClick={(e) => e.stopPropagation()}>
          <button className="property-modal-close" onClick={onClose}>×</button>
          <div className="property-modal-error">
            <p>{error}</p>
            <button className="primary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="property-modal-overlay" onClick={onClose}>
      <div className="property-modal" onClick={(e) => e.stopPropagation()}>
        <button className="property-modal-close" onClick={onClose} aria-label="Close modal">
          ×
        </button>
        
        <div className="property-modal-content">
          {/* Photo Gallery */}
          <div className="property-modal-gallery">
            <PropertyGallery 
              images={fullProperty?.images || []} 
              propertyType={fullProperty?.property_type} 
            />
          </div>

          {/* Summary Section */}
          <div className="property-modal-summary">
            <PropertySummary
              property={fullProperty}
              isSaved={isSaved}
              onSave={handleSaveProperty}
              showSignInPrompt={showSignInPrompt}
            />
          </div>

          {/* Property Facts */}
          <div className="property-modal-facts">
            <PropertyFacts property={fullProperty} />
          </div>

          {/* Map Area */}
          {coordinates.lat && coordinates.lng && (
            <div className="property-modal-map">
              <MapArea 
                lat={coordinates.lat} 
                lng={coordinates.lng} 
                address={fullProperty?.location || fullProperty?.address} 
                city={fullProperty?.city} 
              />
            </div>
          )}

          {/* Similar Homes */}
          <div className="property-modal-similar">
            <SimilarHomes propertyId={fullProperty?.no} />
          </div>

          {/* Agent Contact Box (Zillow-style) */}
          <div className="property-modal-contact">
            <div className="contact-card">
              <div className="contact-header">
                <div className="contact-avatar">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
                <div className="contact-info">
                  <h3>SmartLiving Advisor</h3>
                  <p>Real Estate Specialist</p>
                </div>
              </div>
              <div className="contact-actions">
                <button className="contact-button primary">Contact Agent</button>
                <button className="contact-button secondary">Schedule Tour</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PropertyModal


