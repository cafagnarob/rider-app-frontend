import { Link, useLocation } from "react-router-dom"
import {
  FaHome,
  FaStream,
  FaCalendarAlt,
  FaMotorcycle,
  FaUser,
} from "react-icons/fa"
import { useGetCurrentUserQuery } from "../../features/users/usersApi"
import NotificationBell from "../../features/notification/components/NotificationBell"

const TABS = [
  { key: "home", label: "HOME", path: "/", icon: FaHome },
  { key: "feed", label: "FEED", path: "/feed", icon: FaStream },
  { key: "eventi", label: "EVENTI", path: "/events", icon: FaCalendarAlt },
  { key: "ride", label: "RIDE", path: "/rides", icon: FaMotorcycle },
  { key: "io", label: "IO", path: "/profile", icon: FaUser },
]

function matchTab(pathname, tabPath) {
  if (tabPath === "/") return pathname === "/"
  return pathname.startsWith(tabPath)
}

function SideNav() {
  const location = useLocation()
  const { data: me } = useGetCurrentUserQuery()

  return (
    <nav className="side-nav desktop-only">
      <div className="side-nav__top">
        <div>
          <div className="side-nav__brand">QJ RIDERS</div>
          <div className="screen-label">
            CIAO, {(me?.name || me?.username || "").toUpperCase()}
          </div>
          <div className="side-nav__top-actions">
            <Link to="/profile" className="side-nav__avatar-link">
              <img
                src={me?.profilePicture}
                alt=""
                className="side-nav__avatar"
              />
            </Link>
            <NotificationBell />
          </div>
        </div>
      </div>

      <div className="side-nav__items">
        {TABS.map((tab) => {
          const active = matchTab(location.pathname, tab.path)
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
    </nav>
  )
}

export default SideNav
