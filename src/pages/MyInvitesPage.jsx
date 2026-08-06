import { Card, Button, Spinner, Badge } from "react-bootstrap"
import { Link } from "react-router-dom"
import {
  useGetMyInvitesQuery,
  useAcceptInviteMutation,
  useRejectInviteMutation,
} from "../features/events/invitesApi"
import { formatRelativeTime } from "../utils/dateFormat"

function MyInvitesPage() {
  const { data: invites, isLoading, isError } = useGetMyInvitesQuery()
  const [acceptInvite, { isLoading: isAccepting }] = useAcceptInviteMutation()
  const [rejectInvite, { isLoading: isRejecting }] = useRejectInviteMutation()

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="light" />
      </div>
    )
  }

  if (isError)
    return (
      <div className="alert alert-danger">Impossibile caricare gli inviti.</div>
    )

  return (
    <div style={{ maxWidth: "540px", margin: "0 auto" }}>
      <h2 className="mb-4">I miei inviti</h2>

      {invites.length === 0 ? (
        <p className="text-secondary text-center py-5">
          Non hai inviti in attesa.
        </p>
      ) : (
        <div className="d-flex flex-column gap-3">
          {invites.map((invite) => (
            <Card
              key={invite.id}
              className="bg-dark text-light border-secondary"
            >
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <Link
                    to={`/events/${invite.eventId}`}
                    className="text-decoration-none text-light fw-semibold"
                  >
                    {invite.eventTitle}
                  </Link>
                  <Badge bg="warning" text="dark">
                    Invito
                  </Badge>
                </div>
                <p className="text-secondary small mb-3">
                  Ricevuto {formatRelativeTime(invite.createdAt)}
                </p>
                <div className="d-flex gap-2">
                  <Button
                    size="sm"
                    variant="success"
                    disabled={isAccepting || isRejecting}
                    onClick={() => acceptInvite(invite.id)}
                  >
                    Accetta
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-danger"
                    disabled={isAccepting || isRejecting}
                    onClick={() => rejectInvite(invite.id)}
                  >
                    Rifiuta
                  </Button>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default MyInvitesPage
