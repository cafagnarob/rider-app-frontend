import { Link, useLocation, useNavigate } from "react-router-dom"
import { FaUsers, FaMotorcycle, FaArrowLeft } from "react-icons/fa"

const TABS = [
  { key: "users", label: "UTENTI", path: "/admin/users", icon: FaUsers },
  {
    key: "catalog",
    label: "CATALOGO",
    path: "/admin/catalog",
    icon: FaMotorcycle,
  },
]

function AdminSideNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="admin-side-nav">
      <div className="admin-side-nav__brand">
        <span style={{ color: "var(--color-accent)" }}>QJ</span> ADMIN
      </div>
      <div className="side-nav__items">
        {TABS.map((tab) => {
          const active = location.pathname.startsWith(tab.path)
          const Icon = tab.icon
          return (
            <Link
              key={tab.key}
              to={tab.path}
              className={`side-nav__item ${active ? "side-nav__item--active" : ""}`}
            >
              <span className="side-nav__bar" />
              <Icon size={17} />
              <span>{tab.label}</span>
            </Link>
          )
        })}
      </div>
      <button
        type="button"
        className="admin-side-nav__exit"
        onClick={() => navigate("/")}
      >
        <FaArrowLeft size={13} /> TORNA ALL'APP
      </button>
    </nav>
  )
}

export default AdminSideNav
