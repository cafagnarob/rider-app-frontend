import { Spinner } from "react-bootstrap"
import { Link } from "react-router-dom"
import {
  useGetMyInvitesQuery,
  useAcceptInviteMutation,
  useRejectInviteMutation,
} from "../features/events/invitesApi"
import { formatRelativeTime } from "../utils/dateFormat"
import { COLORS, FONTS, styles } from "../styles/theme"

function MyInvitesPage() {
  const { data: invites, isLoading, isError } = useGetMyInvitesQuery()
  const [acceptInvite, { isLoading: isAccepting }] = useAcceptInviteMutation()
  const [rejectInvite, { isLoading: isRejecting }] = useRejectInviteMutation()

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <Spinner animation="border" style={{ color: COLORS.accent }} />
      </div>
    )
  }

  if (isError)
    return (
      <div style={{ ...styles.emptyState, margin: 20 }}>
        Impossibile caricare gli inviti.
      </div>
    )

  return (
    <div style={{ ...styles.pageBg, paddingTop: 20, paddingBottom: 40 }}>
      <div style={{ padding: "0 20px 18px" }}>
        <div style={{ ...styles.pageTitle, fontSize: 26 }}>I MIEI INVITI</div>
      </div>

      {invites.length === 0 ? (
        <p
          style={{
            fontFamily: FONTS.body,
            fontSize: 13,
            color: COLORS.textFaint,
            textAlign: "center",
            padding: "60px 20px",
          }}
        >
          Non hai inviti in attesa.
        </p>
      ) : (
        <div
          style={{
            padding: "0 20px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {invites.map((invite) => (
            <div key={invite.id} style={{ ...styles.card, padding: 16 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 6,
                }}
              >
                <Link
                  to={`/events/${invite.eventId}`}
                  style={{
                    fontFamily: FONTS.heading,
                    fontWeight: 700,
                    fontSize: 17,
                    color: COLORS.text,
                    textDecoration: "none",
                  }}
                >
                  {invite.eventTitle}
                </Link>
                <span
                  style={{
                    padding: "3px 9px",
                    borderRadius: 7,
                    background: COLORS.accentSoftBg,
                    border: `1px solid ${COLORS.accentSoftBorder}`,
                    fontFamily: FONTS.mono,
                    fontSize: 9,
                    color: COLORS.accent,
                    flexShrink: 0,
                  }}
                >
                  INVITO
                </span>
              </div>
              <p
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 10,
                  color: COLORS.textMuted,
                  marginBottom: 14,
                }}
              >
                RICEVUTO {formatRelativeTime(invite.createdAt).toUpperCase()}
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  disabled={isAccepting || isRejecting}
                  onClick={() => acceptInvite(invite.id)}
                  style={{
                    height: 36,
                    padding: "0 15px",
                    borderRadius: 11,
                    background: "#173323",
                    border: "1px solid rgba(52,199,89,.35)",
                    color: "#4ADE80",
                    fontFamily: FONTS.mono,
                    fontSize: 10.5,
                    cursor: "pointer",
                  }}
                >
                  ACCETTA
                </button>
                <button
                  type="button"
                  disabled={isAccepting || isRejecting}
                  onClick={() => rejectInvite(invite.id)}
                  style={{
                    height: 36,
                    padding: "0 15px",
                    borderRadius: 11,
                    background: COLORS.dangerBg,
                    border: `1px solid ${COLORS.dangerBorder}`,
                    color: COLORS.danger,
                    fontFamily: FONTS.mono,
                    fontSize: 10.5,
                    cursor: "pointer",
                  }}
                >
                  RIFIUTA
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MyInvitesPage
