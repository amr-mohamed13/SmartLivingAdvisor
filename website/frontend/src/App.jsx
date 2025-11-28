import { useEffect, useState } from 'react'
import './App.css'
import englishLogo from './assets/PNG/english_version.png'
import logo from './assets/PNG/logo.png'
import contactIllustration from './assets/contact-illustration.png'
import footerIllustration from './assets/PNG/footer.png'
import heroIllustration from './assets/home_page.png'
import apartmentImg from './assets/apartment.png'
import villaImg from './assets/villa.png'
import condoImg from './assets/condo.png'
import farmhouseImg from './assets/farmhouse.png'
import penthouseImg from './assets/penthouse.png'
import bungalowImg from './assets/bungalow.png'
import smartLivingScoreImg from './assets/Smart Living Score.png'
import aiRecommendationsImg from './assets/AI-Powered Recommendations.png'
import neighborhoodInsightsImg from './assets/Neighborhood Insights.png'


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

const heroStats = [
  { label: 'Eco-ready homes', color: 'teal' },
  { label: 'Commute-friendly picks', color: 'blue' },
  { label: 'Wellness-focused amenities', color: 'coral' },
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

function App() {
  const [listings, setListings] = useState(fallbackListings)
  const [loadingListings, setLoadingListings] = useState(false)
  const [listingsError, setListingsError] = useState(null)

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
        console.log('API Response:', data) // Debug log
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
            console.log('Normalized listings:', normalized) // Debug log
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

  return (
    <div className="app">
      <nav className="nav">
        <div className="nav-links">
          <a href="#listings">Buy</a>
          <a href="#listings">Rent</a>
          <a href="#services">Features</a>
          <a href="#contact">Support</a>
        </div>
        <div className="brand-center">
          <img src={englishLogo} alt="SmartLivingAdvisor logo" />
        </div>
        <div className="nav-actions">
          <button className="ghost">Sign In</button>
          <button className="primary">Get Started</button>
        </div>
      </nav>

      <header className="hero">
        <div className="hero-background">
          <img src={heroIllustration} alt="Hero background" />
        </div>
        <div className="hero-content">
          <div className="hero-copy">
            <h1>Find the perfect home, smarter.</h1>

            <div className="search-bar" role="search">
              <span className="search-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M15 15l6 6m-3.5-8.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
                </svg>
              </span>
              <input type="text" placeholder="Search by city, neighborhood, or price…" aria-label="Search homes" />
              <button className="primary">Search</button>
            </div>
          </div>
        </div>
      </header>

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
          <h2>Need help deciding? We’re here to guide you.</h2>
          <p>
            Partner with SmartLiving Advisors who combine local expertise with AI-powered insights. From budgeting to closing,
            we’re with you every step of the way.
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
          <div className="brand">
            <img src={logo} alt="SmartLivingAdvisor logo" />
            <span>SmartLivingAdvisor</span>
            <p>AI-forward experiences to help you live better, wherever you land.</p>
          </div>
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
          <p>© {new Date().getFullYear()} SmartLivingAdvisor. All rights reserved.</p>
          <div className="socials">
            <a href="#" aria-label="LinkedIn">
              in
            </a>
            <a href="#" aria-label="Instagram">
              ig
            </a>
            <a href="#" aria-label="X">
              x
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

export default App
