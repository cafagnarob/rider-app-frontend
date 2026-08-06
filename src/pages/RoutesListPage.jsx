import { useState } from "react"
import {
  useDeleteRouteMutation,
  useGetMyRoutesQuery,
  useSetImportableMutation,
} from "../features/routesMap/routesApi"
import { Link, useNavigate } from "react-router-dom"
import { Badge, Button, Card, Form, Spinner } from "react-bootstrap"

function RoutesListPage() {
  const [page, setPage] = useState(0)
  const { data, isLoading, isFetching, isError } = useGetMyRoutesQuery({ page })
  const [deleteRoute] = useDeleteRouteMutation()
  const [setImportable] = useSetImportableMutation()
  const navigate = useNavigate()

  const handleDelete = async (routeId) => {
    try {
      await deleteRoute(routeId).unwrap()
    } catch (err) {
      console.error("Eliminazione fallita:", err.data?.message || err)
    }
  }

  const handleToggleImportable = (routeId, current) => {
    setImportable({ routeId, value: !current })
  }

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="light" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="alert alert-danger">Impossibile caricare i percorsi.</div>
    )
  }

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto" }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">I miei percorsi</h2>
        <Link to="/routes/new">
          <Button
            className="rounded-pill px-3 fw-bold border-0"
            style={{ backgroundColor: "#FFBE5D", color: "#000" }}
          >
            + Nuovo percorso
          </Button>
        </Link>
      </div>

      {data.content.length === 0 ? (
        <div className="text-center py-5">
          <p className="text-secondary mb-3">
            Non hai ancora creato nessun percorso.
          </p>
          <Link to="/routes/new">
            <Button variant="outline-light">Crea il primo</Button>
          </Link>
        </div>
      ) : (
        <div
          className="d-flex flex-column gap-3"
          style={{ opacity: isFetching ? 0.6 : 1 }}
        >
          {data.content.map((route) => (
            <Card
              key={route.id}
              className="bg-dark text-light border-secondary"
            >
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <Card.Title
                    className="fs-6 mb-0"
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate(`/routes/${route.id}`)}
                  >
                    {route.name}
                  </Card.Title>
                  {route.importable && <Badge bg="success">Importabile</Badge>}
                </div>

                <div className="d-flex gap-2 flex-wrap mb-3">
                  <Badge bg="secondary">
                    {(route.distanceMeters / 1000).toFixed(1)} km
                  </Badge>
                  <Badge bg="secondary">
                    {Math.round(route.durationSeconds / 60)} min
                  </Badge>
                  <Badge bg="secondary">{route.waypoints.length} tappe</Badge>
                  {route.avoidHighways && (
                    <Badge bg="secondary">No autostrade</Badge>
                  )}
                  {route.avoidTolls && <Badge bg="secondary">No pedaggi</Badge>}
                </div>

                <div className="d-flex gap-2 flex-wrap align-items-center">
                  <Button
                    variant="outline-light"
                    size="sm"
                    onClick={() => navigate(`/routes/${route.id}`)}
                  >
                    Visualizza
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleDelete(route.id)}
                  >
                    Elimina
                  </Button>
                  {route.googleMapsUrl && (
                    <Button
                      variant="outline-primary"
                      size="sm"
                      href={route.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Apri in Google Maps
                    </Button>
                  )}
                  <Form.Check
                    type="switch"
                    id={`importable-${route.id}`}
                    label="Rendi importabile"
                    className="small ms-auto"
                    checked={route.importable}
                    onChange={() =>
                      handleToggleImportable(route.id, route.importable)
                    }
                  />
                </div>
              </Card.Body>
            </Card>
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

export default RoutesListPage
