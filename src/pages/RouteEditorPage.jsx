import { useEffect, useRef, useState } from "react"
import {
  useCreateRouteMutation,
  usePreviewRouteMutation,
} from "../features/routesMap/routesApi"
import { useLocation, useNavigate } from "react-router-dom"
import { Map, Marker, FullscreenControl } from "maplibre-gl"
import { decodePolyline } from "../utils/polyline"
import { searchPlaces } from "../utils/geocoding"
import { Spinner } from "react-bootstrap"
import { FaArrowDown, FaArrowUp, FaSearch, FaTrash } from "react-icons/fa"
import { COLORS, FONTS, styles } from "../styles/theme"
import { MAP_STYLE_URL } from "../utils/mapStyle"

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
    <div style={{ ...styles.pageBg, paddingBottom: 40 }}>
      <div style={{ padding: "20px 20px 0" }}>
        <div style={{ ...styles.pageTitle, fontSize: 26, marginBottom: 4 }}>
          NUOVO PERCORSO
        </div>
        <p
          style={{
            fontFamily: FONTS.mono,
            fontSize: 10,
            color: COLORS.textMuted,
            marginBottom: 14,
          }}
        >
          TOCCA LA MAPPA PER AGGIUNGERE UN PUNTO · TRASCINA PER SPOSTARE
        </p>
      </div>

      <div
        style={{
          position: "relative",
          height: 360,
          margin: "0 20px 18px",
          borderRadius: 18,
          overflow: "hidden",
          border: `1px solid ${COLORS.border}`,
        }}
      >
        <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      </div>

      <form
        onSubmit={handleSave}
        style={{
          padding: "0 20px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div>
          <div style={{ ...styles.fieldLabel, marginBottom: 8 }}>
            NOME DEL PERCORSO
          </div>
          <input
            type="text"
            placeholder="Giro dei trulli"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={styles.input}
          />
        </div>

        <div style={{ position: "relative" }}>
          <div style={{ ...styles.fieldLabel, marginBottom: 8 }}>
            CERCA UN LUOGO
          </div>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="Via, città, monumento..."
              value={searchText}
              onChange={handleSearchChange}
              style={{ ...styles.input, paddingRight: 44 }}
            />
            <FaSearch
              style={{
                position: "absolute",
                right: 15,
                top: "50%",
                transform: "translateY(-50%)",
                color: COLORS.textMuted,
              }}
            />
          </div>

          {results.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                marginTop: 6,
                zIndex: 10,
                ...styles.card,
                overflow: "hidden",
              }}
            >
              {results.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handlePickPlace(r)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "11px 13px",
                    background: "none",
                    border: "none",
                    borderBottom: `1px solid ${COLORS.borderSoft}`,
                    color: COLORS.text,
                    fontFamily: FONTS.body,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  {r.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div style={{ ...styles.fieldLabel, marginBottom: 8 }}>
            PUNTI ({waypoints.length})
          </div>
          {waypoints.length === 0 ? (
            <p
              style={{
                fontFamily: FONTS.body,
                fontSize: 13,
                color: COLORS.textFaint,
              }}
            >
              Nessun punto. Tocca la mappa per iniziare.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {waypoints.map((wp, index) => (
                <div
                  key={wp.id}
                  style={{
                    ...styles.card,
                    padding: "9px 11px",
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      flexShrink: 0,
                      background:
                        index === 0
                          ? "#173323"
                          : index === waypoints.length - 1
                            ? COLORS.dangerBg
                            : COLORS.cardAlt,
                      color:
                        index === 0
                          ? "#4ADE80"
                          : index === waypoints.length - 1
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
                  <input
                    type="text"
                    placeholder={
                      index === 0
                        ? "Es. Ritrovo"
                        : index === waypoints.length - 1
                          ? "Es. Arrivo"
                          : "Es. Sosta caffè"
                    }
                    value={wp.label}
                    onChange={(e) => setLabel(wp.id, e.target.value)}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      background: "none",
                      border: "none",
                      color: COLORS.text,
                      fontFamily: FONTS.body,
                      fontSize: 13,
                      outline: "none",
                    }}
                  />
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                    style={{
                      background: "none",
                      border: "none",
                      color: COLORS.textMuted,
                      cursor: "pointer",
                      padding: 4,
                      opacity: index === 0 ? 0.3 : 1,
                    }}
                  >
                    <FaArrowUp size={11} />
                  </button>
                  <button
                    type="button"
                    disabled={index === waypoints.length - 1}
                    onClick={() => move(index, 1)}
                    style={{
                      background: "none",
                      border: "none",
                      color: COLORS.textMuted,
                      cursor: "pointer",
                      padding: 4,
                      opacity: index === waypoints.length - 1 ? 0.3 : 1,
                    }}
                  >
                    <FaArrowDown size={11} />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(wp.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: COLORS.danger,
                      cursor: "pointer",
                      padding: 4,
                    }}
                  >
                    <FaTrash size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { key: "avoidHighways", label: "Evita autostrade" },
            { key: "avoidTolls", label: "Evita pedaggi" },
            { key: "avoidFerries", label: "Evita traghetti" },
          ].map((opt) => (
            <label
              key={opt.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontFamily: FONTS.body,
                fontSize: 13,
                color: COLORS.textSecondary,
                cursor: "pointer",
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

        {errorMsg && (
          <div
            style={{
              fontFamily: FONTS.body,
              fontSize: 13,
              color: COLORS.danger,
            }}
          >
            {errorMsg}
          </div>
        )}

        {routeInfo && waypoints.length >= 2 && (
          <div style={{ display: "flex", gap: 20 }}>
            <div>
              <span
                style={{
                  fontFamily: FONTS.heading,
                  fontWeight: 700,
                  fontSize: 20,
                }}
              >
                {routeInfo.distanceKm.toFixed(1).replace(".", ",")}
              </span>
              <span
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 10,
                  color: COLORS.textMuted,
                  marginLeft: 5,
                }}
              >
                KM
              </span>
            </div>
            <div>
              <span
                style={{
                  fontFamily: FONTS.heading,
                  fontWeight: 700,
                  fontSize: 20,
                }}
              >
                {Math.round(routeInfo.durationMin)}
              </span>
              <span
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 10,
                  color: COLORS.textMuted,
                  marginLeft: 5,
                }}
              >
                MIN
              </span>
            </div>
          </div>
        )}

        {savedRoute && (
          <div
            style={{
              ...styles.card,
              borderColor: COLORS.accentSoftBorder,
              padding: 14,
            }}
          >
            <div
              style={{
                fontFamily: FONTS.body,
                fontSize: 13,
                color: COLORS.textSecondary,
                marginBottom: 8,
              }}
            >
              Percorso "{savedRoute.name}" salvato.
            </div>
            <button
              type="button"
              onClick={() =>
                location.state?.returnTo
                  ? navigate(location.state.returnTo, {
                      state: { newRouteId: savedRoute.id, resumeDraft: true },
                    })
                  : navigate("/routes")
              }
              style={{
                background: "none",
                border: "none",
                color: COLORS.accent,
                fontFamily: FONTS.mono,
                fontSize: 11,
                cursor: "pointer",
                padding: 0,
              }}
            >
              {location.state?.returnTo
                ? "TORNA ALLA CREAZIONE DELL'EVENTO"
                : "VAI AI MIEI PERCORSI"}
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || waypoints.length < 2}
          style={{
            ...styles.primaryButton,
            opacity: isLoading || waypoints.length < 2 ? 0.5 : 1,
          }}
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
