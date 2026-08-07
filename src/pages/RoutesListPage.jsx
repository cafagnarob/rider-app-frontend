import { useRef, useState } from "react"
import {
  useDeleteRouteMutation,
  useGetMyRoutesQuery,
  useSetImportableMutation,
} from "../features/routesMap/routesApi"
import { Link, useNavigate } from "react-router-dom"
import { Spinner } from "react-bootstrap"
import { downloadGpx } from "../utils/gpx"
import { COLORS, FONTS, styles } from "../styles/theme"
import { FaDownload, FaTrash } from "react-icons/fa"

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

  const filtered = data?.content.filter((r) =>
    r.name.toLowerCase().includes(searchInput.toLowerCase()),
  )

  const handleDelete = async (routeId) => {
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
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <Spinner animation="border" style={{ color: COLORS.accent }} />
      </div>
    )
  }

  if (isError) {
    return (
      <div style={{ ...styles.emptyState, margin: 20 }}>
        Impossibile caricare i percorsi.
      </div>
    )
  }

  return (
    <div style={{ ...styles.pageBg, paddingTop: 20, paddingBottom: 40 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 20px 16px",
        }}
      >
        <div style={{ ...styles.pageTitle, fontSize: 28 }}>PERCORSI</div>
        <Link
          to="/routes/new"
          style={{
            height: 40,
            padding: "0 15px",
            borderRadius: 12,
            background: COLORS.accent,
            border: "none",
            color: COLORS.onAccent,
            fontFamily: FONTS.heading,
            fontWeight: 700,
            fontSize: 15,
            letterSpacing: ".04em",
            display: "inline-flex",
            alignItems: "center",
            textDecoration: "none",
          }}
        >
          + NUOVO
        </Link>
      </div>

      <div style={{ padding: "0 20px 16px" }}>
        <input
          type="search"
          placeholder="Cerca percorso..."
          value={searchInput}
          onChange={handleSearchChange}
          style={{ ...styles.input, height: 44 }}
        />
      </div>

      {data.content.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <p
            style={{
              fontFamily: FONTS.body,
              fontSize: 13,
              color: COLORS.textSecondary,
              marginBottom: 22,
            }}
          >
            Non hai ancora creato nessun percorso.
          </p>
          <Link
            to="/routes/new"
            style={{
              ...styles.primaryButton,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 32px",
              textDecoration: "none",
            }}
          >
            CREA IL PRIMO
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <p
          style={{
            fontFamily: FONTS.body,
            fontSize: 13,
            color: COLORS.textFaint,
            textAlign: "center",
            padding: "40px 20px",
          }}
        >
          Nessun percorso corrisponde alla ricerca.
        </p>
      ) : (
        <div
          style={{
            padding: "0 20px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            opacity: isFetching ? 0.6 : 1,
          }}
        >
          {filtered.map((route) => (
            <div
              key={route.id}
              onClick={() => navigate(`/routes/${route.id}`)}
              style={{ ...styles.card, padding: 16, cursor: "pointer" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    fontFamily: FONTS.heading,
                    fontWeight: 700,
                    fontSize: 18,
                    lineHeight: 1.15,
                  }}
                >
                  {route.name}
                </div>
                {route.importable && (
                  <span
                    style={{
                      padding: "3px 8px",
                      borderRadius: 7,
                      background: COLORS.accentSoftBg,
                      border: `1px solid ${COLORS.accentSoftBorder}`,
                      fontFamily: FONTS.mono,
                      fontSize: 9,
                      color: COLORS.accent,
                      flexShrink: 0,
                      marginLeft: 8,
                    }}
                  >
                    IMPORTABILE
                  </span>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 6,
                  flexWrap: "wrap",
                  marginBottom: 14,
                }}
              >
                <span style={pillStyle}>
                  {(route.distanceMeters / 1000).toFixed(1).replace(".", ",")}{" "}
                  KM
                </span>
                <span style={pillStyle}>
                  {Math.round(route.durationSeconds / 60)} MIN
                </span>
                <span style={pillStyle}>{route.waypoints.length} TAPPE</span>
                {route.avoidHighways && (
                  <span style={pillStyle}>NO AUTOSTRADE</span>
                )}
                {route.avoidTolls && <span style={pillStyle}>NO PEDAGGI</span>}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  type="button"
                  onClick={(e) => handleExport(e, route)}
                  style={{
                    height: 32,
                    padding: "0 12px",
                    borderRadius: 9,
                    background: COLORS.card,
                    border: `1px solid ${COLORS.borderStrong}`,
                    color: COLORS.textSecondary,
                    fontFamily: FONTS.mono,
                    fontSize: 9.5,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <FaDownload size={9} /> GPX
                </button>

                <button
                  type="button"
                  onClick={(e) => handleDelete(e, route.id)}
                  style={{
                    height: 32,
                    padding: "0 12px",
                    borderRadius: 9,
                    background: COLORS.dangerBg,
                    border: `1px solid ${COLORS.dangerBorder}`,
                    color: COLORS.danger,
                    fontFamily: FONTS.mono,
                    fontSize: 9.5,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <FaTrash size={9} /> ELIMINA
                </button>

                <label
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    marginLeft: "auto",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontFamily: FONTS.mono,
                    fontSize: 9.5,
                    color: COLORS.textMuted,
                    cursor: "pointer",
                  }}
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
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 16,
            padding: "24px 20px",
          }}
        >
          <button
            type="button"
            disabled={data.first || isFetching}
            onClick={() => setPage((p) => p - 1)}
            style={{
              ...styles.secondaryButton,
              height: 40,
              padding: "0 16px",
              opacity: data.first ? 0.4 : 1,
            }}
          >
            PRECEDENTE
          </button>
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: 11,
              color: COLORS.textMuted,
            }}
          >
            {data.number + 1} / {data.totalPages}
          </span>
          <button
            type="button"
            disabled={data.last || isFetching}
            onClick={() => setPage((p) => p + 1)}
            style={{
              ...styles.secondaryButton,
              height: 40,
              padding: "0 16px",
              opacity: data.last ? 0.4 : 1,
            }}
          >
            SUCCESSIVA
          </button>
        </div>
      )}
    </div>
  )
}

const pillStyle = {
  padding: "4px 10px",
  borderRadius: 8,
  background: COLORS.cardAlt,
  border: `1px solid ${COLORS.borderSoft}`,
  fontFamily: FONTS.mono,
  fontSize: 9.5,
  color: COLORS.textSecondary,
}

export default RoutesListPage
