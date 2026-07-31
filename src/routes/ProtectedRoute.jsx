import { useSelector } from "react-redux"
import { Navigate, Outlet, useLocation } from "react-router-dom"

function ProtectedRoute() {
  const token = useSelector((state) => state.auth.token)
  const location = useLocation()

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}

export default ProtectedRoute
