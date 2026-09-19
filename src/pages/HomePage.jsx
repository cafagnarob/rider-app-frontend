import { useEffect, useRef, useState } from "react"
import { Map as MapLibreMap, Marker, FullscreenControl } from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { useNavigate, Link } from "react-router-dom"
import { useGetCurrentUserQuery } from "../features/users/usersApi"
import {
  useSearchEventsQuery,
  useGetParticipatingEventsQuery,
} from "../features/events/eventsApi"
import { useGetFeedQuery } from "../features/social/postsApi"
import { useGeolocation } from "../utils/useGeolocation"
import NotificationBell from "../features/notification/components/NotificationBell"
import { MAP_STYLE_URL } from "../utils/mapStyle"
import { COLORS } from "../styles/theme" // solo per i marcatori MapLibre, DOM creati fuori da React — stessa eccezione di EventDetailPage
import { EVENT_TYPE_LABELS } from "../utils/constants"
import "../pages/CSS/HomePage.css"
import Avatar from "../components/Avatar"
import { useGetImportableRoutesForMapQuery } from "../features/routesMap/routesApi"
import { decodePolyline } from "../utils/polyline"
import Supercluster from "supercluster"

const RADIUS_KM = 40
const INITIAL_CENTER = [12.4964, 41.9028]
const INITIAL_ZOOM = 5
const ROUTE_COLOR = "#6df55b"
const CLUSTER_MAX_ZOOM = 16

function computeDeoverlapOffsets(points, thresholdPx, fanRadiusPx) {
  const offsets = points.map(() => [0, 0])
  const used = new Array(points.length).fill(false)

  for (let i = 0; i < points.length; i++) {
    if (used[i]) continue
    const group = [i]
    used[i] = true
    for (let j = i + 1; j < points.length; j++) {
      if (used[j]) continue
      const dx = points[j].x - points[i].x
      const dy = points[j].y - points[i].y
      if (Math.hypot(dx, dy) < thresholdPx) {
        group.push(j)
        used[j] = true
      }
    }
    if (group.length > 1) {
      group.forEach((idx, k) => {
        const angle = (2 * Math.PI * k) / group.length
        offsets[idx] = [
          Math.cos(angle) * fanRadiusPx,
          Math.sin(angle) * fanRadiusPx,
        ]
      })
    }
  }
  return offsets
}

function HomePage() {
  const navigate = useNavigate()
  const { position } = useGeolocation()
  const { data: me } = useGetCurrentUserQuery()

  // --- tutto lo stato, prima di qualunque query che lo usa ---
  const [nearbyPage, setNearbyPage] = useState(0)
  const [nearbyAccumulated, setNearbyAccumulated] = useState([])
  const [explorePage, setExplorePage] = useState(0)
  const [communityAccumulated, setCommunityAccumulated] = useState([])
  const [activeSection, setActiveSection] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [selectedRoute, setSelectedRoute] = useState(null)
  const [mapReady, setMapReady] = useState(false)
  const routeEndMarkerRef = useRef(null)

  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const routeMarkersRef = useRef([])
  const hasFlownRef = useRef(false)
  const eventClusterIndexRef = useRef(null)
  const routeClusterIndexRef = useRef(null)

  const [mapCenter, setMapCenter] = useState(null)
  const mapCenterDebounceRef = useRef(null)

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    const center = map.getCenter()
    setMapCenter({ lat: center.lat, lng: center.lng })

    const handleMoveEnd = () => {
      clearTimeout(mapCenterDebounceRef.current)
      mapCenterDebounceRef.current = setTimeout(() => {
        const c = map.getCenter()
        setMapCenter({ lat: c.lat, lng: c.lng })
      }, 600)
    }

    map.on("moveend", handleMoveEnd)
    return () => {
      clearTimeout(mapCenterDebounceRef.current)
      map.off("moveend", handleMoveEnd)
    }
  }, [mapReady])

  // --- query, ora possono usare tranquillamente nearbyPage/explorePage ---
  const { data: allEventsPage, isLoading: isLoadingMap } = useSearchEventsQuery(
    { page: 0, size: 50 },
    { refetchOnMountOrArgChange: true },
  )

  const nearbyQuery = useSearchEventsQuery(
    {
      lat: position?.latitude,
      lng: position?.longitude,
      radiusKm: RADIUS_KM,
      page: nearbyPage,
      size: 20,
    },
    { skip: !position, refetchOnMountOrArgChange: true },
  )

  const { data: participating } = useGetParticipatingEventsQuery(
    { page: 0, size: 1 },
    { refetchOnMountOrArgChange: true },
  )

  const { data: explore, isFetching: isFetchingExplore } = useGetFeedQuery(
    { type: "EXPLORE", page: explorePage, size: 8 },
    { refetchOnMountOrArgChange: true },
  )

  const { data: importableRoutes } = useGetImportableRoutesForMapQuery(
    mapCenter ? { lat: mapCenter.lat, lng: mapCenter.lng } : undefined,
    { skip: !mapCenter },
  )

  // --- valori derivati ---
  const mapEvents = allEventsPage?.content || []
  const nearbyEvents = position ? nearbyAccumulated : mapEvents
  const communityPhotos = communityAccumulated
  const nextEvent = participating?.content?.[0] || nearbyEvents[0] || null
  const displayedEvent = selectedEvent || nextEvent

  const toggleSection = (key) => {
    setActiveSection((prev) => (prev === key ? null : key))
  }

  const handleNearbyScroll = (e) => {
    if (!position || nearbyQuery.isFetching || nearbyQuery.data?.last) return
    const el = e.target
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
      setNearbyPage((p) => p + 1)
    }
  }

  const handleCommunityScroll = (e) => {
    if (isFetchingExplore || explore?.last) return
    const el = e.target
    if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 60) {
      setExplorePage((p) => p + 1)
    }
  }

  const [prevNearbyData, setPrevNearbyData] = useState(null)
  if (nearbyQuery.data && nearbyQuery.data !== prevNearbyData) {
    setPrevNearbyData(nearbyQuery.data)
    setNearbyAccumulated((prev) =>
      nearbyPage === 0
        ? nearbyQuery.data.content
        : [...prev, ...nearbyQuery.data.content],
    )
  }

  const [prevExploreData, setPrevExploreData] = useState(null)
  if (explore && explore !== prevExploreData) {
    setPrevExploreData(explore)
    const withMedia = explore.content.filter((p) => p.media?.length > 0)
    setCommunityAccumulated((prev) =>
      explorePage === 0 ? withMedia : [...prev, ...withMedia],
    )
  }

  useEffect(() => {
    if (!containerRef.current) return
    const map = new MapLibreMap({
      container: containerRef.current,
      style: MAP_STYLE_URL,
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
    })
    mapRef.current = map
    map.addControl(new FullscreenControl(), "top-right")
    const handleLoad = () => {
      map.resize()
      map.addSource("importable-route-line", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      })
      map.addLayer({
        id: "importable-route-line",
        type: "line",
        source: "importable-route-line",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": ROUTE_COLOR,
          "line-width": 4,
          "line-opacity": 0.85,
        },
      })
      setMapReady(true)
    }
    map.on("load", handleLoad)
    return () => {
      map.off("load", handleLoad)
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady || !position || hasFlownRef.current) return
    hasFlownRef.current = true
    map.flyTo({
      center: [position.longitude, position.latitude],
      zoom: 12,
      speed: 0.8,
      curve: 1.4,
      essential: true,
    })
  }, [mapReady, position])

  // --- ricostruisce l'indice di raggruppamento eventi quando i dati cambiano ---
  useEffect(() => {
    const points = mapEvents
      .filter((ev) => ev.meetingPointLat != null && ev.meetingPointLng != null)
      .map((ev) => ({
        type: "Feature",
        properties: { eventId: ev.id },
        geometry: {
          type: "Point",
          coordinates: [ev.meetingPointLng, ev.meetingPointLat],
        },
      }))
    const index = new Supercluster({ radius: 50, maxZoom: CLUSTER_MAX_ZOOM })
    index.load(points)
    eventClusterIndexRef.current = index
  }, [mapEvents])

  // --- disegna cluster/marcatori di entrambi i tipi insieme, evitando sovrapposizioni evento↔percorso ---
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    const OVERLAP_THRESHOLD_PX = 44
    const FAN_RADIUS_PX = 26

    const renderAllMarkers = () => {
      const eventIndex = eventClusterIndexRef.current
      const routeIndex = routeClusterIndexRef.current
      if (!eventIndex || !routeIndex) return

      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []
      routeMarkersRef.current.forEach((m) => m.remove())
      routeMarkersRef.current = []

      const bounds = map.getBounds()
      const bbox = [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ]
      const zoom = Math.round(map.getZoom())

      const eventClusters = eventIndex.getClusters(bbox, zoom)
      const routeClusters = routeIndex.getClusters(bbox, zoom)

      const descriptors = [
        ...eventClusters.map((feature) => ({
          kind: "event",
          feature,
          lngLat: feature.geometry.coordinates,
        })),
        ...routeClusters.map((feature) => ({
          kind: "route",
          feature,
          lngLat: feature.geometry.coordinates,
        })),
      ]
      descriptors.forEach((d) => {
        const p = map.project(d.lngLat)
        d.pixel = { x: p.x, y: p.y }
      })

      const offsets = computeDeoverlapOffsets(
        descriptors.map((d) => d.pixel),
        OVERLAP_THRESHOLD_PX,
        FAN_RADIUS_PX,
      )

      descriptors.forEach((d, i) => {
        const [lng, lat] = d.lngLat
        const offset = offsets[i]
        const feature = d.feature

        if (d.kind === "event") {
          if (feature.properties.cluster) {
            const count = feature.properties.point_count
            const el = document.createElement("div")
            el.style.cssText = `
            width: 38px; height: 38px; border-radius: 50%; cursor: pointer;
            background: ${COLORS.accent}; border: 3px solid ${COLORS.bg};
            display: flex; align-items: center; justify-content: center;
            color: ${COLORS.bg}; font-family: 'IBM Plex Mono', monospace; font-weight: 700; font-size: 13px;
          `
            el.textContent = String(count)
            el.addEventListener("click", () => {
              const expansionZoom = Math.min(
                eventIndex.getClusterExpansionZoom(
                  feature.properties.cluster_id,
                ),
                CLUSTER_MAX_ZOOM,
              )
              map.easeTo({ center: [lng, lat], zoom: expansionZoom })
            })
            const marker = new Marker({ element: el, offset })
              .setLngLat([lng, lat])
              .addTo(map)
            markersRef.current.push(marker)
            return
          }

          const ev = mapEvents.find((e) => e.id === feature.properties.eventId)
          if (!ev) return
          const isNext = displayedEvent && ev.id === displayedEvent.id
          const el = document.createElement("div")
          el.style.cssText = `
          width: ${isNext ? 34 : 26}px; height: ${isNext ? 34 : 26}px;
          border-radius: 50%; background: ${COLORS.accent}; border: 2px solid ${COLORS.bg}; cursor: pointer;
        `
          if (isNext) {
            const pulse = document.createElement("span")
            pulse.style.cssText = `position: absolute; inset: -6px; border-radius: 50%; background: ${COLORS.accent}; animation: qjpulse 2.6s ease-out infinite;`
            el.appendChild(pulse)
          }
          const marker = new Marker({ element: el, offset })
            .setLngLat([lng, lat])
            .addTo(map)
          el.addEventListener("click", () => {
            setSelectedEvent(ev)
            setSelectedRoute(null)
          })
          markersRef.current.push(marker)
          return
        }

        if (feature.properties.cluster) {
          const count = feature.properties.point_count
          const el = document.createElement("div")
          el.style.cssText = `
          width: 34px; height: 34px; border-radius: 50%; cursor: pointer;
          background: ${ROUTE_COLOR}; border: 3px solid ${COLORS.bg};
          display: flex; align-items: center; justify-content: center;
          color: ${COLORS.bg}; font-family: 'IBM Plex Mono', monospace; font-weight: 700; font-size: 12px;
        `
          el.textContent = String(count)
          el.addEventListener("click", (e) => {
            e.stopPropagation()
            const expansionZoom = Math.min(
              routeIndex.getClusterExpansionZoom(feature.properties.cluster_id),
              CLUSTER_MAX_ZOOM,
            )
            map.easeTo({ center: [lng, lat], zoom: expansionZoom })
          })
          const marker = new Marker({ element: el, offset })
            .setLngLat([lng, lat])
            .addTo(map)
          routeMarkersRef.current.push(marker)
          return
        }

        const r = (importableRoutes || []).find(
          (route) => route.id === feature.properties.routeId,
        )
        if (!r) return
        const isSelected = selectedRoute && r.id === selectedRoute.id
        const el = document.createElement("div")
        el.style.cssText = `
        width: ${isSelected ? 30 : 22}px; height: ${isSelected ? 30 : 22}px;
        border-radius: 50%; background: ${ROUTE_COLOR}; border: 2px solid ${COLORS.bg}; cursor: pointer;
      `
        const marker = new Marker({ element: el, offset })
          .setLngLat([lng, lat])
          .addTo(map)
        el.addEventListener("click", (e) => {
          e.stopPropagation()
          setSelectedRoute((prev) => (prev?.id === r.id ? null : r))
          setSelectedEvent(null)
        })
        routeMarkersRef.current.push(marker)
      })
    }

    renderAllMarkers()
    map.on("moveend", renderAllMarkers)
    return () => map.off("moveend", renderAllMarkers)
  }, [mapReady, mapEvents, importableRoutes, displayedEvent, selectedRoute])

  // --- ricostruisce l'indice di raggruppamento percorsi quando i dati cambiano ---
  useEffect(() => {
    const points = (importableRoutes || [])
      .filter((r) => r.waypoints?.length > 0)
      .map((r) => ({
        type: "Feature",
        properties: { routeId: r.id },
        geometry: {
          type: "Point",
          coordinates: [r.waypoints[0].longitude, r.waypoints[0].latitude],
        },
      }))
    const index = new Supercluster({ radius: 50, maxZoom: CLUSTER_MAX_ZOOM })
    index.load(points)
    routeClusterIndexRef.current = index
  }, [importableRoutes])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    const source = map.getSource("importable-route-line")
    if (!source) return

    routeEndMarkerRef.current?.remove()
    routeEndMarkerRef.current = null

    if (!selectedRoute) {
      source.setData({ type: "FeatureCollection", features: [] })
      return
    }

    const coords = decodePolyline(selectedRoute.encodedPolyline)
    source.setData({
      type: "Feature",
      geometry: { type: "LineString", coordinates: coords },
    })

    if (coords.length > 0) {
      const [endLng, endLat] = coords[coords.length - 1]
      const el = document.createElement("div")
      el.style.cssText = `
      width: 24px; height: 24px; border-radius: 50%;
      background: ${COLORS.danger}; border: 2px solid ${COLORS.bg};
    `
      el.addEventListener("click", (e) => {
        e.stopPropagation()
        setSelectedRoute(null)
      })
      routeEndMarkerRef.current = new Marker({ element: el })
        .setLngLat([endLng, endLat])
        .addTo(map)
    }
  }, [selectedRoute, mapReady])

  return (
    <div className="page" style={{ paddingBottom: 0 }}>
      <div className="home-page__content-shell">
        <div className="header-row">
          <div>
            <div className="mobile-only">
              <div className="screen-label">
                CIAO, {(me?.name || me?.username || "").toUpperCase()}
              </div>
              <div className="page-title home-page__greeting-title">
                FlowRides
              </div>
            </div>
          </div>
          <div className="flex-gap-10">
            <div className="mobile-only">
              <NotificationBell />
            </div>
            <Link to="/profile" className="mobile-only">
              <Avatar
                src={me?.profilePicture}
                alt=""
                className="home-page__avatar"
              />
            </Link>
          </div>
        </div>

        <div className="home-page__search-section">
          <button
            type="button"
            className="home-page__search-btn"
            onClick={() => navigate("/search")}
          >
            Cerca motociclisti, moto, luoghi
          </button>
        </div>

        <div className="home-page__map-section">
          <div className="home-page__map-card">
            <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

            <div className="home-page__map-badge">
              {isLoadingMap ? "CARICAMENTO..." : `${mapEvents.length} EVENTI`}
            </div>

            {selectedRoute ? (
              <div className="home-page__next-event">
                <div className="home-page__next-event-info" style={{ flex: 1 }}>
                  <div className="home-page__next-event-title">
                    {selectedRoute.name}
                  </div>
                  <div className="home-page__next-event-meta">
                    {(selectedRoute.distanceMeters / 1000)
                      .toFixed(1)
                      .replace(".", ",")}{" "}
                    KM
                    {" · "}
                    {Math.round(selectedRoute.durationSeconds / 60)} MIN
                  </div>
                </div>
                <button
                  type="button"
                  className="home-page__next-event-btn"
                  style={{ background: ROUTE_COLOR }}
                  onClick={() => navigate(`/routes/${selectedRoute.id}`)}
                >
                  APRI
                </button>
              </div>
            ) : (
              displayedEvent && (
                <div className="home-page__next-event">
                  <div className="home-page__next-event-date">
                    <span className="home-page__next-event-day">
                      {new Date(displayedEvent.startDateTime)
                        .getDate()
                        .toString()
                        .padStart(2, "0")}
                    </span>
                    <span className="home-page__next-event-month">
                      {new Date(displayedEvent.startDateTime)
                        .toLocaleDateString("it-IT", { month: "short" })
                        .toUpperCase()}
                    </span>
                  </div>
                  <div className="home-page__next-event-info">
                    <div className="home-page__next-event-title">
                      {displayedEvent.title}
                    </div>
                    <div className="home-page__next-event-meta">
                      {new Date(
                        displayedEvent.startDateTime,
                      ).toLocaleTimeString("it-IT", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {" · "}
                      {displayedEvent.currentParticipants}/
                      {displayedEvent.maxParticipants} ISCRITTI
                    </div>
                  </div>
                  <button
                    type="button"
                    className="home-page__next-event-btn"
                    onClick={() => navigate(`/events/${displayedEvent.id}`)}
                  >
                    APRI
                  </button>
                </div>
              )
            )}
          </div>
        </div>

        <div className="home-page__lower-grid">
          {communityPhotos.length > 0 && (
            <div className="home-page__community-section">
              <div className="section-header home-page__community-header">
                <button
                  type="button"
                  className="section-title home-page__section-toggle"
                  onClick={() => toggleSection("community")}
                >
                  DALLA COMMUNITY
                </button>
                <Link to="/feed" className="text-btn text-btn--accent">
                  FEED
                </Link>
              </div>

              {activeSection === "community" && (
                <div
                  className="home-page__community-scroll"
                  onScroll={handleCommunityScroll}
                >
                  {communityPhotos.map((post) => (
                    <Link
                      key={post.id}
                      to={`/posts/${post.id}`}
                      className="home-page__community-item"
                    >
                      <img src={post.media[0].mediaUrl} alt="" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="home-page__nearby-section">
            <div className="section-header">
              <button
                type="button"
                className="section-title home-page__section-toggle"
                onClick={() => toggleSection("nearby")}
              >
                USCITE IN ZONA
              </button>
              <Link to="/events" className="text-btn text-btn--accent">
                TUTTE
              </Link>
            </div>

            {activeSection === "nearby" && (
              <div
                className="home-page__nearby-list"
                onScroll={handleNearbyScroll}
              >
                {nearbyEvents.length === 0 && !isLoadingMap && (
                  <div className="empty-state">
                    Nessun evento nelle vicinanze al momento.
                  </div>
                )}
                {nearbyEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="home-event-row"
                    onClick={() => navigate(`/events/${ev.id}`)}
                  >
                    <div className="event-row__date-box">
                      <span className="event-row__date-day">
                        {new Date(ev.startDateTime)
                          .getDate()
                          .toString()
                          .padStart(2, "0")}
                      </span>
                      <span className="event-row__date-month">
                        {new Date(ev.startDateTime)
                          .toLocaleDateString("it-IT", { month: "short" })
                          .toUpperCase()}
                      </span>
                    </div>
                    <div className="home-event-row__info">
                      <div className="home-event-row__title">{ev.title}</div>
                      <div className="home-event-row__meta">
                        {ev.type !== "STANDARD" && (
                          <span style={{ color: "var(--color-accent)" }}>
                            {EVENT_TYPE_LABELS[ev.type]} ·{" "}
                          </span>
                        )}
                        {ev.organizerUsername} · {ev.currentParticipants}/
                        {ev.maxParticipants}
                      </div>
                    </div>
                    <span className="home-event-row__chevron">{">"}</span>
                  </div>
                ))}
                {nearbyQuery.isFetching && nearbyPage > 0 && (
                  <div className="home-page__scroll-loading">
                    CARICAMENTO...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
