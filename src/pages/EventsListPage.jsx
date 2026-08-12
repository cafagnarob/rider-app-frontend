import { useRef, useState } from "react"
import { useNavigate, Link, useLocation } from "react-router-dom"
import { Spinner } from "react-bootstrap"
import { FaLock, FaTimes } from "react-icons/fa"
import {
  useSearchEventsQuery,
  useGetOrganizedEventsQuery,
  useGetParticipatingEventsQuery,
} from "../features/events/eventsApi"
import NotificationBell from "../features/notification/components/NotificationBell"
import { VISIBILITY_LABELS, EVENT_TYPE_LABELS } from "../utils/constants"
import "../pages/CSS/EventsListPage.css"

const TABS = [
  { key: "search", label: "SCOPRI" },
  { key: "organized", label: "ORGANIZZATI" },
  { key: "participating", label: "PARTECIPO" },
]

function EventsListPage() {
  const [tab, setTab] = useState("search")
  const [page, setPage] = useState(0)
  const [title, setTitle] = useState("")
  const navigate = useNavigate()
  const location = useLocation()

  const [titleInput, setTitleInput] = useState("")
  const timerRef = useRef(null)

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
    },
    { skip: tab !== "search" },
  )
  const organizedQuery = useGetOrganizedEventsQuery(
    { page },
    { skip: tab !== "organized" },
  )
  const participatingQuery = useGetParticipatingEventsQuery(
    { page },
    { skip: tab !== "participating" },
  )

  const { data, isLoading, isFetching, isError } =
    tab === "search"
      ? searchQuery
      : tab === "organized"
        ? organizedQuery
        : participatingQuery

  const handleTab = (key) => {
    setTab(key)
    setPage(0)
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
                      .toLocaleDateString("it-IT", { month: "short" })
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
                    {event.myParticipationStatus && (
                      <span
                        className={
                          event.myParticipationStatus === "ACCEPTED"
                            ? "badge-sm--status-accepted"
                            : "badge-sm--status-pending"
                        }
                      >
                        {event.myParticipationStatus === "ACCEPTED"
                          ? "CONFERMATO"
                          : "IN ATTESA"}
                      </span>
                    )}
                  </div>
                </div>
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
