import { useEffect, useMemo, useRef, useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { Spinner } from "react-bootstrap"
import {
  Map as MapLibreMap,
  Marker,
  LngLatBounds,
  FullscreenControl,
} from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import {
  FaArrowLeft,
  FaCamera,
  FaDownload,
  FaEdit,
  FaTimes,
} from "react-icons/fa"
import {
  useGetRouteByIdQuery,
  useUpdateWaypointImageMutation,
} from "../features/routesMap/routesApi"
import { decodePolyline } from "../utils/polyline"
import { downloadGpx } from "../utils/gpx"
import { MAP_STYLE_URL } from "../utils/mapStyle"
import { COLORS } from "../styles/theme"
import "../pages/CSS/RouteDetailPage.css"

function haversineKm([lng1, lat1], [lng2, lat2]) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

const isValidCoordinate = ([lng, lat]) =>
  Number.isFinite(lng) &&
  Number.isFinite(lat) &&
  lng >= -180 &&
  lng <= 180 &&
  lat >= -90 &&
  lat <= 90

function RouteDetailPage() {
  const { routeId } = useParams()
  const navigate = useNavigate()
  const { data: route, isLoading, isError } = useGetRouteByIdQuery(routeId)

  const containerRef = useRef(null)
  const mapRef = useRef(null)

  const [updateWaypointImage] = useUpdateWaypointImageMutation()

  const handleWaypointImageChange = async (waypointId, file) => {
    if (!file) return
    try {
      await updateWaypointImage({ routeId, waypointId, image: file }).unwrap()
    } catch (err) {
      console.error(err)
    }
  }

  const [selectedWaypointId, setSelectedWaypointId] = useState(null)

  const routeCoordinates = route ? decodePolyline(route.encodedPolyline) : []
  const mapError =
    !route ||
    routeCoordinates.length === 0 ||
    !routeCoordinates.every(isValidCoordinate)

  useEffect(() => {
    if (mapError) {
      if (route)
        console.warn(
          "Percorso con coordinate non valide, mappa non disegnata:",
          route.id,
        )
      return
    }
    if (!containerRef.current || !route) return

    const map = new MapLibreMap({
      container: containerRef.current,
      style: MAP_STYLE_URL,
      center: routeCoordinates[0],
      zoom: 11,
    })
    mapRef.current = map

    map.addControl(new FullscreenControl(), "top-right")

    const draw = () => {
      map.resize()

      map.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: { type: "LineString", coordinates: routeCoordinates },
        },
      })
      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": COLORS.accent,
          "line-width": 4,
          "line-opacity": 0.85,
        },
      })

      const validWaypoints = (route.waypoints || []).filter((wp) =>
        isValidCoordinate([wp.longitude, wp.latitude]),
      )
      const lastIndex = validWaypoints.length - 1

      validWaypoints.forEach((wp, index) => {
        const isStart = index === 0
        const isEnd = index === lastIndex && lastIndex > 0
        const isEndpoint = isStart || isEnd

        const el = document.createElement("div")
        el.style.cssText = `width: ${isEndpoint ? 18 : 10}px; height: ${isEndpoint ? 18 : 10}px;`

        const dot = document.createElement("div")
        dot.style.cssText = `
          width: 100%; height: 100%; border-radius: 50%; position: relative;
          background: ${isStart ? "#4ADE80" : isEnd ? COLORS.danger : COLORS.accent};
          border: 2px solid ${COLORS.bg};
        `
        el.appendChild(dot)

        const marker = new Marker({ element: el }).setLngLat([
          wp.longitude,
          wp.latitude,
        ])
        el.addEventListener("click", () => setSelectedWaypointId(wp.id))
        marker.addTo(map)
      })

      const bounds = routeCoordinates.reduce(
        (b, c) => b.extend(c),
        new LngLatBounds(routeCoordinates[0], routeCoordinates[0]),
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
  }, [route])

  const waypointStats = useMemo(() => {
    if (!route || routeCoordinates.length === 0) return {}

    const cumulative = [0]
    for (let i = 1; i < routeCoordinates.length; i++) {
      cumulative.push(
        cumulative[i - 1] +
          haversineKm(routeCoordinates[i - 1], routeCoordinates[i]),
      )
    }
    const totalKm = cumulative[cumulative.length - 1]

    const waypoints = route.waypoints || []
    const distFromStart = waypoints.map((wp) => {
      let bestIdx = 0
      let bestDist = Infinity
      routeCoordinates.forEach((c, idx) => {
        const d = haversineKm(c, [wp.longitude, wp.latitude])
        if (d < bestDist) {
          bestDist = d
          bestIdx = idx
        }
      })
      return cumulative[bestIdx]
    })

    const stats = {}
    waypoints.forEach((wp, i) => {
      stats[wp.id] = {
        fromStartKm: distFromStart[i],
        toEndKm: totalKm - distFromStart[i],
        fromPrevKm: i > 0 ? distFromStart[i] - distFromStart[i - 1] : null,
        toNextKm:
          i < waypoints.length - 1
            ? distFromStart[i + 1] - distFromStart[i]
            : null,
      }
    })
    return stats
  }, [route, routeCoordinates])

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
        Percorso non trovato.
      </div>
    )
  }

  return (
    <div className="page" style={{ paddingTop: 0 }}>
      <div className="route-detail-page__map-wrapper">
        {mapError ? (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--color-card-alt)",
            }}
          >
            <span className="screen-label">MAPPA NON DISPONIBILE</span>
          </div>
        ) : (
          <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
        )}
        <button
          type="button"
          className="btn-icon map-back-btn"
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft />
        </button>
      </div>

      <div className="route-detail-page__content">
        <div className="route-detail-page__title-row">
          <div className="page-title" style={{ fontSize: 26 }}>
            {route.name}
          </div>
          {!route.locked && (
            <button
              type="button"
              className="btn-outline-sm"
              onClick={() => downloadGpx(route)}
            >
              <FaDownload size={11} /> GPX
            </button>
          )}
        </div>

        <div
          className="stat-grid stat-grid--cols-3"
          style={{ marginBottom: 20 }}
        >
          <div className="stat-cell">
            <span className="stat-label">DISTANZA</span>
            <span className="stat-value">
              {(route.distanceMeters / 1000).toFixed(1).replace(".", ",")} KM
            </span>
          </div>
          <div className="stat-cell">
            <span className="stat-label">DURATA</span>
            <span className="stat-value">
              {Math.round(route.durationSeconds / 60)} MIN
            </span>
          </div>
          <div className="stat-cell">
            <span className="stat-label">TAPPE</span>
            <span className="stat-value">{route.waypoints.length}</span>
          </div>
        </div>
        <div className="route-detail-page__title-row">
          {route.googleMapsUrl && (
            <a
              href={route.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary btn-link-wrap route-detail-page__maps-link"
            >
              APRI IN GOOGLE MAPS
            </a>
          )}

          {route.owner && (
            <Link
              to={`/routes/${route.id}/edit`}
              className="btn-outline-sm-modify-route"
            >
              <FaEdit size={11} /> MODIFICA
            </Link>
          )}
        </div>
        {route.locked ? (
          <div className="empty-state" style={{ marginTop: 4 }}>
            Il creatore non ha reso questo percorso completamente visibile —
            puoi vedere solo il tracciato sulla mappa.
          </div>
        ) : (
          <>
            <div className="section-title">TAPPE</div>
            <div className="route-detail-page__waypoint-list">
              {route.waypoints.map((wp, index) => {
                const isStart = index === 0
                const isEnd = index === route.waypoints.length - 1
                return (
                  <div key={wp.id} className="card waypoint-row">
                    <span
                      className={`waypoint-row__number ${isStart ? "waypoint-row__number--start" : isEnd ? "waypoint-row__number--end" : ""}`}
                    >
                      {index + 1}
                    </span>
                    {wp.imageUrl && (
                      <img
                        src={wp.imageUrl}
                        alt=""
                        className="waypoint-row__image"
                        style={{ cursor: "pointer" }}
                        onClick={() => setSelectedWaypointId(wp.id)}
                      />
                    )}
                    <span className="waypoint-row__label">
                      {wp.label ||
                        `${wp.latitude.toFixed(4)}, ${wp.longitude.toFixed(4)}`}
                      {wp.stopMinutes > 0 && (
                        <span className="waypoint-row__stop-badge">
                          · {wp.stopMinutes} min sosta
                        </span>
                      )}
                    </span>
                    {route.owner && (
                      <label className="waypoint-row__photo-edit-btn">
                        <FaCamera size={11} />
                        <input
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={(e) =>
                            handleWaypointImageChange(
                              wp.id,
                              e.target.files?.[0],
                            )
                          }
                        />
                      </label>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {selectedWaypointId &&
        (() => {
          const wp = route.waypoints.find((w) => w.id === selectedWaypointId)
          const stats = waypointStats[selectedWaypointId]
          if (!wp) return null
          return (
            <div
              className="sheet-overlay"
              onClick={() => setSelectedWaypointId(null)}
            >
              <div className="sheet-panel" onClick={(e) => e.stopPropagation()}>
                <div className="sheet-header">
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => setSelectedWaypointId(null)}
                  >
                    <FaTimes />
                  </button>
                  <div className="sheet-header__title">
                    {wp.label || "TAPPA"}
                  </div>
                  <div style={{ width: 40 }} />
                </div>
                <div className="sheet-body">
                  {wp.imageUrl && (
                    <img
                      src={wp.imageUrl}
                      alt=""
                      className="waypoint-detail-sheet__image"
                    />
                  )}
                  <div
                    className="stat-grid stat-grid--cols-2"
                    style={{ marginTop: 16 }}
                  >
                    <div className="stat-cell">
                      <span className="stat-label">DA PARTENZA</span>
                      <span className="stat-value">
                        {stats?.fromStartKm.toFixed(1).replace(".", ",")} KM
                      </span>
                    </div>
                    <div className="stat-cell">
                      <span className="stat-label">ALL'ARRIVO</span>
                      <span className="stat-value">
                        {stats?.toEndKm.toFixed(1).replace(".", ",")} KM
                      </span>
                    </div>
                    <div className="stat-cell">
                      <span className="stat-label">DA TAPPA PRECEDENTE</span>
                      <span className="stat-value">
                        {stats?.fromPrevKm != null
                          ? stats.fromPrevKm.toFixed(1).replace(".", ",")
                          : "0,0"}{" "}
                        KM
                      </span>
                    </div>
                    <div className="stat-cell">
                      <span className="stat-label">ALLA TAPPA SUCCESSIVA</span>
                      <span className="stat-value">
                        {stats?.toNextKm != null
                          ? stats.toNextKm.toFixed(1).replace(".", ",")
                          : "0,0"}{" "}
                        KM
                      </span>
                    </div>
                  </div>
                  {wp.stopMinutes > 0 && (
                    <div className="empty-state" style={{ marginTop: 14 }}>
                      Sosta di {wp.stopMinutes} minuti
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })()}
    </div>
  )
}

export default RouteDetailPage
