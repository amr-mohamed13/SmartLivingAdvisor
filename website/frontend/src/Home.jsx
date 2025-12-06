import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './App.css'
import NavBar from './components/NavBar'
import { useAuth } from './contexts/AuthContext'
import englishLogo from './assets/PNG/english_version.png'
import logo from './assets/PNG/logo.png'
import contactIllustration from './assets/PNG/contact-illustration.png'
import footerIllustration from './assets/PNG/footer.png'
import heroIllustration from './assets/home_page.png'
import recommendationImage from './assets/recommendation_image.png'
import apartmentImg from './assets/apartment.png'
import villaImg from './assets/villa.png'
import condoImg from './assets/condo.png'
import farmhouseImg from './assets/farmhouse.png'
import penthouseImg from './assets/penthouse.png'
import bungalowImg from './assets/bungalow.png'
import smartLivingScoreImg from './assets/Smart Living Score.png'
import aiRecommendationsImg from './assets/AI-Powered Recommendations.png'
import neighborhoodInsightsImg from './assets/PNG/Neighborhood Insights.png'

const services = [
  {
    title: 'Smart Living Score',
    description: 'A real-time AI score that evaluates comfort, convenience, and community across every home — giving you complete clarity before you decide.',
    accent: '#4FAFB2',
    image: smartLivingScoreImg,
  },
  {
    title: 'AI-Powered Recommendations',
    description: 'Instant property recommendations tailored to your lifestyle — even without an account.',
    accent: '#F4A340',
    image: aiRecommendationsImg,
  },
  {
    title: 'Neighborhood Insights',
    description: 'Detailed safety, commute, amenities, and quality-of-life ratings for smarter decision-making.',
    accent: '#EF6C48',
    image: neighborhoodInsightsImg,
  },
]

const fallbackListings = [
  {
    id: 1,
    title: 'Midtown Skyline Loft',
    price: '$1,250,000',
    location: 'Manhattan, NY',
    area: '1,540 sq ft',
    rooms: '3 Bed • 2 Bath',
    score: '92 Smart Score',
    badge: 'Excellent Match',
    badgeColor: '#52D1C6',
    image: apartmentImg,
  },
  {
    id: 2,
    title: 'Azure Skyline Villa',
    price: '$2,680,000',
    location: 'Miami, FL',
    area: '3,200 sq ft',
    rooms: '4 Bed • 4 Bath',
    score: '88 Smart Score',
    badge: 'High Score',
    badgeColor: '#2D9CDB',
    image: villaImg,
  },
  {
    id: 3,
    title: 'Downtown Horizon Condo',
    price: '$915,000',
    location: 'Chicago, IL',
    area: '1,650 sq ft',
    rooms: '3 Bed • 2 Bath',
    score: '85 Smart Score',
    badge: 'New Listing',
    badgeColor: '#F4A340',
    image: condoImg,
  },
  {
    id: 4,
    title: 'Coastal Glass Retreat',
    price: '$1,780,000',
    location: 'Santa Monica, CA',
    area: '2,400 sq ft',
    rooms: '4 Bed • 3 Bath',
    score: '90 Smart Score',
    badge: 'Excellent Match',
    badgeColor: '#52D1C6',
    image: farmhouseImg,
  },
  {
    id: 5,
    title: 'Skyline Penthouse Loft',
    price: '$1,520,000',
    location: 'Seattle, WA',
    area: '2,150 sq ft',
    rooms: '4 Bed • 3 Bath',
    score: '87 Smart Score',
    badge: 'High Score',
    badgeColor: '#2D9CDB',
    image: penthouseImg,
  },
  {
    id: 6,
    title: 'Sunlit Smart Bungalow',
    price: '$640,000',
    location: 'Denver, CO',
    area: '1,200 sq ft',
    rooms: '2 Bed • 2 Bath',
    score: '80 Smart Score',
    badge: 'New Listing',
    badgeColor: '#EF6C48',
    image: bungalowImg,
  },
]

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

function Home() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [listings, setListings] = useState(fallbackListings)
  const [loadingListings, setLoadingListings] = useState(false)
  const [listingsError, setListingsError] = useState(null)
  const [showStickySearch, setShowStickySearch] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    async function fetchListings() {
      try {
        setLoadingListings(true)
        setListingsError(null)
        const response = await fetch(`${API_BASE_URL}/listings?limit=6`, { signal: controller.signal })
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }
        const data = await response.json()
        console.log('API Response:', data)
        if (Array.isArray(data)) {
          if (data.length > 0) {
            const normalized = data.map((item, idx) => ({
              id: item.id ?? idx,
              title: item.title ?? 'Smart Home',
              price: item.price ?? 'Price on request',
              location: item.location ?? 'Unknown',
              area: item.area ?? '—',
              rooms: item.rooms ?? '—',
              score: item.score ?? 'Smart score coming soon',
              badge: item.badge ?? 'New Listing',
              badgeColor: item.badge_color ?? item.badgeColor ?? '#F4A340',
              image: item.image ?? fallbackListings[idx % fallbackListings.length].image,
            }))
            console.log('Normalized listings:', normalized)
            setListings(normalized)
          } else {
            console.warn('API returned empty array, using fallback listings')
            setListingsError('No listings found. Showing featured picks instead.')
            setListings(fallbackListings)
          }
        } else {
          console.error('API response is not an array:', data)
          setListingsError('Invalid response format. Showing featured picks instead.')
          setListings(fallbackListings)
        }
      } catch (error) {
        if (error?.name === 'AbortError') return
        console.error('Failed to load listings', error)
        setListingsError('Unable to load live listings right now. Showing featured picks instead.')
        setListings(fallbackListings)
      } finally {
        setLoadingListings(false)
      }
    }

    fetchListings()

    return () => controller.abort()
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const hero = document.querySelector('.hero')
      if (hero) {
        const heroBottom = hero.offsetTop + hero.offsetHeight
        setShowStickySearch(window.scrollY > heroBottom)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="app">
      <NavBar />

      {showStickySearch && (
        <div className="sticky-search-bar">
          <div className="sticky-search-container">
            <img src={englishLogo} alt="SmartLivingAdvisor logo" className="sticky-logo" />
            <form 
              className="search-bar" 
              role="search"
              onSubmit={(e) => {
                e.preventDefault()
                const query = e.target.search.value.trim()
                if (query) {
                  navigate(`/search?query=${encodeURIComponent(query)}`)
                }
              }}
            >
              <input 
                type="text" 
                name="search"
                placeholder="Enter an address, neighborhood, city, or ZIP code" 
                aria-label="Search homes" 
              />
              <button type="submit" className="search-icon" aria-label="Search">
                <svg viewBox="0 0 24 24">
                  <path d="M15 15l6 6m-3.5-8.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}

      <header className="hero">
        <div className="hero-background">
          <img src={heroIllustration} alt="Hero background" />
        </div>
        <div className="hero-content">
          <div className="hero-copy">
            <h1>Buy. Explore. <br />Discover. Live Better.</h1>

            <form 
              className="search-bar" 
              role="search"
              onSubmit={(e) => {
                e.preventDefault()
                const query = e.target.search.value.trim()
                if (query) {
                  navigate(`/search?query=${encodeURIComponent(query)}`)
                }
              }}
            >
              <input 
                type="text" 
                name="search"
                placeholder="Enter an address, neighborhood, city, or ZIP code" 
                aria-label="Search homes" 
              />
              <button type="submit" className="search-icon" aria-label="Search">
                <svg viewBox="0 0 24 24">
                  <path d="M15 15l6 6m-3.5-8.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </header>

      <section className="recommendations refined-card">
        {isAuthenticated ? (
          <>
            <div className="recommendations-content">
              <p className="eyebrow">Personalized for you</p>
              <h2>Recommendations underway</h2>
              <p>Search and save a few homes you like and we’ll find recommendations for you.</p>
            </div>
            <div className="recommendations-image">
              <img src={recommendationImage} alt="Personalized recommendations" />
            </div>
          </>
        ) : (
          <>
            <div className="recommendations-content">
              <p className="eyebrow">Get home recommendations</p>
              <h2>Sign in for a more personalized experience.</h2>
              <Link to="/signin">
                <button className="primary subtle-btn">Sign in</button>
              </Link>
            </div>
            <div className="recommendations-image">
              <img src={recommendationImage} alt="Home recommendations" />
            </div>
          </>
        )}
      </section>

      <section id="services" className="services">
        {services.map((service) => (
          <article key={service.title} className="service-card">
            <div className="service-image">
              <img src={service.image} alt={service.title} />
            </div>
            <h3>{service.title}</h3>
            <p>{service.description}</p>
          </article>
        ))}
      </section>

      <section id="listings" className="listings">
        <div className="section-header">
          <div>
            <p className="eyebrow">Featured Listings</p>
            <h2>Curated homes for every lifestyle</h2>
          </div>
          <button className="ghost icon">
            View all listings
            <svg viewBox="0 0 24 24">
              <path d="M5 12h14m-6-6l6 6-6 6" />
            </svg>
          </button>
        </div>

        {listingsError && <p className="listings-status error">{listingsError}</p>}
        {loadingListings && <p className="listings-status">Loading smart matches…</p>}

        <div className="listings-grid">
          {listings.map((listing) => (
            <article key={listing.id} className="listing-card">
              <div className="listing-image">
                <img src={listing.image} alt={listing.title} />
                <span className="badge" style={{ backgroundColor: listing.badgeColor }}>
                  {listing.badge}
                </span>
              </div>
              <div className="listing-content">
                <div className="price-row">
                  <h3>{listing.price}</h3>
                  <span>{listing.score}</span>
                </div>
                <p className="location">{listing.title}</p>
                <p className="subtext">{listing.location}</p>
                <div className="meta">
                  <span>{listing.area}</span>
                  <span>{listing.rooms}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="contact" className="cta">
        <div className="cta-content">
          <p className="eyebrow">Concierge Support</p>
          <h2>Need help deciding? We're here to guide you.</h2>
          <p>
            Partner with SmartLiving Advisors who combine local expertise with AI-powered insights. From budgeting to closing,
            we're with you every step of the way.
          </p>
          <div className="cta-actions">
            <button className="primary">Contact Us</button>
            <button className="ghost">Book a Call</button>
          </div>
        </div>
        <div className="cta-visual">
          <img src={contactIllustration} alt="People discussing real estate" />
        </div>
      </section>

      <footer className="footer">
        <div className="footer-columns">
          <div>
            <h4>Explore</h4>
            <a href="#listings">Trending Homes</a>
            <a href="#services">Smart Living Score</a>
            <a href="#contact">Concierge</a>
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
            <p>© {new Date().getFullYear()} Maladh. All rights reserved.</p>
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
    </div>
  )
}

export default Home

