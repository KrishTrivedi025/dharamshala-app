import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Loader from './Loader'

function ProtectedRoute({ children, adminOnly = false }) {
  const { isLoggedIn, isAdmin, loading } = useAuth()

  if (loading) return <Loader message="Checking access..." />
  if (!isLoggedIn) return <Navigate to="/login" replace />
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />

  return children
}

export default ProtectedRoute