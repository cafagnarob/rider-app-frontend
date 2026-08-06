import { useEffect, useRef, useMemo } from "react"
import { Map as MapLibreMap, Marker } from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { useNavigate, Link } from "react-router-dom"
import { FaBell } from "react-icons/fa"
import { useGetCurrentUserQuery } from "../features/users/usersApi"
import { useGetUnreadCountQuery } from "../features/notification/notificationsApi"
import {
  useSearchEventsQuery,
  useGetParticipatingEventsQuery,
} from "../features/events/eventsApi"
import { useGetFeedQuery } from "../features/social/postsApi"
import { useGeolocation } from "../utils/useGeolocation"
import { COLORS, FONTS, styles } from "../styles/theme"

const RADIUS_KM = 40

function HomePage() {
  const navigate = useNavigate()
  const { position } = useGeolocation()

  const { data: me } = useGetCurrentUserQuery()
  const { data: unread } = useGetUnreadCountQuery(undefined, {
    pollingInterval: 30000,
  })

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

  useEffect(() => {
    if (!containerRef.current) return

    const center = position
      ? [position.longitude, position.latitude]
      : events[0]?.meetingPointLng != null
        ? [events[0].meetingPointLng, events[0].meetingPointLat]
        : [12.4964, 41.9028] // fallback: Roma

    const map = new MapLibreMap({
      container: containerRef.current,
      style: `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${import.meta.env.VITE_MAPTILER_KEY}`,
      center,
      zoom: 10,
    })
    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
          position: relative;
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
    <div style={{ ...styles.pageBg, paddingTop: 20 }}>
      {/* header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 20px",
        }}
      >
        <div>
          <div style={styles.screenLabel}>
            CIAO, {(me?.name || me?.username || "").toUpperCase()}
          </div>
          <div style={{ ...styles.pageTitle, fontSize: 30 }}>QJ RIDERS</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={() => navigate("/notifications")}
            style={{ ...styles.iconButton, position: "relative" }}
          >
            <FaBell />
            {unread?.count > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: COLORS.accent,
                }}
              />
            )}
          </button>
          <Link to="/profile">
            <img
              src={me?.profilePicture}
              alt=""
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                objectFit: "cover",
                border: `1px solid ${COLORS.borderStrong}`,
              }}
            />
          </Link>
        </div>
      </div>

      {/* ricerca */}
      <div style={{ padding: "20px 20px 0" }}>
        <button
          type="button"
          onClick={() => navigate("/search")}
          style={{
            width: "100%",
            height: 48,
            borderRadius: 14,
            background: COLORS.card,
            border: `1px solid ${COLORS.border}`,
            color: COLORS.textFaint,
            fontFamily: FONTS.body,
            fontSize: 14,
            textAlign: "left",
            padding: "0 15px",
            cursor: "pointer",
          }}
        >
          Cerca motociclisti, moto, luoghi
        </button>
      </div>

      {/* mappa */}
      <div style={{ padding: "20px 20px 0" }}>
        <div
          style={{
            position: "relative",
            height: 340,
            borderRadius: 22,
            overflow: "hidden",
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

          <div
            style={{
              position: "absolute",
              left: 14,
              top: 14,
              padding: "7px 11px",
              borderRadius: 9,
              background: "rgba(10,10,12,.78)",
              border: `1px solid ${COLORS.border}`,
              fontFamily: FONTS.mono,
              fontSize: 10,
              letterSpacing: ".1em",
              color: COLORS.textSecondary,
            }}
          >
            {isLoadingEvents
              ? "CARICAMENTO..."
              : `${events.length} EVENTI ${position ? `ENTRO ${RADIUS_KM} KM` : "TROVATI"}`}
          </div>

          {nextEvent && (
            <div
              style={{
                position: "absolute",
                left: 14,
                right: 14,
                bottom: 14,
                padding: 14,
                borderRadius: 16,
                background: "rgba(12,12,14,.86)",
                border: `1px solid ${COLORS.border}`,
                backdropFilter: "blur(8px)",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: COLORS.accent,
                  color: COLORS.onAccent,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: FONTS.mono,
                  lineHeight: 1.1,
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 500 }}>
                  {new Date(nextEvent.startDateTime)
                    .getDate()
                    .toString()
                    .padStart(2, "0")}
                </span>
                <span style={{ fontSize: 9 }}>
                  {new Date(nextEvent.startDateTime)
                    .toLocaleDateString("it-IT", { month: "short" })
                    .toUpperCase()}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: FONTS.heading,
                    fontWeight: 600,
                    fontSize: 19,
                    lineHeight: 1.1,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {nextEvent.title}
                </div>
                <div
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: 10,
                    color: COLORS.textSecondary,
                    marginTop: 3,
                  }}
                >
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
                onClick={() => navigate(`/events/${nextEvent.id}`)}
                style={{
                  height: 36,
                  padding: "0 14px",
                  borderRadius: 10,
                  background: COLORS.accent,
                  border: "none",
                  color: COLORS.onAccent,
                  fontFamily: FONTS.heading,
                  fontWeight: 700,
                  fontSize: 15,
                  letterSpacing: ".04em",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                APRI
              </button>
            </div>
          )}
        </div>
      </div>

      {/* dalla community */}
      {communityPhotos.length > 0 && (
        <div
          style={{
            marginTop: 26,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              padding: "0 20px",
            }}
          >
            <div style={styles.sectionTitle}>DALLA COMMUNITY</div>
            <Link
              to="/feed"
              style={{
                fontFamily: FONTS.mono,
                fontSize: 11,
                color: COLORS.accent,
              }}
            >
              FEED
            </Link>
          </div>
          <div
            style={{
              display: "flex",
              gap: 12,
              overflowX: "auto",
              padding: "0 20px 4px",
            }}
          >
            {communityPhotos.map((post) => (
              <Link
                key={post.id}
                to={`/posts/${post.id}`}
                style={{
                  flex: "0 0 auto",
                  width: 140,
                  borderRadius: 16,
                  overflow: "hidden",
                  border: `1px solid ${COLORS.border}`,
                }}
              >
                <img
                  src={post.media[0].mediaUrl}
                  alt=""
                  style={{
                    width: 140,
                    height: 140,
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* uscite in zona */}
      <div
        style={{
          marginTop: 26,
          padding: "0 20px 8px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <div style={styles.sectionTitle}>USCITE IN ZONA</div>
          <Link
            to="/events"
            style={{
              fontFamily: FONTS.mono,
              fontSize: 11,
              color: COLORS.accent,
            }}
          >
            TUTTE
          </Link>
        </div>

        {events.length === 0 && !isLoadingEvents && (
          <div style={styles.emptyState}>
            Nessun evento nelle vicinanze al momento.
          </div>
        )}

        {events.slice(0, 5).map((ev) => (
          <div
            key={ev.id}
            onClick={() => navigate(`/events/${ev.id}`)}
            style={{
              display: "flex",
              gap: 13,
              alignItems: "center",
              padding: 13,
              borderRadius: 16,
              background: COLORS.card,
              border: `1px solid ${COLORS.borderSoft}`,
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                flexShrink: 0,
                borderRadius: 12,
                background: COLORS.surfaceRaised,
                border: `1px solid ${COLORS.borderSoft}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: FONTS.mono,
                color: COLORS.accent,
              }}
            >
              <span style={{ fontSize: 14 }}>
                {new Date(ev.startDateTime)
                  .getDate()
                  .toString()
                  .padStart(2, "0")}
              </span>
              <span style={{ fontSize: 9, color: COLORS.textMuted }}>
                {new Date(ev.startDateTime)
                  .toLocaleDateString("it-IT", { month: "short" })
                  .toUpperCase()}
              </span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: FONTS.heading,
                  fontWeight: 600,
                  fontSize: 19,
                  lineHeight: 1.1,
                }}
              >
                {ev.title}
              </div>
              <div
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 10,
                  color: COLORS.textMuted,
                  marginTop: 4,
                }}
              >
                {ev.organizerUsername} · {ev.currentParticipants}/
                {ev.maxParticipants}
              </div>
            </div>
            <span
              style={{
                fontFamily: FONTS.heading,
                color: COLORS.textFaint,
                fontSize: 20,
              }}
            >
              {">"}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default HomePage
