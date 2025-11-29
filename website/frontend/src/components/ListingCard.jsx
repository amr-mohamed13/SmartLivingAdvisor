import { useState } from 'react'
import getPropertyImage from '../utils/propertyImages'
import './ListingCard.css'

function ListingCard({ property, onHover, onClick }) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [imageError, setImageError] = useState(false)

  const formatPrice = (price) => {
    if (!price) return 'Price on request'
    return `$${Number(price).toLocaleString()}`
  }

  const convertM2ToSqft = (m2) => {
    if (!m2) return null
    const sqft = Math.round(m2 * 10.764)
    return `${sqft.toLocaleString()} sqft`
  }

  const handleFavoriteClick = (e) => {
    e.stopPropagation()
    setIsFavorite(!isFavorite)
  }

  const handleCardClick = () => {
    if (onClick) {
      onClick(property)
    }
  }

  const handleMouseEnter = () => {
    if (onHover) {
      onHover(property)
    }
  }

  const specs = []
  if (property.num_rooms) specs.push(`${property.num_rooms} bd`)
  if (property.num_bathrooms) specs.push(`${property.num_bathrooms} ba`)
  if (property.floor_area_m2) {
    const sqft = convertM2ToSqft(property.floor_area_m2)
    if (sqft) specs.push(sqft)
  }

  return (
    <article
      className="listing-card"
      onClick={handleCardClick}
      onMouseEnter={handleMouseEnter}
    >
      <div className="listing-image-container">
        {!imageError ? (
          <img
            src={getPropertyImage(property.property_type)}
            alt={property.property_type || 'Property'}
            className="listing-image"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="listing-image-placeholder">
            {property.property_type || 'Property'}
          </div>
        )}
        
        {/* Showcase Badge */}
        <div className="showcase-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <span>Showcase</span>
        </div>

        {/* Heart Icon */}
        <button
          className={`favorite-button ${isFavorite ? 'active' : ''}`}
          onClick={handleFavoriteClick}
          aria-label="Save property"
        >
          <svg viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>

        {/* Smart Score Badge */}
        {property.smart_living_score && (
          <div className="score-badge">
            {Math.round(property.smart_living_score)}
          </div>
        )}

        {/* Image Pagination Dots */}
        <div className="image-dots">
          <div className="dot active"></div>
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
      </div>

      <div className="listing-details">
        <div className="listing-header">
          <div className="listing-price">{formatPrice(property.price)}</div>
          <button className="more-options-button" aria-label="More options">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="2"/>
              <circle cx="12" cy="12" r="2"/>
              <circle cx="12" cy="19" r="2"/>
            </svg>
          </button>
        </div>

        <div className="listing-specs">
          {specs.join(' · ')}
        </div>

        <div className="listing-address">
          {property.location || 'Address not available'}
        </div>

        {property.property_type && (
          <div className="listing-type">
            {property.property_type}
          </div>
        )}
      </div>
    </article>
  )
}

export default ListingCard

