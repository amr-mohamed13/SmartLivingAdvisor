import { useEffect, useState, useMemo } from 'react'
import './PropertyDetails.css'

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

function PropertyLocationMap({ lat, lng, address }) {
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapInstance, setMapInstance] = useState(null)

  const center = useMemo(() => ({ lat: Number(lat), lng: Number(lng) }), [lat, lng])

  useEffect(() => {
    if (!GOOGLE_MAPS_KEY || mapLoaded || !center.lat || !center.lng) return

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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}`
    script.async = true
    script.defer = true
    script.onload = () => {
      setMapLoaded(true)
    }
    document.head.appendChild(script)
  }, [GOOGLE_MAPS_KEY, mapLoaded, center])

  // Initialize map when loaded
  useEffect(() => {
    if (!mapLoaded || !window.google || !center.lat || !center.lng || mapInstance) return

    const mapDiv = document.getElementById('property-location-map')
    if (!mapDiv) return

    const map = new window.google.maps.Map(mapDiv, {
      center,
      zoom: 15,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
      ],
    })

    // Custom house-shaped marker with theme color
    const marker = new window.google.maps.Marker({
      position: center,
      map,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#004F52',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3,
      },
      title: address || 'Property Location',
      animation: window.google.maps.Animation.DROP,
    })

    // Info window
    const infoWindow = new window.google.maps.InfoWindow({
      content: `<div style="padding: 8px; font-weight: 600; color: #004F52;">${address || 'Property Location'}</div>`,
    })

    marker.addListener('click', () => {
      infoWindow.open(map, marker)
    })

    setMapInstance(map)
  }, [mapLoaded, center, address, mapInstance])

  // Fallback to iframe if JavaScript API not available
  if (!GOOGLE_MAPS_KEY) {
    const mapSrc = center.lat && center.lng
      ? `https://www.google.com/maps/embed/v1/view?key=${GOOGLE_MAPS_KEY || ''}&center=${center.lat},${center.lng}&zoom=14&maptype=roadmap`
      : ''

    return (
      <section className="property-location-map-section">
        <div className="map-card-header">
          <div>
            <p className="section-eyebrow">Property Location</p>
            <h2>Where is this property?</h2>
          </div>
          {center.lat && center.lng && (
            <div className="map-coordinates">
              {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
            </div>
          )}
        </div>
        <div className="property-map-container">
          {mapSrc ? (
            <iframe
              title="Property location"
              src={mapSrc}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="property-map-iframe"
            />
          ) : (
            <div className="map-placeholder">Map will appear when coordinates are available.</div>
          )}
        </div>
      </section>
    )
  }

  return (
    <section className="property-location-map-section">
      <div className="map-card-header">
        <div>
          <p className="section-eyebrow">Property Location</p>
          <h2>Where is this property?</h2>
        </div>
        {center.lat && center.lng && (
          <div className="map-coordinates">
            {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
          </div>
        )}
      </div>
      <div className="property-map-container">
        <div id="property-location-map" className="property-map-interactive" />
        {!mapLoaded && (
          <div className="map-loading-overlay">
            <p>Loading map...</p>
          </div>
        )}
      </div>
    </section>
  )
}

export default PropertyLocationMap

