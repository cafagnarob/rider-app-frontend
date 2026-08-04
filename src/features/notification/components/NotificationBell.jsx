import { Dropdown, Badge, Button } from "react-bootstrap"
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
    )
    if (link) navigate(link)
  }

  const count = unread?.count || 0

  return (
    <Dropdown align="end">
      <Dropdown.Toggle
        variant="dark"
        id="notif-bell"
        className="position-relative border-0"
      >
        <FaBell />
        {count > 0 && (
          <Badge
            bg="danger"
            pill
            className="position-absolute top-0 start-100 translate-middle"
            style={{ fontSize: "0.6rem" }}
          >
            {count > 99 ? "99+" : count}
          </Badge>
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu
        style={{ width: "320px", maxHeight: "420px", overflowY: "auto" }}
      >
        <div className="d-flex justify-content-between align-items-center px-3 py-2">
          <span className="fw-semibold small">Notifiche</span>
          {count > 0 && (
            <Button
              variant="link"
              size="sm"
              className="p-0 text-decoration-none small"
              onClick={() => markAllAsRead()}
            >
              Segna tutte
            </Button>
          )}
        </div>
        <Dropdown.Divider className="my-1" />

        {list?.content.length === 0 && (
          <p className="text-secondary small text-center py-3 mb-0">
            Nessuna notifica
          </p>
        )}

        {list?.content.map((n) => {
          const { Icon, color } =
            NOTIFICATION_ICONS[n.type] || NOTIFICATION_ICONS.SYSTEM
          return (
            <Dropdown.Item
              key={n.id}
              onClick={() => handleClick(n)}
              className={`d-flex align-items-start gap-2 py-2 ${n.read ? "" : "fw-semibold"}`}
              style={{ whiteSpace: "normal" }}
            >
              <Icon style={{ color, marginTop: "3px", flexShrink: 0 }} />
              <div className="flex-grow-1">
                <div className="small">{n.message}</div>
                <div className="text-secondary" style={{ fontSize: "0.7rem" }}>
                  {formatRelativeTime(n.createdAt)}
                </div>
              </div>
              {!n.read && (
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: "#FFBE5D",
                    flexShrink: 0,
                    marginTop: "6px",
                  }}
                />
              )}
            </Dropdown.Item>
          )
        })}

        <Dropdown.Divider className="my-1" />
        <Dropdown.Item
          as={Link}
          to="/notifications"
          className="text-center small"
        >
          Vedi tutte
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  )
}

export default NotificationBell
