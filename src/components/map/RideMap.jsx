import { useEffect, useRef } from "react"
import {
  Map,
  Marker,
  Popup,
  LngLatBounds,
  FullscreenControl,
} from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { COLORS, FONTS } from "../../styles/theme"
import { MAP_STYLE_URL } from "../../utils/mapStyle"

function buildEndpointMarker(color, isPulsing) {
  const el = document.createElement("div")
  el.style.cssText = "width: 20px; height: 20px;"

  const dot = document.createElement("div")
  dot.style.cssText = `
    width: 100%; height: 100%; border-radius: 50%; position: relative;
    background: ${color}; border: 3px solid ${COLORS.bg};
  `
  el.appendChild(dot)

  if (isPulsing) {
    const pulse = document.createElement("span")
    pulse.style.cssText = `
      position: absolute; inset: -8px; border-radius: 50%;
      background: ${color}; animation: qjpulse 2.6s ease-out infinite;
    `
    dot.appendChild(pulse)
  }

  return el
}

function RideMap({ points, height = "360px" }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current || !points || points.length === 0) return

    const coordinates = points.map((p) => [
      Number(p.longitude),
      Number(p.latitude),
    ])

    const map = new Map({
      container: containerRef.current,
      style: MAP_STYLE_URL,
      center: coordinates[0],
      zoom: 12,
    })
    mapRef.current = map

    map.addControl(new FullscreenControl(), "top-right")

    map.on("error", (e) => {
      console.error("MapLibre error:", e.error)
    })

    const init = () => {
      map.resize()

      map.addSource("track", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates,
          },
        },
      })

      map.addLayer({
        id: "track-line",
        type: "line",
        source: "track",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": COLORS.accent,
          "line-width": 4,
        },
      })

      const popupClass = { className: "qj-popup" }

      new Marker({ element: buildEndpointMarker("#4ADE80", true) })
        .setLngLat(coordinates[0])
        .setPopup(
          new Popup({ offset: 16, closeButton: false, ...popupClass }).setText(
            "Partenza",
          ),
        )
        .addTo(map)

      new Marker({ element: buildEndpointMarker(COLORS.danger, false) })
        .setLngLat(coordinates[coordinates.length - 1])
        .setPopup(
          new Popup({ offset: 16, closeButton: false, ...popupClass }).setText(
            "Arrivo",
          ),
        )
        .addTo(map)

      const first = coordinates[0]
      const last = coordinates[coordinates.length - 1]

      const isDegenerate =
        coordinates.length < 2 ||
        (Math.abs(first[0] - last[0]) < 0.0005 &&
          Math.abs(first[1] - last[1]) < 0.0005)

      if (isDegenerate) {
        map.setCenter(first)
        map.setZoom(14)
      } else {
        const bounds = coordinates.reduce(
          (bounds, coord) => bounds.extend(coord),
          new LngLatBounds(first, first),
        )

        map.fitBounds(bounds, {
          padding: 40,
          maxZoom: 15,
        })
      }
    }

    let initialized = false
    const tryInit = () => {
      if (initialized || !map.isStyleLoaded()) return
      initialized = true
      init()
    }
    map.on("styledata", tryInit)
    map.on("load", tryInit)
    tryInit()

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [points])

  if (!points || points.length === 0) {
    return (
      <div
        style={{
          height,
          borderRadius: 16,
          background: COLORS.cardAlt,
          border: `1px solid ${COLORS.borderSoft}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontFamily: FONTS.body,
            fontSize: 13,
            color: COLORS.textFaint,
          }}
        >
          Nessun tracciato disponibile
        </span>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height, borderRadius: 16, overflow: "hidden" }}
    />
  )
}

export default RideMap
