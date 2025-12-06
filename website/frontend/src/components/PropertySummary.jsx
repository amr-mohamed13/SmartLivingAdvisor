import './PropertyDetails.css'

const formatPrice = (price) => {
  if (!price && price !== 0) return 'Price on request'
  const numericPrice = Number(price)
  return Number.isFinite(numericPrice) ? `$${numericPrice.toLocaleString()}` : 'Price on request'
}

const smartScoreColor = (score) => {
  if (score >= 85) return 'excellent'
  if (score >= 70) return 'good'
  return 'moderate'
}

function PropertySummary({ property, isSaved, onSave, showSignInPrompt }) {
  const details = []
  if (property?.num_rooms || property?.beds) details.push(`${property.num_rooms || property.beds} bd`)
  if (property?.num_bathrooms || property?.baths) details.push(`${property.num_bathrooms || property.baths} ba`)
  if (property?.floor_area_m2 || property?.sqft) {
    const sqft = property.floor_area_m2
      ? Math.round(Number(property.floor_area_m2) * 10.764)
      : Number(property.sqft)
    if (Number.isFinite(sqft)) details.push(`${sqft.toLocaleString()} sqft`)
  }

  const scoreValue = property?.smart_living_score ?? property?.smartLivingScore
  const badgeTone = smartScoreColor(Number(scoreValue) || 0)

  return (
    <section className="summary-card">
      <div>
        <p className="summary-price">{formatPrice(property?.price)}</p>
        <p className="summary-meta">{details.join(' | ')}</p>
        <p className="summary-address">{property?.location || property?.address}</p>
      </div>
      <div className="summary-actions">
        {scoreValue && (
          <span className={`score-pill ${badgeTone}`}>
            <span className="pill-label">Smart Living Score</span>
            <span className="pill-value">{Math.round(scoreValue)}</span>
          </span>
        )}
        <button className="save-button" type="button" onClick={onSave}>
          <span className={`save-icon ${isSaved ? 'active' : ''}`} aria-hidden>
            ❤
          </span>
          {isSaved ? 'Saved' : 'Save property'}
        </button>
        {showSignInPrompt && (
          <div className="signin-modal">
            <div className="signin-card">
              <p>Sign in to save this property and sync across devices.</p>
              <a className="primary" href="/signin">Sign in</a>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default PropertySummary
