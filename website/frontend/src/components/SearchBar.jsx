import { useState, useEffect } from 'react'
import './SearchBar.css'

function SearchBar({ searchQuery, onSearch, onFilterClick, filterLabels }) {
  const [localQuery, setLocalQuery] = useState(searchQuery)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (onSearch) {
      onSearch(localQuery)
    }
  }
  
  useEffect(() => {
    setLocalQuery(searchQuery)
  }, [searchQuery])

  return (
    <div className="search-bar-container">
      <form onSubmit={handleSubmit} className="search-bar-form">
        <div className="search-input-wrapper">
          <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Enter city, neighborhood, or address"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-chips">
          <button
            type="button"
            className="filter-chip"
            onClick={() => onFilterClick('saleType')}
          >
            <span>{filterLabels.saleType || 'For Sale'}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <button
            type="button"
            className="filter-chip"
            onClick={() => onFilterClick('homeType')}
          >
            <span>{filterLabels.homeType || 'Home Type'}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <button
            type="button"
            className="filter-chip"
            onClick={() => onFilterClick('bedsBaths')}
          >
            <span>{filterLabels.bedsBaths || 'Beds & Baths'}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <button
            type="button"
            className="filter-chip"
            onClick={() => onFilterClick('price')}
          >
            <span>{filterLabels.price || 'Price'}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <button
            type="button"
            className="filter-chip more-filters"
            onClick={() => onFilterClick('more')}
          >
            <span>More Filters</span>
            {filterLabels.moreCount > 0 && (
              <span className="filter-count">{filterLabels.moreCount}</span>
            )}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
        </div>
      </form>
    </div>
  )
}

export default SearchBar

