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

const formatValue = (value, formatter) => {
  if (value === null || value === undefined || value === '') return null
  if (formatter) return formatter(value)
  return value
}

function PropertyFacts({ property }) {
  const sqft = property?.floor_area_m2
    ? `${Math.round(Number(property.floor_area_m2) * 10.764).toLocaleString()} sqft`
    : property?.sqft
      ? `${Number(property.sqft).toLocaleString()} sqft`
      : null

  const areaM2 = property?.floor_area_m2
    ? `${Number(property.floor_area_m2).toFixed(1)} m²`
    : null

  const smartScore = property?.smart_living_score ?? property?.smartLivingScore
  const hqsScore = property?.hqs_score

  // Format amenities
  let amenitiesDisplay = null
  if (property?.amenities) {
    if (Array.isArray(property.amenities)) {
      amenitiesDisplay = property.amenities.join(', ')
    } else if (typeof property.amenities === 'string') {
      // Try to parse if it's a stringified array
      try {
        const parsed = JSON.parse(property.amenities)
        if (Array.isArray(parsed)) {
          amenitiesDisplay = parsed.join(', ')
        } else {
          amenitiesDisplay = property.amenities
        }
      } catch {
        amenitiesDisplay = property.amenities
      }
    }
  }

  return (
    <section className="facts-card">
      <h2>Property Details</h2>
      <div className="facts-grid">
        {/* Basic Information */}
        <FactRow icon="🏠" label="Property Type" value={property?.property_type} />
        <FactRow icon="💲" label="Price" value={property?.price ? `$${Number(property.price).toLocaleString()}` : null} />
        <FactRow icon="🛏️" label="Bedrooms" value={property?.num_rooms || property?.beds} />
        <FactRow icon="🛁" label="Bathrooms" value={property?.num_bathrooms || property?.baths} />
        <FactRow icon="📏" label="Area (sq ft)" value={sqft} />
        <FactRow icon="📐" label="Area (m²)" value={areaM2} />
        <FactRow icon="📍" label="Location" value={property?.location || property?.address} />
        <FactRow icon="🏙️" label="City" value={property?.city} />

        {/* Property Condition & Features */}
        <FactRow icon="🏗️" label="Property Condition" value={property?.property_condition} />
        <FactRow icon="✨" label="Amenities" value={amenitiesDisplay} />
        <FactRow icon="🪑" label="Furnishing Status" value={property?.furnishing_status} />
        <FactRow icon="❄️" label="Air Conditioning" value={property?.air_conditioning ? 'Yes' : property?.air_conditioning === false ? 'No' : null} />
        <FactRow icon="🔥" label="Heating" value={property?.heating ? 'Yes' : property?.heating === false ? 'No' : null} />
        <FactRow icon="💪" label="Gym" value={property?.has_gym ? 'Yes' : property?.has_gym === false ? 'No' : null} />
        <FactRow icon="🅿️" label="Parking" value={property?.has_parking ? 'Yes' : property?.has_parking === false ? 'No' : null} />
        <FactRow icon="🏊" label="Pool" value={property?.has_pool ? 'Yes' : property?.has_pool === false ? 'No' : null} />

        {/* Scores */}
        <FactRow icon="⭐" label="Smart Living Score" value={smartScore ? Math.round(smartScore) : null} />
        <FactRow icon="📊" label="HQS Score" value={hqsScore ? Math.round(hqsScore) : null} />
        <FactRow icon="✅" label="HQS Pass" value={property?._hqs_pass_boolean ? 'Yes' : property?._hqs_pass_boolean === false ? 'No' : null} />
        <FactRow icon="🚌" label="Transport Score" value={property?.transport_score ? Math.round(property.transport_score) : null} />
        <FactRow icon="💰" label="Affordability Score" value={property?.affordability_score ? Math.round(property.affordability_score) : null} />

        {/* Distances */}
        <FactRow icon="🏥" label="Distance to Hospital (km)" value={property?.dist_hospital ? Number(property.dist_hospital).toFixed(2) : null} />
        <FactRow icon="🎓" label="Distance to School (km)" value={property?.dist_school ? Number(property.dist_school).toFixed(2) : null} />
        <FactRow icon="🚌" label="Distance to Bus (km)" value={property?.dist_bus ? Number(property.dist_bus).toFixed(2) : null} />

        {/* Neighborhood Data */}
        <FactRow icon="👥" label="Population" value={property?.population ? Number(property.population).toLocaleString() : null} />
        <FactRow icon="💵" label="Income" value={property?.income ? `$${Number(property.income).toLocaleString()}` : null} />
        <FactRow icon="📈" label="Price to Income Ratio" value={property?.price_to_income_ratio ? Number(property.price_to_income_ratio).toFixed(2) : null} />
        <FactRow icon="💰" label="Price per m²" value={property?.price_per_m2 ? `$${Number(property.price_per_m2).toLocaleString()}` : null} />
        <FactRow icon="🚨" label="Crime Rate" value={property?.crime_rate ? Number(property.crime_rate).toFixed(2) : null} />

        {/* Coordinates */}
        <FactRow icon="🧭" label="Latitude" value={property?.latitude ? Number(property.latitude).toFixed(6) : null} />
        <FactRow icon="🧭" label="Longitude" value={property?.longitude ? Number(property.longitude).toFixed(6) : null} />
      </div>
    </section>
  )
}

export default PropertyFacts
