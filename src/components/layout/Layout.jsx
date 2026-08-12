import { Outlet } from "react-router-dom"
import { useSelector } from "react-redux"
import BottomNav from "./BottomNav"
import ActiveRideBanner from "./ActiveRideBanner"

function Layout() {
  const rideId = useSelector((state) => state.ride.rideId)

  return (
    <div className={`layout ${rideId ? "layout--ride-active" : ""}`}>
      <Outlet />
      {rideId && <ActiveRideBanner />}
      <BottomNav />
    </div>
  )
}

export default Layout
