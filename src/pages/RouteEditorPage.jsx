import { useEffect, useRef, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { Map, Marker, FullscreenControl, LngLatBounds } from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { Spinner } from "react-bootstrap"
import {
  FaArrowDown,
  FaArrowLeft,
  FaArrowUp,
  FaCamera,
  FaChevronDown,
  FaChevronUp,
  FaSearch,
  FaTrash,
} from "react-icons/fa"
import {
  useCreateRouteMutation,
  useGetRouteByIdQuery,
  usePreviewRouteMutation,
  useUpdateRouteMutation,
} from "../features/routesMap/routesApi"
import { decodePolyline } from "../utils/polyline"
import { searchPlaces } from "../utils/geocoding"
import { MAP_STYLE_URL } from "../utils/mapStyle"
import { COLORS, FONTS } from "../styles/theme"
import "../pages/CSS/RouteEditorPage.css"
import { useGeolocation } from "../utils/useGeolocation"

const START_CENTER = [12.4964, 41.9028]

function RouteEditorPage() {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const timerRef = useRef(null)
  const previewTimerRef = useRef(null)

  const waypointsRef = useRef([])
  const skipNextPreviewRef = useRef(false)
  const hasFlownToRouteRef = useRef(false)

  const location = useLocation()
  const navigate = useNavigate()
  const { routeId } = useParams()

  const isEditMode = !!routeId

  const [mapReady, setMapReady] = useState(false)
  const [savedRoute, setSavedRoute] = useState(null)

  const [previewRoute] = usePreviewRouteMutation()
  const [routeInfo, setRouteInfo] = useState(null)

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
  const [updateRoute, { isLoading: isUpdating }] = useUpdateRouteMutation()

  const [initializedFor, setInitializedFor] = useState(null)

  const isSaving = isLoading || isUpdating

  const { position, error } = useGeolocation()
  const [timedOut, setTimedOut] = useState(false)
  const [waypointsExpanded, setWaypointsExpanded] = useState(false)

  const { data: existingRoute, isLoading: isLoadingRoute } =
    useGetRouteByIdQuery(routeId, {
      skip: !routeId,
    })

  // Mantiene il ref sincronizzato con lo state dei waypoint.
  useEffect(() => {
    waypointsRef.current = waypoints
  }, [waypoints])

  useEffect(() => {
    if (isEditMode || position || error) return
    const timer = setTimeout(() => setTimedOut(true), 2500)
    return () => clearTimeout(timer)
  }, [isEditMode, position, error])

  const locationResolved = isEditMode || !!position || !!error || timedOut

  // Gestione della preview del percorso.
  useEffect(() => {
    if (waypoints.length < 2) return

    if (skipNextPreviewRef.current) {
      skipNextPreviewRef.current = false
      return
    }

    clearTimeout(previewTimerRef.current)

    previewTimerRef.current = setTimeout(async () => {
      setPreview(null)
      setRouteInfo(null)

      try {
        const result = await previewRoute({
          points: waypoints.map((w) => ({
            latitude: w.latitude,
            longitude: w.longitude,
            label: w.label || null,
            stopMinutes: w.stopMinutes ?? null,
          })),
          ...options,
        }).unwrap()

        setPreview(result.encodedPolyline)

        setRouteInfo({
          distanceKm: result.distanceMeters / 1000,
          durationMin: result.durationSeconds / 60,
        })
      } catch (err) {
        setErrorMsg(err?.data?.message || "Impossibile calcolare l'anteprima.")
      }
    }, 800)

    return () => {
      clearTimeout(previewTimerRef.current)
    }
  }, [waypoints, options, existingRoute, previewRoute])

  // Inizializzazione della mappa.
  useEffect(() => {
    if (isLoadingRoute) return
    if (!isEditMode && !locationResolved) return
    if (!containerRef.current) return
    if (mapRef.current) return

    const initialCenter =
      !isEditMode && position
        ? [position.longitude, position.latitude]
        : START_CENTER
    const initialZoom = !isEditMode && position ? 13 : 11

    const map = new Map({
      container: containerRef.current,
      style: MAP_STYLE_URL,
      center: initialCenter,
      zoom: initialZoom,
    })
    mapRef.current = map

    map.addControl(new FullscreenControl(), "top-right")

    map.on("error", (e) => {
      console.error("MapLibre error:", e.error)
    })

    // Click sulla mappa = aggiunta di un waypoint.
    map.on("click", (e) => {
      setWaypoints((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          latitude: e.lngLat.lat,
          longitude: e.lngLat.lng,
          label: "",
          stopMinutes: null,
          imageFile: null,
          imagePreviewUrl: null,
          existingImageUrl: null,
          isExisting: false,
        },
      ])
    })

    const initLayers = () => {
      map.resize()

      const empty = {
        type: "FeatureCollection",
        features: [],
      }

      if (
        map.getSource("draft") ||
        map.getSource("ghost") ||
        map.getSource("route")
      ) {
        return
      }

      map.addSource("draft", {
        type: "geojson",
        data: empty,
      })

      map.addSource("ghost", {
        type: "geojson",
        data: empty,
      })

      map.addSource("route", {
        type: "geojson",
        data: empty,
      })

      map.addLayer({
        id: "draft-line",
        type: "line",
        source: "draft",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
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
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
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
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
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

    // Ghost line dal punto precedente alla posizione del mouse.
    map.on("mousemove", (e) => {
      const list = waypointsRef.current
      const source = map.getSource("ghost")

      if (!source) return

      if (list.length === 0) {
        source.setData({
          type: "FeatureCollection",
          features: [],
        })
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
      map.getSource("ghost")?.setData({
        type: "FeatureCollection",
        features: [],
      })
    })

    return () => {
      map.remove()
      mapRef.current = null
      setMapReady(false)
    }
  }, [isLoadingRoute, isEditMode, locationResolved, position])

  // Disegna la linea tratteggiata tra i waypoint.
  useEffect(() => {
    if (!mapReady) return

    const source = mapRef.current?.getSource("draft")

    if (!source) return

    if (waypoints.length < 2) {
      source.setData({
        type: "FeatureCollection",
        features: [],
      })
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

  // Disegna sulla mappa il percorso calcolato dal backend.
  useEffect(() => {
    if (!mapReady) return

    const source = mapRef.current?.getSource("route")

    if (!source) return

    if (!preview || waypoints.length < 2) {
      source.setData({
        type: "FeatureCollection",
        features: [],
      })
      return
    }

    source.setData({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: decodePolyline(preview),
      },
    })
  }, [preview, mapReady, waypoints.length])

  // Gestione dei marker dei waypoint.
  useEffect(() => {
    if (!mapReady) return

    const map = mapRef.current

    if (!map) return

    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    waypoints.forEach((wp, index) => {
      const isStart = index === 0
      const isEnd = index === waypoints.length - 1 && waypoints.length > 1

      const el = document.createElement("div")

      el.style.cssText = "width: 28px; height: 28px; cursor: grab;"

      const dot = document.createElement("div")

      dot.style.cssText = `
        width: 100%;
        height: 100%;
        border-radius: 50%;
        position: relative;
        background: ${
          isStart ? "#4ADE80" : isEnd ? COLORS.danger : COLORS.accent
        };
        color: #08080A;
        font-family: ${FONTS.mono};
        font-weight: 700;
        font-size: 11px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid ${COLORS.bg};
      `

      dot.textContent = String(index + 1)

      el.appendChild(dot)

      const marker = new Marker({
        element: el,
        draggable: true,
      })
        .setLngLat([wp.longitude, wp.latitude])
        .addTo(map)

      marker.on("dragend", () => {
        const { lng, lat } = marker.getLngLat()

        setWaypoints((prev) =>
          prev.map((p) =>
            p.id === wp.id
              ? {
                  ...p,
                  latitude: lat,
                  longitude: lng,
                }
              : p,
          ),
        )
      })

      markersRef.current.push(marker)
    })

    return () => {
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []
    }
  }, [waypoints, mapReady])

  useEffect(() => {
    if (initializedFor) {
      skipNextPreviewRef.current = true
    }
  }, [initializedFor])

  // Cleanup generale di timer e ObjectURL.
  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current)
      clearTimeout(previewTimerRef.current)

      waypointsRef.current.forEach((wp) => {
        if (wp.imagePreviewUrl) {
          URL.revokeObjectURL(wp.imagePreviewUrl)
        }
      })
    }
  }, [])

  const setWaypointImage = (id, file) => {
    setWaypoints((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p

        if (p.imagePreviewUrl) {
          URL.revokeObjectURL(p.imagePreviewUrl)
        }

        return {
          ...p,
          imageFile: file,
          imagePreviewUrl: file ? URL.createObjectURL(file) : null,
        }
      }),
    )
  }

  const handleSearchChange = (e) => {
    const value = e.target.value

    setSearchText(value)

    clearTimeout(timerRef.current)

    if (!value.trim()) {
      setResults([])
      return
    }

    timerRef.current = setTimeout(async () => {
      try {
        const places = await searchPlaces(value)
        setResults(places)
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
        stopMinutes: null,
        imageFile: null,
        imagePreviewUrl: null,
        existingImageUrl: null,
        isExisting: false,
      },
    ])

    setSearchText("")
    setResults([])
  }

  const move = (index, direction) => {
    setWaypoints((prev) => {
      const next = [...prev]
      const target = index + direction

      if (target < 0 || target >= next.length) {
        return prev
      }

      ;[next[index], next[target]] = [next[target], next[index]]

      return next
    })
  }

  const remove = (id) => {
    setWaypoints((prev) => {
      const target = prev.find((p) => p.id === id)

      if (target?.imagePreviewUrl) {
        URL.revokeObjectURL(target.imagePreviewUrl)
      }

      return prev.filter((p) => p.id !== id)
    })
  }

  const setLabel = (id, label) => {
    setWaypoints((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              label,
            }
          : p,
      ),
    )
  }

  const setStopMinutes = (id, value) => {
    setWaypoints((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              stopMinutes: value === "" ? null : Math.max(0, Number(value)),
            }
          : p,
      ),
    )
  }

  const handleSave = async (e) => {
    e.preventDefault()

    setErrorMsg("")

    if (waypoints.length < 2) {
      setErrorMsg("Servono almeno due punti: partenza e arrivo.")
      return
    }

    if (!name.trim()) {
      setErrorMsg("Inserisci un nome per il percorso.")
      return
    }

    const images = []

    const points = waypoints.map((w) => {
      let imageIndex = null

      if (w.imageFile) {
        imageIndex = images.length
        images.push(w.imageFile)
      }

      return {
        id: w.isExisting ? w.id : null,
        latitude: w.latitude,
        longitude: w.longitude,
        label: w.label || null,
        imageIndex,
        stopMinutes: w.stopMinutes ?? null,
      }
    })

    try {
      if (isEditMode) {
        const updated = await updateRoute({
          routeId,
          data: {
            name: name.trim(),
            points,
            ...options,
          },
          images,
        }).unwrap()

        navigate(`/routes/${updated.id}`)
      } else {
        const created = await createRoute({
          data: {
            name: name.trim(),
            points,
            ...options,
          },
          images,
        }).unwrap()

        setSavedRoute(created)
      }
    } catch (err) {
      setErrorMsg(
        err?.data?.message ||
          (isEditMode
            ? "Impossibile modificare il percorso."
            : "Impossibile salvare il percorso."),
      )
    }
  }

  // Porta la mappa sul percorso esistente una sola volta per route.
  useEffect(() => {
    if (!mapReady || !existingRoute || hasFlownToRouteRef.current) {
      return
    }

    const coords = decodePolyline(existingRoute.encodedPolyline)

    if (coords.length === 0) return

    hasFlownToRouteRef.current = true

    const bounds = coords.reduce(
      (b, c) => b.extend(c),
      new LngLatBounds(coords[0], coords[0]),
    )

    mapRef.current?.fitBounds(bounds, {
      padding: 60,
      maxZoom: 14,
    })
  }, [mapReady, existingRoute])

  if (existingRoute && initializedFor !== existingRoute.id) {
    setInitializedFor(existingRoute.id)
    setName(existingRoute.name)
    setOptions({
      avoidHighways: existingRoute.avoidHighways,
      avoidTolls: existingRoute.avoidTolls,
      avoidFerries: existingRoute.avoidFerries,
    })
    setWaypoints(
      existingRoute.waypoints.map((wp) => ({
        id: wp.id,
        isExisting: true,
        latitude: wp.latitude,
        longitude: wp.longitude,
        label: wp.label || "",
        stopMinutes: wp.stopMinutes ?? null,
        existingImageUrl: wp.imageUrl || null,
        imageFile: null,
        imagePreviewUrl: null,
      })),
    )
    setPreview(existingRoute.encodedPolyline)
    setRouteInfo({
      distanceKm: existingRoute.distanceMeters / 1000,
      durationMin: existingRoute.durationSeconds / 60,
    })
  }

  return isLoadingRoute ? (
    <div className="centered-spinner">
      <Spinner animation="border" style={{ color: "#FF7A2F" }} />
    </div>
  ) : isEditMode && existingRoute && !existingRoute.owner ? (
    <div className="empty-state empty-state-margin">
      Non sei il creatore di questo percorso.
    </div>
  ) : (
    <div className="page route-editor-page" style={{ paddingBottom: 40 }}>
      <div className="route-editor-page__intro">
        <div className="btn-title-new-route">
          <button
            type="button"
            className="btn-icon"
            onClick={() => navigate(-1)}
            style={{ marginBottom: 10 }}
          >
            <FaArrowLeft />
          </button>
          <div
            className="page-title-title-new-route"
            style={{
              fontSize: 26,
              marginBottom: 4,
            }}
          >
            {isEditMode ? "MODIFICA PERCORSO" : "NUOVO PERCORSO"}
          </div>
        </div>

        <p className="route-editor-page__hint">
          TOCCA LA MAPPA PER AGGIUNGERE UN PUNTO · TRASCINA PER SPOSTARE
        </p>
      </div>

      <div className="map-frame">
        {!isEditMode && !locationResolved ? (
          <div className="centered-spinner" style={{ height: "100%" }}>
            <Spinner animation="border" style={{ color: "#FF7A2F" }} />
          </div>
        ) : (
          <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
        )}
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

        <div>
          <div className="field-label form-group__label">
            PREFERENZE PERCORSO
          </div>
          <div className="options-row">
            {[
              { key: "avoidHighways", label: "NO AUTOSTRADE" },
              { key: "avoidTolls", label: "NO PEDAGGI" },
              { key: "avoidFerries", label: "NO TRAGHETTI" },
            ].map((opt) => {
              const active = options[opt.key]
              return (
                <button
                  key={opt.key}
                  type="button"
                  className={`option-toggle ${active ? "option-toggle--active" : ""}`}
                  onClick={() =>
                    setOptions({ ...options, [opt.key]: !options[opt.key] })
                  }
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
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
                const isMiddle = !isStart && !isLast
                const middleCount = waypoints.length - 2

                if (isMiddle && !waypointsExpanded) {
                  if (index !== 1) return null
                  return (
                    <button
                      key="waypoints-summary"
                      type="button"
                      className="card waypoint-edit-row waypoint-edit-row--summary"
                      onClick={() => setWaypointsExpanded(true)}
                    >
                      <span>
                        {middleCount}{" "}
                        {middleCount === 1
                          ? "TAPPA INTERMEDIA"
                          : "TAPPE INTERMEDIE"}
                      </span>
                      <FaChevronDown size={11} />
                    </button>
                  )
                }

                return (
                  <div key={wp.id} className="card waypoint-edit-row">
                    <span
                      className={`waypoint-edit-row__number ${isStart ? "waypoint-row__number--start" : isLast ? "waypoint-row__number--end" : "waypoint-row__number"}`}
                    >
                      {index + 1}
                    </span>
                    <label className="waypoint-edit-row__photo-btn">
                      {wp.imagePreviewUrl || wp.existingImageUrl ? (
                        <img
                          src={wp.imagePreviewUrl || wp.existingImageUrl}
                          alt=""
                          className="waypoint-edit-row__photo-preview"
                        />
                      ) : (
                        <FaCamera size={12} />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) =>
                          setWaypointImage(wp.id, e.target.files?.[0] || null)
                        }
                      />
                    </label>
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
                    <input
                      type="number"
                      className="waypoint-edit-row__stop-input"
                      min={0}
                      placeholder="0"
                      value={wp.stopMinutes ?? ""}
                      onChange={(e) => setStopMinutes(wp.id, e.target.value)}
                      title="Minuti di sosta"
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

              {waypointsExpanded && waypoints.length > 2 && (
                <button
                  type="button"
                  className="waypoint-edit-row__collapse-btn"
                  onClick={() => setWaypointsExpanded(false)}
                >
                  <FaChevronUp size={11} /> COMPRIMI TAPPE INTERMEDIE
                </button>
              )}
            </div>
          )}
        </div>

        {errorMsg && <div className="error-text">{errorMsg}</div>}

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
                      state: {
                        newRouteId: savedRoute.id,
                        resumeDraft: true,
                      },
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
          disabled={isSaving || waypoints.length < 2}
          style={{
            opacity: isSaving || waypoints.length < 2 ? 0.5 : 1,
          }}
        >
          {isSaving ? (
            <Spinner size="sm" animation="border" />
          ) : isEditMode ? (
            "SALVA MODIFICHE"
          ) : (
            "CALCOLA E SALVA PERCORSO"
          )}
        </button>
      </form>
    </div>
  )
}

export default RouteEditorPage
