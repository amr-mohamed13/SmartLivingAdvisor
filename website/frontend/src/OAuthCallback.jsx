import { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'

function OAuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { handleOAuthCallback } = useAuth()

  useEffect(() => {
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    const error = searchParams.get('error')
    const returnTo = searchParams.get('from') || '/'

    if (error) {
      // Redirect to signin with error
      navigate(`/signin?error=${error}`)
    } else if (accessToken && refreshToken) {
      handleOAuthCallback(accessToken, refreshToken)
      // Navigate back to the page user was on, or home
      navigate(returnTo, { replace: true })
    } else {
      navigate('/signin?error=oauth_failed')
    }
  }, [searchParams, handleOAuthCallback, navigate])

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <div className="spinner" style={{
        width: '40px',
        height: '40px',
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #004F52',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}></div>
      <p>Completing sign in...</p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default OAuthCallback

