import { useState } from "react"
import { Card, Spinner, Button, Badge } from "react-bootstrap"
import { Link } from "react-router-dom"
import { useGetMyRidesQuery } from "../features/rides/ridesApi"
import { RIDE_TYPE_LABELS } from "../utils/constants"

function RidesHistoryPage() {
  const [page, setPage] = useState(0)
  const { data, isLoading, isFetching, isError } = useGetMyRidesQuery({ page })

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="light" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="alert alert-danger">Impossibile caricare lo storico.</div>
    )
  }

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto" }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">I miei giri</h2>
        <Link to="/rides/new">
          <Button
            className="rounded-pill px-3 fw-bold border-0"
            style={{ backgroundColor: "#FFBE5D", color: "#000" }}
          >
            + Nuova uscita
          </Button>
        </Link>
      </div>

      {data.content.length === 0 ? (
        <p className="text-secondary text-center py-5">
          Non hai ancora registrato nessuna uscita.
        </p>
      ) : (
        <div
          className="d-flex flex-column gap-3"
          style={{ opacity: isFetching ? 0.6 : 1 }}
        >
          {data.content.map((ride) => (
            <Link
              key={ride.id}
              to={`/rides/${ride.id}`}
              className="text-decoration-none"
            >
              <Card className="bg-dark text-light border-secondary">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <Card.Title className="fs-6 mb-1">
                        {ride.title || "Uscita senza titolo"}
                      </Card.Title>
                      <small className="text-secondary">
                        {new Date(ride.startedAt).toLocaleDateString("it-IT", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </small>
                    </div>
                    {ride.inProgress && <Badge bg="danger">In corso</Badge>}
                  </div>

                  <div className="d-flex gap-2 flex-wrap">
                    {ride.type && (
                      <Badge bg="secondary">
                        {RIDE_TYPE_LABELS[ride.type] || ride.type}
                      </Badge>
                    )}
                    {ride.distanceKm != null && (
                      <Badge bg="secondary">
                        {ride.distanceKm.toFixed(1)} km
                      </Badge>
                    )}
                    {ride.avgSpeedKmH != null && (
                      <Badge bg="secondary">
                        {ride.avgSpeedKmH.toFixed(0)} km/h media
                      </Badge>
                    )}
                    {ride.vehicle && (
                      <Badge bg="warning" text="dark">
                        {ride.vehicle.nickname ||
                          `${ride.vehicle.brandName} ${ride.vehicle.modelName}`}
                      </Badge>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {data.totalPages > 1 && (
        <div className="d-flex justify-content-center align-items-center gap-3 mt-4">
          <Button
            variant="outline-light"
            size="sm"
            disabled={data.first || isFetching}
            onClick={() => setPage((p) => p - 1)}
          >
            Precedente
          </Button>
          <span className="text-secondary">
            {data.number + 1} / {data.totalPages}
          </span>
          <Button
            variant="outline-light"
            size="sm"
            disabled={data.last || isFetching}
            onClick={() => setPage((p) => p + 1)}
          >
            Successiva
          </Button>
        </div>
      )}
    </div>
  )
}

export default RidesHistoryPage
