import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Spinner } from "react-bootstrap"
import { FaArrowLeft, FaTrash } from "react-icons/fa"
import {
  useGetRideByIdQuery,
  useDeleteRideMutation,
} from "../features/rides/ridesApi"
import RideMap from "../components/map/RideMap"
import RideCharts from "../features/rides/components/RideCharts"
import { formatDuration } from "../utils/geo"
import { RIDE_TYPE_LABELS } from "../utils/constants"
import "../pages/CSS/RideDetailPage.css"

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
      <div className="centered-spinner">
        <Spinner animation="border" style={{ color: "#FF7A2F" }} />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="empty-state" style={{ margin: 20 }}>
        Giro non trovato.
      </div>
    )
  }

  const duration = ride.endedAt
    ? (new Date(ride.endedAt) - new Date(ride.startedAt)) / 1000
    : 0

  return (
    <div className="page">
      <div className="icon-header ">
        <button type="button" className="btn-icon" onClick={() => navigate(-1)}>
          <FaArrowLeft />
        </button>
        <div className="ride-detail-page__title-block">
          <div className="ride-detail-page__title">
            {ride.title || "Uscita senza titolo"}
          </div>
          <div className="ride-detail-page__subtitle">
            {new Date(ride.startedAt).toLocaleString("it-IT")}
          </div>
        </div>
        <button
          type="button"
          className="btn-icon icon-btn--danger"
          style={{ flexShrink: 0 }}
          onClick={() => setConfirm(true)}
        >
          <FaTrash size={13} />
        </button>
      </div>

      <div className="ride-detail-page__hero">
        <div className="ride-detail-page__map-frame">
          <RideMap points={ride.points} />
        </div>

        <div className="card ride-detail-page__chart-card">
          <RideCharts points={ride.points} />
        </div>
      </div>

      <div className="px-20">
        <div
          className="stat-grid stat-grid--cols-3"
          style={{ marginBottom: 20 }}
        >
          <div className="stat-cell">
            <span className="stat-label">DISTANZA</span>
            <span className="stat-value">
              {ride.distanceKm != null
                ? ride.distanceKm.toFixed(1).replace(".", ",")
                : "—"}
            </span>
          </div>
          <div className="stat-cell">
            <span className="stat-label">MEDIA</span>
            <span className="stat-value">
              {ride.avgSpeedKmH != null ? ride.avgSpeedKmH.toFixed(0) : "—"}
            </span>
          </div>
          <div className="stat-cell">
            <span className="stat-label">MASSIMA</span>
            <span className="stat-value">
              {ride.maxSpeedKmH != null ? ride.maxSpeedKmH.toFixed(0) : "—"}
            </span>
          </div>
          <div className="stat-cell">
            <span className="stat-label">DURATA</span>
            <span className="stat-value" style={{ fontSize: 17 }}>
              {formatDuration(duration)}
            </span>
          </div>
          <div className="stat-cell">
            <span className="stat-label">SOSTE</span>
            <span className="stat-value">{ride.stopsCount}</span>
          </div>
          <div className="stat-cell">
            <span className="stat-label">TEMPO FERMO</span>
            <span className="stat-value" style={{ fontSize: 17 }}>
              {formatDuration(ride.totalStopDurationSeconds)}
            </span>
          </div>
        </div>

        <div
          className="ride-detail-page__badges"
          style={{ marginBottom: ride.notes ? 18 : 0 }}
        >
          {ride.type && (
            <span className="meta-badge">
              {RIDE_TYPE_LABELS[ride.type] || ride.type}
            </span>
          )}
          {ride.vehicle && (
            <span className="meta-badge meta-badge--accent">
              {ride.vehicle.nickname ||
                `${ride.vehicle.brandName} ${ride.vehicle.modelName}`}
            </span>
          )}
          <span className="meta-badge">{ride.points.length} PUNTI GPS</span>
        </div>

        {ride.notes && <p className="ride-detail-page__notes">{ride.notes}</p>}
      </div>

      {confirm && (
        <div className="modal-overlay" onClick={() => setConfirm(false)}>
          <div className="card modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">ELIMINARE IL GIRO?</div>
            <p className="modal-text">
              Il tracciato e le statistiche verranno persi definitivamente.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setConfirm(false)}
              >
                ANNULLA
              </button>
              <button
                type="button"
                className="btn-danger"
                disabled={isDeleting}
                onClick={handleDelete}
              >
                {isDeleting ? "..." : "ELIMINA"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RideDetailPage
