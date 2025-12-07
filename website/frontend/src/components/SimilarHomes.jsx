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

function SimilarHomes({ propertyId, location, city }) {
  const navigate = useNavigate()
  const [homes, setHomes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSimilar() {
      if (!propertyId) return
      
      try {
        setLoading(true)
        
        // Extract city/area from location string
        let searchQuery = ''
        if (city) {
          searchQuery = city
        } else if (location) {
          // Try to extract city from location (e.g., "123 Main St, Chicago, IL" -> "Chicago")
          const parts = location.split(',')
          if (parts.length > 1) {
            searchQuery = parts[parts.length - 1].trim() // Get last part (usually city)
          } else {
            searchQuery = location
          }
        }
        
        if (!searchQuery) {
          setLoading(false)
          return
        }
        
        // Fetch properties from the same area, excluding current property
        const params = new URLSearchParams()
        params.append('query', searchQuery)
        params.append('limit', '20') // Get more to filter out current property
        params.append('sort_by', 'score')
        
        const response = await fetch(`${API_BASE_URL}/search?${params.toString()}`)
        
        if (!response.ok) {
          throw new Error('Unable to load properties')
        }
        
        const data = await response.json()
        
        if (Array.isArray(data)) {
          // Filter out current property and limit to 6
          const filtered = data
            .filter(prop => prop.no !== Number(propertyId) && prop.id !== Number(propertyId))
            .slice(0, 6)
          
          setHomes(filtered)
        }
      } catch (err) {
        console.error('Error fetching similar homes:', err)
        setHomes([])
      } finally {
        setLoading(false)
      }
    }

    // Add a small delay to make it feel more natural
    const timer = setTimeout(() => {
      fetchSimilar()
    }, 100)

    return () => clearTimeout(timer)
  }, [propertyId, location, city])

  return (
    <section className="related-section">
      <div className="section-header">
        <div>
          <p className="section-eyebrow">Hand-picked matches</p>
          <h2>Similar Homes</h2>
        </div>
      </div>
      <div className="card-row" aria-busy={loading}>
        {homes.map((home) => (
          <article 
            key={home.id || home.no} 
            className="mini-card"
            onClick={() => navigate(`/property/${home.id || home.no}`)}
            style={{ cursor: 'pointer' }}
          >
            <div className="mini-card-image">
              <img src={getPropertyImage(home.property_type)} alt={home.property_type || 'Property'} />
              {home.smart_living_score && (
                <span className="mini-score">{Math.round(home.smart_living_score)} Smart</span>
              )}
            </div>
            <div className="mini-card-body">
              <p className="mini-price">{formatPrice(home.price)}</p>
              <p className="mini-specs">{formatSpecs(home)}</p>
              <p className="mini-address">{home.location || home.city || 'Location not available'}</p>
              <p className="mini-type">{home.property_type || 'Property'}</p>
            </div>
          </article>
        ))}
        {!loading && homes.length === 0 && (
          <p className="empty-state">No other homes found in this area.</p>
        )}
      </div>
    </section>
  )
}

export default SimilarHomes
