import { useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Spinner } from "react-bootstrap"
import { FaDownload, FaTrash } from "react-icons/fa"
import {
  useGetMyRoutesQuery,
  useDeleteRouteMutation,
  useSetImportableMutation,
} from "../features/routesMap/routesApi"
import { downloadGpx } from "../utils/gpx"
import "../pages/CSS/RoutesListPage.css"

function RoutesListPage() {
  const [page, setPage] = useState(0)
  const { data, isLoading, isFetching, isError } = useGetMyRoutesQuery({ page })
  const [deleteRoute] = useDeleteRouteMutation()
  const [setImportable] = useSetImportableMutation()
  const navigate = useNavigate()
  const [searchInput, setSearchInput] = useState("")
  const timerRef = useRef(null)

  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchInput(value)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setPage(0), 400)
  }

  const handleDelete = async (e, routeId) => {
    e.stopPropagation()
    try {
      await deleteRoute(routeId).unwrap()
    } catch (err) {
      console.error("Eliminazione fallita:", err.data?.message || err)
    }
  }

  const handleExport = (e, route) => {
    e.stopPropagation()
    downloadGpx(route)
  }

  const handleToggleImportable = (e, routeId, current) => {
    e.stopPropagation()
    setImportable({ routeId, value: !current })
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
        Impossibile caricare i percorsi.
      </div>
    )
  }

  const filtered = data?.content.filter((r) =>
    r.name.toLowerCase().includes(searchInput.toLowerCase()),
  )

  return (
    <div className="page">
      <div className="header-row routes-list-page__header">
        <div className="page-title" style={{ fontSize: 28 }}>
          PERCORSI
        </div>
        <Link to="/routes/new" className="btn-accent-sm">
          + NUOVO
        </Link>
      </div>

      <div className="routes-list-page__search">
        <input
          type="search"
          className="input input--compact"
          placeholder="Cerca percorso..."
          value={searchInput}
          onChange={handleSearchChange}
        />
      </div>

      {data.content.length === 0 ? (
        <div className="empty-hero">
          <p className="empty-hero__text">
            Non hai ancora creato nessun percorso.
          </p>
          <Link to="/routes/new" className="btn-primary empty-hero__cta">
            CREA IL PRIMO
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <p className="no-results-text">
          Nessun percorso corrisponde alla ricerca.
        </p>
      ) : (
        <div className="route-list" style={{ opacity: isFetching ? 0.6 : 1 }}>
          {filtered.map((route) => (
            <div
              key={route.id}
              className="card"
              style={{ padding: 16, cursor: "pointer" }}
              onClick={() => navigate(`/routes/${route.id}`)}
            >
              <div className="route-card__header">
                <div className="route-card__name">{route.name}</div>
                {route.importable && (
                  <span className="route-card__importable-badge">
                    IMPORTABILE
                  </span>
                )}
              </div>

              <div className="route-card__badges">
                <span className="meta-badge">
                  {(route.distanceMeters / 1000).toFixed(1).replace(".", ",")}{" "}
                  KM
                </span>
                <span className="meta-badge">
                  {Math.round(route.durationSeconds / 60)} MIN
                </span>
                <span className="meta-badge">
                  {route.waypoints.length} TAPPE
                </span>
                {route.avoidHighways && (
                  <span className="meta-badge">NO AUTOSTRADE</span>
                )}
                {route.avoidTolls && (
                  <span className="meta-badge">NO PEDAGGI</span>
                )}
              </div>

              <div className="route-card__actions">
                <button
                  type="button"
                  className="btn-outline-xs"
                  onClick={(e) => handleExport(e, route)}
                >
                  <FaDownload size={9} /> GPX
                </button>
                <button
                  type="button"
                  className="btn-danger-xs"
                  onClick={(e) => handleDelete(e, route.id)}
                >
                  <FaTrash size={9} /> ELIMINA
                </button>

                <label
                  className="importable-toggle"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={route.importable}
                    onChange={(e) =>
                      handleToggleImportable(e, route.id, route.importable)
                    }
                  />
                  IMPORTABILE
                </label>
              </div>
            </div>
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

export default RoutesListPage
