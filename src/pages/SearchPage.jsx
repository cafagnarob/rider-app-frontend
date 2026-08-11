import { useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Spinner } from "react-bootstrap"
import { FaArrowLeft, FaMapMarkerAlt, FaSearch } from "react-icons/fa"
import { useSearchUsersQuery } from "../features/users/usersApi"
import { useGetModelsQuery } from "../features/catalog/catalogApi"
import { useSearchEventsQuery } from "../features/events/eventsApi"
import { searchPlaces } from "../utils/geocoding"
import ModelDetailModal from "../features/catalog/components/ModelDetailModal"
import {
  CATEGORY_LABELS,
  VISIBILITY_LABELS,
  EVENT_TYPE_LABELS,
} from "../utils/constants"
import "./SearchPage.css"

const TABS = [
  { key: "people", label: "MOTOCICLISTI" },
  { key: "bikes", label: "MOTO" },
  { key: "events", label: "EVENTI" },
  { key: "places", label: "LUOGHI" },
]

function SearchPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState("people")
  const [queryInput, setQueryInput] = useState("")
  const [query, setQuery] = useState("")
  const timerRef = useRef(null)

  const [selectedModel, setSelectedModel] = useState(null)

  const [placesResult, setPlacesResult] = useState({ query: "", places: [] })

  const places = placesResult.query === query ? placesResult.places : []
  const isSearchingPlaces =
    tab === "places" && !!query.trim() && placesResult.query !== query

  const handleChange = (e) => {
    const value = e.target.value
    setQueryInput(value)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setQuery(value), 400)
  }

  useEffect(() => {
    if (tab !== "places" || !query.trim()) return

    let cancelled = false
    searchPlaces(query)
      .then((results) => {
        if (!cancelled) setPlacesResult({ query, places: results })
      })
      .catch(() => {
        if (!cancelled) setPlacesResult({ query, places: [] })
      })

    return () => {
      cancelled = true
    }
  }, [query, tab])

  const usersQuery = useSearchUsersQuery(
    { query, page: 0, size: 20 },
    { skip: tab !== "people" || !query },
  )
  const modelsQuery = useGetModelsQuery(
    { name: query, page: 0, size: 20 },
    { skip: tab !== "bikes" || !query },
  )
  const eventsQuery = useSearchEventsQuery(
    { title: query, page: 0, size: 20 },
    { skip: tab !== "events" || !query },
  )

  const handlePlaceClick = (place) => {
    navigate("/events", {
      state: {
        nearLat: place.latitude,
        nearLng: place.longitude,
        placeName: place.name.split(",")[0],
      },
    })
  }

  return (
    <div className="page">
      <div className="search-page__header">
        <button type="button" className="btn-icon" onClick={() => navigate(-1)}>
          <FaArrowLeft />
        </button>
        <div className="search-page__search-wrap">
          <input
            type="search"
            className="input"
            autoFocus
            placeholder="Cerca motociclisti, moto, eventi, luoghi..."
            value={queryInput}
            onChange={handleChange}
            style={{ height: 44, paddingRight: 40 }}
          />
          <FaSearch className="search-input-wrap__icon" />
        </div>
      </div>

      <div className="search-page__tabs">
        {TABS.map((t) => {
          const active = tab === t.key
          return (
            <button
              key={t.key}
              type="button"
              className={`search-tab-pill ${active ? "search-tab-pill--active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {!query.trim() && (
        <p className="search-page__prompt">Digita per iniziare a cercare.</p>
      )}

      {query.trim() && tab === "people" && (
        <div className="search-page__tab-content">
          {usersQuery.isLoading ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <Spinner animation="border" style={{ color: "#FF7A2F" }} />
            </div>
          ) : usersQuery.data?.content.length === 0 ? (
            <p className="search-result-empty">Nessun motociclista trovato.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {usersQuery.data?.content.map((u) => (
                <Link
                  key={u.id}
                  to={`/profile/${u.username}`}
                  className="card result-row"
                >
                  <img
                    src={u.profilePicture}
                    alt={u.username}
                    className="result-row__avatar"
                  />
                  <div>
                    <div className="result-row__title">{u.username}</div>
                    {(u.name || u.surname) && (
                      <div className="result-row__subtitle">
                        {u.name} {u.surname}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {query.trim() && tab === "bikes" && (
        <div className="search-page__tab-content">
          {modelsQuery.isLoading ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <Spinner animation="border" style={{ color: "#FF7A2F" }} />
            </div>
          ) : modelsQuery.data?.content.length === 0 ? (
            <p className="search-result-empty">Nessun modello trovato.</p>
          ) : (
            <div className="grid-2">
              {modelsQuery.data?.content.map((model) => (
                <div
                  key={model.id}
                  className="card"
                  style={{ cursor: "pointer", overflow: "hidden" }}
                  onClick={() => setSelectedModel(model)}
                >
                  <div className="model-tile__image">
                    {model.imageUrl && (
                      <img src={model.imageUrl} alt={model.name} />
                    )}
                  </div>
                  <div className="model-tile__info">
                    <div className="model-tile__name">
                      {model.brand?.name} {model.name}
                    </div>
                    <div className="model-tile__meta">
                      {CATEGORY_LABELS[model.category] || model.category}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {query.trim() && tab === "events" && (
        <div className="search-page__tab-content">
          {eventsQuery.isLoading ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <Spinner animation="border" style={{ color: "#FF7A2F" }} />
            </div>
          ) : eventsQuery.data?.content.length === 0 ? (
            <p className="search-result-empty">Nessun evento trovato.</p>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {eventsQuery.data?.content.map((event) => {
                const start = new Date(event.startDateTime)
                return (
                  <Link
                    key={event.id}
                    to={`/events/${event.id}`}
                    className="card search-event-row"
                  >
                    <div className="search-event-row__date">
                      <span className="search-event-row__day">
                        {start.getDate()}
                      </span>
                      <span className="search-event-row__month">
                        {start
                          .toLocaleDateString("it-IT", { month: "short" })
                          .toUpperCase()}
                      </span>
                    </div>
                    <div className="search-event-row__info">
                      <div className="search-event-row__title">
                        {event.title}
                      </div>
                      <div className="search-event-row__meta">
                        {event.type !== "STANDARD" && (
                          <span style={{ color: "var(--color-accent)" }}>
                            {EVENT_TYPE_LABELS[event.type]} ·{" "}
                          </span>
                        )}
                        {VISIBILITY_LABELS[event.visibility]} ·{" "}
                        {event.currentParticipants}/{event.maxParticipants}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}

      {query.trim() && tab === "places" && (
        <div className="search-page__tab-content">
          {isSearchingPlaces ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <Spinner animation="border" style={{ color: "#FF7A2F" }} />
            </div>
          ) : places.length === 0 ? (
            <p className="search-result-empty">Nessun luogo trovato.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {places.map((place) => (
                <button
                  key={place.id}
                  type="button"
                  className="card place-result-btn"
                  onClick={() => handlePlaceClick(place)}
                >
                  <FaMapMarkerAlt className="place-result-btn__icon" />
                  <span className="place-result-btn__label">{place.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <ModelDetailModal
        model={selectedModel}
        onClose={() => setSelectedModel(null)}
      />
    </div>
  )
}

export default SearchPage
