import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Spinner } from "react-bootstrap"
import {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} from "../features/notification/notificationsApi"
import {
  buildNotificationLink,
  NOTIFICATION_ICONS,
} from "../utils/notifications"
import { formatRelativeTime } from "../utils/dateFormat"
import "../pages/CSS/NotificationsPage.css"

function NotificationsPage() {
  const [page, setPage] = useState(0)
  const navigate = useNavigate()

  const { data, isLoading, isFetching } = useGetNotificationsQuery({ page })
  const [markAsRead] = useMarkAsReadMutation()
  const [markAllAsRead] = useMarkAllAsReadMutation()

  const handleClick = (n) => {
    if (!n.read) markAsRead(n.id)
    const link = buildNotificationLink(
      n.referenceType,
      n.referenceId,
      n.type,
      n.actorUsername,
    )
    if (link) navigate(link)
  }

  if (isLoading) {
    return (
      <div className="centered-spinner">
        <Spinner animation="border" style={{ color: "#FF7A2F" }} />
      </div>
    )
  }

  return (
    <div className="page">
      <div className="header-row notifications-page__header">
        <div className="page-title" style={{ fontSize: 26 }}>
          NOTIFICHE
        </div>
        <button
          type="button"
          className="btn-secondary"
          style={{ height: 36, padding: "0 13px", fontSize: 10.5 }}
          onClick={() => markAllAsRead()}
        >
          SEGNA TUTTE
        </button>
      </div>

      {data?.content.length === 0 ? (
        <p className="empty-list-text">Non hai notifiche.</p>
      ) : (
        <div style={{ opacity: isFetching ? 0.6 : 1 }}>
          {data.content.map((n) => {
            const { Icon, color } =
              NOTIFICATION_ICONS[n.type] || NOTIFICATION_ICONS.SYSTEM
            const clickable = !!buildNotificationLink(
              n.referenceType,
              n.referenceId,
              n.type,
            )

            return (
              <div
                key={n.id}
                className={`notification-row ${clickable ? "notification-row--clickable" : ""} ${!n.read ? "notification-row--unread" : ""}`}
                onClick={() => handleClick(n)}
              >
                {n.actorProfilePicture ? (
                  <img
                    src={n.actorProfilePicture}
                    alt=""
                    className="notification-row__avatar"
                  />
                ) : (
                  <div className="notification-row__icon-fallback">
                    <Icon style={{ color }} size={17} />
                  </div>
                )}
                <div className="notification-row__body">
                  <p
                    className={`notification-row__message ${!n.read ? "notification-row__message--unread" : ""}`}
                  >
                    {n.message}
                  </p>
                  <span className="notification-row__time">
                    {formatRelativeTime(n.createdAt)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {data?.totalPages > 1 && (
        <div className="pagination-row">
          <button
            type="button"
            className="btn-secondary"
            style={{
              height: 40,
              padding: "0 16px",
              opacity: data.first ? 0.4 : 1,
            }}
            disabled={data.first || isFetching}
            onClick={() => setPage((p) => p - 1)}
          >
            PRECEDENTE
          </button>
          <span className="pagination-row__label">
            {data.number + 1} / {data.totalPages}
          </span>
          <button
            type="button"
            className="btn-secondary"
            style={{
              height: 40,
              padding: "0 16px",
              opacity: data.last ? 0.4 : 1,
            }}
            disabled={data.last || isFetching}
            onClick={() => setPage((p) => p + 1)}
          >
            SUCCESSIVA
          </button>
        </div>
      )}
    </div>
  )
}

export default NotificationsPage
