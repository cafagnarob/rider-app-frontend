import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  useGetNotificationsQuery,
  useMarkAllAsReadMutation,
  useMarkAsReadMutation,
} from "../features/notification/notificationsApi"
import {
  buildNotificationLink,
  NOTIFICATION_ICONS,
} from "../utils/notifications"
import { Button, Spinner } from "react-bootstrap"
import { formatRelativeTime } from "../utils/dateFormat"

function NotificationsPage() {
  const [page, setPage] = useState(0)
  const navigate = useNavigate()

  const { data, isLoading, isFetching } = useGetNotificationsQuery({ page })
  const [markAsRead] = useMarkAsReadMutation()
  const [markAllAsRead] = useMarkAllAsReadMutation()

  const handleClick = (n) => {
    if (!n.read) markAsRead(n.id)
    const link = buildNotificationLink(n.referenceType, n.referenceId)
    if (link) navigate(link)
  }

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="light" />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto" }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Notifiche</h2>
        <Button
          variant="outline-light"
          size="sm"
          onClick={() => markAllAsRead()}
        >
          Segna tutte come lette
        </Button>
      </div>

      {data?.content.length === 0 ? (
        <p className="text-secondary text-center py-5">Non hai notifiche.</p>
      ) : (
        <div
          className="d-flex flex-column"
          style={{ opacity: isFetching ? 0.6 : 1 }}
        >
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
                onClick={() => handleClick(n)}
                className="d-flex align-items-start gap-3 p-3 border-bottom border-secondary"
                style={{
                  cursor: clickable ? "pointer" : "default",
                  backgroundColor: n.read
                    ? "transparent"
                    : "rgba(255,190,93,0.08)",
                }}
              >
                <Icon style={{ color, fontSize: "1.2rem", marginTop: "2px" }} />
                <div className="flex-grow-1">
                  <p className={`mb-1 ${n.read ? "" : "fw-semibold"}`}>
                    {n.message}
                  </p>
                  <small className="text-secondary">
                    {formatRelativeTime(n.createdAt)}
                  </small>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {data?.totalPages > 1 && (
        <div className="d-flex justify-content-center align-items-center gap-3 mt-4">
          <Button
            variant="outline-light"
            size="sm"
            disabled={data.first || isFetching}
            onClick={() => setPage((p) => p - 1)}
          >
            Precedente
          </Button>
          <span className="text-secondary">
            {data.number + 1} / {data.totalPages}
          </span>
          <Button
            variant="outline-light"
            size="sm"
            disabled={data.last || isFetching}
            onClick={() => setPage((p) => p + 1)}
          >
            Successiva
          </Button>
        </div>
      )}
    </div>
  )
}

export default NotificationsPage
