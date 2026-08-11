import { useEffect, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import { Spinner } from "react-bootstrap"
import { useGetMyVehiclesQuery } from "../features/vehicles/vehiclesApi"
import {
  useStartRideMutation,
  useFinishRideMutation,
  useDeleteRideMutation,
} from "../features/rides/ridesApi"
import { rideStarted, rideCleared } from "../features/rides/rideSlice"
import { startTracking, stopTracking } from "../features/rides/trackingService"
import { formatDuration, toLocalDateTimeString } from "../utils/geo"
import { RIDE_TYPE_LABELS } from "../utils/constants"
import "../pages/CSS/RideTrackerPage.css"

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

  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    if (!ride.rideId) return
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [ride.rideId])

  const [deleteRide, { isLoading: isDiscarding }] = useDeleteRideMutation()

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

  const handleDiscard = async () => {
    stopTracking()
    try {
      await deleteRide(ride.rideId).unwrap()
    } catch (err) {
      console.error("Impossibile eliminare il giro scartato sul server:", err)
    } finally {
      dispatch(rideCleared())
    }
  }

  if (ride.rideId) {
    const lastPoint = ride.points[ride.points.length - 1]
    const elapsed = ride.startedAt
      ? Math.max(0, (now - new Date(ride.startedAt)) / 1000)
      : 0

    return (
      <div className="page">
        <div className="px-20">
          <div className="card tracker-card">
            <span className="tracker-badge">● REGISTRAZIONE IN CORSO</span>

            <div className="tracker-hero-value">
              {ride.distanceKm.toFixed(2).replace(".", ",")}
            </div>
            <div className="tracker-hero-label">KM PERCORSI</div>

            <div className="tracker-stat-row">
              <div>
                <div className="tracker-stat-value">
                  {lastPoint ? lastPoint.speedKmh.toFixed(0) : "0"}
                </div>
                <div className="tracker-stat-label">KM/H ATTUALI</div>
              </div>
              <div>
                <div className="tracker-stat-value">
                  {ride.maxSpeedKmH.toFixed(0)}
                </div>
                <div className="tracker-stat-label">KM/H MAX</div>
              </div>
              <div>
                <div className="tracker-stat-value">
                  {formatDuration(elapsed)}
                </div>
                <div className="tracker-stat-label">DURATA</div>
              </div>
            </div>

            <div className="tracker-stat-row tracker-stat-row--divider">
              <div>
                <div className="tracker-stat-value tracker-stat-value--sm">
                  {ride.points.length}
                </div>
                <div className="tracker-stat-label">PUNTI GPS</div>
              </div>
              <div>
                <div className="tracker-stat-value tracker-stat-value--sm">
                  {ride.stopsCount}
                </div>
                <div className="tracker-stat-label">SOSTE</div>
              </div>
            </div>
          </div>

          <textarea
            className="textarea ride-tracker-page__notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder="Note sul giro (opzionale)"
          />

          {errorMsg && <div className="error-text mb-16">{errorMsg}</div>}

          <button
            type="button"
            className="btn-danger-block"
            disabled={isFinishing}
            onClick={handleFinish}
          >
            {isFinishing ? (
              <Spinner size="sm" animation="border" />
            ) : (
              "TERMINA GIRO"
            )}
          </button>
          <button
            type="button"
            className="btn-text-block"
            disabled={isDiscarding}
            style={{ opacity: isDiscarding ? 0.5 : 1 }}
            onClick={handleDiscard}
          >
            {isDiscarding ? "ELIMINAZIONE..." : "SCARTA SENZA SALVARE"}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="px-20">
        <div className="page-title mb-20">REGISTRA UN'USCITA</div>

        <form className="form-stack" onSubmit={handleStart}>
          <div>
            <div className="field-label form-group__label">MOTO</div>
            <select
              className="select"
              value={form.vehicleId}
              onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
            >
              <option value="">Nessuna moto</option>
              {vehicles?.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nickname || `${v.model.brand.name} ${v.model.name}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="field-label form-group__label">TITOLO</div>
            <input
              type="text"
              className="input"
              maxLength={100}
              placeholder="Giro al Passo dello Stelvio"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div>
            <div className="field-label form-group__label">TIPO</div>
            <select
              className="select"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              {Object.entries(RIDE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {errorMsg && <div className="error-text">{errorMsg}</div>}

          <button
            type="submit"
            className="btn-primary"
            disabled={isStarting}
            style={{ opacity: isStarting ? 0.6 : 1 }}
          >
            {isStarting ? "..." : "INIZIA"}
          </button>
        </form>
      </div>
    </div>
  )
}

export default RideTrackerPage
