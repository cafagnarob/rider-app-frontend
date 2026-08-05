import { useState } from "react"
import { Card, Spinner, Button, Badge, Modal } from "react-bootstrap"
import { useParams, useNavigate } from "react-router-dom"
import { FaArrowLeft, FaTrash } from "react-icons/fa"
import {
  useGetRideByIdQuery,
  useDeleteRideMutation,
} from "../features/rides/ridesApi"
import RideMap from "../components/map/RideMap"
import { RIDE_TYPE_LABELS } from "../utils/constants"
import { formatDuration } from "../utils/geo"

function RideDetailPage() {
  const { rideId } = useParams()
  const navigate = useNavigate()
  const { data: ride, isLoading, isError } = useGetRideByIdQuery(rideId)
  const [deleteRide, { isLoading: isDeleting }] = useDeleteRideMutation()
  const [confirm, setConfirm] = useState(false)

  const handleDelete = async () => {
    try {
      await deleteRide(rideId).unwrap()
      navigate("/rides")
    } catch (err) {
      console.error("Eliminazione fallita:", err)
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
    return <div className="alert alert-danger">Giro non trovato.</div>

  const duration = ride.endedAt
    ? (new Date(ride.endedAt) - new Date(ride.startedAt)) / 1000
    : 0

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto" }}>
      <div className="d-flex align-items-center gap-3 mb-3">
        <Button variant="outline-light" size="sm" onClick={() => navigate(-1)}>
          <FaArrowLeft />
        </Button>
        <div className="flex-grow-1">
          <h4 className="mb-0">{ride.title || "Uscita senza titolo"}</h4>
          <small className="text-secondary">
            {new Date(ride.startedAt).toLocaleString("it-IT")}
          </small>
        </div>
        <Button
          variant="outline-danger"
          size="sm"
          onClick={() => setConfirm(true)}
        >
          <FaTrash />
        </Button>
      </div>

      <div className="mb-4">
        <RideMap points={ride.points} />
      </div>

      <Card className="bg-dark text-light border-secondary mb-4">
        <Card.Body>
          <div className="row text-center g-3">
            <div className="col-4">
              <div className="fs-4 fw-bold">
                {ride.distanceKm?.toFixed(1) ?? "—"}
              </div>
              <small className="text-secondary">km</small>
            </div>
            <div className="col-4">
              <div className="fs-4 fw-bold">
                {ride.avgSpeedKmH?.toFixed(0) ?? "—"}
              </div>
              <small className="text-secondary">km/h media</small>
            </div>
            <div className="col-4">
              <div className="fs-4 fw-bold">
                {ride.maxSpeedKmH?.toFixed(0) ?? "—"}
              </div>
              <small className="text-secondary">km/h max</small>
            </div>
            <div className="col-4">
              <div className="fs-5">{formatDuration(duration)}</div>
              <small className="text-secondary">durata</small>
            </div>
            <div className="col-4">
              <div className="fs-5">{ride.stopsCount}</div>
              <small className="text-secondary">soste</small>
            </div>
            <div className="col-4">
              <div className="fs-5">
                {formatDuration(ride.totalStopDurationSeconds)}
              </div>
              <small className="text-secondary">tempo fermo</small>
            </div>
          </div>

          <div className="d-flex gap-2 flex-wrap mt-3">
            {ride.type && (
              <Badge bg="secondary">
                {RIDE_TYPE_LABELS[ride.type] || ride.type}
              </Badge>
            )}
            {ride.vehicle && (
              <Badge bg="warning" text="dark">
                {ride.vehicle.nickname ||
                  `${ride.vehicle.brandName} ${ride.vehicle.modelName}`}
              </Badge>
            )}
            <Badge bg="secondary">{ride.points.length} punti GPS</Badge>
          </div>

          {ride.notes && <p className="mt-3 mb-0">{ride.notes}</p>}
        </Card.Body>
      </Card>

      <Modal
        show={confirm}
        onHide={() => setConfirm(false)}
        centered
        data-bs-theme="dark"
      >
        <Modal.Header
          closeButton
          className="bg-dark text-light border-secondary"
        >
          <Modal.Title className="fs-5">Eliminare il giro?</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark text-light">
          Il tracciato e le statistiche verranno persi definitivamente.
        </Modal.Body>
        <Modal.Footer className="bg-dark border-secondary">
          <Button variant="outline-light" onClick={() => setConfirm(false)}>
            Annulla
          </Button>
          <Button variant="danger" disabled={isDeleting} onClick={handleDelete}>
            {isDeleting ? "Eliminazione..." : "Elimina"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default RideDetailPage
