import { useEffect, useMemo, useState } from 'react'
import './PropertyDetails.css'

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

const defaultCategories = [
  { key: 'school', label: 'Schools', icon: '🎓' },
  { key: 'hospital', label: 'Hospitals', icon: '🏥' },
  { key: 'restaurant', label: 'Restaurants', icon: '🍴' },
  { key: 'grocery_or_supermarket', label: 'Grocery Stores', icon: '🛒' },
  { key: 'park', label: 'Parks', icon: '🌳' },
  { key: 'transit_station', label: 'Transit Stations', icon: '🚌' },
]

function MapArea({ lat, lng, address, city }) {
  const [places, setPlaces] = useState([])
  const [loading, setLoading] = useState(false)

  const center = useMemo(() => ({ lat: Number(lat), lng: Number(lng) }), [lat, lng])

  useEffect(() => {
    async function fetchPlaces() {
      if (!center.lat || !center.lng || !GOOGLE_MAPS_KEY) {
        setPlaces(buildFallback())
        return
      }

      try {
        setLoading(true)
        const categoryParams = defaultCategories.map((c) => `type=${c.key}`).join('&')
        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${center.lat},${center.lng}&radius=2500&${categoryParams}&key=${GOOGLE_MAPS_KEY}`
        const response = await fetch(url)
        if (!response.ok) throw new Error('Places request failed')
        const data = await response.json()
        if (Array.isArray(data.results)) {
          const mapped = data.results.slice(0, 18).map((place) => ({
            name: place.name,
            rating: place.rating,
            distance: place.vicinity,
            types: place.types,
          }))
          setPlaces(mapped)
        } else {
          setPlaces(buildFallback())
        }
      } catch (err) {
        console.warn('Falling back to mock POIs', err)
        setPlaces(buildFallback())
      } finally {
        setLoading(false)
      }
    }

    function buildFallback() {
      return defaultCategories.map((category) => ({
        name: `${category.label} nearby`,
        rating: '4.6',
        distance: 'Within 2 mi',
        icon: category.icon,
      }))
    }

    fetchPlaces()
  }, [center, city])

  const mapSrc = center.lat && center.lng
    ? `https://www.google.com/maps/embed/v1/view?key=${GOOGLE_MAPS_KEY || ''}&center=${center.lat},${center.lng}&zoom=14&maptype=roadmap`
    : ''

  return (
    <section className="map-card">
      <div className="map-card-header">
        <div>
          <p className="section-eyebrow">Explore the Area</p>
          <h2>{address || city || 'Neighborhood'}</h2>
        </div>
        {center.lat && center.lng && (
          <div className="map-coordinates">{center.lat.toFixed(4)}, {center.lng.toFixed(4)}</div>
        )}
      </div>
      <div className="map-grid">
        <div className="map-frame">
          {mapSrc ? (
            <iframe
              title="Property location"
              src={mapSrc}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : (
            <div className="map-placeholder">Map will appear when coordinates are available.</div>
          )}
        </div>
        <div className="poi-list">
          <div className="poi-scroll" aria-busy={loading}>
            {places.map((poi, idx) => (
              <div key={`${poi.name}-${idx}`} className="poi-card">
                <div className="poi-icon">{poi.icon || defaultCategories[idx % defaultCategories.length].icon}</div>
                <div className="poi-content">
                  <p className="poi-name">{poi.name}</p>
                  <p className="poi-meta">{poi.distance}</p>
                  {poi.rating && <span className="poi-rating">⭐ {poi.rating}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default MapArea
