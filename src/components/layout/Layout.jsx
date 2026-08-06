import { Outlet } from "react-router-dom"
import { COLORS } from "../../styles/theme"
import BottomNav from "./BottomNav"

function Layout() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: COLORS.bg,
        paddingBottom: "104px",
      }}
    >
      <Outlet />
      <BottomNav />
    </div>
  )
}
export default Layout
