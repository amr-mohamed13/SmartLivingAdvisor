import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [refreshToken, setRefreshToken] = useState(null)
  const [loading, setLoading] = useState(true)

  // Load user from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken')
    const storedRefreshToken = localStorage.getItem('refreshToken')
    const storedUser = localStorage.getItem('user')

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error('Failed to parse cached user', error)
      }
    }

    if (storedToken) {
      setToken(storedToken)
      setRefreshToken(storedRefreshToken)
      loadUser(storedToken)
    } else {
      setLoading(false)
    }
  }, [])

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!token || !refreshToken) return

    const interval = setInterval(async () => {
      try {
        await refreshAccessToken()
      } catch (error) {
        console.error('Token refresh failed:', error)
      }
    }, 14 * 60 * 1000) // Refresh every 14 minutes (before 15 min expiry)

    return () => clearInterval(interval)
  }, [token, refreshToken])

  const loadUser = async (accessToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        localStorage.setItem('user', JSON.stringify(userData))
      } else {
        // Token might be expired, try refresh
        const storedRefresh = localStorage.getItem('refreshToken')
        if (storedRefresh) {
          await refreshAccessToken()
        } else {
          logout()
        }
      }
    } catch (error) {
      console.error('Failed to load user:', error)
      logout()
    } finally {
      setLoading(false)
    }
  }

  const refreshAccessToken = async () => {
    const storedRefresh = localStorage.getItem('refreshToken')
    if (!storedRefresh) {
      logout()
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refresh_token: storedRefresh })
      })

      if (response.ok) {
        const data = await response.json()
        setToken(data.access_token)
        setRefreshToken(data.refresh_token)
        localStorage.setItem('accessToken', data.access_token)
        localStorage.setItem('refreshToken', data.refresh_token)
        await loadUser(data.access_token)
      } else {
        logout()
      }
    } catch (error) {
      console.error('Token refresh failed:', error)
      logout()
    }
  }

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (response.ok) {
        setToken(data.access_token)
        setRefreshToken(data.refresh_token)
        setUser(data.user)
        localStorage.setItem('accessToken', data.access_token)
        localStorage.setItem('refreshToken', data.refresh_token)
        localStorage.setItem('user', JSON.stringify(data.user))
        return { success: true }
      } else {
        return { success: false, error: data.detail || 'Login failed' }
      }
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  const signup = async (email, password, name) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, name })
      })

      const data = await response.json()

      if (response.ok) {
        setToken(data.access_token)
        setRefreshToken(data.refresh_token)
        setUser(data.user)
        localStorage.setItem('accessToken', data.access_token)
        localStorage.setItem('refreshToken', data.refresh_token)
        localStorage.setItem('user', JSON.stringify(data.user))
        return { success: true }
      } else {
        return { success: false, error: data.detail || 'Signup failed' }
      }
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  const logout = async () => {
    const storedRefresh = localStorage.getItem('refreshToken')
    
    if (storedRefresh) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ refresh_token: storedRefresh })
        })
      } catch (error) {
        console.error('Logout error:', error)
      }
    }

    setUser(null)
    setToken(null)
    setRefreshToken(null)
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')

    if (window.location.pathname !== '/') {
      window.location.href = '/'
    }
  }

  const handleOAuthCallback = useCallback((accessToken, refreshToken) => {
    setToken(accessToken)
    setRefreshToken(refreshToken)
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    loadUser(accessToken)
    // Navigation will be handled by OAuthCallback component
  }, [])

  const value = {
    user,
    token,
    isAuthenticated: !!user,
    loading,
    login,
    signup,
    logout,
    refresh: refreshAccessToken,
    loadUser: () => loadUser(token),
    handleOAuthCallback
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

