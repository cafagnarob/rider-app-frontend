import { Outlet } from "react-router-dom"
import AdminSideNav from "../components/layout/AdminSideNav"

function AdminLayout() {
  return (
    <div className="admin-layout">
      <AdminSideNav />
      <div className="admin-layout__main">
        <Outlet />
      </div>
    </div>
  )
}

export default AdminLayout
