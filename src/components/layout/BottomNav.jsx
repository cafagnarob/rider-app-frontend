import { useLocation, useNavigate } from "react-router-dom"
import { COLORS, FONTS } from "../../styles/theme"

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
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 70,
        padding: "0 12px 26px",
        background: `linear-gradient(to top, ${COLORS.bg} 62%, rgba(11,11,12,0))`,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 2,
          background: COLORS.card,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 18,
          padding: 6,
          pointerEvents: "auto",
          maxWidth: "540px",
          margin: "0 auto",
        }}
      >
        {TABS.map((tab) => {
          const active = matchTab(location.pathname, tab.path)
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => navigate(tab.path)}
              style={{
                height: 52,
                border: "none",
                borderRadius: 13,
                background: active ? "#1E2027" : "transparent",
                color: active ? COLORS.text : COLORS.textMuted,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                cursor: "pointer",
                padding: 0,
              }}
            >
              <span
                style={{
                  width: active ? 18 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: active ? COLORS.accent : "rgba(255,255,255,.16)",
                  transition: "width 0.2s ease",
                }}
              />
              <span
                style={{
                  fontFamily: FONTS.heading,
                  fontWeight: 600,
                  fontSize: 14,
                  letterSpacing: ".06em",
                }}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default BottomNav
