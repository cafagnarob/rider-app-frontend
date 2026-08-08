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
import { useState } from "react"
import { COLORS, FONTS, styles } from "../../../styles/theme"

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
        onClick={() => setOpen((v) => !v)}
        style={{ ...styles.iconButton, position: "relative" }}
      >
        <FaBell size={15} />
        {count > 0 && (
          <span
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              minWidth: 15,
              height: 15,
              borderRadius: 8,
              background: COLORS.accent,
              color: COLORS.onAccent,
              fontFamily: FONTS.mono,
              fontSize: 9,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 3px",
            }}
          >
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 49 }}
            onClick={() => setOpen(false)}
          />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              zIndex: 50,
              width: 320,
              maxHeight: 420,
              overflowY: "auto",
              ...styles.card,
              padding: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "13px 15px",
                borderBottom: `1px solid ${COLORS.borderSoft}`,
              }}
            >
              <span
                style={{
                  fontFamily: FONTS.heading,
                  fontWeight: 600,
                  fontSize: 15,
                }}
              >
                Notifiche
              </span>
              {count > 0 && (
                <button
                  type="button"
                  onClick={() => markAllAsRead()}
                  style={{
                    background: "none",
                    border: "none",
                    color: COLORS.accent,
                    fontFamily: FONTS.mono,
                    fontSize: 10,
                    cursor: "pointer",
                  }}
                >
                  SEGNA TUTTE
                </button>
              )}
            </div>

            {list?.content.length === 0 && (
              <p
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 13,
                  color: COLORS.textFaint,
                  textAlign: "center",
                  padding: "24px 0",
                }}
              >
                Nessuna notifica
              </p>
            )}

            {list?.content.map((n) => {
              const { Icon, color } =
                NOTIFICATION_ICONS[n.type] || NOTIFICATION_ICONS.SYSTEM
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleClick(n)}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    width: "100%",
                    textAlign: "left",
                    padding: "11px 15px",
                    background: n.read ? "transparent" : "rgba(255,122,47,.06)",
                    border: "none",
                    borderBottom: `1px solid ${COLORS.borderSoft}`,
                    cursor: "pointer",
                  }}
                >
                  {n.actorProfilePicture ? (
                    <img
                      src={n.actorProfilePicture}
                      alt=""
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        objectFit: "cover",
                        background: COLORS.surfaceRaised,
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: COLORS.cardAlt,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon style={{ color }} size={14} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: FONTS.body,
                        fontSize: 12.5,
                        fontWeight: n.read ? 400 : 600,
                        color: COLORS.text,
                        lineHeight: 1.35,
                      }}
                    >
                      {n.message}
                    </div>
                    <div
                      style={{
                        fontFamily: FONTS.mono,
                        fontSize: 9,
                        color: COLORS.textFaint,
                        marginTop: 3,
                      }}
                    >
                      {formatRelativeTime(n.createdAt)}
                    </div>
                  </div>
                  {!n.read && (
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: COLORS.accent,
                        flexShrink: 0,
                        marginTop: 5,
                      }}
                    />
                  )}
                </button>
              )
            })}

            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              style={{
                display: "block",
                textAlign: "center",
                padding: 11,
                fontFamily: FONTS.mono,
                fontSize: 10.5,
                color: COLORS.accent,
                textDecoration: "none",
              }}
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
