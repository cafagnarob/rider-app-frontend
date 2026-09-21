import { useRef, useState } from "react"
import { Spinner } from "react-bootstrap"
import { EVENT_TYPE_LABELS, VISIBILITY_LABELS } from "../utils/constants"
import {
  useAdminCancelEventMutation,
  useGetAdminEventsQuery,
} from "../features/auth/adminApi"
import { FaTimes } from "react-icons/fa"
import { searchPlaces } from "../utils/geocoding"
import { Link } from "react-router-dom"

const STATUS_LABELS = {
  ACTIVE: "ATTIVO",
  CANCELLED: "ANNULLATO",
  FINISHED: "CONCLUSO",
}

function AdminEventsPage() {
  const [page, setPage] = useState(0)

  const [searchMode, setSearchMode] = useState("title")
  const [titleInput, setTitleInput] = useState("")
  const [organizerInput, setOrganizerInput] = useState("")
  const [title, setTitle] = useState("")
  const [organizerUsername, setOrganizerUsername] = useState("")
  const textTimerRef = useRef(null)

  const [status, setStatus] = useState("")
  const [visibility, setVisibility] = useState("")
  const [type, setType] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const [geoFilter, setGeoFilter] = useState(null)
  const [placeSearch, setPlaceSearch] = useState("")
  const [placeResults, setPlaceResults] = useState([])
  const placeTimerRef = useRef(null)
  const [radiusKm, setRadiusKm] = useState(40)
  const [onlyPendingAccessRequests, setOnlyPendingAccessRequests] =
    useState(false)

  const { data, isLoading, isFetching, isError } = useGetAdminEventsQuery({
    title: title || undefined,
    organizerUsername: organizerUsername || undefined,
    status: status || undefined,
    visibility: visibility || undefined,
    type: type || undefined,
    onlyPendingAccessRequests: onlyPendingAccessRequests || undefined,
    dateFrom: dateFrom ? dateFrom + ":00" : undefined,
    dateTo: dateTo ? dateTo + ":00" : undefined,
    lat: geoFilter?.lat,
    lng: geoFilter?.lng,
    radiusKm: geoFilter ? radiusKm : undefined,
    page,
  })

  const [adminCancelEvent, { isLoading: isCancelling }] =
    useAdminCancelEventMutation()
  const [eventToCancel, setEventToCancel] = useState(null)
  const [reason, setReason] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  const handleTitleChange = (e) => {
    const value = e.target.value
    setTitleInput(value)
    clearTimeout(textTimerRef.current)
    textTimerRef.current = setTimeout(() => {
      setTitle(value)
      setPage(0)
    }, 400)
  }

  const handleOrganizerChange = (e) => {
    const value = e.target.value
    setOrganizerInput(value)
    clearTimeout(textTimerRef.current)
    textTimerRef.current = setTimeout(() => {
      setOrganizerUsername(value)
      setPage(0)
    }, 400)
  }

  const handlePlaceSearchChange = (e) => {
    const value = e.target.value
    setPlaceSearch(value)
    clearTimeout(placeTimerRef.current)
    if (!value.trim()) {
      setPlaceResults([])
      return
    }
    placeTimerRef.current = setTimeout(async () => {
      try {
        setPlaceResults(await searchPlaces(value))
      } catch {
        setPlaceResults([])
      }
    }, 500)
  }

  const handlePickPlace = (place) => {
    setGeoFilter({
      lat: place.latitude,
      lng: place.longitude,
      placeName: place.name,
    })
    setPlaceSearch("")
    setPlaceResults([])
    setPage(0)
  }

  const handleCancel = async () => {
    setErrorMsg("")
    try {
      await adminCancelEvent({
        eventId: eventToCancel.id,
        reason: reason.trim() || null,
      }).unwrap()
      setEventToCancel(null)
      setReason("")
    } catch (err) {
      setErrorMsg(err.data?.message || "Impossibile annullare l'evento.")
    }
  }

  return (
    <div className="page">
      <div className="page-title" style={{ fontSize: 26, marginBottom: 16 }}>
        EVENTI
      </div>

      <div className="form-stack" style={{ marginBottom: 16 }}>
        <div className="tab-pills" style={{ marginBottom: 12 }}>
          {[
            { key: "title", label: "TITOLO" },
            { key: "username", label: "ORGANIZZATORE" },
            { key: "zone", label: "ZONA" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`tab-pill ${searchMode === tab.key ? "tab-pill--active" : ""}`}
              onClick={() => {
                setSearchMode(tab.key)
                setTitleInput("")
                setTitle("")
                setOrganizerInput("")
                setOrganizerUsername("")
                setGeoFilter(null)
                setPage(0)
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {searchMode === "title" && (
          <input
            type="search"
            className="input input--compact"
            placeholder="Cerca per titolo..."
            value={titleInput}
            onChange={handleTitleChange}
            style={{ marginBottom: 16 }}
          />
        )}

        {searchMode === "username" && (
          <input
            type="text"
            className="input input--compact"
            placeholder="Username organizzatore..."
            value={organizerInput}
            onChange={handleOrganizerChange}
            style={{ marginBottom: 16 }}
          />
        )}

        {searchMode === "zone" && (
          <div style={{ marginBottom: 16 }}>
            {!geoFilter ? (
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  className="input input--compact"
                  placeholder="Cerca una zona..."
                  value={placeSearch}
                  onChange={handlePlaceSearchChange}
                />
                {placeResults.length > 0 && (
                  <div className="card search-results">
                    {placeResults.map((r) => (
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
            ) : (
              <div className="events-list-page__filter-chip-wrap">
                <span className="chip">
                  VICINO A {geoFilter.placeName?.toUpperCase()}
                  <button
                    type="button"
                    className="chip__remove-btn"
                    onClick={() => {
                      setGeoFilter(null)
                      setPage(0)
                    }}
                  >
                    <FaTimes size={10} />
                  </button>
                </span>
                <input
                  type="number"
                  className="input input--compact"
                  style={{ width: 90, marginLeft: 8 }}
                  value={radiusKm}
                  min={1}
                  onChange={(e) => {
                    setRadiusKm(Number(e.target.value) || 40)
                    setPage(0)
                  }}
                />
                <span className="duration-hint" style={{ marginLeft: 6 }}>
                  KM
                </span>
              </div>
            )}
          </div>
        )}

        <div className="field-row" style={{ marginBottom: 12 }}>
          <select
            className="select"
            style={{ fontFamily: "var(--font-heading)" }}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(0)
            }}
          >
            <option value="">TUTTI GLI STATI</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            className="select"
            style={{ fontFamily: "var(--font-heading)" }}
            value={visibility}
            onChange={(e) => {
              setVisibility(e.target.value)
              setPage(0)
            }}
          >
            <option value="">TUTTE LE VISIBILITÀ</option>
            {Object.entries(VISIBILITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            className="select"
            style={{ fontFamily: "var(--font-heading)" }}
            value={type}
            onChange={(e) => {
              setType(e.target.value)
              setPage(0)
            }}
          >
            <option value="">TUTTI I TIPI</option>
            {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="options-row" style={{ marginBottom: 16 }}>
          <button
            type="button"
            className={`option-toggle ${onlyPendingAccessRequests ? "option-toggle--active" : ""}`}
            onClick={() => {
              setOnlyPendingAccessRequests((v) => !v)
              setPage(0)
            }}
          >
            SOLO CON RICHIESTE IN SOSPESO
          </button>
        </div>

        <div className="field-row">
          <div className="field-col">
            <div className="field-label form-group__label">DA</div>
            <input
              type="datetime-local"
              className="input"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value)
                setPage(0)
              }}
            />
          </div>
          <div className="field-col">
            <div className="field-label form-group__label">A</div>
            <input
              type="datetime-local"
              className="input"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value)
                setPage(0)
              }}
            />
          </div>
        </div>
      </div>

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
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            opacity: isFetching ? 0.6 : 1,
          }}
        >
          {data.content.map((event) => {
            const start = new Date(event.startDateTime)
            return (
              <div key={event.id} className="card" style={{ padding: 14 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 12,
                  }}
                >
                  <div>
                    <Link
                      to={`/events/${event.id}`}
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontWeight: 700,
                        fontSize: 16,
                        textDecoration: "none",
                        color: "inherit",
                      }}
                    >
                      {event.title}
                    </Link>
                    <div className="duration-hint" style={{ marginTop: 4 }}>
                      {event.organizerUsername} ·{" "}
                      {start.toLocaleDateString("it-IT", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                      {" · "}
                      {event.currentParticipants}/{event.maxParticipants}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        marginTop: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <span className="badge-sm">
                        {VISIBILITY_LABELS[event.visibility]}
                      </span>
                      {event.type !== "STANDARD" && (
                        <span className="badge-sm badge-sm--accent">
                          {EVENT_TYPE_LABELS[event.type]}
                        </span>
                      )}
                      {event.status === "CANCELLED" && (
                        <span
                          className="badge-sm"
                          style={{ color: "var(--color-danger)" }}
                        >
                          ANNULLATO
                        </span>
                      )}
                      {event.status === "FINISHED" && (
                        <span className="badge-sm">CONCLUSO</span>
                      )}
                    </div>
                  </div>

                  {event.status === "ACTIVE" && (
                    <button
                      type="button"
                      className="btn-danger-xs"
                      onClick={() => setEventToCancel(event)}
                    >
                      ANNULLA
                    </button>
                  )}
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

      {eventToCancel && (
        <div className="modal-overlay" onClick={() => setEventToCancel(null)}>
          <div className="card modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">
              ANNULLARE "{eventToCancel.title.toUpperCase()}"?
            </div>
            <p className="modal-text">
              L'organizzatore e i partecipanti verranno informati. L'operazione
              non è reversibile.
            </p>
            <div style={{ marginBottom: 16 }}>
              <div className="field-label form-group__label">
                MOTIVO (OPZIONALE)
              </div>
              <textarea
                className="textarea"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            {errorMsg && (
              <div className="error-text" style={{ marginBottom: 12 }}>
                {errorMsg}
              </div>
            )}
            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setEventToCancel(null)}
              >
                INDIETRO
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleCancel}
                disabled={isCancelling}
              >
                {isCancelling ? "..." : "CONFERMA ANNULLAMENTO"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminEventsPage
