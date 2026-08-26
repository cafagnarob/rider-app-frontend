import { Navigate, Outlet } from "react-router-dom"
import { Spinner } from "react-bootstrap"
import { useGetCurrentUserQuery } from "../features/users/usersApi"

function AdminRoute() {
  const { data: me, isLoading } = useGetCurrentUserQuery()

  if (isLoading) {
    return (
      <div className="centered-spinner">
        <Spinner animation="border" style={{ color: "#FF7A2F" }} />
      </div>
    )
  }

  if (me?.role !== "ADMIN") {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export default AdminRoute
