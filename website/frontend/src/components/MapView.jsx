import { useEffect, useRef } from 'react'
import { getPropertyImage } from '../utils/propertyImages'
import './MapView.css'

function MapView({ properties, highlightedProperty, onVisiblePropertiesChange }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const infoWindowsRef = useRef([])
  const propertiesRef = useRef(properties)

  const getPriceLabel = (price) => {
    if (!price) return ''
    const priceNum = Number(price)
    if (priceNum >= 1000000) {
      return `${(priceNum / 1000000).toFixed(1)}M`
    }
    return `${Math.round(priceNum / 1000)}K`
  }

  const filterPropertiesInBounds = (map, items) => {
    const bounds = map.getBounds()
    if (!bounds) return items

    return items.filter((property) => {
      const lat = parseFloat(property.latitude)
      const lng = parseFloat(property.longitude)
      if (Number.isNaN(lat) || Number.isNaN(lng)) return false
      return bounds.contains({ lat, lng })
    })
  }

  const clearMarkers = () => {
    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current = []
    infoWindowsRef.current = []
  }

  const renderMarkers = (map, visibleProperties) => {
    clearMarkers()

    visibleProperties.forEach((property) => {
      const position = {
        lat: parseFloat(property.latitude) || map.getCenter().lat(),
        lng: parseFloat(property.longitude) || map.getCenter().lng(),
      }

      const priceLabel = getPriceLabel(property.price)
      const score = property.smart_living_score ? Math.round(property.smart_living_score) : '—'
      const sqft = property.floor_area_m2 ? Math.round(property.floor_area_m2 * 10.764) : null
      const propertyType = property.property_type || 'Property'

      const specs = []
      if (property.num_rooms) specs.push(`${property.num_rooms} bd`)
      if (property.num_bathrooms) specs.push(`${property.num_bathrooms} ba`)
      if (sqft) specs.push(`${sqft.toLocaleString()} sqft`)
      const specsText = specs.join(' · ')

      const photoUrl = getPropertyImage(property.property_type)

      const marker = new window.google.maps.Marker({
        position,
        map,
        title: property.location || 'Property',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="96" height="42" xmlns="http://www.w3.org/2000/svg">
              <rect x="0" y="0" rx="12" ry="12" width="96" height="42" fill="#004F52" stroke="#ffffff" stroke-width="2"/>
              <text x="48" y="26" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="15" font-weight="700" font-family="Arial, sans-serif">
                ${priceLabel}
              </text>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(96, 42),
          anchor: new window.google.maps.Point(48, 42),
        },
      })

      marker.__propertyNo = property.no

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="width: 260px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 12px 32px rgba(17,24,39,0.18);">
            <div style="position: relative; height: 160px; overflow: hidden;">
              <img src="${photoUrl}" alt="${propertyType}" style="width: 100%; height: 100%; object-fit: cover;" />
              <div style="position: absolute; top: 10px; left: 10px; padding: 6px 10px; border-radius: 999px; background: rgba(0,79,82,0.9); color: #fff; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px;">
                <span>${score}</span>
                <span style="font-weight: 500; opacity: 0.9;">Smart score</span>
              </div>
              <div style="position: absolute; top: 10px; right: 10px; width: 34px; height: 34px; border-radius: 12px; background: rgba(255,255,255,0.92); display: grid; place-items: center; box-shadow: 0 6px 18px rgba(17,24,39,0.12);">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </div>
            </div>
            <div style="padding: 14px 14px 16px; display: grid; gap: 6px;">
              <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                <span style="font-weight: 700; font-size: 18px; color: #0A0A0A;">${property.price ? `$${Number(property.price).toLocaleString()}` : 'Price on request'}</span>
                <span style="color: #6B7280; font-size: 13px;">${propertyType}</span>
              </div>
              <div style="color: #374151; font-size: 13px;">${specsText || 'Property details'}</div>
              <div style="color: #6B7280; font-size: 13px; line-height: 1.4;">${property.location || 'Address not available'}</div>
            </div>
          </div>
        `,
      })

      marker.addListener('click', () => {
        infoWindowsRef.current.forEach((iw) => iw?.close())
        infoWindow.open(map, marker)
      })

      infoWindowsRef.current.push(infoWindow)
      markersRef.current.push(marker)
    })
  }

  useEffect(() => {
    propertiesRef.current = properties
  }, [properties])

  useEffect(() => {
    if (!window.google || !properties) {
      return
    }

    if (properties.length === 0) {
      clearMarkers()
      onVisiblePropertiesChange?.([])
      return
    }

    if (!mapInstanceRef.current) {
      const firstProperty = properties[0]
      const center = {
        lat: parseFloat(firstProperty.latitude) || 30.0444,
        lng: parseFloat(firstProperty.longitude) || 31.2357,
      }

      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: properties.length === 1 ? 14 : 11,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }],
          },
        ],
        streetViewControl: false,
        mapTypeControlOptions: {
          position: window.google.maps.ControlPosition.TOP_LEFT,
        },
        fullscreenControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_TOP,
        },
        zoomControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_BOTTOM,
        },
      })

      mapInstanceRef.current.addListener('idle', () => {
        const map = mapInstanceRef.current
        if (!map) return
        const visible = filterPropertiesInBounds(map, propertiesRef.current)
        renderMarkers(map, visible)
        onVisiblePropertiesChange?.(visible)
      })
    }

    const map = mapInstanceRef.current

    if (properties.length > 1) {
      const bounds = new window.google.maps.LatLngBounds()
      properties.forEach((property) => {
        bounds.extend({
          lat: parseFloat(property.latitude) || map.getCenter().lat(),
          lng: parseFloat(property.longitude) || map.getCenter().lng(),
        })
      })
      map.fitBounds(bounds)
    } else {
      map.setCenter({
        lat: parseFloat(properties[0].latitude) || map.getCenter().lat(),
        lng: parseFloat(properties[0].longitude) || map.getCenter().lng(),
      })
      map.setZoom(13)
    }

    const visible = filterPropertiesInBounds(map, properties)
    renderMarkers(map, visible)
    onVisiblePropertiesChange?.(visible)

    return () => {
      clearMarkers()
    }
  }, [properties, onVisiblePropertiesChange])

  useEffect(() => {
    if (!highlightedProperty || !markersRef.current.length) return

    markersRef.current.forEach((marker) => {
      if (marker.__propertyNo === highlightedProperty.no) {
        marker.setAnimation(window.google.maps.Animation.BOUNCE)
        setTimeout(() => marker.setAnimation(null), 750)
      }
    })
  }, [highlightedProperty])

  // Show placeholder if Google Maps not loaded
  if (!window.google) {
    return (
      <div className="map-placeholder">
        <div className="map-placeholder-content">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <p>Map will appear here</p>
          <p className="map-placeholder-note">Enable Google Maps API to view property locations</p>
        </div>
      </div>
    )
  }

  return <div ref={mapRef} className="map-container" />
}

export default MapView

