import { useState } from "react"
import { Link } from "react-router-dom"
import { Spinner } from "react-bootstrap"
import { useGetMyRidesQuery } from "../features/rides/ridesApi"
import NotificationBell from "../features/notification/components/NotificationBell"
import { RIDE_TYPE_LABELS } from "../utils/constants"
import "../pages/CSS/RidesHistoryPage.css"

function RidesHistoryPage() {
  const [page, setPage] = useState(0)
  const { data, isLoading, isFetching, isError } = useGetMyRidesQuery({ page })

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
        Impossibile caricare lo storico.
      </div>
    )
  }

  return (
    <div className="page">
      <div className="header-row rides-history-page__header">
        <div className="page-title" style={{ fontSize: 26 }}>
          I MIEI GIRI
        </div>
        <div className="header-actions">
          <NotificationBell />
          <Link
            to="/rides/new"
            className="btn-accent-sm"
            style={{ fontSize: 14 }}
          >
            + USCITA
          </Link>
        </div>
      </div>

      {data.content.length === 0 ? (
        <p className="empty-list-text">
          Non hai ancora registrato nessuna uscita.
        </p>
      ) : (
        <div className="ride-list" style={{ opacity: isFetching ? 0.6 : 1 }}>
          {data.content.map((ride) => (
            <Link
              key={ride.id}
              to={`/rides/${ride.id}`}
              className="ride-card-link"
            >
              <div className="card" style={{ padding: 16 }}>
                <div className="ride-card__top">
                  <div>
                    <div className="ride-card__title">
                      {ride.title || "Uscita senza titolo"}
                    </div>
                    <div className="ride-card__date">
                      {new Date(ride.startedAt).toLocaleDateString("it-IT", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                  {ride.inProgress && (
                    <span className="meta-badge meta-badge--danger">
                      IN CORSO
                    </span>
                  )}
                </div>

                <div className="ride-card__badges">
                  {ride.type && (
                    <span className="meta-badge">
                      {RIDE_TYPE_LABELS[ride.type] || ride.type}
                    </span>
                  )}
                  {ride.distanceKm != null && (
                    <span className="meta-badge">
                      {ride.distanceKm.toFixed(1).replace(".", ",")} KM
                    </span>
                  )}
                  {ride.avgSpeedKmH != null && (
                    <span className="meta-badge">
                      {ride.avgSpeedKmH.toFixed(0)} KM/H MEDIA
                    </span>
                  )}
                  {ride.vehicle && (
                    <span className="meta-badge meta-badge--accent">
                      {ride.vehicle.nickname ||
                        `${ride.vehicle.brandName} ${ride.vehicle.modelName}`}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {data.totalPages > 1 && (
        <div className="pagination-row">
          <button
            type="button"
            className="btn-secondary"
            style={{
              height: 40,
              padding: "0 16px",
              opacity: data.first ? 0.4 : 1,
            }}
            disabled={data.first || isFetching}
            onClick={() => setPage((p) => p - 1)}
          >
            PRECEDENTE
          </button>
          <span className="pagination-row__label">
            {data.number + 1} / {data.totalPages}
          </span>
          <button
            type="button"
            className="btn-secondary"
            style={{
              height: 40,
              padding: "0 16px",
              opacity: data.last ? 0.4 : 1,
            }}
            disabled={data.last || isFetching}
            onClick={() => setPage((p) => p + 1)}
          >
            SUCCESSIVA
          </button>
        </div>
      )}
    </div>
  )
}

export default RidesHistoryPage
