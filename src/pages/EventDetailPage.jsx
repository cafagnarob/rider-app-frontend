import { useEffect, useMemo, useRef, useState } from "react"
import { Spinner } from "react-bootstrap"
import { useParams, useNavigate, Link } from "react-router-dom"
import {
  Map as MapLibreMap,
  Marker,
  LngLatBounds,
  FullscreenControl,
} from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import {
  FaArrowLeft,
  FaCamera,
  FaGripVertical,
  FaTimes,
  FaTrash,
} from "react-icons/fa"
import {
  useGetEventByIdQuery,
  useChangeEventStatusMutation,
  useRequestAccessCodeMutation,
  useUpdateEventCoverPhotoMutation,
  useDeleteEventDayMutation,
  useReorderEventDaysMutation,
} from "../features/events/eventsApi"
import {
  useJoinEventMutation,
  useCancelMyParticipationMutation,
  useGetAcceptedParticipantsQuery,
} from "../features/events/participationApi"
import OrganizerPanel from "../features/events/components/OrganizerPanel"
import AccessCodeCard from "../features/events/components/AccessCodeCard"
import { decodePolyline } from "../utils/polyline"
import { MAP_STYLE_URL } from "../utils/mapStyle"
import { COLORS } from "../styles/theme" // solo per i marcatori MapLibre: sono DOM creati a mano, fuori dal render React, quindi non possono usare classi CSS — restano gli unici tre riferimenti diretti a COLORS in questo file
import { VISIBILITY_LABELS, EVENT_TYPE_LABELS } from "../utils/constants"
import "../pages/CSS/EventDetailPage.css"
import {
  useAcceptInviteMutation,
  useRejectInviteMutation,
} from "../features/events/invitesApi"
import Avatar from "../components/Avatar"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

function haversineKm([lng1, lat1], [lng2, lat2]) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

function SortableDayRow({ day, index, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: day.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }
  const dayStart = new Date(day.startDateTime)

  return (
    <div ref={setNodeRef} style={style} className="card trip-day-row">
      <span
        {...attributes}
        {...listeners}
        className="trip-day-row__drag-handle"
      >
        <FaGripVertical size={12} />
      </span>
      <span className="trip-day-row__number">{index + 1}</span>
      <Link to={`/events/${day.id}`} className="trip-day-row__link-area">
        <div className="trip-day-row__title">{day.title}</div>
        <div className="trip-day-row__meta">
          {dayStart.toLocaleDateString("it-IT", {
            day: "numeric",
            month: "short",
          })}
          {" · "}
          {day.type === "RADUNO" ? "SOSTA" : "TAPPA"}
        </div>
      </Link>
      <button
        type="button"
        className="icon-btn-plain icon-btn-plain--danger"
        onClick={() => onDelete(day.id)}
      >
        <FaTrash size={11} />
      </button>
    </div>
  )
}

function EventDetailPage() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const { data: event, isLoading, isError } = useGetEventByIdQuery(eventId)

  const { data: participants } = useGetAcceptedParticipantsQuery(eventId)

  const [selectedWaypointId, setSelectedWaypointId] = useState(null)

  const [requestAccessCode, { isLoading: isRequestingCode }] =
    useRequestAccessCodeMutation()

  const [joinEvent, { isLoading: isJoining }] = useJoinEventMutation()
  const [cancelParticipation, { isLoading: isCancelling }] =
    useCancelMyParticipationMutation()
  const [changeStatus] = useChangeEventStatusMutation()

  const [accessCode, setAccessCode] = useState("")
  const [joinError, setJoinError] = useState("")
  const [confirmType, setConfirmType] = useState(null)

  const containerRef = useRef(null)
  const mapRef = useRef(null)

  const [activeView, setActiveView] = useState("map")

  const [showFullscreenCover, setShowFullscreenCover] = useState(false)

  const [deleteEventDay, { isLoading: isDeletingDay }] =
    useDeleteEventDayMutation()
  const [reorderEventDays] = useReorderEventDaysMutation()
  const [dayToDelete, setDayToDelete] = useState(null)

  useEffect(() => {
    if (activeView === "map") {
      mapRef.current?.resize()
    }
  }, [activeView])

  const [updateCoverPhoto, { isLoading: isUploadingCover }] =
    useUpdateEventCoverPhotoMutation()

  const handleCoverPhotoChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await updateCoverPhoto({ eventId, image: file }).unwrap()
    } catch (err) {
      console.error(err)
    }
  }

  const [acceptInvite, { isLoading: isAcceptingInvite }] =
    useAcceptInviteMutation()
  const [rejectInvite, { isLoading: isRejectingInvite }] =
    useRejectInviteMutation()

  const handleAcceptInvite = async () => {
    try {
      await acceptInvite(event.myInviteId).unwrap()
    } catch (err) {
      setJoinError(err.data?.message || "Impossibile accettare l'invito.")
    }
  }

  const handleRejectInvite = async () => {
    try {
      await rejectInvite(event.myInviteId).unwrap()
    } catch (err) {
      setJoinError(err.data?.message || "Impossibile rifiutare l'invito.")
    }
  }

  useEffect(() => {
    if (!containerRef.current || !event) return

    const hasRoute = !!event.route?.encodedPolyline
    const hasDirectMeetingPoint =
      !hasRoute &&
      event.meetingPointLat != null &&
      event.meetingPointLng != null
    if (!hasRoute && !hasDirectMeetingPoint) return

    const isValidCoordinate = ([lng, lat]) =>
      Number.isFinite(lng) &&
      Number.isFinite(lat) &&
      lng >= -180 &&
      lng <= 180 &&
      lat >= -90 &&
      lat <= 90

    let coordinates = []
    if (hasRoute) {
      coordinates = decodePolyline(event.route.encodedPolyline)
      if (coordinates.length === 0 || !coordinates.every(isValidCoordinate))
        return
    } else {
      coordinates = [[event.meetingPointLng, event.meetingPointLat]]
      if (!isValidCoordinate(coordinates[0])) return
    }

    const map = new MapLibreMap({
      container: containerRef.current,
      style: MAP_STYLE_URL,
      center: coordinates[0],
      zoom: hasRoute ? 12 : 13,
    })
    mapRef.current = map

    map.addControl(new FullscreenControl(), "bottom-left")

    const draw = () => {
      map.resize()

      if (hasRoute) {
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
          el.style.cssText = `width: ${isEndpoint ? 20 : 11}px; height: ${isEndpoint ? 20 : 11}px;`

          const dot = document.createElement("div")
          dot.style.cssText = `
            width: 100%; height: 100%; border-radius: 50%; position: relative;
            background: ${isStart ? "#4ADE80" : isEnd ? COLORS.danger : COLORS.accent};
            border: ${isEndpoint ? 3 : 2}px solid ${COLORS.bg};
          `
          el.appendChild(dot)

          if (isStart) {
            const pulse = document.createElement("span")
            pulse.style.cssText = `
              position: absolute; inset: -8px; border-radius: 50%;
              background: #4ADE80; animation: qjpulse 2.6s ease-out infinite;
            `
            dot.appendChild(pulse)
          }

          const marker = new Marker({ element: el }).setLngLat([
            wp.longitude,
            wp.latitude,
          ])
          el.addEventListener("click", () => setSelectedWaypointId(wp.id))
          marker.addTo(map)
        })

        const bounds = coordinates.reduce(
          (b, c) => b.extend(c),
          new LngLatBounds(coordinates[0], coordinates[0]),
        )
        map.fitBounds(bounds, { padding: 40, maxZoom: 14 })
      } else {
        const el = document.createElement("div")
        el.style.cssText = "width: 22px; height: 22px;"
        const dot = document.createElement("div")
        dot.style.cssText = `
          width: 100%; height: 100%; border-radius: 50%; position: relative;
          background: ${COLORS.accent}; border: 3px solid ${COLORS.bg};
        `
        el.appendChild(dot)
        const pulse = document.createElement("span")
        pulse.style.cssText = `
          position: absolute; inset: -8px; border-radius: 50%;
          background: ${COLORS.accent}; animation: qjpulse 2.6s ease-out infinite;
        `
        dot.appendChild(pulse)
        new Marker({ element: el }).setLngLat(coordinates[0]).addTo(map)
      }
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
  }, [event])

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

  const handleDeleteDay = async () => {
    if (!dayToDelete) return
    try {
      await deleteEventDay({ tripId: eventId, dayId: dayToDelete }).unwrap()
      setDayToDelete(null)
    } catch (err) {
      console.error(err)
    }
  }

  const dayDragSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const handleDayDragEnd = async (dragEvent) => {
    const { active, over } = dragEvent
    if (!over || active.id === over.id) return
    const oldIndex = event.children.findIndex((d) => d.id === active.id)
    const newIndex = event.children.findIndex((d) => d.id === over.id)
    const reordered = arrayMove(event.children, oldIndex, newIndex)
    try {
      await reorderEventDays({
        tripId: eventId,
        dayIds: reordered.map((d) => d.id),
      }).unwrap()
    } catch (err) {
      console.error(err)
    }
  }

  const hasRoute = !!event?.route?.encodedPolyline

  const waypointStats = useMemo(() => {
    if (!hasRoute || !event?.route?.waypoints) return {}

    const coords = decodePolyline(event.route.encodedPolyline)
    if (coords.length === 0) return {}

    const cumulative = [0]
    for (let i = 1; i < coords.length; i++) {
      cumulative.push(cumulative[i - 1] + haversineKm(coords[i - 1], coords[i]))
    }
    const totalKm = cumulative[cumulative.length - 1]

    const waypoints = event.route.waypoints
    const distFromStart = waypoints.map((wp) => {
      let bestIdx = 0
      let bestDist = Infinity
      coords.forEach((c, idx) => {
        const d = haversineKm(c, [wp.longitude, wp.latitude])
        if (d < bestDist) {
          bestDist = d
          bestIdx = idx
        }
      })
      return cumulative[bestIdx]
    })

    const stats = {}
    waypoints.forEach((wp, i) => {
      stats[wp.id] = {
        fromStartKm: distFromStart[i],
        toEndKm: totalKm - distFromStart[i],
        fromPrevKm: i > 0 ? distFromStart[i] - distFromStart[i - 1] : null,
        toNextKm:
          i < waypoints.length - 1
            ? distFromStart[i + 1] - distFromStart[i]
            : null,
      }
    })
    return stats
  }, [event, hasRoute])

  if (isLoading) {
    return (
      <div className="centered-spinner">
        <Spinner animation="border" style={{ color: "#FF7A2F" }} />
      </div>
    )
  }

  if (isError || !event) {
    return (
      <div className="empty-state empty-state-margin">
        Evento non trovato o accesso negato.
      </div>
    )
  }

  if (event.locked) {
    const distanceKmLocked = event.route
      ? (event.route.distanceMeters / 1000).toFixed(1).replace(".", ",")
      : null
    const durationMinLocked = event.route
      ? Math.round(event.route.durationSeconds / 60)
      : null

    return (
      <div className="page" style={{ minHeight: "100vh" }}>
        <div className="px-20">
          <button
            type="button"
            className="btn-icon mb-16"
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft />
          </button>

          <div
            className="event-detail-page__title"
            style={{ fontSize: 30, marginBottom: 8 }}
          >
            {event.title}
          </div>
          <div className="event-detail-page__meta">
            Organizzato da {event.organizerUsername}
          </div>

          <span
            className="pill pill--accent"
            style={{ display: "inline-block", marginBottom: 18 }}
          >
            EVENTO CON CODICE
          </span>

          <p className="prose" style={{ marginBottom: 20 }}>
            {event.description}
          </p>

          {event.route && (
            <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
              <span className="pill pill--neutral">{distanceKmLocked} KM</span>
              <span className="pill pill--neutral">
                {durationMinLocked} MIN
              </span>
            </div>
          )}

          <div className="card" style={{ padding: 18 }}>
            <div className="field-label form-group__label">
              HAI IL CODICE DI ACCESSO?
            </div>
            <input
              type="text"
              className="input mb-16"
              placeholder="Inserisci il codice"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
            />
            {joinError && <div className="error-text mb-16">{joinError}</div>}
            <button
              type="button"
              className="btn-primary"
              style={{ width: "100%" }}
              onClick={handleJoin}
              disabled={isJoining || !accessCode.trim()}
            >
              {isJoining ? "..." : "SBLOCCA EVENTO"}
            </button>

            <div style={{ marginTop: 16 }}>
              {event.myAccessRequestStatus === "PENDING" && (
                <div
                  className="empty-state"
                  style={{ borderColor: "var(--color-accent-soft-border)" }}
                >
                  Richiesta inviata. Riceverai una notifica quando
                  l'organizzatore risponde.
                </div>
              )}

              {event.myAccessRequestStatus === "APPROVED" && (
                <div
                  className="empty-state"
                  style={{
                    borderColor: "var(--color-accent-soft-border)",
                    color: "var(--color-accent)",
                  }}
                >
                  Richiesta approvata — controlla le tue notifiche per il
                  codice, poi inseriscilo qui sopra.
                </div>
              )}

              {(event.myAccessRequestStatus === "REJECTED" ||
                event.myAccessRequestStatus == null) && (
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ width: "100%" }}
                  onClick={() => requestAccessCode(eventId)}
                  disabled={isRequestingCode}
                >
                  {isRequestingCode
                    ? "..."
                    : event.myAccessRequestStatus === "REJECTED"
                      ? "RICHIEDI DI NUOVO IL CODICE"
                      : "NON HAI IL CODICE? RICHIEDILO"}
                </button>
              )}
            </div>
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
  const showMap =
    !!event.route?.encodedPolyline ||
    (event.meetingPointLat != null && event.meetingPointLng != null)
  const isChild = !!event.parentEventId
  const isTrip = event.type === "MULTI_DAY_TRIP"

  const meetingPointMapsUrl =
    event.meetingPointLat != null && event.meetingPointLng != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${event.meetingPointLat},${event.meetingPointLng}&travelmode=driving`
      : null

  return (
    <div className="page pb-100">
      <div className="event-detail-page__map-wrapper">
        <div
          style={{
            display: activeView === "map" ? "block" : "none",
            width: "100%",
            height: "100%",
          }}
        >
          {showMap ? (
            <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
          ) : (
            <div className="event-detail-page__map-placeholder">
              <span className="screen-label">VIAGGIO MULTIGIORNO</span>
            </div>
          )}
        </div>

        <div
          style={{
            display: activeView === "cover" ? "block" : "none",
            width: "100%",
            height: "100%",
            cursor: event.coverPhotoUrl ? "pointer" : "default",
          }}
          onClick={() => event.coverPhotoUrl && setShowFullscreenCover(true)}
        >
          {event.coverPhotoUrl ? (
            <img
              src={event.coverPhotoUrl}
              alt=""
              className="event-detail-page__cover-img"
            />
          ) : (
            <div className="event-detail-page__cover-empty">
              <span className="screen-label">NESSUNA FOTO DI COPERTINA</span>
            </div>
          )}
        </div>

        {event.organizer && activeView === "cover" && (
          <label className="event-detail-page__cover-edit-btn">
            {isUploadingCover ? (
              <Spinner size="sm" animation="border" />
            ) : (
              <FaCamera size={13} />
            )}
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handleCoverPhotoChange}
              disabled={isUploadingCover}
            />
          </label>
        )}

        <button
          type="button"
          className="btn-icon event-detail-page__map-back-btn"
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft />
        </button>

        {(event.coverPhotoUrl || event.organizer) && (
          <div className="event-detail-page__view-tabs">
            <button
              type="button"
              className={`event-detail-page__view-tab ${activeView === "map" ? "event-detail-page__view-tab--active" : ""}`}
              onClick={() => setActiveView("map")}
            >
              MAPPA
            </button>
            <button
              type="button"
              className={`event-detail-page__view-tab ${activeView === "cover" ? "event-detail-page__view-tab--active" : ""}`}
              onClick={() => setActiveView("cover")}
            >
              FOTO
            </button>
          </div>
        )}

        {activeView === "map" && hasRoute && (
          <div className="event-detail-page__waypoint-hint">
            Tocca un punto sulla mappa per i dettagli
          </div>
        )}
      </div>

      <div className="event-detail-page__content">
        {isChild && (
          <Link
            to={`/events/${event.parentEventId}`}
            className="event-detail-page__parent-link"
          >
            ← TORNA AL VIAGGIO
          </Link>
        )}

        <div className="event-detail-page__status-row">
          <div className="event-detail-page__status-group">
            <span
              className="screen-label"
              style={{ color: "var(--color-accent)" }}
            >
              {dayLabel} · {timeLabel}
            </span>
            {event.status === "CANCELLED" && (
              <span
                className="screen-label"
                style={{ color: "var(--color-danger)" }}
              >
                ANNULLATO
              </span>
            )}
            {event.status === "FINISHED" && (
              <span className="screen-label">CONCLUSO</span>
            )}
          </div>

          {event.type !== "STANDARD" && (
            <span
              className="screen-label event-detail-page__type-badge"
              style={{ color: "var(--color-accent)" }}
            >
              {EVENT_TYPE_LABELS[event.type]}
            </span>
          )}
        </div>

        <div className="event-detail-page__title">{event.title}</div>

        <Link
          to={`/profile/${event.organizerUsername}`}
          className="event-detail-page__organizer-link"
        >
          Organizzato da {event.organizerUsername}
        </Link>

        <div className="event-detail-page__meta">
          {isTrip
            ? `${event.children?.length || 0} GIORNI`
            : event.meetingPointAddress || "Ritrovo da definire"}
          {distanceKm && ` · ${distanceKm} KM`}
          {` · ${event.currentParticipants}/${event.maxParticipants}`}
        </div>

        <p className="prose event-detail-page__description">
          {event.description}
        </p>

        {isTrip ? (
          <div className="stat-grid event-detail-page__stats">
            <div className="stat-cell">
              <span className="stat-label">GIORNI</span>
              <span className="stat-value">{event.children?.length || 0}</span>
            </div>
            <div className="stat-cell">
              <span className="stat-label">POSTI</span>
              <span className="stat-value">
                {event.currentParticipants}/{event.maxParticipants}
              </span>
            </div>
            <div className="stat-cell">
              <span className="stat-label">KM TOTALI</span>
              <span className="stat-value">
                {event.totalDistanceMeters
                  ? (event.totalDistanceMeters / 1000)
                      .toFixed(1)
                      .replace(".", ",")
                  : "—"}
              </span>
            </div>
            <div className="stat-cell">
              <span className="stat-label">VISIBILITÀ</span>
              <span
                style={{
                  fontFamily: "var(--font-heading)",
                  fontWeight: 700,
                  fontSize: 21,
                }}
              >
                {VISIBILITY_LABELS[event.visibility]}
              </span>
            </div>
          </div>
        ) : (
          <div className="stat-grid event-detail-page__stats">
            {meetingPointMapsUrl ? (
              <a
                href={meetingPointMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="stat-cell stat-cell--link"
              >
                <span className="stat-label">RITROVO ↗</span>
                <span
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontWeight: 600,
                    fontSize: 15,
                    lineHeight: 1.2,
                    color: "var(--color-accent)",
                  }}
                >
                  {event.meetingPointAddress || "—"}
                </span>
              </a>
            ) : (
              <div className="stat-cell">
                <span className="stat-label">RITROVO</span>
                <span
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontWeight: 600,
                    fontSize: 15,
                    lineHeight: 1.2,
                  }}
                >
                  {event.meetingPointAddress || "—"}
                </span>
              </div>
            )}
            <div className="stat-cell">
              <span className="stat-label">POSTI</span>
              <span className="stat-value">
                {event.currentParticipants}/{event.maxParticipants}
              </span>
            </div>
            <div className="stat-cell">
              <span className="stat-label">PERCORSO</span>
              <span className="stat-value">
                {distanceKm ? `${distanceKm} KM` : "—"}
              </span>
            </div>
            <div className="stat-cell">
              <span className="stat-label">VISIBILITÀ</span>
              <span
                style={{
                  fontFamily: "var(--font-heading)",
                  fontWeight: 700,
                  fontSize: 21,
                }}
              >
                {VISIBILITY_LABELS[event.visibility]}
              </span>
            </div>
          </div>
        )}

        {event.route?.googleMapsUrl && (
          <a
            href={event.route.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary btn-link-wrap event-detail-page__maps-link"
          >
            APRI IN GOOGLE MAPS
          </a>
        )}

        {isTrip && (
          <div className="event-detail-page__days-section">
            <div className="section-header event-detail-page__days-header">
              <div className="section-title">GIORNI</div>
              {event.organizer && (
                <Link
                  to={`/events/${eventId}/days/new`}
                  className="text-btn text-btn--accent"
                >
                  + AGGIUNGI
                </Link>
              )}
            </div>

            {!event.children || event.children.length === 0 ? (
              <p className="event-detail-page__no-days">
                Nessun giorno ancora aggiunto a questo viaggio.
              </p>
            ) : !event.organizer ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {event.children.map((day, index) => {
                  const dayStart = new Date(day.startDateTime)
                  return (
                    <Link
                      key={day.id}
                      to={`/events/${day.id}`}
                      className="card trip-day-row"
                    >
                      <span className="trip-day-row__number">{index + 1}</span>
                      <div className="trip-day-row__info">
                        <div className="trip-day-row__title">{day.title}</div>
                        <div className="trip-day-row__meta">
                          {dayStart.toLocaleDateString("it-IT", {
                            day: "numeric",
                            month: "short",
                          })}
                          {" · "}
                          {day.type === "RADUNO" ? "SOSTA" : "TAPPA"}
                        </div>
                      </div>
                      <span className="trip-day-row__chevron">{">"}</span>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <DndContext
                sensors={dayDragSensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDayDragEnd}
              >
                <SortableContext
                  items={event.children.map((d) => d.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    {event.children.map((day, index) => (
                      <SortableDayRow
                        key={day.id}
                        day={day}
                        index={index}
                        onDelete={setDayToDelete}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        )}

        {participants && participants.length > 0 && (
          <div className="event-detail-page__participants">
            <div className="field-label event-detail-page__participants-label">
              PARTECIPANTI
            </div>
            <div className="avatar-stack">
              {participants.slice(0, 3).map((p) => (
                <Avatar
                  key={p.id}
                  src={p.profilePicture}
                  alt={p.username}
                  title={p.username}
                  className="avatar-stack__item"
                />
              ))}
              {participants.length > 3 && (
                <div className="avatar-stack__more">
                  +{participants.length - 3}
                </div>
              )}
            </div>
          </div>
        )}

        {isChild ? (
          <div className="empty-state event-detail-page__child-notice">
            Questo è un giorno del viaggio. La partecipazione si gestisce dalla
            pagina del viaggio completo.
          </div>
        ) : (
          !event.organizer &&
          event.status === "ACTIVE" && (
            <div className="card participation-card">
              {event.myParticipationStatus === "ACCEPTED" && (
                <div className="participation-card__row">
                  <span className="participation-card__status--accepted">
                    ✓ PARTECIPAZIONE CONFERMATA
                  </span>
                  <button
                    type="button"
                    className="text-btn text-btn--danger"
                    onClick={() => setConfirmType("cancelMe")}
                  >
                    ANNULLA
                  </button>
                </div>
              )}

              {event.myParticipationStatus === "PENDING" && (
                <div className="participation-card__row">
                  <span className="participation-card__status--pending">
                    RICHIESTA IN ATTESA
                  </span>
                  <button
                    type="button"
                    className="text-btn text-btn--danger"
                    onClick={() => setConfirmType("cancelMe")}
                  >
                    ANNULLA RICHIESTA
                  </button>
                </div>
              )}

              {event.myParticipationStatus === "REJECTED" && (
                <span className="participation-card__status--neutral">
                  RICHIESTA RIFIUTATA
                </span>
              )}

              {event.myParticipationStatus === "REMOVED" && (
                <span className="participation-card__status--neutral">
                  SEI STATO RIMOSSO DALL'ORGANIZZATORE
                </span>
              )}

              {(event.myParticipationStatus === null ||
                event.myParticipationStatus === "CANCELLED") && (
                <>
                  {event.myParticipationStatus === "CANCELLED" && (
                    <p
                      className="participation-card__info-text"
                      style={{ marginBottom: 12 }}
                    >
                      Hai annullato la tua partecipazione. Puoi richiedere di
                      nuovo di partecipare.
                    </p>
                  )}
                  {event.visibility === "INVITE_ONLY" ? (
                    event.myInviteId ? (
                      <div>
                        <p
                          className="participation-card__info-text"
                          style={{ marginBottom: 12 }}
                        >
                          Sei stato invitato a questo evento.
                        </p>
                        {joinError && (
                          <div
                            className="error-text"
                            style={{ marginBottom: 10 }}
                          >
                            {joinError}
                          </div>
                        )}
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            type="button"
                            className="btn-approve"
                            style={{ flex: 1 }}
                            disabled={isAcceptingInvite || isRejectingInvite}
                            onClick={handleAcceptInvite}
                          >
                            {isAcceptingInvite ? "..." : "ACCETTA"}
                          </button>
                          <button
                            type="button"
                            className="btn-reject"
                            style={{ flex: 1 }}
                            disabled={isAcceptingInvite || isRejectingInvite}
                            onClick={handleRejectInvite}
                          >
                            {isRejectingInvite ? "..." : "RIFIUTA"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="participation-card__info-text">
                        Questo evento richiede un invito dall'organizzatore.
                      </p>
                    )
                  ) : isFull ? (
                    <p className="participation-card__info-text">
                      Numero massimo di partecipanti raggiunto.
                    </p>
                  ) : (
                    <>
                      {event.visibility === "PRIVATE_CODE" && (
                        <input
                          type="text"
                          className="input mb-16"
                          placeholder="Codice di accesso"
                          value={accessCode}
                          onChange={(e) => setAccessCode(e.target.value)}
                        />
                      )}
                      {joinError && (
                        <div
                          className="error-text"
                          style={{ marginBottom: 10 }}
                        >
                          {joinError}
                        </div>
                      )}
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ width: "100%" }}
                        onClick={handleJoin}
                        disabled={isJoining}
                      >
                        {isJoining ? "..." : "PRENOTA IL TUO POSTO"}
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          )
        )}

        {!isChild && event.organizer && event.visibility === "PRIVATE_CODE" && (
          <AccessCodeCard eventId={eventId} />
        )}
        {!isChild && event.organizer && (
          <OrganizerPanel eventId={eventId} visibility={event.visibility} />
        )}

        {event.organizer && event.status === "ACTIVE" && (
          <div className="event-detail-page__organizer-actions">
            <Link
              to={
                isChild
                  ? `/events/${event.parentEventId}/days/${event.id}/edit`
                  : `/events/${eventId}/edit`
              }
              className="btn-secondary btn-link-edit-events"
              style={{ width: "100%" }}
            >
              {isChild ? "MODIFICA GIORNO" : "MODIFICA EVENTO"}
            </Link>
            {!isChild && (
              <button
                type="button"
                className="btn-danger-block"
                onClick={() => setConfirmType("cancelEvent")}
              >
                ANNULLA EVENTO
              </button>
            )}
          </div>
        )}
      </div>

      {confirmType && (
        <div className="modal-overlay" onClick={() => setConfirmType(null)}>
          <div className="card modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">
              {confirmType === "cancelEvent"
                ? "ANNULLARE L'EVENTO?"
                : "ANNULLARE LA PARTECIPAZIONE?"}
            </div>
            <p className="modal-text">
              {confirmType === "cancelEvent"
                ? "Tutti i partecipanti verranno informati. L'operazione non è reversibile."
                : "Potrai richiedere di partecipare di nuovo solo se l'organizzatore te lo consente."}
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setConfirmType(null)}
              >
                INDIETRO
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={
                  confirmType === "cancelEvent"
                    ? handleCancelEvent
                    : handleCancelParticipation
                }
                disabled={isCancelling}
              >
                CONFERMA
              </button>
            </div>
          </div>
        </div>
      )}

      {dayToDelete && (
        <div className="modal-overlay" onClick={() => setDayToDelete(null)}>
          <div className="card modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">ELIMINARE QUESTO GIORNO?</div>
            <p className="modal-text">
              I giorni successivi scivoleranno indietro di un giorno. I
              partecipanti verranno informati.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDayToDelete(null)}
              >
                INDIETRO
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleDeleteDay}
                disabled={isDeletingDay}
              >
                {isDeletingDay ? "..." : "ELIMINA"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedWaypointId &&
        hasRoute &&
        (() => {
          const wp = event.route.waypoints.find(
            (w) => w.id === selectedWaypointId,
          )
          const stats = waypointStats[selectedWaypointId]
          if (!wp) return null
          return (
            <div
              className="sheet-overlay"
              onClick={() => setSelectedWaypointId(null)}
            >
              <div className="sheet-panel" onClick={(e) => e.stopPropagation()}>
                <div className="sheet-header">
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => setSelectedWaypointId(null)}
                  >
                    <FaTimes />
                  </button>
                  <div className="sheet-header__title">
                    {wp.label || "TAPPA"}
                  </div>
                  <div style={{ width: 40 }} />
                </div>
                <div className="sheet-body">
                  {wp.imageUrl && (
                    <img
                      src={wp.imageUrl}
                      alt=""
                      className="waypoint-detail-sheet__image"
                    />
                  )}
                  <div
                    className="stat-grid stat-grid--cols-2"
                    style={{ marginTop: 16 }}
                  >
                    <div className="stat-cell">
                      <span className="stat-label">DA PARTENZA</span>
                      <span className="stat-value">
                        {stats?.fromStartKm.toFixed(1).replace(".", ",")} KM
                      </span>
                    </div>
                    <div className="stat-cell">
                      <span className="stat-label">ALL'ARRIVO</span>
                      <span className="stat-value">
                        {stats?.toEndKm.toFixed(1).replace(".", ",")} KM
                      </span>
                    </div>
                    <div className="stat-cell">
                      <span className="stat-label">DA TAPPA PRECEDENTE</span>
                      <span className="stat-value">
                        {stats?.fromPrevKm != null
                          ? stats.fromPrevKm.toFixed(1).replace(".", ",")
                          : "0,0"}{" "}
                        KM
                      </span>
                    </div>
                    <div className="stat-cell">
                      <span className="stat-label">ALLA TAPPA SUCCESSIVA</span>
                      <span className="stat-value">
                        {stats?.toNextKm != null
                          ? stats.toNextKm.toFixed(1).replace(".", ",")
                          : "0,0"}{" "}
                        KM
                      </span>
                    </div>
                  </div>
                  {wp.stopMinutes > 0 && (
                    <div className="empty-state" style={{ marginTop: 14 }}>
                      Sosta di {wp.stopMinutes} minuti
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })()}

      {showFullscreenCover && event.coverPhotoUrl && (
        <div className="event-cover-fullscreen">
          <button
            type="button"
            className="btn-icon event-cover-fullscreen__back-btn"
            onClick={() => setShowFullscreenCover(false)}
          >
            <FaArrowLeft />
          </button>
          <img
            src={event.coverPhotoUrl}
            alt=""
            className="event-cover-fullscreen__img"
          />
        </div>
      )}
    </div>
  )
}

export default EventDetailPage
