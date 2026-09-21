import { useState } from "react"
import { FaBars } from "react-icons/fa"
import { Outlet } from "react-router-dom"
import AdminSideNav from "../components/layout/AdminSideNav"

function AdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="admin-layout">
      <div className="admin-mobile-topbar mobile-only">
        <button
          type="button"
          className="admin-mobile-topbar__menu-btn"
          onClick={() => setDrawerOpen(true)}
        >
          <FaBars size={18} />
        </button>
        <span className="admin-mobile-topbar__brand">
          <span style={{ color: "var(--color-accent)" }}>FlowRides</span> ADMIN
        </span>
      </div>

      <div
        className={`admin-side-nav-wrap ${drawerOpen ? "admin-side-nav-wrap--open" : ""}`}
      >
        <AdminSideNav onNavigate={() => setDrawerOpen(false)} />
      </div>

      {drawerOpen && (
        <div
          className="admin-drawer-overlay"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <div className="admin-layout__main">
        <Outlet />
      </div>
    </div>
  )
}

export default AdminLayout
