import { useLocation, useNavigate } from "react-router-dom"

const TABS = [
  { key: "home", label: "HOME", path: "/" },
  { key: "feed", label: "FEED", path: "/feed" },
  { key: "eventi", label: "EVENTI", path: "/events" },
  { key: "ride", label: "RIDE", path: "/rides" },
  { key: "io", label: "IO", path: "/profile" },
]

function matchTab(pathname, tabPath) {
  if (tabPath === "/") return pathname === "/"
  return pathname.startsWith(tabPath)
}

function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div className="bottom-nav-wrap">
      <div className="bottom-nav">
        {TABS.map((tab) => {
          const active = matchTab(location.pathname, tab.path)
          return (
            <button
              key={tab.key}
              type="button"
              className={`bottom-nav__item ${active ? "bottom-nav__item--active" : ""}`}
              onClick={() => navigate(tab.path)}
            >
              <span
                className={`bottom-nav__dot ${active ? "bottom-nav__dot--active" : ""}`}
                style={{ width: active ? 18 : 6 }}
              />
              <span className="bottom-nav__label">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default BottomNav
