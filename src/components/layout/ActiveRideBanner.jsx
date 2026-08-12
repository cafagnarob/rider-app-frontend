import { useSelector } from "react-redux"
import { useNavigate, useLocation } from "react-router-dom"

function ActiveRideBanner() {
  const ride = useSelector((state) => state.ride)
  const navigate = useNavigate()
  const location = useLocation()

  if (!ride.rideId) return null
  if (location.pathname === "/rides/new") return null

  return (
    <div className="ride-banner-wrap">
      <button
        type="button"
        className="ride-banner"
        onClick={() => navigate("/rides/new")}
      >
        <span className="ride-banner__dot-wrap">
          <span className="ride-banner__dot" />
          <span className="ride-banner__dot-pulse" />
        </span>
        <span className="ride-banner__label">REGISTRAZIONE IN CORSO</span>
        <span className="ride-banner__distance">
          {ride.distanceKm.toFixed(2).replace(".", ",")} KM
        </span>
      </button>
    </div>
  )
}

export default ActiveRideBanner
