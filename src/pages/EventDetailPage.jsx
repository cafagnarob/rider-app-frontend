import { useEffect, useRef, useState } from "react"
import { Spinner } from "react-bootstrap"
import { useParams, useNavigate } from "react-router-dom"
import {
  Map as MapLibreMap,
  Marker,
  LngLatBounds,
  Popup,
  FullscreenControl,
} from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import {
  useGetEventByIdQuery,
  useChangeEventStatusMutation,
} from "../features/events/eventsApi"
import {
  useJoinEventMutation,
  useCancelMyParticipationMutation,
  useGetAcceptedParticipantsQuery,
} from "../features/events/participationApi"
import OrganizerPanel from "../features/events/components/OrganizerPanel"
import { decodePolyline } from "../utils/polyline"
import { VISIBILITY_LABELS } from "../utils/constants"
import { COLORS, FONTS, styles } from "../styles/theme"
import { FaArrowLeft } from "react-icons/fa"
import AccessCodeCard from "../features/events/components/AccessCodeCard"
import { MAP_STYLE_URL } from "../utils/mapStyle"

function EventDetailPage() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const { data: event, isLoading, isError } = useGetEventByIdQuery(eventId)

  const { data: participants } = useGetAcceptedParticipantsQuery(eventId)

  const [joinEvent, { isLoading: isJoining }] = useJoinEventMutation()
  const [cancelParticipation, { isLoading: isCancelling }] =
    useCancelMyParticipationMutation()
  const [changeStatus] = useChangeEventStatusMutation()

  const [accessCode, setAccessCode] = useState("")
  const [joinError, setJoinError] = useState("")
  const [confirmType, setConfirmType] = useState(null)

  const containerRef = useRef(null)
  const mapRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current || !event?.route?.encodedPolyline) return

    const coordinates = decodePolyline(event.route.encodedPolyline)

    const isValidCoordinate = ([lng, lat]) =>
      Number.isFinite(lng) &&
      Number.isFinite(lat) &&
      lng >= -180 &&
      lng <= 180 &&
      lat >= -90 &&
      lat <= 90

    if (coordinates.length === 0 || !coordinates.every(isValidCoordinate))
      return

    const map = new MapLibreMap({
      container: containerRef.current,
      style: MAP_STYLE_URL,
      center: coordinates[0],
      zoom: 11,
    })
    mapRef.current = map

    map.addControl(new FullscreenControl(), "top-right")

    const draw = () => {
      map.resize()
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
        paint: {
          "line-color": COLORS.accent,
          "line-width": 4,
          "line-opacity": 0.85,
        },
      })
      const validWaypoints = (event.route.waypoints || []).filter((wp) =>
        isValidCoordinate([wp.longitude, wp.latitude]),
      )
      const lastIndex = validWaypoints.length - 1

      validWaypoints.forEach((wp, index) => {
        const isStart = index === 0
        const isEnd = index === lastIndex && lastIndex > 0
        const isEndpoint = isStart || isEnd

        const el = document.createElement("div")
        el.style.cssText = `
       width: ${isEndpoint ? 20 : 11}px;
      height: ${isEndpoint ? 20 : 11}px;
      border-radius: 50%;
      background: ${isStart ? "#4ADE80" : isEnd ? COLORS.danger : COLORS.accent};
      border: ${isEndpoint ? 3 : 2}px solid ${COLORS.bg};

    `
        if (isStart) {
          const pulse = document.createElement("span")
          pulse.style.cssText = `
         position: absolute; inset: -8px; border-radius: 50%;
        background: #4ADE80; animation: qjpulse 2.6s ease-out infinite;
      `
          el.appendChild(pulse)
        }
        const marker = new Marker({ element: el }).setLngLat([
          wp.longitude,
          wp.latitude,
        ])

        if (wp.label && wp.label.trim()) {
          marker.setPopup(
            new Popup({
              offset: 14,
              closeButton: false,
              className: "qj-popup",
            }).setText(wp.label),
          )
        }

        marker.addTo(map)
      })

      const bounds = coordinates.reduce(
        (b, c) => b.extend(c),
        new LngLatBounds(coordinates[0], coordinates[0]),
      )
      map.fitBounds(bounds, { padding: 40, maxZoom: 14 })
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
  }, [event?.route?.encodedPolyline])

  const handleJoin = async () => {
    setJoinError("")
    try {
      await joinEvent({ eventId, accessCode }).unwrap()
      setAccessCode("")
    } catch (err) {
      setJoinError(
        err.data?.message || "Impossibile partecipare a questo evento.",
      )
    }
  }

  const handleCancelParticipation = async () => {
    try {
      await cancelParticipation(eventId).unwrap()
      setConfirmType(null)
    } catch (err) {
      setJoinError(
        err.data?.message || "Impossibile annullare la partecipazione.",
      )
    }
  }

  const handleCancelEvent = async () => {
    try {
      await changeStatus({ eventId, status: "CANCELLED" }).unwrap()
      setConfirmType(null)
    } catch (err) {
      console.error(err)
    }
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <Spinner animation="border" style={{ color: COLORS.accent }} />
      </div>
    )
  }

  if (isError)
    return (
      <div style={{ ...styles.emptyState, margin: 20 }}>
        Evento non trovato o accesso negato.
      </div>
    )

  if (event.locked) {
    const distanceKmLocked = event.route
      ? (event.route.distanceMeters / 1000).toFixed(1).replace(".", ",")
      : null
    const durationMinLocked = event.route
      ? Math.round(event.route.durationSeconds / 60)
      : null

    return (
      <div style={{ ...styles.pageBg, minHeight: "100vh", paddingTop: 20 }}>
        <div style={{ padding: "0 20px" }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{ ...styles.iconButton, marginBottom: 16 }}
          >
            <FaArrowLeft />
          </button>

          <div style={{ ...styles.pageTitle, fontSize: 30, marginBottom: 8 }}>
            {event.title}
          </div>
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 11,
              color: COLORS.textMuted,
              marginBottom: 16,
            }}
          >
            Organizzato da {event.organizerUsername}
          </div>

          <span
            style={{
              display: "inline-block",
              padding: "5px 11px",
              borderRadius: 9,
              marginBottom: 18,
              background: COLORS.accentSoftBg,
              border: `1px solid ${COLORS.accentSoftBorder}`,
              fontFamily: FONTS.mono,
              fontSize: 10,
              color: COLORS.accent,
            }}
          >
            EVENTO CON CODICE
          </span>

          <p
            style={{
              fontSize: 14.5,
              lineHeight: 1.55,
              color: "rgba(255,255,255,.85)",
              marginBottom: 20,
            }}
          >
            {event.description}
          </p>

          {event.route && (
            <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
              <span
                style={{
                  padding: "5px 11px",
                  borderRadius: 8,
                  background: COLORS.cardAlt,
                  border: `1px solid ${COLORS.borderSoft}`,
                  fontFamily: FONTS.mono,
                  fontSize: 10,
                  color: COLORS.textSecondary,
                }}
              >
                {distanceKmLocked} KM
              </span>
              <span
                style={{
                  padding: "5px 11px",
                  borderRadius: 8,
                  background: COLORS.cardAlt,
                  border: `1px solid ${COLORS.borderSoft}`,
                  fontFamily: FONTS.mono,
                  fontSize: 10,
                  color: COLORS.textSecondary,
                }}
              >
                {durationMinLocked} MIN
              </span>
            </div>
          )}

          <div style={{ ...styles.card, padding: 18 }}>
            <div style={{ ...styles.fieldLabel, marginBottom: 10 }}>
              HAI IL CODICE DI ACCESSO?
            </div>
            <input
              type="text"
              placeholder="Inserisci il codice"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              style={{ ...styles.input, height: 46, marginBottom: 12 }}
            />
            {joinError && (
              <div
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 13,
                  color: COLORS.danger,
                  marginBottom: 12,
                }}
              >
                {joinError}
              </div>
            )}
            <button
              type="button"
              onClick={handleJoin}
              disabled={isJoining || !accessCode.trim()}
              style={{
                ...styles.primaryButton,
                width: "100%",
                opacity: isJoining || !accessCode.trim() ? 0.6 : 1,
              }}
            >
              {isJoining ? "..." : "SBLOCCA EVENTO"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const isFull = event.currentParticipants >= event.maxParticipants
  const start = new Date(event.startDateTime)
  const dayLabel = start
    .toLocaleDateString("it-IT", {
      weekday: "short",
      day: "numeric",
      month: "short",
    })
    .toUpperCase()
  const timeLabel = start.toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  })
  const distanceKm = event.route
    ? (event.route.distanceMeters / 1000).toFixed(1).replace(".", ",")
    : null

  return (
    <div style={{ ...styles.pageBg, paddingBottom: 100 }}>
      <div style={{ position: "relative", height: 250 }}>
        {event.route?.encodedPolyline ? (
          <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: COLORS.cardAlt,
            }}
          />
        )}

        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            ...styles.iconButton,
            position: "absolute",
            left: 16,
            top: 16,
            background: "rgba(10,10,12,.8)",
          }}
        >
          <FaArrowLeft />
        </button>

        {event.organizer && event.status === "ACTIVE" && (
          <button
            type="button"
            onClick={() => setConfirmType("cancelEvent")}
            style={{
              position: "absolute",
              right: 16,
              top: 16,
              height: 40,
              padding: "0 14px",
              borderRadius: 12,
              background: "rgba(10,10,12,.8)",
              border: `1px solid ${COLORS.dangerBorder}`,
              color: COLORS.danger,
              fontFamily: FONTS.mono,
              fontSize: 10,
              cursor: "pointer",
            }}
          >
            ANNULLA EVENTO
          </button>
        )}
      </div>
      <div style={{ padding: "22px 20px 0" }}>
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <span style={{ ...styles.screenLabel, color: COLORS.accent }}>
            {dayLabel} · {timeLabel}
          </span>
          {event.status === "CANCELLED" && (
            <span style={{ ...styles.screenLabel, color: COLORS.danger }}>
              ANNULLATO
            </span>
          )}
          {event.status === "FINISHED" && (
            <span style={{ ...styles.screenLabel, color: COLORS.textMuted }}>
              CONCLUSO
            </span>
          )}
        </div>

        <div style={{ ...styles.pageTitle, fontSize: 34, marginBottom: 10 }}>
          {event.title}
        </div>

        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: 11,
            color: COLORS.textMuted,
            marginBottom: 18,
          }}
        >
          {event.meetingPointAddress || "Ritrovo da definire"}
          {distanceKm && ` · ${distanceKm} KM`}
          {` · ${event.currentParticipants}/${event.maxParticipants}`}
        </div>

        <p
          style={{
            fontSize: 14.5,
            lineHeight: 1.55,
            color: "rgba(255,255,255,.85)",
            marginBottom: 22,
          }}
        >
          {event.description}
        </p>

        <div
          style={{
            ...styles.statGrid,
            gridTemplateColumns: "1fr 1fr",
            marginBottom: 22,
          }}
        >
          <div style={styles.statCell}>
            <span style={styles.statLabel}>RITROVO</span>
            <span
              style={{
                fontFamily: FONTS.heading,
                fontWeight: 600,
                fontSize: 15,
                lineHeight: 1.2,
              }}
            >
              {event.meetingPointAddress || "—"}
            </span>
          </div>
          <div style={styles.statCell}>
            <span style={styles.statLabel}>POSTI</span>
            <span style={styles.statValue}>
              {event.currentParticipants}/{event.maxParticipants}
            </span>
          </div>
          <div style={styles.statCell}>
            <span style={styles.statLabel}>PERCORSO</span>
            <span style={styles.statValue}>
              {distanceKm ? `${distanceKm} KM` : "—"}
            </span>
          </div>
          <div style={styles.statCell}>
            <span style={styles.statLabel}>VISIBILITÀ</span>
            <span
              style={{
                fontFamily: FONTS.heading,
                fontWeight: 700,
                fontSize: 21,
              }}
            >
              {VISIBILITY_LABELS[event.visibility]}
            </span>
          </div>
        </div>

        {event.route?.googleMapsUrl && (
          <a
            href={event.route.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              ...styles.secondaryButton,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 18px",
              textDecoration: "none",
              marginBottom: 22,
            }}
          >
            APRI IN GOOGLE MAPS
          </a>
        )}

        {participants && participants.length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <div style={{ ...styles.fieldLabel, marginBottom: 10 }}>
              PARTECIPANTI
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              {participants.slice(0, 3).map((p, i) => (
                <img
                  key={p.id}
                  src={p.profilePicture}
                  alt={p.username}
                  title={p.username}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    objectFit: "cover",
                    background: COLORS.surfaceRaised,
                    border: `2px solid ${COLORS.bg}`,
                    marginLeft: i === 0 ? 0 : -12,
                  }}
                />
              ))}
              {participants.length > 3 && (
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    marginLeft: -12,
                    background: COLORS.card,
                    border: `2px solid ${COLORS.bg}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: FONTS.mono,
                    fontSize: 11,
                    color: COLORS.textSecondary,
                  }}
                >
                  +{participants.length - 3}
                </div>
              )}
            </div>
          </div>
        )}

        {!event.organizer && event.status === "ACTIVE" && (
          <div style={{ ...styles.card, padding: 18, marginBottom: 20 }}>
            {event.myParticipationStatus === "ACCEPTED" && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: 11,
                    color: "#4ADE80",
                  }}
                >
                  ✓ PARTECIPAZIONE CONFERMATA
                </span>
                <button
                  type="button"
                  onClick={() => setConfirmType("cancelMe")}
                  style={{
                    background: "none",
                    border: "none",
                    color: COLORS.danger,
                    fontFamily: FONTS.mono,
                    fontSize: 10,
                    cursor: "pointer",
                  }}
                >
                  ANNULLA
                </button>
              </div>
            )}

            {event.myParticipationStatus === "PENDING" && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: 11,
                    color: COLORS.accent,
                  }}
                >
                  RICHIESTA IN ATTESA
                </span>
                <button
                  type="button"
                  onClick={() => setConfirmType("cancelMe")}
                  style={{
                    background: "none",
                    border: "none",
                    color: COLORS.danger,
                    fontFamily: FONTS.mono,
                    fontSize: 10,
                    cursor: "pointer",
                  }}
                >
                  ANNULLA RICHIESTA
                </button>
              </div>
            )}

            {(event.myParticipationStatus === "REJECTED" ||
              event.myParticipationStatus === "CANCELLED") && (
              <span
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 11,
                  color: COLORS.textMuted,
                }}
              >
                {event.myParticipationStatus === "REJECTED"
                  ? "RICHIESTA RIFIUTATA"
                  : "PARTECIPAZIONE ANNULLATA"}
              </span>
            )}

            {event.myParticipationStatus === null && (
              <>
                {event.visibility === "INVITE_ONLY" ? (
                  <p
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 13,
                      color: COLORS.textFaint,
                      margin: 0,
                    }}
                  >
                    Questo evento richiede un invito dall'organizzatore.
                  </p>
                ) : isFull ? (
                  <p
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 13,
                      color: COLORS.textFaint,
                      margin: 0,
                    }}
                  >
                    Numero massimo di partecipanti raggiunto.
                  </p>
                ) : (
                  <>
                    {event.visibility === "PRIVATE_CODE" && (
                      <input
                        type="text"
                        placeholder="Codice di accesso"
                        value={accessCode}
                        onChange={(e) => setAccessCode(e.target.value)}
                        style={{
                          ...styles.input,
                          height: 46,
                          marginBottom: 12,
                        }}
                      />
                    )}
                    {joinError && (
                      <div
                        style={{
                          fontFamily: FONTS.body,
                          fontSize: 13,
                          color: COLORS.danger,
                          marginBottom: 10,
                        }}
                      >
                        {joinError}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={handleJoin}
                      disabled={isJoining}
                      style={{
                        ...styles.primaryButton,
                        width: "100%",
                        opacity: isJoining ? 0.6 : 1,
                      }}
                    >
                      {isJoining ? "..." : "PRENOTA IL TUO POSTO"}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {event.organizer && event.visibility === "PRIVATE_CODE" && (
          <AccessCodeCard eventId={eventId} />
        )}

        {event.organizer && (
          <OrganizerPanel eventId={eventId} visibility={event.visibility} />
        )}
      </div>
      {confirmType && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(6,6,7,.72)",
            zIndex: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
          onClick={() => setConfirmType(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              ...styles.card,
              padding: 22,
              width: "100%",
              maxWidth: 340,
            }}
          >
            <div
              style={{
                fontFamily: FONTS.heading,
                fontWeight: 700,
                fontSize: 20,
                marginBottom: 10,
              }}
            >
              {confirmType === "cancelEvent"
                ? "ANNULLARE L'EVENTO?"
                : "ANNULLARE LA PARTECIPAZIONE?"}
            </div>
            <p
              style={{
                fontFamily: FONTS.body,
                fontSize: 13,
                color: COLORS.textSecondary,
                lineHeight: 1.5,
                marginBottom: 18,
              }}
            >
              {confirmType === "cancelEvent"
                ? "Tutti i partecipanti verranno informati. L'operazione non è reversibile."
                : "Potrai richiedere di partecipare di nuovo solo se l'organizzatore te lo consente."}
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={() => setConfirmType(null)}
                style={{ ...styles.secondaryButton, flex: 1 }}
              >
                INDIETRO
              </button>
              <button
                type="button"
                onClick={
                  confirmType === "cancelEvent"
                    ? handleCancelEvent
                    : handleCancelParticipation
                }
                disabled={isCancelling}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 15,
                  background: COLORS.danger,
                  border: "none",
                  color: "#fff",
                  fontFamily: FONTS.heading,
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: "pointer",
                }}
              >
                CONFERMA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EventDetailPage
