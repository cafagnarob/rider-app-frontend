import { FaBell } from "react-icons/fa"
import { useNavigate } from "react-router-dom"
import { useSelector } from "react-redux"
import { useGetUnreadCountQuery } from "../notificationsApi"

function NotificationBell() {
  const token = useSelector((state) => state.auth.token)
  const navigate = useNavigate()

  const { data: unread } = useGetUnreadCountQuery(undefined, {
    skip: !token,
    pollingInterval: 30000,
  })

  const count = unread?.count || 0

  return (
    <button
      type="button"
      className="btn-icon"
      style={{ position: "relative" }}
      onClick={() => navigate("/notifications")}
    >
      <FaBell size={15} />
      {count > 0 && (
        <span className="icon-badge">{count > 99 ? "99+" : count}</span>
      )}
    </button>
  )
}

export default NotificationBell
