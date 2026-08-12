import { useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Spinner } from "react-bootstrap"
import {
  Map as MapLibreMap,
  Marker,
  LngLatBounds,
  FullscreenControl,
} from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { FaArrowLeft, FaDownload } from "react-icons/fa"
import { useGetRouteByIdQuery } from "../features/routesMap/routesApi"
import { decodePolyline } from "../utils/polyline"
import { downloadGpx } from "../utils/gpx"
import { MAP_STYLE_URL } from "../utils/mapStyle"
import { COLORS } from "../styles/theme" // solo per i marcatori MapLibre, DOM creati fuori da React
import "../pages/CSS/RouteDetailPage.css"

function RouteDetailPage() {
  const { routeId } = useParams()
  const navigate = useNavigate()
  const { data: route, isLoading, isError } = useGetRouteByIdQuery(routeId)

  const containerRef = useRef(null)
  const mapRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current || !route) return

    const coordinates = decodePolyline(route.encodedPolyline)
    if (coordinates.length === 0) return

    const map = new MapLibreMap({
      container: containerRef.current,
      style: MAP_STYLE_URL,
      center: coordinates[0],
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
          geometry: { type: "LineString", coordinates },
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

      const lastIndex = route.waypoints.length - 1
      route.waypoints.forEach((wp, index) => {
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

        new Marker({ element: el })
          .setLngLat([wp.longitude, wp.latitude])
          .addTo(map)
      })

      const bounds = coordinates.reduce(
        (b, c) => b.extend(c),
        new LngLatBounds(coordinates[0], coordinates[0]),
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
        <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
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
          <button
            type="button"
            className="btn-outline-sm"
            onClick={() => downloadGpx(route)}
          >
            <FaDownload size={11} /> GPX
          </button>
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

        <div className="section-title">TAPPE</div>
        <div className="route-detail-page__waypoint-list">
          {route.waypoints.map((wp, index) => {
            const isStart = index === 0
            const isEnd = index === route.waypoints.length - 1
            return (
              <div key={wp.sequence} className="card waypoint-row">
                <span
                  className={`waypoint-row__number ${isStart ? "waypoint-row__number--start" : isEnd ? "waypoint-row__number--end" : ""}`}
                >
                  {index + 1}
                </span>
                <span className="waypoint-row__label">
                  {wp.label ||
                    `${wp.latitude.toFixed(4)}, ${wp.longitude.toFixed(4)}`}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default RouteDetailPage
