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
import { Spinner } from "react-bootstrap"
import { formatRelativeTime } from "../utils/dateFormat"
import { COLORS, FONTS, styles } from "../styles/theme"

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
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <Spinner animation="border" style={{ color: COLORS.accent }} />
      </div>
    )
  }

  return (
    <div style={{ ...styles.pageBg, paddingTop: 20, paddingBottom: 40 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 20px 18px",
        }}
      >
        <div style={{ ...styles.pageTitle, fontSize: 26 }}>NOTIFICHE</div>
        <button
          type="button"
          onClick={() => markAllAsRead()}
          style={{
            ...styles.secondaryButton,
            height: 36,
            padding: "0 13px",
            fontSize: 10.5,
          }}
        >
          SEGNA TUTTE
        </button>
      </div>

      {data?.content.length === 0 ? (
        <p
          style={{
            fontFamily: FONTS.body,
            fontSize: 13,
            color: COLORS.textFaint,
            textAlign: "center",
            padding: "60px 20px",
          }}
        >
          Non hai notifiche.
        </p>
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
                onClick={() => handleClick(n)}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 13,
                  padding: "14px 20px",
                  borderBottom: `1px solid ${COLORS.borderSoft}`,
                  cursor: clickable ? "pointer" : "default",
                  background: n.read ? "transparent" : "rgba(255,122,47,.05)",
                }}
              >
                {n.actorProfilePicture ? (
                  <img
                    src={n.actorProfilePicture}
                    alt=""
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      objectFit: "cover",
                      background: COLORS.surfaceRaised,
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background: COLORS.cardAlt,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon style={{ color }} size={17} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 14,
                      fontWeight: n.read ? 400 : 600,
                      color: COLORS.text,
                      margin: "0 0 4px",
                      lineHeight: 1.4,
                    }}
                  >
                    {n.message}
                  </p>
                  <span
                    style={{
                      fontFamily: FONTS.mono,
                      fontSize: 9.5,
                      color: COLORS.textMuted,
                    }}
                  >
                    {formatRelativeTime(n.createdAt)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {data?.totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 16,
            padding: "24px 20px",
          }}
        >
          <button
            type="button"
            disabled={data.first || isFetching}
            onClick={() => setPage((p) => p - 1)}
            style={{
              ...styles.secondaryButton,
              height: 40,
              padding: "0 16px",
              opacity: data.first ? 0.4 : 1,
            }}
          >
            PRECEDENTE
          </button>
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: 11,
              color: COLORS.textMuted,
            }}
          >
            {data.number + 1} / {data.totalPages}
          </span>
          <button
            type="button"
            disabled={data.last || isFetching}
            onClick={() => setPage((p) => p + 1)}
            style={{
              ...styles.secondaryButton,
              height: 40,
              padding: "0 16px",
              opacity: data.last ? 0.4 : 1,
            }}
          >
            SUCCESSIVA
          </button>
        </div>
      )}
    </div>
  )
}

export default NotificationsPage
