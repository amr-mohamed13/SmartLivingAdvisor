import { useEffect, useState } from 'react'
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

function SimilarHomes({ propertyId }) {
  const [homes, setHomes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSimilar() {
      if (!propertyId) return
      try {
        setLoading(true)
        const response = await fetch(`${API_BASE_URL}/api/properties/similar?id=${propertyId}`)
        if (!response.ok) throw new Error('Unable to load similar properties')
        const data = await response.json()
        if (Array.isArray(data)) setHomes(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchSimilar()
  }, [propertyId])

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
          <article key={home.id || home.no} className="mini-card">
            <div className="mini-card-image">
              <img src={getPropertyImage(home.property_type)} alt={home.property_type || 'Property'} />
              {home.smart_living_score && (
                <span className="mini-score">{Math.round(home.smart_living_score)} Smart</span>
              )}
            </div>
            <div className="mini-card-body">
              <p className="mini-price">{formatPrice(home.price)}</p>
              <p className="mini-specs">{formatSpecs(home)}</p>
              <p className="mini-address">{home.location || home.city}</p>
              <p className="mini-type">{home.property_type}</p>
            </div>
          </article>
        ))}
        {!loading && homes.length === 0 && (
          <p className="empty-state">No similar homes found.</p>
        )}
      </div>
    </section>
  )
}

export default SimilarHomes
