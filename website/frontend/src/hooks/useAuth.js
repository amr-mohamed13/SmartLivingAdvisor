import { useAuth as useAuthContext } from '../contexts/AuthContext'

// Small wrapper to keep hook usage consistent across the app.
export function useAuth() {
  return useAuthContext()
}

export default useAuth
