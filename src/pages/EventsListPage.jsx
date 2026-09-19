import { useRef, useState } from "react"
import { useNavigate, Link, useLocation } from "react-router-dom"
import { Spinner } from "react-bootstrap"
import { FaLock, FaTimes } from "react-icons/fa"
import {
  useSearchEventsQuery,
  useGetOrganizedEventsQuery,
  useGetParticipatingEventsQuery,
  useGetHistoryEventsQuery,
} from "../features/events/eventsApi"
import NotificationBell from "../features/notification/components/NotificationBell"
import { VISIBILITY_LABELS, EVENT_TYPE_LABELS } from "../utils/constants"
import "../pages/CSS/EventsListPage.css"
import { useGeolocation } from "../utils/useGeolocation"

const TABS = [
  { key: "search", label: "SCOPRI" },
  { key: "organized", label: "ORGANIZZATI" },
  { key: "participating", label: "PARTECIPO" },
  { key: "history", label: "STORICO" },
]

const DISTANCE_BUCKET_LABELS = {
  UNDER_5KM: "< 5 KM",
  KM_5_20: "5-20 KM",
  KM_20_50: "20-50 KM",
  OVER_50KM: "> 50 KM",
}

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

function EventsListPage() {
  const [tab, setTab] = useState("search")
  const [page, setPage] = useState(0)
  const [title, setTitle] = useState("")
  const navigate = useNavigate()
  const location = useLocation()
  const [history, setHistory] = useState(false)

  const [titleInput, setTitleInput] = useState("")
  const timerRef = useRef(null)
  const { position } = useGeolocation()

  const [geoFilter, setGeoFilter] = useState(
    location.state?.nearLat
      ? {
          lat: location.state.nearLat,
          lng: location.state.nearLng,
          placeName: location.state.placeName,
        }
      : null,
  )

  const handleSearchChange = (e) => {
    const value = e.target.value

    setTitleInput(value)

    clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      setTitle(value)
      setPage(0)
    }, 400)
  }

  const searchQuery = useSearchEventsQuery(
    {
      title: title || undefined,
      page,
      lat: geoFilter?.lat,
      lng: geoFilter?.lng,
      radiusKm: geoFilter ? 40 : undefined,
      viewerLat: position?.latitude,
      viewerLng: position?.longitude,
    },
    { skip: tab !== "search" },
  )

  const organizedQuery = useGetOrganizedEventsQuery(
    {
      history,
      page,
      viewerLat: position?.latitude,
      viewerLng: position?.longitude,
    },
    { skip: tab !== "organized" },
  )

  const participatingQuery = useGetParticipatingEventsQuery(
    {
      history,
      page,
      viewerLat: position?.latitude,
      viewerLng: position?.longitude,
    },
    { skip: tab !== "participating" },
  )

  const historyQuery = useGetHistoryEventsQuery(
    { page, viewerLat: position?.latitude, viewerLng: position?.longitude },
    { skip: tab !== "history" },
  )

  const { data, isLoading, isFetching, isError } =
    tab === "search"
      ? searchQuery
      : tab === "organized"
        ? organizedQuery
        : tab === "participating"
          ? participatingQuery
          : historyQuery

  const handleTab = (key) => {
    setTab(key)
    setPage(0)
    setHistory(false)
  }

  return (
    <div className="page">
      <div className="events-list-page__header">
        <div className="page-title" style={{ fontSize: 28 }}>
          EVENTI
        </div>

        <div className="events-list-page__header-actions">
          <div className="mobile-only">
            <NotificationBell />
          </div>

          <Link to="/events/new" className="btn-accent-sm">
            + CREA
          </Link>
        </div>
      </div>

      <div className="tab-pills events-list-page__tabs">
        {TABS.map((t) => {
          const active = tab === t.key

          return (
            <button
              key={t.key}
              type="button"
              className={`tab-pill ${active ? "tab-pill--active" : ""}`}
              onClick={() => handleTab(t.key)}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {tab === "search" && (
        <div className="events-list-page__search">
          <input
            type="search"
            className="input input--compact"
            placeholder="Cerca per titolo..."
            value={titleInput}
            onChange={handleSearchChange}
          />
        </div>
      )}

      {(tab === "organized" || tab === "participating") && (
        <label className="checkbox-label" style={{ margin: "0 20px 14px" }}>
          <input
            type="checkbox"
            checked={history}
            onChange={(e) => {
              setHistory(e.target.checked)
              setPage(0)
            }}
          />
          Mostra storico
        </label>
      )}

      {geoFilter && (
        <div className="events-list-page__filter-chip-wrap">
          <span className="chip">
            VICINO A {geoFilter.placeName?.toUpperCase()}
            <button
              type="button"
              className="chip__remove-btn"
              onClick={() => setGeoFilter(null)}
            >
              <FaTimes size={10} />
            </button>
          </span>
        </div>
      )}

      {isLoading && (
        <div className="centered-spinner">
          <Spinner animation="border" style={{ color: "#FF7A2F" }} />
        </div>
      )}

      {isError && (
        <div className="empty-state" style={{ margin: 20 }}>
          Impossibile caricare gli eventi.
        </div>
      )}

      {data && data.content.length === 0 && (
        <p className="empty-list-text">Nessun evento trovato.</p>
      )}

      {data && data.content.length > 0 && (
        <div
          className="events-list-page__list"
          style={{ opacity: isFetching ? 0.6 : 1 }}
        >
          {data.content.map((event) => {
            const start = new Date(event.startDateTime)

            const distanceKm =
              position &&
              event.meetingPointLat != null &&
              event.meetingPointLng != null
                ? haversineKm(
                    [position.longitude, position.latitude],
                    [event.meetingPointLng, event.meetingPointLat],
                  )
                : null

            return (
              <div
                key={event.id}
                className="card event-row"
                onClick={() => navigate(`/events/${event.id}`)}
              >
                <div className="event-row__date-box">
                  <span className="event-row__date-day">
                    {start.getDate().toString().padStart(2, "0")}
                  </span>

                  <span className="event-row__date-month">
                    {start
                      .toLocaleDateString("it-IT", {
                        month: "short",
                      })
                      .toUpperCase()}
                  </span>
                </div>

                <div className="event-row__info">
                  <div className="event-row__title-line">
                    {event.locked && (
                      <FaLock className="event-row__lock-icon" />
                    )}

                    <span className="event-row__title">{event.title}</span>

                    {event.organizer && (
                      <span className="badge-sm--own">TUO</span>
                    )}
                  </div>

                  <div className="event-row__meta">
                    {event.organizerUsername} ·{" "}
                    {start.toLocaleTimeString("it-IT", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>

                  <div className="event-row__badges">
                    {event.type !== "STANDARD" && (
                      <span className="badge-sm badge-sm--accent">
                        {EVENT_TYPE_LABELS[event.type]}
                      </span>
                    )}

                    <span className="badge-sm">
                      {VISIBILITY_LABELS[event.visibility]}
                    </span>

                    <span className="badge-sm">
                      {event.currentParticipants}/{event.maxParticipants}
                    </span>

                    {event.myParticipationStatus === "ACCEPTED" && (
                      <span className="badge-sm--status-accepted">
                        CONFERMATO
                      </span>
                    )}

                    {event.myParticipationStatus === "PENDING" && (
                      <span className="badge-sm--status-pending">
                        IN ATTESA
                      </span>
                    )}
                  </div>
                </div>

                {event.type === "MULTI_DAY_TRIP" &&
                event.tripDurationDays != null ? (
                  <div className="event-row__distance-box">
                    <span className="event-row__date-day">
                      {event.tripDurationDays}
                    </span>
                    <span className="event-row__date-month">
                      {event.tripDurationDays === 1 ? "GIORNO" : "GIORNI"}
                    </span>
                  </div>
                ) : event.locked ? (
                  event.lockedDistanceBucket ? (
                    <div className="event-row__distance-box event-row__date-box--locked">
                      <span
                        className="event-row__date-day"
                        style={{ fontSize: 14 }}
                      >
                        {DISTANCE_BUCKET_LABELS[event.lockedDistanceBucket]}
                      </span>
                      <span className="event-row__date-month">DA TE</span>
                    </div>
                  ) : (
                    <div className="event-row__distance-box event-row__date-box--locked">
                      <span
                        className="event-row__date-month"
                        style={{ fontSize: 7.5, lineHeight: 1.25 }}
                      >
                        RICHIEDI IL CODICE
                      </span>
                    </div>
                  )
                ) : (
                  distanceKm != null && (
                    <div className="event-row__distance-box">
                      <span className="event-row__date-day">
                        {Math.round(distanceKm)}
                      </span>
                      <span className="event-row__date-month">KM DA TE</span>
                    </div>
                  )
                )}
              </div>
            )
          })}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="pagination-row">
          <button
            type="button"
            className="btn-secondary"
            style={{
              height: 40,
              padding: "0 16px",
              opacity: data.first ? 0.4 : 1,
            }}
            disabled={data.first || isFetching}
            onClick={() => setPage((p) => p - 1)}
          >
            PRECEDENTE
          </button>

          <span className="pagination-row__label">
            {data.number + 1} / {data.totalPages}
          </span>

          <button
            type="button"
            className="btn-secondary"
            style={{
              height: 40,
              padding: "0 16px",
              opacity: data.last ? 0.4 : 1,
            }}
            disabled={data.last || isFetching}
            onClick={() => setPage((p) => p + 1)}
          >
            SUCCESSIVA
          </button>
        </div>
      )}
    </div>
  )
}

export default EventsListPage
