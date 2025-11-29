import { useState } from 'react'
import './FilterDrawer.css'

const SMART_LABEL_OPTIONS = ['', 'Excellent', 'Good', 'Fair', 'Poor']

function FilterDrawer({ 
  isOpen, 
  onClose, 
  onApply, 
  onReset,
  filters,
  setFilters 
}) {
  if (!isOpen) return null

  const handleApply = () => {
    onApply()
    onClose()
  }

  const handleReset = () => {
    onReset()
  }

  return (
    <>
      <div className="filter-drawer-overlay" onClick={onClose} />
      <div className="filter-drawer">
        <div className="filter-drawer-header">
          <h2 className="filter-drawer-title">More filters</h2>
          <button className="filter-drawer-close" onClick={onClose} aria-label="Close filters">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="filter-drawer-content">
          {/* Amenities Filters */}
          <div className="filter-section">
            <h3 className="filter-section-title">Amenities</h3>
            <div className="filter-checkbox-group">
              <label className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={filters.hasGym}
                  onChange={(e) => setFilters({ ...filters, hasGym: e.target.checked })}
                />
                <span>Has Gym</span>
              </label>
              <label className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={filters.hasParking}
                  onChange={(e) => setFilters({ ...filters, hasParking: e.target.checked })}
                />
                <span>Has Parking</span>
              </label>
              <label className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={filters.hasPool}
                  onChange={(e) => setFilters({ ...filters, hasPool: e.target.checked })}
                />
                <span>Has Pool</span>
              </label>
            </div>
            <div className="filter-input-group">
              <label className="filter-label">Amenities contains...</label>
              <input
                type="text"
                placeholder="e.g., WiFi, Elevator, Garden, Bar"
                value={filters.amenitiesContains}
                onChange={(e) => setFilters({ ...filters, amenitiesContains: e.target.value })}
                className="filter-text-input"
              />
            </div>
          </div>

          {/* Comfort & Utilities */}
          <div className="filter-section">
            <h3 className="filter-section-title">Comfort & Utilities</h3>
            <div className="filter-checkbox-group">
              <label className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={filters.airConditioning}
                  onChange={(e) => setFilters({ ...filters, airConditioning: e.target.checked })}
                />
                <span>Air Conditioning</span>
              </label>
              <label className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={filters.heating}
                  onChange={(e) => setFilters({ ...filters, heating: e.target.checked })}
                />
                <span>Heating</span>
              </label>
            </div>
          </div>

          {/* Location Filters */}
          <div className="filter-section">
            <h3 className="filter-section-title">Location</h3>
            <div className="filter-range-group">
              <label className="filter-label">Distance to Hospital (km)</label>
              <div className="filter-range-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minDistHospital}
                  onChange={(e) => setFilters({ ...filters, minDistHospital: e.target.value })}
                  className="filter-range-input"
                />
                <span>—</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxDistHospital}
                  onChange={(e) => setFilters({ ...filters, maxDistHospital: e.target.value })}
                  className="filter-range-input"
                />
              </div>
            </div>
            <div className="filter-range-group">
              <label className="filter-label">Distance to School (km)</label>
              <div className="filter-range-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minDistSchool}
                  onChange={(e) => setFilters({ ...filters, minDistSchool: e.target.value })}
                  className="filter-range-input"
                />
                <span>—</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxDistSchool}
                  onChange={(e) => setFilters({ ...filters, maxDistSchool: e.target.value })}
                  className="filter-range-input"
                />
              </div>
            </div>
            <div className="filter-range-group">
              <label className="filter-label">Distance to Bus (km)</label>
              <div className="filter-range-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minDistBus}
                  onChange={(e) => setFilters({ ...filters, minDistBus: e.target.value })}
                  className="filter-range-input"
                />
                <span>—</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxDistBus}
                  onChange={(e) => setFilters({ ...filters, maxDistBus: e.target.value })}
                  className="filter-range-input"
                />
              </div>
            </div>
          </div>

          {/* Neighborhood Safety & Quality */}
          <div className="filter-section">
            <h3 className="filter-section-title">Neighborhood & Safety</h3>
            <div className="filter-range-group">
              <label className="filter-label">Crime Rate</label>
              <div className="filter-range-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minCrimeRate}
                  onChange={(e) => setFilters({ ...filters, minCrimeRate: e.target.value })}
                  className="filter-range-input"
                />
                <span>—</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxCrimeRate}
                  onChange={(e) => setFilters({ ...filters, maxCrimeRate: e.target.value })}
                  className="filter-range-input"
                />
              </div>
            </div>
            <div className="filter-range-group">
              <label className="filter-label">Smart Living Score</label>
              <div className="filter-range-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  min="0"
                  max="100"
                  value={filters.minScore}
                  onChange={(e) => setFilters({ ...filters, minScore: e.target.value })}
                  className="filter-range-input"
                />
                <span>—</span>
                <input
                  type="number"
                  placeholder="Max"
                  min="0"
                  max="100"
                  value={filters.maxScore}
                  onChange={(e) => setFilters({ ...filters, maxScore: e.target.value })}
                  className="filter-range-input"
                />
              </div>
            </div>
            <div className="filter-input-group">
              <label className="filter-label">Smart Label</label>
              <select
                value={filters.smartLabel}
                onChange={(e) => setFilters({ ...filters, smartLabel: e.target.value })}
                className="filter-select"
              >
                {SMART_LABEL_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt || 'Any'}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Transportation */}
          <div className="filter-section">
            <h3 className="filter-section-title">Transportation</h3>
            <div className="filter-range-group">
              <label className="filter-label">Transport Score</label>
              <div className="filter-range-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minTransportScore}
                  onChange={(e) => setFilters({ ...filters, minTransportScore: e.target.value })}
                  className="filter-range-input"
                />
                <span>—</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxTransportScore}
                  onChange={(e) => setFilters({ ...filters, maxTransportScore: e.target.value })}
                  className="filter-range-input"
                />
              </div>
            </div>
          </div>

          {/* Demographics & Income */}
          <div className="filter-section">
            <h3 className="filter-section-title">Demographics & Income</h3>
            <div className="filter-range-group">
              <label className="filter-label">Population</label>
              <div className="filter-range-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPopulation}
                  onChange={(e) => setFilters({ ...filters, minPopulation: e.target.value })}
                  className="filter-range-input"
                />
                <span>—</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPopulation}
                  onChange={(e) => setFilters({ ...filters, maxPopulation: e.target.value })}
                  className="filter-range-input"
                />
              </div>
            </div>
            <div className="filter-range-group">
              <label className="filter-label">Income</label>
              <div className="filter-range-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minIncome}
                  onChange={(e) => setFilters({ ...filters, minIncome: e.target.value })}
                  className="filter-range-input"
                />
                <span>—</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxIncome}
                  onChange={(e) => setFilters({ ...filters, maxIncome: e.target.value })}
                  className="filter-range-input"
                />
              </div>
            </div>
            <div className="filter-range-group">
              <label className="filter-label">Price-to-Income Ratio</label>
              <div className="filter-range-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  step="0.1"
                  value={filters.minPriceToIncome}
                  onChange={(e) => setFilters({ ...filters, minPriceToIncome: e.target.value })}
                  className="filter-range-input"
                />
                <span>—</span>
                <input
                  type="number"
                  placeholder="Max"
                  step="0.1"
                  value={filters.maxPriceToIncome}
                  onChange={(e) => setFilters({ ...filters, maxPriceToIncome: e.target.value })}
                  className="filter-range-input"
                />
              </div>
            </div>
          </div>

          {/* HQS Filters */}
          <div className="filter-section">
            <h3 className="filter-section-title">HQS</h3>
            <div className="filter-checkbox-group">
              <label className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={filters.hqsPassOnly}
                  onChange={(e) => setFilters({ ...filters, hqsPassOnly: e.target.checked })}
                />
                <span>HQS Pass Only</span>
              </label>
            </div>
            <div className="filter-range-group">
              <label className="filter-label">HQS Score</label>
              <div className="filter-range-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minHqsScore}
                  onChange={(e) => setFilters({ ...filters, minHqsScore: e.target.value })}
                  className="filter-range-input"
                />
                <span>—</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxHqsScore}
                  onChange={(e) => setFilters({ ...filters, maxHqsScore: e.target.value })}
                  className="filter-range-input"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="filter-drawer-footer">
          <button className="filter-reset-btn" onClick={handleReset}>
            Reset all filters
          </button>
          <button className="filter-apply-btn" onClick={handleApply}>
            Apply
          </button>
        </div>
      </div>
    </>
  )
}

export default FilterDrawer

