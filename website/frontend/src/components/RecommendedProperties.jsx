import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import getPropertyImage from '../utils/propertyImages'
import './PropertyDetails.css'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

const formatPrice = (price) => {
  if (!price && price !== 0) return 'Price on request'
  const numericPrice = Number(price)
  return Number.isFinite(numericPrice) ? `$${numericPrice.toLocaleString()}` : 'Price on request'
}

const formatSpecs = (property) => {
  const specs = []
  if (property?.num_rooms || property?.beds) specs.push(`${property.num_rooms || property.beds} bd`)
  if (property?.num_bathrooms || property?.baths) specs.push(`${property.num_bathrooms || property.baths} ba`)
  if (property?.floor_area_m2 || property?.sqft) {
    const sqft = property.floor_area_m2
      ? Math.round(Number(property.floor_area_m2) * 10.764)
      : Number(property.sqft)
    if (Number.isFinite(sqft)) specs.push(`${sqft.toLocaleString()} sqft`)
  }
  return specs.join(' • ')
}

function RecommendedProperties({ propertyId, token }) {
  const navigate = useNavigate()
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRecommendations() {
      if (!propertyId) return

      try {
        setLoading(true)
        const headers = {}
        if (token) {
          headers.Authorization = `Bearer ${token}`
        }

        // Try property-specific recommendations first
        let response = await fetch(`${API_BASE_URL}/api/recommendations/${propertyId}`, {
          headers,
        })

        // Fallback to general recommendations if property-specific endpoint doesn't exist
        if (!response.ok) {
          response = await fetch(`${API_BASE_URL}/api/recommendations?limit=6`, {
            headers,
          })
        }

        if (!response.ok) {
          // If still fails and user is not authenticated, try similar properties
          if (!token) {
            response = await fetch(`${API_BASE_URL}/api/properties/similar?id=${propertyId}`)
          }
        }

        if (!response.ok) throw new Error('Unable to load recommendations')

        const data = await response.json()
        if (Array.isArray(data)) {
          setProperties(data.slice(0, 6)) // Limit to 6
        }
      } catch (err) {
        console.error('Error fetching recommendations:', err)
        // Try similar properties as fallback
        try {
          const response = await fetch(`${API_BASE_URL}/api/properties/similar?id=${propertyId}`)
          if (response.ok) {
            const data = await response.json()
            if (Array.isArray(data)) {
              setProperties(data.slice(0, 6))
            }
          }
        } catch (fallbackErr) {
          console.error('Fallback also failed:', fallbackErr)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [propertyId, token])

  if (loading && properties.length === 0) {
    return (
      <section className="related-section">
        <div className="section-header">
          <div>
            <p className="section-eyebrow">Personalized for you</p>
            <h2>Recommended For You</h2>
          </div>
        </div>
        <div className="card-row" aria-busy={true}>
          <p className="empty-state">Loading recommendations...</p>
        </div>
      </section>
    )
  }

  if (properties.length === 0) {
    return null
  }

  return (
    <section className="related-section">
      <div className="section-header">
        <div>
          <p className="section-eyebrow">Personalized for you</p>
          <h2>Recommended For You</h2>
        </div>
      </div>
      <div className="card-row" aria-busy={loading}>
        {properties.map((property) => (
          <article
            key={property.id || property.no}
            className="mini-card"
            onClick={() => navigate(`/property/${property.id || property.no}`)}
            style={{ cursor: 'pointer' }}
          >
            <div className="mini-card-image">
              <img
                src={getPropertyImage(property.property_type)}
                alt={property.property_type || 'Property'}
              />
              {property.smart_living_score && (
                <span className="mini-score">
                  {Math.round(property.smart_living_score)} Smart
                </span>
              )}
            </div>
            <div className="mini-card-body">
              <p className="mini-price">{formatPrice(property.price)}</p>
              <p className="mini-specs">{formatSpecs(property)}</p>
              <p className="mini-address">{property.location || property.city || 'Location not available'}</p>
              <p className="mini-type">{property.property_type || 'Property'}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default RecommendedProperties

