import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './Home'
import AuthPage from './AuthPage'
import SearchResults from './SearchResults'
import PropertyDetailsPage from './PropertyDetailsPage'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<AuthPage />} />
        <Route path="/signup" element={<AuthPage />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/property/:id" element={<PropertyDetailsPage />} />
      </Routes>
    </Router>
  )
}

export default App
