import { useEffect, useRef } from "react"
import { Spinner } from "react-bootstrap"
import { useParams, useNavigate } from "react-router-dom"
import {
  Map as MapLibreMap,
  Marker,
  LngLatBounds,
  FullscreenControl,
} from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { useGetRouteByIdQuery } from "../features/routesMap/routesApi"
import { decodePolyline } from "../utils/polyline"
import { COLORS, FONTS, styles } from "../styles/theme"
import { FaArrowLeft, FaDownload } from "react-icons/fa"
import { downloadGpx } from "../utils/gpx"
import { MAP_STYLE_URL } from "../utils/mapStyle"

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
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <Spinner animation="border" style={{ color: COLORS.accent }} />
      </div>
    )
  }

  if (isError)
    return (
      <div style={{ ...styles.emptyState, margin: 20 }}>
        Percorso non trovato.
      </div>
    )

  return (
    <div style={{ ...styles.pageBg, paddingBottom: 40 }}>
      <div style={{ position: "relative", height: 260 }}>
        <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            ...styles.iconButton,
            position: "absolute",
            left: 16,
            top: 16,
            background: "rgba(10,10,12,.8)",
          }}
        >
          <FaArrowLeft />
        </button>
      </div>

      <div style={{ padding: "20px 20px 0" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 14,
          }}
        >
          <div style={{ ...styles.pageTitle, fontSize: 26 }}>{route.name}</div>
          <button
            type="button"
            onClick={() => downloadGpx(route)}
            style={{
              height: 38,
              padding: "0 14px",
              borderRadius: 11,
              background: COLORS.card,
              flexShrink: 0,
              border: `1px solid ${COLORS.borderStrong}`,
              color: COLORS.textSecondary,
              fontFamily: FONTS.mono,
              fontSize: 10,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <FaDownload size={11} /> GPX
          </button>
        </div>

        <div
          style={{
            ...styles.statGrid,
            gridTemplateColumns: "1fr 1fr 1fr",
            marginBottom: 20,
          }}
        >
          <div style={styles.statCell}>
            <span style={styles.statLabel}>DISTANZA</span>
            <span style={styles.statValue}>
              {(route.distanceMeters / 1000).toFixed(1).replace(".", ",")} KM
            </span>
          </div>
          <div style={styles.statCell}>
            <span style={styles.statLabel}>DURATA</span>
            <span style={styles.statValue}>
              {Math.round(route.durationSeconds / 60)} MIN
            </span>
          </div>
          <div style={styles.statCell}>
            <span style={styles.statLabel}>TAPPE</span>
            <span style={styles.statValue}>{route.waypoints.length}</span>
          </div>
        </div>

        {route.googleMapsUrl && (
          <a
            href={route.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              ...styles.secondaryButton,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 18px",
              textDecoration: "none",
              marginBottom: 24,
            }}
          >
            APRI IN GOOGLE MAPS
          </a>
        )}

        <div style={styles.sectionTitle}>TAPPE</div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginTop: 12,
          }}
        >
          {route.waypoints.map((wp, index) => (
            <div
              key={wp.sequence}
              style={{
                ...styles.card,
                padding: "11px 13px",
                display: "flex",
                alignItems: "center",
                gap: 11,
              }}
            >
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background:
                    index === 0
                      ? "#173323"
                      : index === route.waypoints.length - 1
                        ? COLORS.dangerBg
                        : COLORS.cardAlt,
                  color:
                    index === 0
                      ? "#4ADE80"
                      : index === route.waypoints.length - 1
                        ? COLORS.danger
                        : COLORS.textSecondary,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: FONTS.mono,
                  fontSize: 10,
                }}
              >
                {index + 1}
              </span>
              <span style={{ fontFamily: FONTS.body, fontSize: 13.5 }}>
                {wp.label ||
                  `${wp.latitude.toFixed(4)}, ${wp.longitude.toFixed(4)}`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default RouteDetailPage
