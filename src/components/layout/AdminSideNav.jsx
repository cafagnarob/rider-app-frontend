import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  FaUsers,
  FaMotorcycle,
  FaArrowLeft,
  FaBullhorn,
  FaCalendarAlt,
  FaClipboardList,
  FaFlag,
  FaChartLine,
  FaTimes,
} from "react-icons/fa"

const TABS = [
  {
    key: "dashboard",
    label: "DASHBOARD",
    path: "/admin/dashboard",
    icon: FaChartLine,
  },
  { key: "users", label: "UTENTI", path: "/admin/users", icon: FaUsers },
  {
    key: "catalog",
    label: "CATALOGO",
    path: "/admin/catalog",
    icon: FaMotorcycle,
  },
  {
    key: "suggestions",
    label: "SEGNALAZIONI CATALOGO",
    path: "/admin/catalog-suggestions",
    icon: FaClipboardList,
  },
  {
    key: "reports",
    label: "SEGNALAZIONI",
    path: "/admin/reports",
    icon: FaFlag,
  },
  {
    key: "events",
    label: "EVENTI",
    path: "/admin/events",
    icon: FaCalendarAlt,
  },
  {
    key: "broadcast",
    label: "NOTIFICHE",
    path: "/admin/broadcast",
    icon: FaBullhorn,
  },
]

function AdminSideNav({ onNavigate }) {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="admin-side-nav">
      <div className="admin-side-nav__brand-row">
        <div className="admin-side-nav__brand">
          <span style={{ color: "var(--color-accent)" }}>FlowRides</span> ADMIN
        </div>
        <button
          type="button"
          className="admin-side-nav__close-btn mobile-only"
          onClick={onNavigate}
        >
          <FaTimes size={16} />
        </button>
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
              onClick={onNavigate}
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
