import { Outlet } from "react-router-dom"
import { COLORS } from "../../styles/theme"
import BottomNav from "./BottomNav"
import { useSelector } from "react-redux"
import ActiveRideBanner from "./ActiveRideBanner"

function Layout() {
  const rideId = useSelector((state) => state.ride.rideId)

  return (
    <div
      style={{
        minHeight: "100vh",
        background: COLORS.bg,
        paddingBottom: "104px",
      }}
    >
      <Outlet />
      {rideId && <ActiveRideBanner />}
      <BottomNav />
    </div>
  )
}
export default Layout
