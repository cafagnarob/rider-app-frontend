import { Spinner } from "react-bootstrap"
import { Link } from "react-router-dom"
import {
  useGetMyInvitesQuery,
  useAcceptInviteMutation,
  useRejectInviteMutation,
} from "../features/events/invitesApi"
import { formatRelativeTime } from "../utils/dateFormat"
import "./MyInvitesPage.css"

function MyInvitesPage() {
  const { data: invites, isLoading, isError } = useGetMyInvitesQuery()
  const [acceptInvite, { isLoading: isAccepting }] = useAcceptInviteMutation()
  const [rejectInvite, { isLoading: isRejecting }] = useRejectInviteMutation()

  if (isLoading) {
    return (
      <div className="centered-spinner">
        <Spinner animation="border" style={{ color: "#FF7A2F" }} />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="empty-state" style={{ margin: 20 }}>
        Impossibile caricare gli inviti.
      </div>
    )
  }

  return (
    <div className="page">
      <div className="my-invites-page__title-block">
        <div className="page-title" style={{ fontSize: 26 }}>
          I MIEI INVITI
        </div>
      </div>

      {invites.length === 0 ? (
        <p className="empty-list-text">Non hai inviti in attesa.</p>
      ) : (
        <div className="invite-list">
          {invites.map((invite) => (
            <div key={invite.id} className="card" style={{ padding: 16 }}>
              <div className="invite-card__header">
                <Link
                  to={`/events/${invite.eventId}`}
                  className="invite-card__title-link"
                >
                  {invite.eventTitle}
                </Link>
                <span className="invite-badge">INVITO</span>
              </div>

              <p className="invite-card__received">
                RICEVUTO {formatRelativeTime(invite.createdAt).toUpperCase()}
              </p>

              <div className="invite-card__actions">
                <button
                  type="button"
                  className="btn-success"
                  disabled={isAccepting || isRejecting}
                  onClick={() => acceptInvite(invite.id)}
                >
                  ACCETTA
                </button>
                <button
                  type="button"
                  className="btn-danger-sm"
                  disabled={isAccepting || isRejecting}
                  onClick={() => rejectInvite(invite.id)}
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
