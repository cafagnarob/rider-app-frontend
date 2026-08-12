import { useEffect, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Map, Marker, FullscreenControl } from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { Spinner } from "react-bootstrap"
import { FaArrowDown, FaArrowUp, FaSearch, FaTrash } from "react-icons/fa"
import {
  useCreateRouteMutation,
  usePreviewRouteMutation,
} from "../features/routesMap/routesApi"
import { decodePolyline } from "../utils/polyline"
import { searchPlaces } from "../utils/geocoding"
import { MAP_STYLE_URL } from "../utils/mapStyle"
import { COLORS, FONTS } from "../styles/theme" // solo per marcatori/layer MapLibre, DOM/paint fuori da React
import "../pages/CSS/RouteEditorPage.css"

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

  useEffect(() => {
    if (!containerRef.current) return

    const map = new Map({
      container: containerRef.current,
      style: MAP_STYLE_URL,
      center: START_CENTER,
      zoom: 11,
    })
    mapRef.current = map

    map.addControl(new FullscreenControl(), "top-right")
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
      map.resize()
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
          "line-color": COLORS.textMuted,
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
          "line-color": COLORS.accent,
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
          "line-color": COLORS.accent,
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

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    waypoints.forEach((wp, index) => {
      const isStart = index === 0
      const isEnd = index === waypoints.length - 1 && waypoints.length > 1

      const el = document.createElement("div")
      el.style.cssText = "width: 28px; height: 28px; cursor: grab;"
      const dot = document.createElement("div")
      dot.style.cssText = `
        width: 100%; height: 100%; border-radius: 50%; position: relative;
        background: ${isStart ? "#4ADE80" : isEnd ? COLORS.danger : COLORS.accent};
        color: #08080A; font-family: ${FONTS.mono}; font-weight: 700; font-size: 11px;
        display: flex; align-items: center; justify-content: center;
        border: 2px solid ${COLORS.bg};
      `
      dot.textContent = String(index + 1)
      el.appendChild(dot)

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
    <div className="page" style={{ paddingBottom: 40 }}>
      <div className="route-editor-page__intro">
        <div className="page-title" style={{ fontSize: 26, marginBottom: 4 }}>
          NUOVO PERCORSO
        </div>
        <p className="route-editor-page__hint">
          TOCCA LA MAPPA PER AGGIUNGERE UN PUNTO · TRASCINA PER SPOSTARE
        </p>
      </div>

      <div className="map-frame">
        <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      </div>

      <form className="form-stack px-20" onSubmit={handleSave}>
        <div>
          <div className="field-label form-group__label">NOME DEL PERCORSO</div>
          <input
            type="text"
            className="input"
            placeholder="Giro dei trulli"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div style={{ position: "relative" }}>
          <div className="field-label form-group__label">CERCA UN LUOGO</div>
          <div className="search-input-wrap">
            <input
              type="text"
              className="input"
              placeholder="Via, città, monumento..."
              value={searchText}
              onChange={handleSearchChange}
            />
            <FaSearch className="search-input-wrap__icon" />
          </div>

          {results.length > 0 && (
            <div className="card search-results">
              {results.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className="search-results__item"
                  onClick={() => handlePickPlace(r)}
                >
                  {r.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="field-label form-group__label">
            PUNTI ({waypoints.length})
          </div>
          {waypoints.length === 0 ? (
            <p
              className="no-results-text"
              style={{ padding: 0, textAlign: "left" }}
            >
              Nessun punto. Tocca la mappa per iniziare.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {waypoints.map((wp, index) => {
                const isStart = index === 0
                const isLast = index === waypoints.length - 1
                return (
                  <div key={wp.id} className="card waypoint-edit-row">
                    <span
                      className={`waypoint-edit-row__number ${isStart ? "waypoint-row__number--start" : isLast ? "waypoint-row__number--end" : "waypoint-row__number"}`}
                    >
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      className="waypoint-edit-row__input"
                      placeholder={
                        isStart
                          ? "Es. Ritrovo"
                          : isLast
                            ? "Es. Arrivo"
                            : "Es. Sosta caffè"
                      }
                      value={wp.label}
                      onChange={(e) => setLabel(wp.id, e.target.value)}
                    />
                    <button
                      type="button"
                      className="icon-btn-plain icon-btn-plain--muted"
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                    >
                      <FaArrowUp size={11} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn-plain icon-btn-plain--muted"
                      disabled={isLast}
                      onClick={() => move(index, 1)}
                    >
                      <FaArrowDown size={11} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn-plain icon-btn-plain--danger"
                      onClick={() => remove(wp.id)}
                    >
                      <FaTrash size={11} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="checkbox-stack">
          {[
            { key: "avoidHighways", label: "Evita autostrade" },
            { key: "avoidTolls", label: "Evita pedaggi" },
            { key: "avoidFerries", label: "Evita traghetti" },
          ].map((opt) => (
            <label
              key={opt.key}
              className="auth-page__remember-label"
              style={{
                textTransform: "none",
                letterSpacing: "normal",
                fontFamily: "var(--font-body)",
                fontSize: 13,
              }}
            >
              <input
                type="checkbox"
                checked={options[opt.key]}
                onChange={(e) =>
                  setOptions({ ...options, [opt.key]: e.target.checked })
                }
              />
              {opt.label}
            </label>
          ))}
        </div>

        {errorMsg && <div className="error-text">{errorMsg}</div>}

        {routeInfo && waypoints.length >= 2 && (
          <div className="inline-stats-row">
            <div>
              <span className="inline-stats-row__value">
                {routeInfo.distanceKm.toFixed(1).replace(".", ",")}
              </span>
              <span className="inline-stats-row__unit">KM</span>
            </div>
            <div>
              <span className="inline-stats-row__value">
                {Math.round(routeInfo.durationMin)}
              </span>
              <span className="inline-stats-row__unit">MIN</span>
            </div>
          </div>
        )}

        {savedRoute && (
          <div
            className="card"
            style={{
              borderColor: "var(--color-accent-soft-border)",
              padding: 14,
            }}
          >
            <div
              className="success-box__inline-text"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 13,
                color: "var(--color-text-secondary)",
                marginBottom: 8,
              }}
            >
              Percorso "{savedRoute.name}" salvato.
            </div>
            <button
              type="button"
              className="text-btn text-btn--accent"
              onClick={() =>
                location.state?.returnTo
                  ? navigate(location.state.returnTo, {
                      state: { newRouteId: savedRoute.id, resumeDraft: true },
                    })
                  : navigate("/routes")
              }
            >
              {location.state?.returnTo
                ? "TORNA ALLA CREAZIONE DELL'EVENTO"
                : "VAI AI MIEI PERCORSI"}
            </button>
          </div>
        )}

        <button
          type="submit"
          className="btn-primary"
          disabled={isLoading || waypoints.length < 2}
          style={{ opacity: isLoading || waypoints.length < 2 ? 0.5 : 1 }}
        >
          {isLoading ? (
            <Spinner size="sm" animation="border" />
          ) : (
            "CALCOLA E SALVA PERCORSO"
          )}
        </button>
      </form>
    </div>
  )
}

export default RouteEditorPage
