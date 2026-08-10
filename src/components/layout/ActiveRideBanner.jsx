import { useSelector } from "react-redux"
import { useNavigate, useLocation } from "react-router-dom"
import { COLORS, FONTS } from "../../styles/theme"

function ActiveRideBanner() {
  const ride = useSelector((state) => state.ride)
  const navigate = useNavigate()
  const location = useLocation()

  if (!ride.rideId) return null
  if (location.pathname === "/rides/new") return null // già sulla pagina di tracciamento

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 100,
        zIndex: 65,
        padding: "0 12px",
        pointerEvents: "none",
      }}
    >
      <button
        type="button"
        onClick={() => navigate("/rides/new")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          width: "100%",
          maxWidth: 540,
          margin: "0 auto",
          height: 52,
          borderRadius: 16,
          background: "rgba(12,12,14,.92)",
          border: `1px solid ${COLORS.dangerBorder}`,
          backdropFilter: "blur(8px)",
          padding: "0 16px",
          cursor: "pointer",
          pointerEvents: "auto",
        }}
      >
        <span
          style={{ position: "relative", width: 9, height: 9, flexShrink: 0 }}
        >
          <span
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: COLORS.danger,
            }}
          />
          <span
            style={{
              position: "absolute",
              inset: -5,
              borderRadius: "50%",
              background: COLORS.danger,
              animation: "qjpulse 1.8s ease-out infinite",
            }}
          />
        </span>
        <span
          style={{
            fontFamily: FONTS.mono,
            fontSize: 11,
            color: COLORS.danger,
            letterSpacing: ".04em",
          }}
        >
          REGISTRAZIONE IN CORSO
        </span>
        <span
          style={{
            fontFamily: FONTS.heading,
            fontWeight: 700,
            fontSize: 15,
            color: COLORS.text,
            marginLeft: "auto",
          }}
        >
          {ride.distanceKm.toFixed(2).replace(".", ",")} KM
        </span>
      </button>
    </div>
  )
}

export default ActiveRideBanner
