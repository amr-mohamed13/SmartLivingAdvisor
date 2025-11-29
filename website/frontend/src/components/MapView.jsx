import { useEffect, useRef } from 'react'
import { getPropertyImage } from '../utils/propertyImages'
import './MapView.css'

function MapView({ properties, highlightedProperty }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const infoWindowsRef = useRef([])

  useEffect(() => {
    if (!window.google || !properties || properties.length === 0) {
      // Show placeholder if Google Maps not loaded or no properties
      return
    }

    // Initialize map centered on first property
    const firstProperty = properties[0]
    const center = {
      lat: parseFloat(firstProperty.latitude) || 30.0444,
      lng: parseFloat(firstProperty.longitude) || 31.2357,
    }

    const map = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: properties.length === 1 ? 14 : 11,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
      ],
    })

    mapInstanceRef.current = map

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current = []

    // Helper function to format price for marker label
    const getPriceLabel = (price) => {
      if (!price) return ''
      const priceNum = Number(price)
      if (priceNum >= 1000000) {
        return `${(priceNum / 1000000).toFixed(1)}M`
      }
      return `${Math.round(priceNum / 1000)}K`
    }

    // Add markers for each property
    properties.forEach((property) => {
      const position = {
        lat: parseFloat(property.latitude) || center.lat,
        lng: parseFloat(property.longitude) || center.lng,
      }

      const priceLabel = getPriceLabel(property.price)

      // Create custom marker with price label
      const marker = new window.google.maps.Marker({
        position,
        map,
        title: property.location || 'Property',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="60" height="60" xmlns="http://www.w3.org/2000/svg">
              <circle cx="30" cy="30" r="20" fill="#004F52" stroke="#fff" stroke-width="2"/>
              <text x="30" y="30" text-anchor="middle" dominant-baseline="middle" 
                    fill="white" font-size="11" font-weight="700" font-family="Arial, sans-serif">
                ${priceLabel}
              </text>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(60, 60),
          anchor: new window.google.maps.Point(30, 30),
        },
      })

      // Create Zillow-style info window
      const price = property.price
        ? `$${property.price.toLocaleString()}`
        : 'Price on request'
      const score = property.smart_living_score ? Math.round(property.smart_living_score) : 'N/A'
      const sqft = property.floor_area_m2 ? Math.round(property.floor_area_m2 * 10.764) : null
      const propertyType = property.property_type || 'Property'
      
      // Format beds/baths/sqft
      const specs = []
      if (property.num_rooms) specs.push(`${property.num_rooms} bd`)
      if (property.num_bathrooms) specs.push(`${property.num_bathrooms} ba`)
      if (sqft) specs.push(`${sqft.toLocaleString()} sqft`)
      const specsText = specs.join(' | ')

      // Create a gradient background based on property type
      const gradientColors = {
        'Apartment': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'Villa': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'Condo': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'Farmhouse': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'Penthouse': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'Bungalow': 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
      }
      const bgGradient = gradientColors[propertyType] || 'linear-gradient(135deg, #004F52 0%, #1BA7A5 100%)'

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="width: 320px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
            <!-- Image Section -->
            <div style="position: relative; width: 100%; height: 200px; overflow: hidden; background: ${bgGradient}; display: flex; align-items: center; justify-content: center;">
              <div style="color: rgba(255,255,255,0.9); font-size: 18px; font-weight: 600; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">${propertyType}</div>
              <!-- Showcase Badge -->
              <div style="position: absolute; top: 12px; left: 12px; background: rgba(0,0,0,0.6); color: #fff; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; display: flex; align-items: center; gap: 4px;">
                <span>⭐</span>
                <span>Showcase</span>
              </div>
              <!-- Heart Icon -->
              <div style="position: absolute; top: 12px; right: 12px; width: 32px; height: 32px; background: rgba(255,255,255,0.9); border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </div>
              <!-- Image Dots -->
              <div style="position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%); display: flex; gap: 6px;">
                <div style="width: 6px; height: 6px; border-radius: 50%; background: #fff;"></div>
                <div style="width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.4);"></div>
                <div style="width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.4);"></div>
                <div style="width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.4);"></div>
                <div style="width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.4);"></div>
              </div>
            </div>
            <!-- Details Section -->
            <div style="padding: 16px;">
              <!-- Price and More Options -->
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                <div style="font-weight: 700; font-size: 20px; color: #111827; line-height: 1.2;">
                  ${price}
                </div>
                <div style="width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #004F52;">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="2"/>
                    <circle cx="12" cy="12" r="2"/>
                    <circle cx="12" cy="19" r="2"/>
                  </svg>
                </div>
              </div>
              <!-- Specs -->
              <div style="font-size: 14px; color: #374151; margin-bottom: 8px; line-height: 1.4;">
                ${specsText || 'Property details'}
              </div>
              <!-- Address -->
              <div style="font-size: 14px; color: #6B7280; margin-bottom: 12px; line-height: 1.4;">
                ${property.location || 'Address not available'}
              </div>
              <!-- Smart Score Badge -->
              <div style="display: inline-flex; align-items: center; gap: 6px; background: linear-gradient(135deg, #004F52 0%, #1BA7A5 100%); color: #fff; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600;">
                <span>Smart Score: ${score}</span>
              </div>
            </div>
          </div>
        `,
      })

      marker.addListener('click', () => {
        // Close all other info windows
        infoWindowsRef.current.forEach((iw) => {
          if (iw && iw.close) iw.close()
        })
        infoWindow.open(map, marker)
      })

      infoWindowsRef.current.push(infoWindow)
      markersRef.current.push(marker)
    })

    // Fit bounds to show all markers
    if (properties.length > 1) {
      const bounds = new window.google.maps.LatLngBounds()
      properties.forEach((property) => {
        bounds.extend({
          lat: parseFloat(property.latitude) || center.lat,
          lng: parseFloat(property.longitude) || center.lng,
        })
      })
      map.fitBounds(bounds)
    }

    return () => {
      markersRef.current.forEach((marker) => marker.setMap(null))
      infoWindowsRef.current = []
    }
  }, [properties])
  
  // Highlight property on hover
  useEffect(() => {
    if (!highlightedProperty || !markersRef.current.length) return
    
    markersRef.current.forEach((marker, index) => {
      const property = properties[index]
      if (property && property.no === highlightedProperty.no) {
        // Highlight marker (you can change icon or add animation)
        marker.setAnimation(window.google.maps.Animation.BOUNCE)
        setTimeout(() => {
          marker.setAnimation(null)
        }, 750)
      }
    })
  }, [highlightedProperty, properties])

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

