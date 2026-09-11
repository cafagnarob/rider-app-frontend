import {
  useGetPendingParticipantsQuery,
  useGetAcceptedParticipantsQuery,
  useApproveParticipationMutation,
  useRejectParticipationMutation,
  useRemoveParticipantMutation,
} from "../participationApi"
import { useGetEventInvitesQuery } from "../invitesApi"
import {
  useGetAccessCodeRequestsQuery,
  useApproveAccessCodeRequestMutation,
  useRejectAccessCodeRequestMutation,
} from "../eventsApi"
import InvitePeoplePicker from "./InvitePeoplePicker"
import Avatar from "../../../components/Avatar"
import { FaTimes } from "react-icons/fa"

function OrganizerPanel({ eventId, visibility }) {
  const { data: pending } = useGetPendingParticipantsQuery(eventId)
  const { data: accepted } = useGetAcceptedParticipantsQuery(eventId)
  const [approve] = useApproveParticipationMutation()
  const [reject] = useRejectParticipationMutation()
  const [removeParticipant] = useRemoveParticipantMutation()

  const { data: invites } = useGetEventInvitesQuery(eventId, {
    skip: visibility !== "INVITE_ONLY",
  })

  const { data: accessRequests } = useGetAccessCodeRequestsQuery(eventId, {
    skip: visibility !== "PRIVATE_CODE",
  })
  const [approveAccessCodeRequest] = useApproveAccessCodeRequestMutation()
  const [rejectAccessCodeRequest] = useRejectAccessCodeRequestMutation()

  return (
    <div className="card" style={{ padding: 18, marginTop: 20 }}>
      <div className="field-label" style={{ marginBottom: 14 }}>
        GESTIONE PARTECIPANTI
      </div>

      {visibility === "INVITE_ONLY" && (
        <div style={{ marginBottom: 18 }}>
          <div className="field-label" style={{ marginBottom: 9 }}>
            INVITA DAI TUOI CONTATTI
          </div>
          <InvitePeoplePicker eventId={eventId} existingInvites={invites} />
        </div>
      )}

      <div className="field-label" style={{ marginBottom: 9 }}>
        RICHIESTE IN ATTESA {pending ? `(${pending.length})` : ""}
      </div>
      {pending?.length === 0 && (
        <p className="request-section-empty">Nessuna richiesta in attesa.</p>
      )}
      <div className="request-list">
        {pending?.map((p) => (
          <div key={p.id} className="request-row">
            <span className="request-row__name">{p.username}</span>
            <div className="request-row__actions">
              <button
                type="button"
                className="btn-approve"
                onClick={() => approve({ eventId, participationId: p.id })}
              >
                ACCETTA
              </button>
              <button
                type="button"
                className="btn-reject"
                onClick={() => reject({ eventId, participationId: p.id })}
              >
                RIFIUTA
              </button>
            </div>
          </div>
        ))}
      </div>

      {visibility === "PRIVATE_CODE" && (
        <div style={{ marginBottom: 18 }}>
          <div className="field-label" style={{ marginBottom: 9 }}>
            RICHIESTE CODICE{" "}
            {accessRequests ? `(${accessRequests.length})` : ""}
          </div>
          {accessRequests?.length === 0 && (
            <p className="request-section-empty request-section-empty--tight">
              Nessuna richiesta di codice in attesa.
            </p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {accessRequests?.map((req) => (
              <div key={req.id} className="request-row">
                <div className="request-row__identity">
                  <Avatar
                    src={req.requesterProfilePicture}
                    alt={req.requesterUsername}
                    className="request-row__avatar"
                  />
                  <span className="request-row__name">
                    {req.requesterUsername}
                  </span>
                </div>
                <div className="request-row__actions">
                  <button
                    type="button"
                    className="btn-approve"
                    onClick={() =>
                      approveAccessCodeRequest({ eventId, requestId: req.id })
                    }
                  >
                    INVIA CODICE
                  </button>
                  <button
                    type="button"
                    className="btn-reject"
                    onClick={() =>
                      rejectAccessCodeRequest({ eventId, requestId: req.id })
                    }
                  >
                    RIFIUTA
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="field-label" style={{ marginBottom: 9 }}>
        CONFERMATI {accepted ? `(${accepted.length})` : ""}
      </div>
      {accepted?.length === 0 ? (
        <p className="request-section-empty request-section-empty--tight">
          Nessuno ha ancora confermato.
        </p>
      ) : (
        <div className="confirmed-pills">
          {accepted?.map((p) => (
            <span key={p.id} className="confirmed-pill">
              {p.username}
              <button
                type="button"
                className="confirmed-pill__remove"
                onClick={() => {
                  if (window.confirm(`Rimuovere ${p.username} dall'evento?`)) {
                    removeParticipant({ eventId, participationId: p.id })
                  }
                }}
              >
                <FaTimes size={9} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default OrganizerPanel
