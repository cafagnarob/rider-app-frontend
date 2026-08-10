import { useEffect, useRef, useMemo, useState } from "react"
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
import NotificationBell from "../features/notifications/components/NotificationBell"
import { MAP_STYLE_URL } from "../utils/mapStyle"
import { COLORS } from "../styles/theme" // solo per i marcatori MapLibre, DOM creati fuori da React — stessa eccezione di EventDetailPage
import { EVENT_TYPE_LABELS } from "../utils/constants"
import "./HomePage.css"

const RADIUS_KM = 40
const INITIAL_CENTER = [12.4964, 41.9028]
const INITIAL_ZOOM = 5

function HomePage() {
  const navigate = useNavigate()
  const { position } = useGeolocation()

  const { data: me } = useGetCurrentUserQuery()

  const nearbyQuery = useSearchEventsQuery(
    {
      lat: position?.latitude,
      lng: position?.longitude,
      radiusKm: RADIUS_KM,
      page: 0,
      size: 20,
    },
    { skip: !position },
  )
  const fallbackQuery = useSearchEventsQuery(
    { page: 0, size: 20 },
    { skip: !!position },
  )
  const { data: eventsPage, isLoading: isLoadingEvents } = position
    ? nearbyQuery
    : fallbackQuery

  const { data: participating } = useGetParticipatingEventsQuery({
    page: 0,
    size: 1,
  })
  const { data: explore } = useGetFeedQuery({
    type: "EXPLORE",
    page: 0,
    size: 8,
  })

  const events = eventsPage?.content || []
  const nextEvent = participating?.content?.[0] || events[0] || null

  const communityPhotos = useMemo(
    () =>
      explore?.content?.filter((p) => p.media?.length > 0).slice(0, 6) || [],
    [explore],
  )

  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const hasFlownRef = useRef(false)
  const [mapReady, setMapReady] = useState(false)

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

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    events
      .filter((ev) => ev.meetingPointLat != null && ev.meetingPointLng != null)
      .forEach((ev) => {
        const isNext = nextEvent && ev.id === nextEvent.id

        const el = document.createElement("div")
        el.style.cssText = `
          width: ${isNext ? 34 : 26}px; height: ${isNext ? 34 : 26}px;
          border-radius: 50%;
          background: ${COLORS.accent};
          border: 2px solid ${COLORS.bg};
          cursor: pointer;
        `
        if (isNext) {
          const pulse = document.createElement("span")
          pulse.style.cssText = `
            position: absolute; inset: -6px; border-radius: 50%;
            background: ${COLORS.accent}; animation: qjpulse 2.6s ease-out infinite;
          `
          el.appendChild(pulse)
        }

        const marker = new Marker({ element: el })
          .setLngLat([ev.meetingPointLng, ev.meetingPointLat])
          .addTo(map)

        el.addEventListener("click", () => navigate(`/events/${ev.id}`))
        markersRef.current.push(marker)
      })
  }, [events, nextEvent, navigate])

  return (
    <div className="page" style={{ paddingBottom: 0 }}>
      <div className="header-row">
        <div>
          <div className="screen-label">
            CIAO, {(me?.name || me?.username || "").toUpperCase()}
          </div>
          <div className="page-title home-page__greeting-title">QJ RIDERS</div>
        </div>
        <div className="flex-gap-10">
          <NotificationBell />
          <Link to="/profile">
            <img
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
            {isLoadingEvents
              ? "CARICAMENTO..."
              : `${events.length} EVENTI ${position ? `ENTRO ${RADIUS_KM} KM` : "TROVATI"}`}
          </div>

          {nextEvent && (
            <div className="home-page__next-event">
              <div className="home-page__next-event-date">
                <span className="home-page__next-event-day">
                  {new Date(nextEvent.startDateTime)
                    .getDate()
                    .toString()
                    .padStart(2, "0")}
                </span>
                <span className="home-page__next-event-month">
                  {new Date(nextEvent.startDateTime)
                    .toLocaleDateString("it-IT", { month: "short" })
                    .toUpperCase()}
                </span>
              </div>
              <div className="home-page__next-event-info">
                <div className="home-page__next-event-title">
                  {nextEvent.title}
                </div>
                <div className="home-page__next-event-meta">
                  {new Date(nextEvent.startDateTime).toLocaleTimeString(
                    "it-IT",
                    { hour: "2-digit", minute: "2-digit" },
                  )}
                  {" · "}
                  {nextEvent.currentParticipants}/{nextEvent.maxParticipants}{" "}
                  ISCRITTI
                </div>
              </div>
              <button
                type="button"
                className="home-page__next-event-btn"
                onClick={() => navigate(`/events/${nextEvent.id}`)}
              >
                APRI
              </button>
            </div>
          )}
        </div>
      </div>

      {communityPhotos.length > 0 && (
        <div className="home-page__community-section">
          <div className="section-header home-page__community-header">
            <div className="section-title">DALLA COMMUNITY</div>
            <Link to="/feed" className="text-btn text-btn--accent">
              FEED
            </Link>
          </div>
          <div className="home-page__community-scroll">
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
        </div>
      )}

      <div className="home-page__nearby-section">
        <div className="section-header">
          <div className="section-title">USCITE IN ZONA</div>
          <Link to="/events" className="text-btn text-btn--accent">
            TUTTE
          </Link>
        </div>

        {events.length === 0 && !isLoadingEvents && (
          <div className="empty-state">
            Nessun evento nelle vicinanze al momento.
          </div>
        )}

        {events.slice(0, 5).map((ev) => (
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
      </div>
    </div>
  )
}

export default HomePage
