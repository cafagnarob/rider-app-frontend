import { useState } from "react"
import { Card, Button, ListGroup, Spinner, Form } from "react-bootstrap"
import {
  useGetPendingParticipantsQuery,
  useGetAcceptedParticipantsQuery,
  useApproveParticipationMutation,
  useRejectParticipationMutation,
} from "../participationApi"
import { useInviteUserMutation } from "../invitesApi"

function OrganizerPanel({ eventId, visibility }) {
  const { data: pending, isLoading: isLoadingPending } =
    useGetPendingParticipantsQuery(eventId)
  const { data: accepted } = useGetAcceptedParticipantsQuery(eventId)
  const [approve] = useApproveParticipationMutation()
  const [reject] = useRejectParticipationMutation()
  const [inviteUser, { isLoading: isInviting }] = useInviteUserMutation()

  const [username, setUsername] = useState("")
  const [inviteMsg, setInviteMsg] = useState("")

  const handleInvite = async (e) => {
    e.preventDefault()
    setInviteMsg("")
    try {
      await inviteUser({ eventId, username }).unwrap()
      setInviteMsg(`Invito inviato a ${username}.`)
      setUsername("")
    } catch (err) {
      setInviteMsg(err.data?.message || "Impossibile inviare l'invito.")
    }
  }

  return (
    <Card className="bg-dark text-light border-secondary mb-4">
      <Card.Body>
        <Card.Title className="fs-6 mb-3">Gestione partecipanti</Card.Title>

        {visibility === "INVITE_ONLY" && (
          <Form onSubmit={handleInvite} className="mb-3">
            <Form.Label className="small">Invita un utente</Form.Label>
            <div className="d-flex gap-2">
              <Form.Control
                size="sm"
                className="bg-transparent text-light"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <Button
                type="submit"
                size="sm"
                variant="outline-warning"
                disabled={isInviting}
              >
                Invita
              </Button>
            </div>
            {inviteMsg && (
              <div className="small text-secondary mt-1">{inviteMsg}</div>
            )}
          </Form>
        )}

        <p className="small text-secondary mb-2">
          Richieste in attesa {pending ? `(${pending.length})` : ""}
        </p>
        {isLoadingPending ? (
          <Spinner size="sm" animation="border" variant="light" />
        ) : pending?.length === 0 ? (
          <p className="small text-secondary">Nessuna richiesta in attesa.</p>
        ) : (
          <ListGroup className="mb-3">
            {pending?.map((p) => (
              <ListGroup.Item
                key={p.id}
                className="bg-dark text-light border-secondary d-flex justify-content-between align-items-center py-2"
              >
                <span className="small">{p.username}</span>
                <div className="d-flex gap-2">
                  <Button
                    size="sm"
                    variant="outline-success"
                    onClick={() => approve({ eventId, participationId: p.id })}
                  >
                    Accetta
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-danger"
                    onClick={() => reject({ eventId, participationId: p.id })}
                  >
                    Rifiuta
                  </Button>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}

        <p className="small text-secondary mb-2">
          Partecipanti confermati {accepted ? `(${accepted.length})` : ""}
        </p>
        {accepted?.length === 0 ? (
          <p className="small text-secondary mb-0">
            Nessuno ha ancora confermato.
          </p>
        ) : (
          <div className="d-flex flex-wrap gap-2">
            {accepted?.map((p) => (
              <span key={p.id} className="badge bg-secondary">
                {p.username}
              </span>
            ))}
          </div>
        )}
      </Card.Body>
    </Card>
  )
}

export default OrganizerPanel
