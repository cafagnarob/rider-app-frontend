import { useEffect, useRef } from "react"
import { Card, Button, Badge, Spinner } from "react-bootstrap"
import { useParams, useNavigate } from "react-router-dom"
import {
  Map as MapLibreMap,
  NavigationControl,
  Marker,
  LngLatBounds,
} from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { useGetRouteByIdQuery } from "../features/routesMap/routesApi"
import { decodePolyline } from "../utils/polyline"

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
      style: `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${import.meta.env.VITE_MAPTILER_KEY}`,
      center: coordinates[0],
      zoom: 11,
    })
    mapRef.current = map
    map.addControl(new NavigationControl(), "top-right")

    const draw = () => {
      const bounds = coordinates.reduce(
        (b, c) => b.extend(c),
        new LngLatBounds(coordinates[0], coordinates[0]),
      )
      map.fitBounds(bounds, { padding: 40, maxZoom: 15 })
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
        paint: { "line-color": "#0d6efd", "line-width": 5 },
      })

      route.waypoints.forEach((wp, index) => {
        const isEndpoint = index === 0 || index === route.waypoints.length - 1
        new Marker({
          color: index === 0 ? "#198754" : isEndpoint ? "#dc3545" : "#FFBE5D",
        })
          .setLngLat([wp.longitude, wp.latitude])
          .addTo(map)
      })
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
      <div className="text-center py-5">
        <Spinner animation="border" variant="light" />
      </div>
    )
  }

  if (isError)
    return <div className="alert alert-danger">Percorso non trovato.</div>

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto" }}>
      <div className="d-flex align-items-center gap-3 mb-3">
        <Button variant="outline-light" size="sm" onClick={() => navigate(-1)}>
          ← Indietro
        </Button>
        <h4 className="mb-0">{route.name}</h4>
      </div>

      <div
        ref={containerRef}
        style={{ height: "420px", borderRadius: "0.5rem", overflow: "hidden" }}
        className="mb-3"
      />

      <Card className="bg-dark text-light border-secondary">
        <Card.Body>
          <div className="d-flex gap-2 flex-wrap mb-3">
            <Badge bg="secondary">
              {(route.distanceMeters / 1000).toFixed(1)} km
            </Badge>
            <Badge bg="secondary">
              {Math.round(route.durationSeconds / 60)} min
            </Badge>
            <Badge bg="secondary">{route.waypoints.length} tappe</Badge>
          </div>
          {route.googleMapsUrl && (
            <a
              href={route.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-primary btn-sm mb-3"
            >
              Apri in Google Maps
            </a>
          )}
          <ol className="ps-3 mb-0">
            {route.waypoints.map((wp) => (
              <li key={wp.sequence} className="small">
                {wp.label ||
                  `${wp.latitude.toFixed(4)}, ${wp.longitude.toFixed(4)}`}
              </li>
            ))}
          </ol>
        </Card.Body>
      </Card>
    </div>
  )
}

export default RouteDetailPage
