import {
  useGetPendingParticipantsQuery,
  useGetAcceptedParticipantsQuery,
  useApproveParticipationMutation,
  useRejectParticipationMutation,
} from "../participationApi"
import { useGetEventInvitesQuery } from "../invitesApi"
import { COLORS, FONTS, styles } from "../../../styles/theme"
import InvitePeoplePicker from "./InvitePeoplePicker"
import {
  useApproveAccessCodeRequestMutation,
  useGetAccessCodeRequestsQuery,
  useRejectAccessCodeRequestMutation,
} from "../eventsApi"

function OrganizerPanel({ eventId, visibility }) {
  const { data: pending } = useGetPendingParticipantsQuery(eventId)
  const { data: accepted } = useGetAcceptedParticipantsQuery(eventId)
  const [approve] = useApproveParticipationMutation()
  const [reject] = useRejectParticipationMutation()

  const { data: invites } = useGetEventInvitesQuery(eventId, {
    skip: visibility !== "INVITE_ONLY",
  })

  const { data: accessRequests } = useGetAccessCodeRequestsQuery(eventId, {
    skip: visibility !== "PRIVATE_CODE",
  })
  const [approveAccessCodeRequest] = useApproveAccessCodeRequestMutation()
  const [rejectAccessCodeRequest] = useRejectAccessCodeRequestMutation()

  return (
    <div style={{ ...styles.card, padding: 18, marginTop: 20 }}>
      <div style={{ ...styles.fieldLabel, marginBottom: 14 }}>
        GESTIONE PARTECIPANTI
      </div>

      {visibility === "INVITE_ONLY" && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ ...styles.fieldLabel, marginBottom: 9 }}>
            INVITA DAI TUOI CONTATTI
          </div>
          <InvitePeoplePicker eventId={eventId} existingInvites={invites} />
        </div>
      )}

      <div style={{ ...styles.fieldLabel, marginBottom: 9 }}>
        RICHIESTE IN ATTESA {pending ? `(${pending.length})` : ""}
      </div>
      {pending?.length === 0 && (
        <p
          style={{
            fontFamily: FONTS.body,
            fontSize: 13,
            color: COLORS.textFaint,
            margin: "0 0 16px",
          }}
        >
          Nessuna richiesta in attesa.
        </p>
      )}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          marginBottom: 18,
        }}
      >
        {pending?.map((p) => (
          <div
            key={p.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 12px",
              borderRadius: 12,
              background: COLORS.cardAlt,
              border: `1px solid ${COLORS.borderSoft}`,
            }}
          >
            <span style={{ fontFamily: FONTS.body, fontSize: 14 }}>
              {p.username}
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                type="button"
                onClick={() => approve({ eventId, participationId: p.id })}
                style={{
                  height: 32,
                  padding: "0 12px",
                  borderRadius: 9,
                  background: "#173323",
                  border: "1px solid rgba(52,199,89,.35)",
                  color: "#4ADE80",
                  fontFamily: FONTS.mono,
                  fontSize: 10,
                  cursor: "pointer",
                }}
              >
                ACCETTA
              </button>
              <button
                type="button"
                onClick={() => reject({ eventId, participationId: p.id })}
                style={{
                  height: 32,
                  padding: "0 12px",
                  borderRadius: 9,
                  background: COLORS.dangerBg,
                  border: `1px solid ${COLORS.dangerBorder}`,
                  color: COLORS.danger,
                  fontFamily: FONTS.mono,
                  fontSize: 10,
                  cursor: "pointer",
                }}
              >
                RIFIUTA
              </button>
            </div>
          </div>
        ))}
      </div>

      {visibility === "PRIVATE_CODE" && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ ...styles.fieldLabel, marginBottom: 9 }}>
            RICHIESTE CODICE{" "}
            {accessRequests ? `(${accessRequests.length})` : ""}
          </div>
          {accessRequests?.length === 0 && (
            <p
              style={{
                fontFamily: FONTS.body,
                fontSize: 13,
                color: COLORS.textFaint,
                margin: 0,
              }}
            >
              Nessuna richiesta di codice in attesa.
            </p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {accessRequests?.map((req) => (
              <div
                key={req.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 12px",
                  borderRadius: 12,
                  background: COLORS.cardAlt,
                  border: `1px solid ${COLORS.borderSoft}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <img
                    src={req.requesterProfilePicture}
                    alt={req.requesterUsername}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      objectFit: "cover",
                      background: COLORS.surfaceRaised,
                    }}
                  />
                  <span style={{ fontFamily: FONTS.body, fontSize: 14 }}>
                    {req.requesterUsername}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    type="button"
                    onClick={() =>
                      approveAccessCodeRequest({ eventId, requestId: req.id })
                    }
                    style={{
                      height: 32,
                      padding: "0 12px",
                      borderRadius: 9,
                      background: "#173323",
                      border: "1px solid rgba(52,199,89,.35)",
                      color: "#4ADE80",
                      fontFamily: FONTS.mono,
                      fontSize: 10,
                      cursor: "pointer",
                    }}
                  >
                    INVIA CODICE
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      rejectAccessCodeRequest({ eventId, requestId: req.id })
                    }
                    style={{
                      height: 32,
                      padding: "0 12px",
                      borderRadius: 9,
                      background: COLORS.dangerBg,
                      border: `1px solid ${COLORS.dangerBorder}`,
                      color: COLORS.danger,
                      fontFamily: FONTS.mono,
                      fontSize: 10,
                      cursor: "pointer",
                    }}
                  >
                    RIFIUTA
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          marginBottom: 18,
        }}
      >
        {pending?.map((p) => (
          <div
            key={p.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 12px",
              borderRadius: 12,
              background: COLORS.cardAlt,
              border: `1px solid ${COLORS.borderSoft}`,
            }}
          >
            <span style={{ fontFamily: FONTS.body, fontSize: 14 }}>
              {p.username}
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                type="button"
                onClick={() => approve({ eventId, participationId: p.id })}
                style={{
                  height: 32,
                  padding: "0 12px",
                  borderRadius: 9,
                  background: "#173323",
                  border: "1px solid rgba(52,199,89,.35)",
                  color: "#4ADE80",
                  fontFamily: FONTS.mono,
                  fontSize: 10,
                  cursor: "pointer",
                }}
              >
                ACCETTA
              </button>
              <button
                type="button"
                onClick={() => reject({ eventId, participationId: p.id })}
                style={{
                  height: 32,
                  padding: "0 12px",
                  borderRadius: 9,
                  background: COLORS.dangerBg,
                  border: `1px solid ${COLORS.dangerBorder}`,
                  color: COLORS.danger,
                  fontFamily: FONTS.mono,
                  fontSize: 10,
                  cursor: "pointer",
                }}
              >
                RIFIUTA
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ ...styles.fieldLabel, marginBottom: 9 }}>
        CONFERMATI {accepted ? `(${accepted.length})` : ""}
      </div>
      {accepted?.length === 0 ? (
        <p
          style={{
            fontFamily: FONTS.body,
            fontSize: 13,
            color: COLORS.textFaint,
            margin: 0,
          }}
        >
          Nessuno ha ancora confermato.
        </p>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {accepted?.map((p) => (
            <span
              key={p.id}
              style={{
                padding: "5px 10px",
                borderRadius: 9,
                background: COLORS.cardAlt,
                border: `1px solid ${COLORS.borderSoft}`,
                fontFamily: FONTS.mono,
                fontSize: 10,
                color: COLORS.textSecondary,
              }}
            >
              {p.username}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default OrganizerPanel
