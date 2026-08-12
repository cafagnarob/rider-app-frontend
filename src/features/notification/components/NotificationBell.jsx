import { useState } from "react"
import { FaBell } from "react-icons/fa"
import { useNavigate, Link } from "react-router-dom"
import { useSelector } from "react-redux"
import {
  useGetUnreadCountQuery,
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} from "../notificationsApi"
import {
  NOTIFICATION_ICONS,
  buildNotificationLink,
} from "../../../utils/notifications"
import { formatRelativeTime } from "../../../utils/dateFormat"

function NotificationBell() {
  const token = useSelector((state) => state.auth.token)
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const { data: unread } = useGetUnreadCountQuery(undefined, {
    skip: !token,
    pollingInterval: 30000,
  })
  const { data: list } = useGetNotificationsQuery(
    { page: 0, size: 8 },
    { skip: !token },
  )

  const [markAsRead] = useMarkAsReadMutation()
  const [markAllAsRead] = useMarkAllAsReadMutation()

  const handleClick = async (notification) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }
    const link = buildNotificationLink(
      notification.referenceType,
      notification.referenceId,
      notification.type,
      notification.actorUsername,
    )
    setOpen(false)
    if (link) navigate(link)
  }

  const count = unread?.count || 0

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        className="btn-icon"
        style={{ position: "relative" }}
        onClick={() => setOpen((v) => !v)}
      >
        <FaBell size={15} />
        {count > 0 && (
          <span className="icon-badge">{count > 99 ? "99+" : count}</span>
        )}
      </button>

      {open && (
        <>
          <div className="popover-overlay" onClick={() => setOpen(false)} />
          <div className="card dropdown-panel">
            <div className="dropdown-panel__header">
              <span className="dropdown-panel__title">Notifiche</span>
              {count > 0 && (
                <button
                  type="button"
                  className="text-btn text-btn--accent"
                  onClick={() => markAllAsRead()}
                >
                  SEGNA TUTTE
                </button>
              )}
            </div>

            {list?.content.length === 0 && (
              <p className="dropdown-empty">Nessuna notifica</p>
            )}

            {list?.content.map((n) => {
              const { Icon, color } =
                NOTIFICATION_ICONS[n.type] || NOTIFICATION_ICONS.SYSTEM
              return (
                <div
                  key={n.id}
                  role="button"
                  tabIndex={0}
                  className={`notif-dropdown-row ${!n.read ? "notif-dropdown-row--unread" : ""}`}
                  onClick={() => handleClick(n)}
                >
                  {n.actorProfilePicture ? (
                    <img
                      src={n.actorProfilePicture}
                      alt=""
                      className="notif-dropdown-row__avatar"
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpen(false)
                        navigate(`/profile/${n.actorUsername}`)
                      }}
                    />
                  ) : (
                    <div className="notif-dropdown-row__icon-fallback">
                      <Icon style={{ color }} size={14} />
                    </div>
                  )}
                  <div className="notif-dropdown-row__body">
                    <div
                      className={`notif-dropdown-row__message ${!n.read ? "notif-dropdown-row__message--unread" : ""}`}
                    >
                      {n.message}
                    </div>
                    <div className="notif-dropdown-row__time">
                      {formatRelativeTime(n.createdAt)}
                    </div>
                  </div>
                  {!n.read && <span className="notif-dropdown-row__dot" />}
                </div>
              )
            })}

            <Link
              to="/notifications"
              className="dropdown-panel__footer-link"
              onClick={() => setOpen(false)}
            >
              VEDI TUTTE
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

export default NotificationBell
