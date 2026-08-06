import { useEffect, useRef, useState } from "react"
import {
  useCreateRouteMutation,
  usePreviewRouteMutation,
} from "../features/routesMap/routesApi"
import { useLocation, useNavigate } from "react-router-dom"
import { Map, Marker, NavigationControl } from "maplibre-gl"
import { decodePolyline } from "../utils/polyline"
import { searchPlaces } from "../utils/geocoding"
import { Badge, Button, Form, ListGroup, Spinner } from "react-bootstrap"
import { FaArrowDown, FaArrowUp, FaSearch, FaTrash } from "react-icons/fa"

const START_CENTER = [16.2977, 41.3203]

function RouteEditorPage() {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const timerRef = useRef(null)

  const location = useLocation()

  const [mapReady, setMapReady] = useState(false)

  const [savedRoute, setSavedRoute] = useState(null)

  const [previewRoute] = usePreviewRouteMutation()
  const [routeInfo, setRouteInfo] = useState(null)
  const previewTimerRef = useRef(null)

  const [waypoints, setWaypoints] = useState([])
  const [name, setName] = useState("")
  const [options, setOptions] = useState({
    avoidHighways: false,
    avoidTolls: false,
    avoidFerries: false,
  })

  const [searchText, setSearchText] = useState("")
  const [results, setResults] = useState([])
  const [errorMsg, setErrorMsg] = useState("")
  const [preview, setPreview] = useState(null)

  const [createRoute, { isLoading }] = useCreateRouteMutation()
  const navigate = useNavigate()

  const waypointsRef = useRef([])
  useEffect(() => {
    waypointsRef.current = waypoints
  }, [waypoints])

  useEffect(() => {
    if (waypoints.length < 2) return

    clearTimeout(previewTimerRef.current)
    previewTimerRef.current = setTimeout(async () => {
      setPreview(null)
      try {
        const result = await previewRoute({
          points: waypoints.map((w) => ({
            latitude: w.latitude,
            longitude: w.longitude,
            label: w.label || null,
          })),
          ...options,
        }).unwrap()

        setPreview(result.encodedPolyline)
        setRouteInfo({
          distanceKm: result.distanceMeters / 1000,
          durationMin: result.durationSeconds / 60,
        })
      } catch (err) {
        setErrorMsg(err.data?.message || "Impossibile calcolare l'anteprima.")
      }
    }, 800)

    return () => clearTimeout(previewTimerRef.current)
  }, [waypoints, options])

  // --- creazione mappa (una sola volta) ---
  useEffect(() => {
    if (!containerRef.current) return

    const map = new Map({
      container: containerRef.current,
      style: `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${import.meta.env.VITE_MAPTILER_KEY}`,
      center: START_CENTER,
      zoom: 11,
    })
    mapRef.current = map

    map.addControl(new NavigationControl(), "top-right")
    map.on("error", (e) => console.error("MapLibre error:", e.error))

    map.on("click", (e) => {
      setWaypoints((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          latitude: e.lngLat.lat,
          longitude: e.lngLat.lng,
          label: "",
        },
      ])
    })

    const initLayers = () => {
      const empty = { type: "FeatureCollection", features: [] }

      map.addSource("draft", { type: "geojson", data: empty })
      map.addSource("ghost", { type: "geojson", data: empty })
      map.addSource("route", { type: "geojson", data: empty })

      map.addLayer({
        id: "draft-line",
        type: "line",
        source: "draft",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#adb5bd",
          "line-width": 3,
          "line-dasharray": [2, 2],
          "line-opacity": 0.7,
        },
      })

      map.addLayer({
        id: "ghost-line",
        type: "line",
        source: "ghost",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#FFBE5D",
          "line-width": 2,
          "line-dasharray": [1, 2],
          "line-opacity": 0.6,
        },
      })

      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#0d6efd",
          "line-width": 5,
          "line-opacity": 0.85,
        },
      })

      setMapReady(true)
    }

    let initialized = false
    const tryInit = () => {
      if (initialized || !map.isStyleLoaded()) return
      initialized = true
      initLayers()
    }
    map.on("styledata", tryInit)
    map.on("load", tryInit)
    tryInit()

    map.on("mousemove", (e) => {
      const list = waypointsRef.current
      const source = map.getSource("ghost")
      if (!source) return

      if (list.length === 0) {
        source.setData({ type: "FeatureCollection", features: [] })
        return
      }

      const last = list[list.length - 1]
      source.setData({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: [
            [last.longitude, last.latitude],
            [e.lngLat.lng, e.lngLat.lat],
          ],
        },
      })
    })

    map.on("mouseout", () => {
      map
        .getSource("ghost")
        ?.setData({ type: "FeatureCollection", features: [] })
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!mapReady) return
    const source = mapRef.current?.getSource("draft")
    if (!source) return

    if (waypoints.length < 2) {
      source.setData({ type: "FeatureCollection", features: [] })
      return
    }

    source.setData({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: waypoints.map((w) => [w.longitude, w.latitude]),
      },
    })
  }, [waypoints, mapReady])

  useEffect(() => {
    if (!mapReady) return
    const source = mapRef.current?.getSource("route")
    if (!source) return

    if (!preview || waypoints.length < 2) {
      source.setData({ type: "FeatureCollection", features: [] })
      return
    }

    source.setData({
      type: "Feature",
      geometry: { type: "LineString", coordinates: decodePolyline(preview) },
    })
  }, [preview, mapReady, waypoints.length])

  // --- sincronizzazione marcatori ---
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    waypoints.forEach((wp, index) => {
      const el = document.createElement("div")
      el.textContent = String(index + 1)
      el.style.cssText = `
        width: 28px; height: 28px; border-radius: 50%;
        background: ${index === 0 ? "#198754" : index === waypoints.length - 1 ? "#dc3545" : "#FFBE5D"};
        color: #000; font-weight: bold; display: flex;
        align-items: center; justify-content: center;
        cursor: grab; border: 2px solid #fff;
      `

      const marker = new Marker({ element: el, draggable: true })
        .setLngLat([wp.longitude, wp.latitude])
        .addTo(map)

      marker.on("dragend", () => {
        const { lng, lat } = marker.getLngLat()
        setWaypoints((prev) =>
          prev.map((p) =>
            p.id === wp.id ? { ...p, latitude: lat, longitude: lng } : p,
          ),
        )
      })

      markersRef.current.push(marker)
    })
  }, [waypoints])

  // --- ricerca indirizzo ---
  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchText(value)

    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      try {
        setResults(await searchPlaces(value))
      } catch {
        setResults([])
      }
    }, 500)
  }

  const handlePickPlace = (place) => {
    mapRef.current?.flyTo({
      center: [place.longitude, place.latitude],
      zoom: 14,
    })
    setWaypoints((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        latitude: place.latitude,
        longitude: place.longitude,
        label: place.name.split(",")[0],
      },
    ])
    setSearchText("")
    setResults([])
  }

  // --- operazioni sulla lista ---
  const move = (index, direction) => {
    setWaypoints((prev) => {
      const next = [...prev]
      const target = index + direction
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const remove = (id) => setWaypoints((prev) => prev.filter((p) => p.id !== id))

  const setLabel = (id, label) =>
    setWaypoints((prev) => prev.map((p) => (p.id === id ? { ...p, label } : p)))

  // --- salvataggio ---
  const handleSave = async (e) => {
    e.preventDefault()
    setErrorMsg("")

    if (waypoints.length < 2) {
      setErrorMsg("Servono almeno due punti: partenza e arrivo.")
      return
    }

    try {
      const created = await createRoute({
        name,
        points: waypoints.map((w) => ({
          latitude: w.latitude,
          longitude: w.longitude,
          label: w.label || null,
        })),
        ...options,
      }).unwrap()

      setSavedRoute(created)
    } catch (err) {
      setErrorMsg(err.data?.message || "Impossibile calcolare il percorso.")
    }
  }

  return (
    <div className="row g-3">
      <div className="col-12 col-lg-7">
        <div
          ref={containerRef}
          style={{
            height: "520px",
            borderRadius: "0.5rem",
            overflow: "hidden",
          }}
        />
        <small className="text-secondary d-block mt-2">
          Clicca sulla mappa per aggiungere un punto, trascina i marcatori per
          spostarli.
        </small>
      </div>

      <div className="col-12 col-lg-5">
        <Form onSubmit={handleSave}>
          <Form.Group className="mb-3">
            <Form.Label>Nome del percorso</Form.Label>
            <Form.Control
              type="text"
              className="bg-transparent text-light"
              placeholder="Giro dei trulli"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3 position-relative">
            <Form.Label>Cerca un luogo</Form.Label>
            <div className="position-relative">
              <Form.Control
                type="text"
                className="bg-transparent text-light"
                placeholder="Via, città, monumento..."
                value={searchText}
                onChange={handleSearchChange}
              />
              <FaSearch
                className="position-absolute text-secondary"
                style={{ right: "12px", top: "12px" }}
              />
            </div>

            {results.length > 0 && (
              <ListGroup
                className="position-absolute w-100"
                style={{ zIndex: 10 }}
              >
                {results.map((r) => (
                  <ListGroup.Item
                    key={r.id}
                    action
                    className="bg-dark text-light border-secondary small"
                    onClick={() => handlePickPlace(r)}
                  >
                    {r.name}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </Form.Group>

          <div className="mb-3">
            <Form.Label>Punti ({waypoints.length})</Form.Label>
            {waypoints.length === 0 ? (
              <p className="text-secondary small">
                Nessun punto. Clicca sulla mappa per iniziare.
              </p>
            ) : (
              <ListGroup>
                {waypoints.map((wp, index) => (
                  <ListGroup.Item
                    key={wp.id}
                    className="bg-dark text-light border-secondary d-flex align-items-center gap-2 py-2"
                  >
                    <Badge bg="secondary">{index + 1}</Badge>
                    <Form.Control
                      size="sm"
                      className="bg-transparent text-light border-0"
                      placeholder={`Punto ${index + 1}`}
                      value={wp.label}
                      onChange={(e) => setLabel(wp.id, e.target.value)}
                    />
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 text-secondary"
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                    >
                      <FaArrowUp />
                    </Button>
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 text-secondary"
                      disabled={index === waypoints.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      <FaArrowDown />
                    </Button>
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 text-danger"
                      onClick={() => remove(wp.id)}
                    >
                      <FaTrash />
                    </Button>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </div>

          <div className="mb-3">
            <Form.Check
              type="switch"
              id="avoid-highways"
              label="Evita autostrade"
              checked={options.avoidHighways}
              onChange={(e) =>
                setOptions({ ...options, avoidHighways: e.target.checked })
              }
            />
            <Form.Check
              type="switch"
              id="avoid-tolls"
              label="Evita pedaggi"
              checked={options.avoidTolls}
              onChange={(e) =>
                setOptions({ ...options, avoidTolls: e.target.checked })
              }
            />
            <Form.Check
              type="switch"
              id="avoid-ferries"
              label="Evita traghetti"
              checked={options.avoidFerries}
              onChange={(e) =>
                setOptions({ ...options, avoidFerries: e.target.checked })
              }
            />
          </div>

          {errorMsg && (
            <div className="alert alert-danger py-2">{errorMsg}</div>
          )}

          {routeInfo && waypoints.length >= 2 && (
            <div className="d-flex gap-3 mb-3 text-secondary small">
              <span>
                <strong className="text-light">
                  {routeInfo.distanceKm.toFixed(1)}
                </strong>{" "}
                km
              </span>
              <span>
                <strong className="text-light">
                  {Math.round(routeInfo.durationMin)}
                </strong>{" "}
                min
              </span>
            </div>
          )}

          {savedRoute && (
            <div className="alert alert-success py-2">
              Percorso "{savedRoute.name}" salvato.{" "}
              {location.state?.returnTo ? (
                <Button
                  variant="link"
                  size="sm"
                  className="p-0"
                  onClick={() =>
                    navigate(location.state.returnTo, {
                      state: { newRouteId: savedRoute.id, resumeDraft: true },
                    })
                  }
                >
                  Torna alla creazione dell'evento
                </Button>
              ) : (
                <Button
                  variant="link"
                  size="sm"
                  className="p-0"
                  onClick={() => navigate("/routes")}
                >
                  Vai ai miei percorsi
                </Button>
              )}
            </div>
          )}

          <div className="d-grid">
            <Button
              type="submit"
              disabled={isLoading || waypoints.length < 2}
              className="rounded-pill fw-bold border-0"
              style={{ backgroundColor: "#FFBE5D", color: "#000" }}
            >
              {isLoading ? (
                <Spinner size="sm" animation="border" />
              ) : (
                "Calcola e salva percorso"
              )}
            </Button>
          </div>
        </Form>
      </div>
    </div>
  )
}

export default RouteEditorPage
