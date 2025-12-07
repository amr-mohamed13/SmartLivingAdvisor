import { useEffect, useState, useMemo } from 'react'
import './PropertyDetails.css'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

const POI_CATEGORIES = [
  { key: 'restaurant', label: 'Restaurants', icon: '🍴', color: '#EF6C48' },
  { key: 'cafe', label: 'Cafes', icon: '☕', color: '#8B4513' },
  { key: 'pharmacy', label: 'Pharmacies', icon: '💊', color: '#DC143C' },
  { key: 'school', label: 'Schools', icon: '🎓', color: '#2D9CDB' },
  { key: 'hospital', label: 'Hospitals', icon: '🏥', color: '#E74C3C' },
  { key: 'supermarket', label: 'Supermarkets', icon: '🛒', color: '#27AE60' },
  { key: 'gym', label: 'Gyms', icon: '💪', color: '#9B59B6' },
  { key: 'park', label: 'Parks', icon: '🌳', color: '#52D1C6' },
  { key: 'atm', label: 'ATMs', icon: '🏦', color: '#F39C12' },
  { key: 'gas_station', label: 'Gas Stations', icon: '⛽', color: '#E67E22' },
  { key: 'bank', label: 'Banks', icon: '🏛️', color: '#34495E' },
  { key: 'shopping_mall', label: 'Shopping Malls', icon: '🛍️', color: '#E91E63' },
]

function POIExplorer({ propertyLat, propertyLng }) {
  const [selectedCategory, setSelectedCategory] = useState('restaurant')
  const [pois, setPois] = useState([])
  const [loading, setLoading] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapInstance, setMapInstance] = useState(null)
  const [markers, setMarkers] = useState([])

  const propertyCenter = useMemo(
    () => ({ lat: Number(propertyLat), lng: Number(propertyLng) }),
    [propertyLat, propertyLng]
  )

  // Load Google Maps JavaScript API
  useEffect(() => {
    if (!GOOGLE_MAPS_KEY || mapLoaded) return

    // Check if script already exists
    const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`)
    if (existingScript) {
      if (window.google) {
        setMapLoaded(true)
        return
      }
      // Wait for existing script to load
      existingScript.addEventListener('load', () => {
        setMapLoaded(true)
      })
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=places,geometry`
    script.async = true
    script.defer = true
    script.onload = () => {
      setMapLoaded(true)
    }
    document.head.appendChild(script)
  }, [GOOGLE_MAPS_KEY, mapLoaded])

  // Initialize map when loaded
  useEffect(() => {
    if (!mapLoaded || !window.google || !propertyCenter.lat || !propertyCenter.lng) return

    const mapDiv = document.getElementById('poi-map-container')
    if (!mapDiv || mapInstance) return

    const map = new window.google.maps.Map(mapDiv, {
      center: propertyCenter,
      zoom: 14,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
      ],
    })

    // Add property marker (house-shaped, custom color)
    const propertyMarker = new window.google.maps.Marker({
      position: propertyCenter,
      map,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#004F52',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 2,
      },
      title: 'Property Location',
    })

    setMapInstance(map)
  }, [mapLoaded, propertyCenter, mapInstance])

  // Fetch POIs when category changes
  useEffect(() => {
    if (!propertyCenter.lat || !propertyCenter.lng || !selectedCategory) return

    async function fetchPOIs() {
      // Clear existing markers
      markers.forEach((marker) => {
        if (marker && marker.setMap) {
          marker.setMap(null)
        }
      })
      setMarkers([])
      try {
        setLoading(true)
        const category = POI_CATEGORIES.find((c) => c.key === selectedCategory)
        const type = category?.key || selectedCategory

        const response = await fetch(
          `${API_BASE_URL}/api/places/nearby?lat=${propertyCenter.lat}&lng=${propertyCenter.lng}&radius=2500&types=${type}`
        )

        if (!response.ok) throw new Error('Failed to fetch POIs')

        const data = await response.json()

        if (data.status === 'OK' && Array.isArray(data.results)) {
          // Calculate distances and travel times
          const poisWithDistance = await Promise.all(
            data.results.slice(0, 20).map(async (place) => {
              if (!place.geometry?.location) return null

              const poiLat = place.geometry.location.lat
              const poiLng = place.geometry.location.lng

              // Calculate straight-line distance
              const distance = calculateDistance(
                propertyCenter.lat,
                propertyCenter.lng,
                poiLat,
                poiLng
              )

              // Get travel times using Google Distance Matrix API
              let travelTimes = { walking: null, driving: null, transit: null }
              if (GOOGLE_MAPS_KEY && window.google) {
                travelTimes = await getTravelTimes(
                  propertyCenter,
                  { lat: poiLat, lng: poiLng }
                )
              }

              return {
                name: place.name,
                address: place.vicinity || place.formatted_address || 'Address not available',
                rating: place.rating || null,
                distance: distance,
                travelTimes,
                location: { lat: poiLat, lng: poiLng },
                openingHours: place.opening_hours?.open_now !== undefined
                  ? place.opening_hours.open_now
                  : null,
                types: place.types || [],
              }
            })
          )

          const validPois = poisWithDistance.filter((poi) => poi !== null)
          setPois(validPois)

          // Update map markers
          if (mapInstance && window.google) {
            const newMarkers = []

            // Add property marker
            const propMarker = new window.google.maps.Marker({
              position: propertyCenter,
              map: mapInstance,
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: '#004F52',
                fillOpacity: 1,
                strokeColor: '#fff',
                strokeWeight: 2,
              },
              title: 'Property Location',
            })
            newMarkers.push(propMarker)

            // Add POI markers
            validPois.forEach((poi) => {
              const category = POI_CATEGORIES.find((c) => c.key === selectedCategory)
              const marker = new window.google.maps.Marker({
                position: poi.location,
                map: mapInstance,
                icon: {
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: category?.color || '#EF6C48',
                  fillOpacity: 0.8,
                  strokeColor: '#fff',
                  strokeWeight: 1.5,
                },
                title: poi.name,
              })
              newMarkers.push(marker)
            })

            setMarkers(newMarkers)

            // Fit bounds to show all markers
            if (validPois.length > 0) {
              const bounds = new window.google.maps.LatLngBounds()
              bounds.extend(propertyCenter)
              validPois.forEach((poi) => bounds.extend(poi.location))
              mapInstance.fitBounds(bounds)
            }
          }
        } else {
          setPois([])
        }
      } catch (err) {
        console.error('Error fetching POIs:', err)
        setPois([])
      } finally {
        setLoading(false)
      }
    }

    fetchPOIs()
  }, [selectedCategory, propertyCenter, mapInstance])

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371 // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return (R * c).toFixed(2)
  }

  const getTravelTimes = async (origin, destination) => {
    if (!GOOGLE_MAPS_KEY || !window.google) {
      return { walking: null, driving: null, transit: null }
    }

    try {
      const service = new window.google.maps.DistanceMatrixService()
      const results = await new Promise((resolve, reject) => {
        service.getDistanceMatrix(
          {
            origins: [origin],
            destinations: [destination],
            travelMode: window.google.maps.TravelMode.DRIVING,
            unitSystem: window.google.maps.UnitSystem.METRIC,
          },
          (response, status) => {
            if (status === 'OK') {
              resolve(response)
            } else {
              reject(new Error(status))
            }
          }
        )
      })

      const drivingTime = results.rows[0]?.elements[0]?.duration?.text || null

      // Get walking time
      const walkingResults = await new Promise((resolve, reject) => {
        service.getDistanceMatrix(
          {
            origins: [origin],
            destinations: [destination],
            travelMode: window.google.maps.TravelMode.WALKING,
            unitSystem: window.google.maps.UnitSystem.METRIC,
          },
          (response, status) => {
            if (status === 'OK') {
              resolve(response)
            } else {
              reject(new Error(status))
            }
          }
        )
      })

      const walkingTime = walkingResults.rows[0]?.elements[0]?.duration?.text || null

      // Get transit time (if available)
      let transitTime = null
      try {
        const transitResults = await new Promise((resolve, reject) => {
          service.getDistanceMatrix(
            {
              origins: [origin],
              destinations: [destination],
              travelMode: window.google.maps.TravelMode.TRANSIT,
              unitSystem: window.google.maps.UnitSystem.METRIC,
            },
            (response, status) => {
              if (status === 'OK') {
                resolve(response)
              } else {
                reject(new Error(status))
              }
            }
          )
        })
        transitTime = transitResults.rows[0]?.elements[0]?.duration?.text || null
      } catch {
        // Transit not available
      }

      return { walking: walkingTime, driving: drivingTime, transit: transitTime }
    } catch (err) {
      console.warn('Travel time calculation failed:', err)
      return { walking: null, driving: null, transit: null }
    }
  }

  if (!propertyCenter.lat || !propertyCenter.lng) {
    return null
  }

  return (
    <section className="poi-explorer-section">
      <div className="poi-explorer-header">
        <div>
          <p className="section-eyebrow">Explore Nearby</p>
          <h2>Points of Interest</h2>
        </div>
      </div>

      <div className="poi-category-menu">
        {POI_CATEGORIES.map((category) => (
          <button
            key={category.key}
            type="button"
            className={`poi-category-chip ${selectedCategory === category.key ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category.key)}
            style={
              selectedCategory === category.key
                ? { backgroundColor: category.color, color: '#fff' }
                : {}
            }
          >
            <span className="poi-chip-icon">{category.icon}</span>
            <span>{category.label}</span>
          </button>
        ))}
      </div>

      <div className="poi-map-wrapper">
        <div id="poi-map-container" className="poi-map-container" />
        {!mapLoaded && (
          <div className="map-loading">
            <p>Loading map...</p>
          </div>
        )}
      </div>

      <div className="poi-results-section">
        <h3 className="poi-results-title">
          {loading ? 'Loading...' : `${pois.length} ${POI_CATEGORIES.find((c) => c.key === selectedCategory)?.label || 'results'} found`}
        </h3>

        <div className="poi-results-list">
          {loading ? (
            <div className="poi-loading-state">
              <p>Searching for nearby places...</p>
            </div>
          ) : pois.length === 0 ? (
            <div className="poi-empty-state">
              <p>No {POI_CATEGORIES.find((c) => c.key === selectedCategory)?.label.toLowerCase()} found nearby.</p>
            </div>
          ) : (
            pois.map((poi, idx) => (
              <div key={`${poi.name}-${idx}`} className="poi-result-card">
                <div className="poi-result-header">
                  <h4 className="poi-result-name">{poi.name}</h4>
                  {poi.rating && (
                    <div className="poi-result-rating">
                      <span className="poi-rating-star">⭐</span>
                      <span className="poi-rating-value">{poi.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                <p className="poi-result-address">{poi.address}</p>

                <div className="poi-result-metrics">
                  <div className="poi-metric">
                    <span className="poi-metric-label">Distance:</span>
                    <span className="poi-metric-value">{poi.distance} km</span>
                  </div>

                  {poi.travelTimes.walking && (
                    <div className="poi-metric">
                      <span className="poi-metric-icon">🚶</span>
                      <span className="poi-metric-value">{poi.travelTimes.walking}</span>
                    </div>
                  )}

                  {poi.travelTimes.driving && (
                    <div className="poi-metric">
                      <span className="poi-metric-icon">🚗</span>
                      <span className="poi-metric-value">{poi.travelTimes.driving}</span>
                    </div>
                  )}

                  {poi.travelTimes.transit && (
                    <div className="poi-metric">
                      <span className="poi-metric-icon">🚌</span>
                      <span className="poi-metric-value">{poi.travelTimes.transit}</span>
                    </div>
                  )}

                  {poi.openingHours !== null && (
                    <div className="poi-metric">
                      <span className={`poi-status ${poi.openingHours ? 'open' : 'closed'}`}>
                        {poi.openingHours ? '🟢 Open' : '🔴 Closed'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}

export default POIExplorer

