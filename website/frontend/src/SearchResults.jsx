import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import './SearchResults.css'
import './App.css'
import footerIllustration from './assets/PNG/footer.png'
import MapView from './components/MapView'
import SearchBar from './components/SearchBar'
import ListingCard from './components/ListingCard'
import FilterDrawer from './components/FilterDrawer'
import PropertyModal from './components/PropertyModal'
import NavBar from './components/NavBar'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

const PROPERTY_TYPES = ['Apartment', 'Villa', 'Condo', 'Farmhouse', 'Penthouse', 'Bungalow']
const BED_OPTIONS = ['Any', '1+', '2+', '3+', '4+', '5+']
const BATH_OPTIONS = ['Any', '1+', '2+', '3+', '4+', '5+']
const SORT_OPTIONS = [
  { value: 'score', label: 'Smart Score (Homes for You)' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
]

function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [visibleProperties, setVisibleProperties] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('query') || '')
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState(
    searchParams.get('property_types') ? searchParams.get('property_types').split(',') : []
  )
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '')
  const [beds, setBeds] = useState(searchParams.get('beds') || 'Any')
  const [baths, setBaths] = useState(searchParams.get('baths') || 'Any')
  const [hasGym, setHasGym] = useState(searchParams.get('has_gym') === 'true')
  const [hasParking, setHasParking] = useState(searchParams.get('has_parking') === 'true')
  const [hasPool, setHasPool] = useState(searchParams.get('has_pool') === 'true')
  const [amenitiesContains, setAmenitiesContains] = useState(searchParams.get('amenities_contains') || '')
  const [airConditioning, setAirConditioning] = useState(searchParams.get('air_conditioning') === 'true')
  const [heating, setHeating] = useState(searchParams.get('heating') === 'true')
  const [minDistHospital, setMinDistHospital] = useState(searchParams.get('min_dist_hospital') || '')
  const [maxDistHospital, setMaxDistHospital] = useState(searchParams.get('max_dist_hospital') || '')
  const [minDistSchool, setMinDistSchool] = useState(searchParams.get('min_dist_school') || '')
  const [maxDistSchool, setMaxDistSchool] = useState(searchParams.get('max_dist_school') || '')
  const [minDistBus, setMinDistBus] = useState(searchParams.get('min_dist_bus') || '')
  const [maxDistBus, setMaxDistBus] = useState(searchParams.get('max_dist_bus') || '')
  const [minCrimeRate, setMinCrimeRate] = useState(searchParams.get('min_crime_rate') || '')
  const [maxCrimeRate, setMaxCrimeRate] = useState(searchParams.get('max_crime_rate') || '')
  const [minScore, setMinScore] = useState(searchParams.get('min_score') || '')
  const [maxScore, setMaxScore] = useState(searchParams.get('max_score') || '')
  const [smartLabel, setSmartLabel] = useState(searchParams.get('smart_label') || '')
  const [minTransportScore, setMinTransportScore] = useState(searchParams.get('min_transport_score') || '')
  const [maxTransportScore, setMaxTransportScore] = useState(searchParams.get('max_transport_score') || '')
  const [minPopulation, setMinPopulation] = useState(searchParams.get('min_population') || '')
  const [maxPopulation, setMaxPopulation] = useState(searchParams.get('max_population') || '')
  const [minIncome, setMinIncome] = useState(searchParams.get('min_income') || '')
  const [maxIncome, setMaxIncome] = useState(searchParams.get('max_income') || '')
  const [minPriceToIncome, setMinPriceToIncome] = useState(searchParams.get('min_price_to_income') || '')
  const [maxPriceToIncome, setMaxPriceToIncome] = useState(searchParams.get('max_price_to_income') || '')
  const [hqsPassOnly, setHqsPassOnly] = useState(searchParams.get('hqs_pass_only') === 'true')
  const [minHqsScore, setMinHqsScore] = useState(searchParams.get('min_hqs_score') || '')
  const [maxHqsScore, setMaxHqsScore] = useState(searchParams.get('max_hqs_score') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'score')
  
  // Modal states
  const [openModal, setOpenModal] = useState(null) // 'homeType', 'bedsBaths', 'price', 'more'
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [hoveredProperty, setHoveredProperty] = useState(null)
  const [selectedProperty, setSelectedProperty] = useState(null) // For property detail modal
  
  const SMART_LABEL_OPTIONS = ['', 'Excellent', 'Good', 'Fair', 'Poor']
  
  // Consolidate all filter states into one object for FilterDrawer
  const filterState = {
    hasGym,
    hasParking,
    hasPool,
    amenitiesContains,
    airConditioning,
    heating,
    minDistHospital,
    maxDistHospital,
    minDistSchool,
    maxDistSchool,
    minDistBus,
    maxDistBus,
    minCrimeRate,
    maxCrimeRate,
    minScore,
    maxScore,
    smartLabel,
    minTransportScore,
    maxTransportScore,
    minPopulation,
    maxPopulation,
    minIncome,
    maxIncome,
    minPriceToIncome,
    maxPriceToIncome,
    hqsPassOnly,
    minHqsScore,
    maxHqsScore,
  }
  
  const setFilterState = (updates) => {
    if (updates.hasGym !== undefined) setHasGym(updates.hasGym)
    if (updates.hasParking !== undefined) setHasParking(updates.hasParking)
    if (updates.hasPool !== undefined) setHasPool(updates.hasPool)
    if (updates.amenitiesContains !== undefined) setAmenitiesContains(updates.amenitiesContains)
    if (updates.airConditioning !== undefined) setAirConditioning(updates.airConditioning)
    if (updates.heating !== undefined) setHeating(updates.heating)
    if (updates.minDistHospital !== undefined) setMinDistHospital(updates.minDistHospital)
    if (updates.maxDistHospital !== undefined) setMaxDistHospital(updates.maxDistHospital)
    if (updates.minDistSchool !== undefined) setMinDistSchool(updates.minDistSchool)
    if (updates.maxDistSchool !== undefined) setMaxDistSchool(updates.maxDistSchool)
    if (updates.minDistBus !== undefined) setMinDistBus(updates.minDistBus)
    if (updates.maxDistBus !== undefined) setMaxDistBus(updates.maxDistBus)
    if (updates.minCrimeRate !== undefined) setMinCrimeRate(updates.minCrimeRate)
    if (updates.maxCrimeRate !== undefined) setMaxCrimeRate(updates.maxCrimeRate)
    if (updates.minScore !== undefined) setMinScore(updates.minScore)
    if (updates.maxScore !== undefined) setMaxScore(updates.maxScore)
    if (updates.smartLabel !== undefined) setSmartLabel(updates.smartLabel)
    if (updates.minTransportScore !== undefined) setMinTransportScore(updates.minTransportScore)
    if (updates.maxTransportScore !== undefined) setMaxTransportScore(updates.maxTransportScore)
    if (updates.minPopulation !== undefined) setMinPopulation(updates.minPopulation)
    if (updates.maxPopulation !== undefined) setMaxPopulation(updates.maxPopulation)
    if (updates.minIncome !== undefined) setMinIncome(updates.minIncome)
    if (updates.maxIncome !== undefined) setMaxIncome(updates.maxIncome)
    if (updates.minPriceToIncome !== undefined) setMinPriceToIncome(updates.minPriceToIncome)
    if (updates.maxPriceToIncome !== undefined) setMaxPriceToIncome(updates.maxPriceToIncome)
    if (updates.hqsPassOnly !== undefined) setHqsPassOnly(updates.hqsPassOnly)
    if (updates.minHqsScore !== undefined) setMinHqsScore(updates.minHqsScore)
    if (updates.maxHqsScore !== undefined) setMaxHqsScore(updates.maxHqsScore)
  }

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const params = new URLSearchParams()
        if (searchQuery) params.append('query', searchQuery)
        if (selectedPropertyTypes.length > 0) {
          // For now, use first selected type (backend supports single type)
          params.append('property_type', selectedPropertyTypes[0])
        }
        if (minPrice) params.append('min_price', minPrice)
        if (maxPrice) params.append('max_price', maxPrice)
        if (beds && beds !== 'Any') {
          params.append('min_beds', parseInt(beds))
        }
        if (baths && baths !== 'Any') {
          const bathNum = parseFloat(baths)
          params.append('min_baths', Math.floor(bathNum))
        }
        if (hasGym) params.append('has_gym', 'true')
        if (hasParking) params.append('has_parking', 'true')
        if (hasPool) params.append('has_pool', 'true')
        if (amenitiesContains) params.append('amenities_contains', amenitiesContains)
        if (airConditioning) params.append('air_conditioning', 'true')
        if (heating) params.append('heating', 'true')
        if (minDistHospital) params.append('min_dist_hospital', minDistHospital)
        if (maxDistHospital) params.append('max_dist_hospital', maxDistHospital)
        if (minDistSchool) params.append('min_dist_school', minDistSchool)
        if (maxDistSchool) params.append('max_dist_school', maxDistSchool)
        if (minDistBus) params.append('min_dist_bus', minDistBus)
        if (maxDistBus) params.append('max_dist_bus', maxDistBus)
        if (minCrimeRate) params.append('min_crime_rate', minCrimeRate)
        if (maxCrimeRate) params.append('max_crime_rate', maxCrimeRate)
        if (minScore) params.append('min_score', minScore)
        if (maxScore) params.append('max_score', maxScore)
        if (smartLabel) params.append('smart_label', smartLabel)
        if (minTransportScore) params.append('min_transport_score', minTransportScore)
        if (maxTransportScore) params.append('max_transport_score', maxTransportScore)
        if (minPopulation) params.append('min_population', minPopulation)
        if (maxPopulation) params.append('max_population', maxPopulation)
        if (minIncome) params.append('min_income', minIncome)
        if (maxIncome) params.append('max_income', maxIncome)
        if (minPriceToIncome) params.append('min_price_to_income', minPriceToIncome)
        if (maxPriceToIncome) params.append('max_price_to_income', maxPriceToIncome)
        if (hqsPassOnly) params.append('hqs_pass_only', 'true')
        if (minHqsScore) params.append('min_hqs_score', minHqsScore)
        if (maxHqsScore) params.append('max_hqs_score', maxHqsScore)
        params.append('sort_by', sortBy)
        params.append('limit', '100')

        const response = await fetch(`${API_BASE_URL}/search?${params.toString()}`)
        
        if (!response.ok) {
          throw new Error(`Search failed with status ${response.status}`)
        }
        
        const data = await response.json()
        setProperties(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('Search error:', err)
        setError('Unable to search properties. Please try again.')
        setProperties([])
      } finally {
        setLoading(false)
      }
    }

    fetchProperties()
  }, [searchQuery, selectedPropertyTypes, minPrice, maxPrice, beds, baths, hasGym, hasParking, hasPool, amenitiesContains, airConditioning, heating, minDistHospital, maxDistHospital, minDistSchool, maxDistSchool, minDistBus, maxDistBus, minCrimeRate, maxCrimeRate, minScore, maxScore, smartLabel, minTransportScore, maxTransportScore, minPopulation, maxPopulation, minIncome, maxIncome, minPriceToIncome, maxPriceToIncome, hqsPassOnly, minHqsScore, maxHqsScore, sortBy])

  const handleSearch = (e) => {
    e.preventDefault()
    const query = e.target.search.value.trim()
    setSearchQuery(query)
    updateURL({ query })
  }

  const updateURL = (updates) => {
    const newParams = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== 'Any' && value !== '') {
        newParams.set(key, value)
      } else {
        newParams.delete(key)
      }
    })
    setSearchParams(newParams)
  }

  const handleApplyFilters = () => {
    updateURL({
      property_types: selectedPropertyTypes.join(','),
      min_price: minPrice,
      max_price: maxPrice,
      beds: beds,
      baths: baths,
      has_gym: hasGym ? 'true' : '',
      has_parking: hasParking ? 'true' : '',
      has_pool: hasPool ? 'true' : '',
    })
    setOpenModal(null)
  }

  const handleResetFilters = () => {
    setSelectedPropertyTypes([])
    setMinPrice('')
    setMaxPrice('')
    setBeds('Any')
    setBaths('Any')
    setHasGym(false)
    setHasParking(false)
    setHasPool(false)
    setAmenitiesContains('')
    setAirConditioning(false)
    setHeating(false)
    setMinDistHospital('')
    setMaxDistHospital('')
    setMinDistSchool('')
    setMaxDistSchool('')
    setMinDistBus('')
    setMaxDistBus('')
    setMinCrimeRate('')
    setMaxCrimeRate('')
    setMinScore('')
    setMaxScore('')
    setSmartLabel('')
    setMinTransportScore('')
    setMaxTransportScore('')
    setMinPopulation('')
    setMaxPopulation('')
    setMinIncome('')
    setMaxIncome('')
    setMinPriceToIncome('')
    setMaxPriceToIncome('')
    setHqsPassOnly(false)
    setMinHqsScore('')
    setMaxHqsScore('')
    updateURL({
      property_types: '',
      min_price: '',
      max_price: '',
      beds: 'Any',
      baths: 'Any',
      has_gym: '',
      has_parking: '',
      has_pool: '',
      amenities_contains: '',
      air_conditioning: '',
      heating: '',
      min_dist_hospital: '',
      max_dist_hospital: '',
      min_dist_school: '',
      max_dist_school: '',
      min_dist_bus: '',
      max_dist_bus: '',
      min_crime_rate: '',
      max_crime_rate: '',
      min_score: '',
      max_score: '',
      smart_label: '',
      min_transport_score: '',
      max_transport_score: '',
      min_population: '',
      max_population: '',
      min_income: '',
      max_income: '',
      min_price_to_income: '',
      max_price_to_income: '',
      hqs_pass_only: '',
      min_hqs_score: '',
      max_hqs_score: '',
    })
  }

  const getFilterLabel = (type) => {
    switch(type) {
      case 'homeType':
        return selectedPropertyTypes.length === 0 
          ? 'Home Type' 
          : selectedPropertyTypes.length === PROPERTY_TYPES.length
          ? 'Home Type (All)'
          : `Home Type (${selectedPropertyTypes.length})`
      case 'bedsBaths':
        const bedLabel = beds === 'Any' ? 'Any' : beds
        const bathLabel = baths === 'Any' ? 'Any' : baths
        return bedLabel === 'Any' && bathLabel === 'Any' 
          ? 'Beds & Baths' 
          : `Beds & Baths (${bedLabel}/${bathLabel})`
      case 'price':
        if (!minPrice && !maxPrice) return 'Any'
        if (minPrice && maxPrice) return `$${parseInt(minPrice)/1000}K - $${parseInt(maxPrice)/1000}K`
        if (minPrice) return `$${parseInt(minPrice)/1000}K+`
        if (maxPrice) return `Up to $${parseInt(maxPrice)/1000}K`
        return 'Any'
      case 'more':
        const moreCount = [
          hasGym, hasParking, hasPool, amenitiesContains, airConditioning, heating,
          minDistHospital, maxDistHospital, minDistSchool, maxDistSchool, minDistBus, maxDistBus,
          minCrimeRate, maxCrimeRate, minScore, maxScore, smartLabel,
          minTransportScore, maxTransportScore, minPopulation, maxPopulation,
          minIncome, maxIncome, minPriceToIncome, maxPriceToIncome,
          hqsPassOnly, minHqsScore, maxHqsScore
        ].filter(v => v && v !== '' && v !== false).length
        return moreCount === 0 ? 'More' : `More (${moreCount})`
      default:
        return ''
    }
  }

  const handleFilterClick = (filterType) => {
    if (filterType === 'more') {
      setFilterDrawerOpen(true)
    } else {
      setOpenModal(openModal === filterType ? null : filterType)
    }
  }
  
  const handlePropertyHover = (property) => {
    setHoveredProperty(property)
  }
  
  const handlePropertyClick = (property) => {
    // Open property detail modal
    setSelectedProperty(property)
  }
  
  const moreFiltersCount = [
    hasGym, hasParking, hasPool, amenitiesContains, airConditioning, heating,
    minDistHospital, maxDistHospital, minDistSchool, maxDistSchool, minDistBus, maxDistBus,
    minCrimeRate, maxCrimeRate, minScore, maxScore, smartLabel,
    minTransportScore, maxTransportScore, minPopulation, maxPopulation,
    minIncome, maxIncome, minPriceToIncome, maxPriceToIncome,
    hqsPassOnly, minHqsScore, maxHqsScore
  ].filter(v => v && v !== '' && v !== false).length

  const activeFiltersCount = [
    selectedPropertyTypes.length > 0,
    minPrice || maxPrice,
    beds !== 'Any',
    baths !== 'Any',
    hasGym,
    hasParking,
    hasPool
  ].filter(Boolean).length

  const displayedProperties = visibleProperties.length ? visibleProperties : properties
  const pageSize = 20
  const totalPages = Math.max(1, Math.ceil(displayedProperties.length / pageSize))
  const paginatedProperties = displayedProperties.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  useEffect(() => {
    setVisibleProperties(properties)
    setCurrentPage(1)
  }, [properties])

  useEffect(() => {
    setCurrentPage(1)
  }, [visibleProperties])

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="search-results-page">
      {/* Header */}
      <NavBar />

      {/* Professional Search Bar */}
      <SearchBar
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        onFilterClick={handleFilterClick}
        filterLabels={{
          saleType: 'For Sale',
          homeType: getFilterLabel('homeType'),
          bedsBaths: getFilterLabel('bedsBaths'),
          price: getFilterLabel('price'),
          moreCount: moreFiltersCount,
        }}
      />

      {/* Filter Modals */}
      {openModal && (
        <div className="modal-overlay" onClick={() => setOpenModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {/* Home Type Modal */}
            {openModal === 'homeType' && (
              <div className="filter-modal">
                <h3 className="modal-title">Home Type</h3>
                <div className="checkbox-group">
                  <label className="checkbox-item">
                    <input 
                      type="checkbox"
                      checked={selectedPropertyTypes.length === PROPERTY_TYPES.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPropertyTypes([...PROPERTY_TYPES])
                        } else {
                          setSelectedPropertyTypes([])
                        }
                      }}
                    />
                    <span>Select All</span>
                  </label>
                  {PROPERTY_TYPES.map(type => (
                    <label key={type} className="checkbox-item">
                      <input 
                        type="checkbox"
                        checked={selectedPropertyTypes.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPropertyTypes([...selectedPropertyTypes, type])
                          } else {
                            setSelectedPropertyTypes(selectedPropertyTypes.filter(t => t !== type))
                          }
                        }}
                      />
                      <span>{type}</span>
                    </label>
                  ))}
                </div>
                <div className="modal-actions">
                  <button className="reset-btn" onClick={handleResetFilters}>Reset all filters</button>
                  <button className="apply-btn" onClick={handleApplyFilters}>Apply</button>
                </div>
              </div>
            )}

            {/* Beds & Baths Modal */}
            {openModal === 'bedsBaths' && (
              <div className="filter-modal">
                <h3 className="modal-title">Beds & Baths</h3>
                <div className="filter-section">
                  <h4 className="section-title">Number of Bedrooms</h4>
                  <label className="section-label">Bedrooms</label>
                  <div className="button-group">
                    {BED_OPTIONS.map(opt => (
                      <button
                        key={opt}
                        className={`option-btn ${beds === opt ? 'selected' : ''}`}
                        onClick={() => setBeds(opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="filter-section">
                  <h4 className="section-title">Number of Bathrooms</h4>
                  <label className="section-label">Bathrooms</label>
                  <div className="button-group">
                    {BATH_OPTIONS.map(opt => (
                      <button
                        key={opt}
                        className={`option-btn ${baths === opt ? 'selected' : ''}`}
                        onClick={() => setBaths(opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="modal-actions">
                  <button className="reset-btn" onClick={() => { setBeds('Any'); setBaths('Any') }}>Reset</button>
                  <button className="apply-btn" onClick={handleApplyFilters}>Apply</button>
                </div>
              </div>
            )}

            {/* Price Range Modal */}
            {openModal === 'price' && (
              <div className="filter-modal price-modal">
                <h3 className="modal-title">Price Range</h3>
                <div className="price-inputs">
                  <div className="price-input-group">
                    <label>Min</label>
                    <input
                      type="text"
                      placeholder="$0"
                      value={minPrice ? `$${parseInt(minPrice).toLocaleString()}` : ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '')
                        setMinPrice(val)
                      }}
                    />
                  </div>
                  <span className="price-separator">—</span>
                  <div className="price-input-group">
                    <label>Max</label>
                    <input
                      type="text"
                      placeholder="No max"
                      value={maxPrice ? `$${parseInt(maxPrice).toLocaleString()}` : ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '')
                        setMaxPrice(val)
                      }}
                    />
                  </div>
                </div>
                <div className="modal-actions">
                  <button className="reset-btn" onClick={() => { setMinPrice(''); setMaxPrice('') }}>Reset</button>
                  <button className="apply-btn" onClick={handleApplyFilters}>Apply</button>
                </div>
              </div>
            )}

      {/* Filter Drawer - Slide Over Panel */}
      <FilterDrawer
        isOpen={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        filters={filterState}
        setFilters={setFilterState}
      />

      {/* Legacy More Filters Modal (keeping for other modals) */}
      {openModal === 'more' && (
        <div className="filter-modal more-modal">
          <h3 className="modal-title">More filters</h3>
          <div className="more-filters-content">
                  {/* Amenities Filters */}
                  <div className="filter-section">
                    <h4 className="section-title">Amenities</h4>
                    <label className="checkbox-item">
                      <input 
                        type="checkbox"
                        checked={hasGym}
                        onChange={(e) => setHasGym(e.target.checked)}
                      />
                      <span>Has Gym</span>
                    </label>
                    <label className="checkbox-item">
                      <input 
                        type="checkbox"
                        checked={hasParking}
                        onChange={(e) => setHasParking(e.target.checked)}
                      />
                      <span>Has Parking</span>
                    </label>
                    <label className="checkbox-item">
                      <input 
                        type="checkbox"
                        checked={hasPool}
                        onChange={(e) => setHasPool(e.target.checked)}
                      />
                      <span>Has Pool</span>
                    </label>
                    <div className="filter-input-group">
                      <label className="input-label">Amenities contains...</label>
                      <input
                        type="text"
                        placeholder="e.g., WiFi, Elevator, Garden, Bar"
                        value={amenitiesContains}
                        onChange={(e) => setAmenitiesContains(e.target.value)}
                        className="filter-text-input"
                      />
                    </div>
                  </div>

                  {/* Comfort & Utilities */}
                  <div className="filter-section">
                    <h4 className="section-title">Comfort & Utilities</h4>
                    <label className="checkbox-item">
                      <input 
                        type="checkbox"
                        checked={airConditioning}
                        onChange={(e) => setAirConditioning(e.target.checked)}
                      />
                      <span>Air Conditioning</span>
                    </label>
                    <label className="checkbox-item">
                      <input 
                        type="checkbox"
                        checked={heating}
                        onChange={(e) => setHeating(e.target.checked)}
                      />
                      <span>Heating</span>
                    </label>
                  </div>

                  {/* Location Filters */}
                  <div className="filter-section">
                    <h4 className="section-title">Location</h4>
                    <div className="range-input-group">
                      <label className="input-label">Distance to Hospital (km)</label>
                      <div className="range-inputs">
                        <input
                          type="number"
                          placeholder="Min"
                          value={minDistHospital}
                          onChange={(e) => setMinDistHospital(e.target.value)}
                          className="range-input"
                        />
                        <span>—</span>
                        <input
                          type="number"
                          placeholder="Max"
                          value={maxDistHospital}
                          onChange={(e) => setMaxDistHospital(e.target.value)}
                          className="range-input"
                        />
                      </div>
                    </div>
                    <div className="range-input-group">
                      <label className="input-label">Distance to School (km)</label>
                      <div className="range-inputs">
                        <input
                          type="number"
                          placeholder="Min"
                          value={minDistSchool}
                          onChange={(e) => setMinDistSchool(e.target.value)}
                          className="range-input"
                        />
                        <span>—</span>
                        <input
                          type="number"
                          placeholder="Max"
                          value={maxDistSchool}
                          onChange={(e) => setMaxDistSchool(e.target.value)}
                          className="range-input"
                        />
                      </div>
                    </div>
                    <div className="range-input-group">
                      <label className="input-label">Distance to Bus (km)</label>
                      <div className="range-inputs">
                        <input
                          type="number"
                          placeholder="Min"
                          value={minDistBus}
                          onChange={(e) => setMinDistBus(e.target.value)}
                          className="range-input"
                        />
                        <span>—</span>
                        <input
                          type="number"
                          placeholder="Max"
                          value={maxDistBus}
                          onChange={(e) => setMaxDistBus(e.target.value)}
                          className="range-input"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Neighborhood Safety & Quality */}
                  <div className="filter-section">
                    <h4 className="section-title">Neighborhood & Safety</h4>
                    <div className="range-input-group">
                      <label className="input-label">Crime Rate</label>
                      <div className="range-inputs">
                        <input
                          type="number"
                          placeholder="Min"
                          value={minCrimeRate}
                          onChange={(e) => setMinCrimeRate(e.target.value)}
                          className="range-input"
                        />
                        <span>—</span>
                        <input
                          type="number"
                          placeholder="Max"
                          value={maxCrimeRate}
                          onChange={(e) => setMaxCrimeRate(e.target.value)}
                          className="range-input"
                        />
                      </div>
                    </div>
                    <div className="range-input-group">
                      <label className="input-label">Smart Living Score</label>
                      <div className="range-inputs">
                        <input
                          type="number"
                          placeholder="Min"
                          min="0"
                          max="100"
                          value={minScore}
                          onChange={(e) => setMinScore(e.target.value)}
                          className="range-input"
                        />
                        <span>—</span>
                        <input
                          type="number"
                          placeholder="Max"
                          min="0"
                          max="100"
                          value={maxScore}
                          onChange={(e) => setMaxScore(e.target.value)}
                          className="range-input"
                        />
                      </div>
                    </div>
                    <div className="filter-input-group">
                      <label className="input-label">Smart Label</label>
                      <select
                        value={smartLabel}
                        onChange={(e) => setSmartLabel(e.target.value)}
                        className="filter-select"
                      >
                        {SMART_LABEL_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt || 'Any'}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Transportation / Commute Filters */}
                  <div className="filter-section">
                    <h4 className="section-title">Transportation</h4>
                    <div className="range-input-group">
                      <label className="input-label">Transport Score</label>
                      <div className="range-inputs">
                        <input
                          type="number"
                          placeholder="Min"
                          value={minTransportScore}
                          onChange={(e) => setMinTransportScore(e.target.value)}
                          className="range-input"
                        />
                        <span>—</span>
                        <input
                          type="number"
                          placeholder="Max"
                          value={maxTransportScore}
                          onChange={(e) => setMaxTransportScore(e.target.value)}
                          className="range-input"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Demographic / Income Filters */}
                  <div className="filter-section">
                    <h4 className="section-title">Demographics & Income</h4>
                    <div className="range-input-group">
                      <label className="input-label">Population</label>
                      <div className="range-inputs">
                        <input
                          type="number"
                          placeholder="Min"
                          value={minPopulation}
                          onChange={(e) => setMinPopulation(e.target.value)}
                          className="range-input"
                        />
                        <span>—</span>
                        <input
                          type="number"
                          placeholder="Max"
                          value={maxPopulation}
                          onChange={(e) => setMaxPopulation(e.target.value)}
                          className="range-input"
                        />
                      </div>
                    </div>
                    <div className="range-input-group">
                      <label className="input-label">Income</label>
                      <div className="range-inputs">
                        <input
                          type="number"
                          placeholder="Min"
                          value={minIncome}
                          onChange={(e) => setMinIncome(e.target.value)}
                          className="range-input"
                        />
                        <span>—</span>
                        <input
                          type="number"
                          placeholder="Max"
                          value={maxIncome}
                          onChange={(e) => setMaxIncome(e.target.value)}
                          className="range-input"
                        />
                      </div>
                    </div>
                    <div className="range-input-group">
                      <label className="input-label">Price-to-Income Ratio</label>
                      <div className="range-inputs">
                        <input
                          type="number"
                          placeholder="Min"
                          step="0.1"
                          value={minPriceToIncome}
                          onChange={(e) => setMinPriceToIncome(e.target.value)}
                          className="range-input"
                        />
                        <span>—</span>
                        <input
                          type="number"
                          placeholder="Max"
                          step="0.1"
                          value={maxPriceToIncome}
                          onChange={(e) => setMaxPriceToIncome(e.target.value)}
                          className="range-input"
                        />
                      </div>
                    </div>
                  </div>

                  {/* HQS Filters */}
                  <div className="filter-section">
                    <h4 className="section-title">HQS</h4>
                    <label className="checkbox-item">
                      <input 
                        type="checkbox"
                        checked={hqsPassOnly}
                        onChange={(e) => setHqsPassOnly(e.target.checked)}
                      />
                      <span>HQS Pass Only</span>
                    </label>
                    <div className="range-input-group">
                      <label className="input-label">HQS Score</label>
                      <div className="range-inputs">
                        <input
                          type="number"
                          placeholder="Min"
                          value={minHqsScore}
                          onChange={(e) => setMinHqsScore(e.target.value)}
                          className="range-input"
                        />
                        <span>—</span>
                        <input
                          type="number"
                          placeholder="Max"
                          value={maxHqsScore}
                          onChange={(e) => setMaxHqsScore(e.target.value)}
                          className="range-input"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-actions">
                  <button className="reset-btn" onClick={handleResetFilters}>Reset all filters</button>
                  <button className="apply-btn" onClick={handleApplyFilters}>Apply</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="search-results-container">
        {/* Left Column - Map (Fixed) */}
        <div className="search-results-map">
          <MapView
            properties={properties}
            highlightedProperty={hoveredProperty}
            onVisiblePropertiesChange={setVisibleProperties}
          />
        </div>

        {/* Right Column - Property Listings (Scrollable) */}
        <div className="search-results-listings-wrapper">
          <div className="search-results-listings">
            {loading && (
              <div className="search-results-status">
                <p>Searching properties...</p>
              </div>
            )}

            {error && (
              <div className="search-results-status error">
                <p>{error}</p>
              </div>
            )}

            {!loading && !error && properties.length === 0 && (
              <div className="search-results-status">
                <p>No properties found</p>
                <p className="search-results-subtext">Try adjusting your filters</p>
              </div>
            )}

            {!loading && !error && properties.length > 0 && (
              <>
                <div className="results-header">
                  <h2 className="results-title">
                    Real Estate & Homes For Sale
                  </h2>
                  <div className="results-controls">
                    <span className="results-count">{displayedProperties.length} {displayedProperties.length === 1 ? 'result' : 'results'}</span>
                    <select
                      className="sort-dropdown"
                      value={sortBy}
                      onChange={(e) => {
                        setSortBy(e.target.value)
                        updateURL({ sort: e.target.value })
                      }}
                    >
                      {SORT_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>Sort: {opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="search-results-list">
                  {paginatedProperties.map((property) => (
                    <ListingCard
                      key={property.no}
                      property={property}
                      onHover={handlePropertyHover}
                      onClick={handlePropertyClick}
                    />
                  ))}
                </div>

                {displayedProperties.length > pageSize && (
                  <div className="pagination">
                    <button
                      className="page-button"
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      aria-label="Previous page"
                    >
                      ‹
                    </button>
                    {Array.from({ length: totalPages }).map((_, index) => {
                      const page = index + 1
                      return (
                        <button
                          key={page}
                          className={`page-button ${currentPage === page ? 'active' : ''}`}
                          onClick={() => handlePageChange(page)}
                          aria-label={`Go to page ${page}`}
                        >
                          {page}
                        </button>
                      )
                    })}
                    <button
                      className="page-button"
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      aria-label="Next page"
                    >
                      ›
                    </button>
                  </div>
                )}

                {/* Footer at bottom of properties list */}
                <footer className="footer">
                  <div className="footer-columns">
                    <div>
                      <h4>Explore</h4>
                      <Link to="/#listings">Trending Homes</Link>
                      <Link to="/#services">Smart Living Score</Link>
                      <Link to="/#contact">Concierge</Link>
                    </div>
                    <div>
                      <h4>Buy / Rent</h4>
                      <a href="#">Mortgage Calculator</a>
                      <a href="#">Market Insights</a>
                      <a href="#">Neighborhoods</a>
                    </div>
                    <div>
                      <h4>About</h4>
                      <a href="#">Our Story</a>
                      <a href="#">Careers</a>
                      <a href="#">Newsroom</a>
                    </div>
                    <div>
                      <h4>Support</h4>
                      <a href="#">Help Center</a>
                      <a href="#">Privacy</a>
                      <a href="#">Terms</a>
                    </div>
                  </div>
                  <div className="footer-bottom">
                    <div className="footer-brand">
                      <img src={logo} alt="SmartLivingAdvisor logo" />
                      <p>© {new Date().getFullYear()} SmartLivingAdvisor. All rights reserved.</p>
                    </div>
                    <div className="socials">
                      <span className="follow-text">Follow us:</span>
                      <a href="#" aria-label="Facebook">
                        <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      </a>
                      <a href="#" aria-label="Instagram">
                        <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      </a>
                      <a href="#" aria-label="X">
                        <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      </a>
                    </div>
                  </div>
                  <div className="footer-image-container">
                    <img className="footer-illustration" src={footerIllustration} alt="SmartLivingAdvisor footer illustration" />
                  </div>
                </footer>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Property Detail Modal */}
      {selectedProperty && (
        <PropertyModal 
          property={selectedProperty} 
          onClose={() => setSelectedProperty(null)} 
        />
      )}
    </div>
  )
}

export default SearchResults
