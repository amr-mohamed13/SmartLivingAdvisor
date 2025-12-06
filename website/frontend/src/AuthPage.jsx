import { useState, useEffect } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import './Auth.css'
import englishLogo from './assets/PNG/logo.png'
import authIllustration from './assets/registeration_page.png'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

function AuthPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login, signup, isAuthenticated } = useAuth()
  
  const [mode, setMode] = useState(location.pathname === '/signup' ? 'signup' : 'signin')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  useEffect(() => {
    setMode(location.pathname === '/signup' ? 'signup' : 'signin')
    setErrors({})
    setServerError('')
    
    // Check for OAuth errors
    const error = searchParams.get('error')
    if (error) {
      setServerError(
        error === 'oauth_not_configured' 
          ? 'OAuth is not configured. Please use email sign in.'
          : error === 'oauth_failed'
          ? 'OAuth sign in failed. Please try again.'
          : 'An error occurred. Please try again.'
      )
    }
  }, [location.pathname, searchParams])

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (mode === 'signup') {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password'
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
    setServerError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      let result
      if (mode === 'signin') {
        result = await login(formData.email, formData.password)
      } else {
        result = await signup(formData.email, formData.password, formData.name)
      }

      if (result.success) {
        navigate('/')
      } else {
        setServerError(result.error || 'Authentication failed')
      }
    } catch (error) {
      setServerError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSocialLogin = (provider) => {
    const providerMap = {
      Google: 'google',
      Facebook: 'facebook',
      Apple: 'apple'
    }
    
    const providerKey = providerMap[provider]
    if (!providerKey) return

    // Redirect to OAuth endpoint
    window.location.href = `${API_BASE_URL}/auth/${providerKey}/login`
  }

  const toggleMode = () => {
    const newMode = mode === 'signin' ? 'signup' : 'signin'
    setMode(newMode)
    setFormData({ email: '', password: '', name: '', confirmPassword: '' })
    setErrors({})
    setServerError('')
    navigate(newMode === 'signin' ? '/signin' : '/signup')
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Left Section - Illustration */}
        <div className="auth-illustration">
          <img src={authIllustration} alt="Authentication illustration" />
        </div>

        {/* Right Section - Form */}
        <div className="auth-form-container">
          <div className="auth-form-card">
            {/* Logo */}
            <div className="auth-logo">
              <img src={englishLogo} alt="SmartLivingAdvisor" />
            </div>

            {/* Title */}
            <h1 className="auth-title">
              {mode === 'signin' ? 'Sign In' : 'Create Your Account'}
            </h1>

            {/* Server Error */}
            {serverError && (
              <div className="auth-error-message" role="alert">
                {serverError}
              </div>
            )}

            {/* Social Login Buttons */}
            <div className="auth-social-buttons">
              <button
                type="button"
                className="auth-social-button"
                onClick={() => handleSocialLogin('Google')}
                disabled={loading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </button>

              <button
                type="button"
                className="auth-social-button"
                onClick={() => handleSocialLogin('Facebook')}
                disabled={loading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Continue with Facebook
              </button>

              <button
                type="button"
                className="auth-social-button"
                onClick={() => handleSocialLogin('Apple')}
                disabled={loading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                Continue with Apple
              </button>
            </div>

            {/* Separator */}
            <div className="auth-separator">
              <span>OR</span>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="auth-form">
              {/* Name Input (Sign Up only) */}
              {mode === 'signup' && (
                <div className="auth-input-group">
                  <label htmlFor="name">Name (Optional)</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your name"
                  />
                  {errors.name && <span className="auth-field-error">{errors.name}</span>}
                </div>
              )}

              {/* Email Input */}
              <div className="auth-input-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  required
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && <span className="auth-field-error">{errors.email}</span>}
              </div>

              {/* Password Input */}
              <div className="auth-input-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  required
                  className={errors.password ? 'error' : ''}
                />
                {errors.password && <span className="auth-field-error">{errors.password}</span>}
              </div>

              {/* Confirm Password (Sign Up only) */}
              {mode === 'signup' && (
                <div className="auth-input-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your password"
                    required
                    className={errors.confirmPassword ? 'error' : ''}
                  />
                  {errors.confirmPassword && <span className="auth-field-error">{errors.confirmPassword}</span>}
                </div>
              )}

              {/* Forgot Password Link (Sign In only) */}
              {mode === 'signin' && (
                <div className="auth-forgot-password">
                  <a href="#" onClick={(e) => e.preventDefault()}>
                    Forgot your password?
                  </a>
                </div>
              )}

              {/* Primary Button */}
              <button 
                type="submit" 
                className="auth-primary-button"
                disabled={loading}
              >
                {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            </form>

            {/* Mode Toggle Link */}
            <div className="auth-mode-toggle">
              {mode === 'signin' ? (
                <>
                  Don't have an account?{' '}
                  <a href="#" onClick={(e) => { e.preventDefault(); toggleMode(); }}>
                    Sign up
                  </a>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <a href="#" onClick={(e) => { e.preventDefault(); toggleMode(); }}>
                    Sign in
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthPage
