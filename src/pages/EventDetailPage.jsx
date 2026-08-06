import { useEffect, useRef, useState } from "react"
import { Card, Button, Badge, Spinner, Form, Modal } from "react-bootstrap"
import { useParams, useNavigate } from "react-router-dom"
import {
  Map as MapLibreMap,
  NavigationControl,
  Marker,
  LngLatBounds,
} from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import {
  useGetEventByIdQuery,
  useChangeEventStatusMutation,
} from "../features/events/eventsApi"
import {
  useJoinEventMutation,
  useCancelMyParticipationMutation,
} from "../features/events/participationApi"
import OrganizerPanel from "../features/events/components/OrganizerPanel"
import { decodePolyline } from "../utils/polyline"
import { VISIBILITY_LABELS } from "../utils/constants"

function EventDetailPage() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const { data: event, isLoading, isError } = useGetEventByIdQuery(eventId)

  const [joinEvent, { isLoading: isJoining }] = useJoinEventMutation()
  const [cancelParticipation, { isLoading: isCancelling }] =
    useCancelMyParticipationMutation()
  const [changeStatus] = useChangeEventStatusMutation()

  const [accessCode, setAccessCode] = useState("")
  const [joinError, setJoinError] = useState("")
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [showCancelEventConfirm, setShowCancelEventConfirm] = useState(false)

  const containerRef = useRef(null)
  const mapRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current || !event?.route?.encodedPolyline) return

    const coordinates = decodePolyline(event.route.encodedPolyline)
    if (coordinates.length === 0) return

    const map = new MapLibreMap({
      container: containerRef.current,
      style: `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${import.meta.env.VITE_MAPTILER_KEY}`,
      center: coordinates[0],
      zoom: 11,
    })
    mapRef.current = map
    map.addControl(new NavigationControl(), "top-right")

    const draw = () => {
      map.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: { type: "LineString", coordinates },
        },
      })
      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#0d6efd", "line-width": 5 },
      })

      new Marker({ color: "#198754" }).setLngLat(coordinates[0]).addTo(map)
      new Marker({ color: "#dc3545" })
        .setLngLat(coordinates[coordinates.length - 1])
        .addTo(map)

      const bounds = coordinates.reduce(
        (b, c) => b.extend(c),
        new LngLatBounds(coordinates[0], coordinates[0]),
      )
      map.fitBounds(bounds, { padding: 40, maxZoom: 15 })
    }

    let initialized = false
    const tryInit = () => {
      if (initialized || !map.isStyleLoaded()) return
      initialized = true
      draw()
    }
    map.on("styledata", tryInit)
    map.on("load", tryInit)
    tryInit()

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [event?.route?.encodedPolyline])

  const handleJoin = async () => {
    setJoinError("")
    try {
      await joinEvent({ eventId, accessCode }).unwrap()
      setAccessCode("")
    } catch (err) {
      setJoinError(
        err.data?.message || "Impossibile partecipare a questo evento.",
      )
    }
  }

  const handleCancelParticipation = async () => {
    try {
      await cancelParticipation(eventId).unwrap()
      setShowCancelConfirm(false)
    } catch (err) {
      setJoinError(
        err.data?.message || "Impossibile annullare la partecipazione.",
      )
    }
  }

  const handleCancelEvent = async () => {
    try {
      await changeStatus({ eventId, status: "CANCELLED" }).unwrap()
      setShowCancelEventConfirm(false)
    } catch (err) {
      console.error(err)
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="light" />
      </div>
    )
  }

  if (isError)
    return (
      <div className="alert alert-danger">
        Evento non trovato o accesso negato.
      </div>
    )

  const isFull = event.currentParticipants >= event.maxParticipants
  const isCancelled = event.status === "CANCELLED"
  const isFinished = event.status === "FINISHED"

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto" }}>
      <div className="d-flex align-items-center gap-3 mb-3">
        <Button variant="outline-light" size="sm" onClick={() => navigate(-1)}>
          ← Indietro
        </Button>
        {event.organizer && event.status === "ACTIVE" && (
          <Button
            variant="outline-danger"
            size="sm"
            className="ms-auto"
            onClick={() => setShowCancelEventConfirm(true)}
          >
            Annulla evento
          </Button>
        )}
      </div>

      <div className="d-flex justify-content-between align-items-start mb-2">
        <h3 className="mb-0">{event.title}</h3>
        {isCancelled && <Badge bg="danger">Annullato</Badge>}
        {isFinished && <Badge bg="secondary">Concluso</Badge>}
      </div>

      <p className="text-secondary mb-3">
        Organizzato da <strong>{event.organizerUsername}</strong> ·{" "}
        {new Date(event.startDateTime).toLocaleDateString("it-IT", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>

      <p className="mb-3">{event.description}</p>

      <div className="d-flex gap-2 flex-wrap mb-4">
        <Badge bg="secondary">{VISIBILITY_LABELS[event.visibility]}</Badge>
        <Badge bg="secondary">
          {event.currentParticipants}/{event.maxParticipants} partecipanti
        </Badge>
        {event.route && (
          <Badge bg="secondary">
            {(event.route.distanceMeters / 1000).toFixed(1)} km
          </Badge>
        )}

        <div className="d-flex gap-2 flex-wrap mb-4">
          <Badge bg="secondary">{VISIBILITY_LABELS[event.visibility]}</Badge>
          <Badge bg="secondary">
            {event.currentParticipants}/{event.maxParticipants} partecipanti
          </Badge>
          {event.route && (
            <Badge bg="secondary">
              {(event.route.distanceMeters / 1000).toFixed(1)} km
            </Badge>
          )}
          {event.route?.googleMapsUrl && (
            <a
              href={event.route.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-primary btn-sm"
            >
              Apri in Google Maps
            </a>
          )}
        </div>
      </div>

      {event.route?.encodedPolyline && (
        <div
          ref={containerRef}
          style={{
            height: "360px",
            borderRadius: "0.5rem",
            overflow: "hidden",
          }}
          className="mb-4"
        />
      )}

      {/* --- partecipazione (solo se non sei l'organizzatore) --- */}
      {!event.organizer && event.status === "ACTIVE" && (
        <Card className="bg-dark text-light border-secondary mb-4">
          <Card.Body>
            {event.myParticipationStatus === "ACCEPTED" && (
              <div className="d-flex justify-content-between align-items-center">
                <Badge bg="success">Partecipazione confermata</Badge>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => setShowCancelConfirm(true)}
                >
                  Annulla partecipazione
                </Button>
              </div>
            )}

            {event.myParticipationStatus === "PENDING" && (
              <div className="d-flex justify-content-between align-items-center">
                <Badge bg="info">Richiesta in attesa di approvazione</Badge>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => setShowCancelConfirm(true)}
                >
                  Annulla richiesta
                </Button>
              </div>
            )}

            {(event.myParticipationStatus === "REJECTED" ||
              event.myParticipationStatus === "CANCELLED") && (
              <Badge bg="secondary">
                {event.myParticipationStatus === "REJECTED"
                  ? "Richiesta rifiutata"
                  : "Partecipazione annullata"}
              </Badge>
            )}

            {event.myParticipationStatus === null && (
              <>
                {event.visibility === "INVITE_ONLY" ? (
                  <p className="small text-secondary mb-0">
                    Questo evento richiede un invito da parte
                    dell'organizzatore.
                  </p>
                ) : isFull ? (
                  <p className="small text-secondary mb-0">
                    Numero massimo di partecipanti raggiunto.
                  </p>
                ) : (
                  <>
                    {event.visibility === "PRIVATE_CODE" && (
                      <Form.Group className="mb-2">
                        <Form.Label className="small">
                          Codice di accesso
                        </Form.Label>
                        <Form.Control
                          size="sm"
                          className="bg-transparent text-light"
                          value={accessCode}
                          onChange={(e) => setAccessCode(e.target.value)}
                        />
                      </Form.Group>
                    )}
                    {joinError && (
                      <div className="alert alert-danger py-2 small">
                        {joinError}
                      </div>
                    )}
                    <Button
                      className="rounded-pill px-4 fw-bold border-0"
                      style={{ backgroundColor: "#FFBE5D", color: "#000" }}
                      disabled={isJoining}
                      onClick={handleJoin}
                    >
                      {isJoining ? "Invio richiesta..." : "Partecipa"}
                    </Button>
                  </>
                )}
              </>
            )}
          </Card.Body>
        </Card>
      )}

      {/* --- pannello organizzatore --- */}
      {event.organizer && (
        <OrganizerPanel eventId={eventId} visibility={event.visibility} />
      )}

      {/* --- conferma annullamento partecipazione --- */}
      <Modal
        show={showCancelConfirm}
        onHide={() => setShowCancelConfirm(false)}
        centered
        data-bs-theme="dark"
      >
        <Modal.Header
          closeButton
          className="bg-dark text-light border-secondary"
        >
          <Modal.Title className="fs-5">
            Annullare la partecipazione?
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark text-light">
          Potrai richiedere di partecipare nuovamente solo se l'organizzatore te
          lo consente.
        </Modal.Body>
        <Modal.Footer className="bg-dark border-secondary">
          <Button
            variant="outline-light"
            onClick={() => setShowCancelConfirm(false)}
          >
            Torna indietro
          </Button>
          <Button
            variant="danger"
            disabled={isCancelling}
            onClick={handleCancelParticipation}
          >
            Conferma
          </Button>
        </Modal.Footer>
      </Modal>

      {/* --- conferma annullamento evento --- */}
      <Modal
        show={showCancelEventConfirm}
        onHide={() => setShowCancelEventConfirm(false)}
        centered
        data-bs-theme="dark"
      >
        <Modal.Header
          closeButton
          className="bg-dark text-light border-secondary"
        >
          <Modal.Title className="fs-5">Annullare l'evento?</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark text-light">
          Tutti i partecipanti verranno informati. L'operazione non è
          reversibile.
        </Modal.Body>
        <Modal.Footer className="bg-dark border-secondary">
          <Button
            variant="outline-light"
            onClick={() => setShowCancelEventConfirm(false)}
          >
            Torna indietro
          </Button>
          <Button variant="danger" onClick={handleCancelEvent}>
            Annulla evento
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default EventDetailPage
