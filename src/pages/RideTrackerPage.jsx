import { useState } from "react"
import { Card, Button, Form, Spinner, Badge } from "react-bootstrap"
import { useSelector, useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import { useGetMyVehiclesQuery } from "../features/vehicles/vehiclesApi"
import {
  useStartRideMutation,
  useFinishRideMutation,
} from "../features/rides/ridesApi"
import { rideStarted, rideCleared } from "../features/rides/rideSlice"
import { startTracking, stopTracking } from "../features/rides/trackingService"
import { formatDuration, toLocalDateTimeString } from "../utils/geo"
import { RIDE_TYPE_LABELS } from "../utils/constants"

function RideTrackerPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const ride = useSelector((state) => state.ride)

  const { data: vehicles } = useGetMyVehiclesQuery()
  const [startRide, { isLoading: isStarting }] = useStartRideMutation()
  const [finishRide, { isLoading: isFinishing }] = useFinishRideMutation()

  const [form, setForm] = useState({ vehicleId: "", title: "", type: "TOUR" })
  const [notes, setNotes] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  const handleStart = async (e) => {
    e.preventDefault()
    setErrorMsg("")
    try {
      const created = await startRide({
        vehicleId: form.vehicleId || null,
        title: form.title || null,
        type: form.type,
      }).unwrap()

      dispatch(
        rideStarted({ rideId: created.id, startedAt: created.startedAt }),
      )
      startTracking(setErrorMsg)
    } catch (err) {
      setErrorMsg(err.data?.message || "Impossibile avviare il giro.")
    }
  }

  const handleFinish = async () => {
    setErrorMsg("")

    if (ride.points.length === 0) {
      setErrorMsg(
        "Nessun punto GPS registrato: non è possibile salvare il giro.",
      )
      return
    }

    stopTracking()

    const endedAt = new Date()
    const elapsedSec = (endedAt - new Date(ride.startedAt)) / 1000
    const movingSec = Math.max(1, elapsedSec - ride.totalStopDurationSeconds)
    const avgSpeed = ride.distanceKm / (movingSec / 3600)

    try {
      await finishRide({
        rideId: ride.rideId,
        endedAt: toLocalDateTimeString(endedAt),
        distanceKm: Number(ride.distanceKm.toFixed(3)),
        avgSpeedKmH: Number(avgSpeed.toFixed(2)),
        maxSpeedKmH: Number(ride.maxSpeedKmH.toFixed(2)),
        stopsCount: ride.stopsCount,
        totalStopDurationSeconds: Math.round(ride.totalStopDurationSeconds),
        notes: notes || null,
        points: ride.points,
      }).unwrap()

      const finishedId = ride.rideId
      dispatch(rideCleared())
      navigate(`/rides/${finishedId}`)
    } catch (err) {
      setErrorMsg(err.data?.message || "Errore nel salvataggio del giro.")
      startTracking(setErrorMsg)
    }
  }

  const handleDiscard = () => {
    stopTracking()
    dispatch(rideCleared())
  }

  // --- giro in corso ---
  if (ride.rideId) {
    const lastPoint = ride.points[ride.points.length - 1]
    const elapsed =
      lastPoint && ride.startedAt
        ? (new Date(lastPoint.recordedAt) - new Date(ride.startedAt)) / 1000
        : 0

    return (
      <div style={{ maxWidth: "540px", margin: "0 auto" }}>
        <Card className="bg-dark text-light border-warning mb-3">
          <Card.Body className="text-center">
            <Badge bg="danger" className="mb-3">
              ● Registrazione in corso
            </Badge>

            <div className="display-4 fw-bold mb-0">
              {ride.distanceKm.toFixed(2)}
            </div>
            <div className="text-secondary mb-4">km percorsi</div>

            <div className="row text-center">
              <div className="col-4">
                <div className="fs-5 fw-semibold">
                  {lastPoint ? lastPoint.speedKmh.toFixed(0) : "0"}
                </div>
                <small className="text-secondary">km/h attuali</small>
              </div>
              <div className="col-4">
                <div className="fs-5 fw-semibold">
                  {ride.maxSpeedKmH.toFixed(0)}
                </div>
                <small className="text-secondary">km/h max</small>
              </div>
              <div className="col-4">
                <div className="fs-5 fw-semibold">
                  {formatDuration(elapsed)}
                </div>
                <small className="text-secondary">durata</small>
              </div>
            </div>

            <div className="row text-center mt-3">
              <div className="col-6">
                <div className="fs-6">{ride.points.length}</div>
                <small className="text-secondary">punti GPS</small>
              </div>
              <div className="col-6">
                <div className="fs-6">{ride.stopsCount}</div>
                <small className="text-secondary">soste</small>
              </div>
            </div>
          </Card.Body>
        </Card>

        <Form.Group className="mb-3">
          <Form.Control
            as="textarea"
            rows={2}
            maxLength={1000}
            className="bg-transparent text-light"
            placeholder="Note sul giro (opzionale)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Form.Group>

        {errorMsg && <div className="alert alert-danger py-2">{errorMsg}</div>}

        <div className="d-grid gap-2">
          <Button
            variant="danger"
            size="lg"
            disabled={isFinishing}
            onClick={handleFinish}
            className="rounded-pill fw-bold"
          >
            {isFinishing ? (
              <Spinner size="sm" animation="border" />
            ) : (
              "Termina giro"
            )}
          </Button>
          <Button variant="outline-secondary" size="sm" onClick={handleDiscard}>
            Scarta senza salvare
          </Button>
        </div>
      </div>
    )
  }

  // --- nessun giro attivo ---
  return (
    <div style={{ maxWidth: "480px", margin: "0 auto" }}>
      <h2 className="mb-4">Registra un'uscita</h2>

      <Form onSubmit={handleStart}>
        <Form.Group className="mb-3">
          <Form.Label>Moto</Form.Label>
          <Form.Select
            className="bg-transparent text-light"
            value={form.vehicleId}
            onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
          >
            <option value="">Nessuna moto</option>
            {vehicles?.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nickname || `${v.model.brand.name} ${v.model.name}`}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Titolo</Form.Label>
          <Form.Control
            type="text"
            maxLength={100}
            className="bg-transparent text-light"
            placeholder="Giro al Passo dello Stelvio"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </Form.Group>

        <Form.Group className="mb-4">
          <Form.Label>Tipo</Form.Label>
          <Form.Select
            className="bg-transparent text-light"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            {Object.entries(RIDE_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        {errorMsg && <div className="alert alert-danger py-2">{errorMsg}</div>}

        <div className="d-grid">
          <Button
            type="submit"
            size="lg"
            disabled={isStarting}
            className="rounded-pill fw-bold border-0"
            style={{ backgroundColor: "#FFBE5D", color: "#000" }}
          >
            {isStarting ? "Avvio..." : "Inizia"}
          </Button>
        </div>
      </Form>
    </div>
  )
}

export default RideTrackerPage
