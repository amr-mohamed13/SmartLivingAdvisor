import './PropertyDetails.css'

const FactRow = ({ icon, label, value }) => {
  if (!value && value !== 0) return null
  return (
    <div className="fact-row">
      <div className="fact-icon" aria-hidden>
        {icon}
      </div>
      <div className="fact-content">
        <p className="fact-label">{label}</p>
        <p className="fact-value">{value}</p>
      </div>
    </div>
  )
}

function PropertyFacts({ property }) {
  const sqft = property?.floor_area_m2
    ? `${Math.round(Number(property.floor_area_m2) * 10.764).toLocaleString()} sqft`
    : property?.sqft
      ? `${Number(property.sqft).toLocaleString()} sqft`
      : null

  const smartScore = property?.smart_living_score ?? property?.smartLivingScore
  const neighborhoodScore = property?.neighborhood_score ?? property?.neighborhoodScore

  return (
    <section className="facts-card">
      <h2>Property details</h2>
      <div className="facts-grid">
        <FactRow icon="🏠" label="Property type" value={property?.property_type} />
        <FactRow icon="💲" label="Price" value={property?.price ? `$${Number(property.price).toLocaleString()}` : null} />
        <FactRow icon="🛏️" label="Beds" value={property?.num_rooms || property?.beds} />
        <FactRow icon="🛁" label="Baths" value={property?.num_bathrooms || property?.baths} />
        <FactRow icon="📏" label="Square footage" value={sqft} />
        <FactRow icon="📍" label="City / State" value={property?.city || property?.state ? `${property?.city ?? ''}${property?.state ? `, ${property.state}` : ''}` : property?.location} />
        <FactRow icon="🧭" label="Latitude" value={property?.latitude} />
        <FactRow icon="🧭" label="Longitude" value={property?.longitude} />
        <FactRow icon="⭐" label="Smart Living Score" value={smartScore && Math.round(smartScore)} />
        <FactRow icon="🏘️" label="Neighborhood score" value={neighborhoodScore && Math.round(neighborhoodScore)} />
        <FactRow
          icon="✨"
          label="Amenities"
          value={Array.isArray(property?.amenities) ? property.amenities.join(', ') : property?.amenities}
        />
        <FactRow icon="📝" label="Description" value={property?.description} />
      </div>
    </section>
  )
}

export default PropertyFacts
