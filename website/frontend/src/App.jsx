import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Home from './Home'
import AuthPage from './AuthPage'
import SearchResults from './SearchResults'
import PropertyDetailsPage from './PropertyDetailsPage'
import OAuthCallback from './OAuthCallback'
import ProfilePage from './ProfilePage'
import SavedHomesPage from './SavedHomesPage'
import ViewedHomesPage from './ViewedHomesPage'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signin" element={<AuthPage />} />
          <Route path="/signup" element={<AuthPage />} />
          <Route path="/auth/callback" element={<OAuthCallback />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/property/:id" element={<PropertyDetailsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/saved" element={<SavedHomesPage />} />
          <Route path="/viewed" element={<ViewedHomesPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
