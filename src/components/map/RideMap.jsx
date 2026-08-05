import { useEffect, useRef } from "react"
import {
  Map,
  NavigationControl,
  Marker,
  Popup,
  LngLatBounds,
} from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"

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
      style: `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${import.meta.env.VITE_MAPTILER_KEY}`,
      center: coordinates[0],
      zoom: 12,
    })

    mapRef.current = map

    map.addControl(new NavigationControl(), "top-right")

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
          "line-color": "#FFBE5D",
          "line-width": 4,
        },
      })

      new Marker({ color: "#198754" })
        .setLngLat(coordinates[0])
        .setPopup(new Popup().setText("Partenza"))
        .addTo(map)

      new Marker({ color: "#dc3545" })
        .setLngLat(coordinates[coordinates.length - 1])
        .setPopup(new Popup().setText("Arrivo"))
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
        className="d-flex align-items-center justify-content-center border border-secondary rounded"
        style={{ height }}
      >
        <span className="text-secondary small">
          Nessun tracciato disponibile
        </span>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height,
        borderRadius: "0.5rem",
        overflow: "hidden",
      }}
    />
  )
}

export default RideMap
