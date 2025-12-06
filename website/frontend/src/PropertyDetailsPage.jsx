import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PropertyGallery from './components/PropertyGallery'
import PropertySummary from './components/PropertySummary'
import PropertyFacts from './components/PropertyFacts'
import MapArea from './components/MapArea'
import NearbyHomes from './components/NearbyHomes'
import SimilarHomes from './components/SimilarHomes'
import SiteHeader from './components/SiteHeader'
import './components/PropertyDetails.css'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

function PropertyDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isSaved, setIsSaved] = useState(false)
  const [showSignInPrompt, setShowSignInPrompt] = useState(false)

  const coordinates = useMemo(
    () => ({ lat: property?.latitude, lng: property?.longitude }),
    [property]
  )

  useEffect(() => {
    async function fetchProperty() {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`${API_BASE_URL}/api/properties/${id}`)
        if (!response.ok) throw new Error('Unable to load property')
        const data = await response.json()
        setProperty(data)
      } catch (err) {
        setError('We could not load this property right now.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchProperty()
  }, [id])

  useEffect(() => {
    async function loadSavedState() {
      const authToken = localStorage.getItem('authToken')
      if (!authToken) return
      try {
        const response = await fetch(`${API_BASE_URL}/api/user/saved`, {
          headers: { Authorization: `Bearer ${authToken}` },
        })
        if (!response.ok) return
        const data = await response.json()
        const ids = Array.isArray(data) ? data : []
        setIsSaved(ids.includes(Number(id)) || ids.includes(id))
      } catch (err) {
        console.error('Failed to load saved properties', err)
      }
    }

    loadSavedState()
  }, [id])

  const handleSaveProperty = async () => {
    const authToken = localStorage.getItem('authToken')
    if (!authToken) {
      setShowSignInPrompt(true)
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/save-property`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ propertyId: id }),
      })
      if (!response.ok) throw new Error('Unable to save property')
      setIsSaved(true)
    } catch (err) {
      console.error(err)
    }
  }

  const backToSearch = () => navigate(-1)

  if (loading) {
    return (
      <div className="page-shell">
        <SiteHeader />
        <div className="page-body">
          <p className="loading">Loading property...</p>
        </div>
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="page-shell">
        <SiteHeader />
        <div className="page-body">
          <p className="error-message">{error || 'This property is unavailable.'}</p>
          <button className="primary" type="button" onClick={backToSearch}>
            Go back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell">
      <SiteHeader />
      <main className="page-body">
        <PropertyGallery images={property.images} propertyType={property.property_type} />
        <PropertySummary
          property={property}
          isSaved={isSaved}
          onSave={handleSaveProperty}
          showSignInPrompt={showSignInPrompt}
        />
        <PropertyFacts property={property} />
        <MapArea lat={coordinates.lat} lng={coordinates.lng} address={property.location || property.address} city={property.city} />
        <NearbyHomes latitude={coordinates.lat} longitude={coordinates.lng} city={property.city} />
        <SimilarHomes propertyId={id} />
      </main>
    </div>
  )
}

export default PropertyDetailsPage
