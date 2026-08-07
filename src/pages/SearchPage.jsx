import { useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Spinner } from "react-bootstrap"
import { FaArrowLeft, FaMapMarkerAlt, FaSearch } from "react-icons/fa"
import { useSearchUsersQuery } from "../features/users/usersApi"
import { useGetModelsQuery } from "../features/catalog/catalogApi"
import { useSearchEventsQuery } from "../features/events/eventsApi"
import { searchPlaces } from "../utils/geocoding"
import ModelDetailModal from "../features/catalog/components/ModelDetailModal"
import { CATEGORY_LABELS, VISIBILITY_LABELS } from "../utils/constants"
import { COLORS, FONTS, styles } from "../styles/theme"

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
    <div style={{ ...styles.pageBg, paddingTop: 20, paddingBottom: 40 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 20px 16px",
        }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={styles.iconButton}
        >
          <FaArrowLeft />
        </button>
        <div style={{ position: "relative", flex: 1 }}>
          <input
            type="search"
            autoFocus
            placeholder="Cerca motociclisti, moto, eventi, luoghi..."
            value={queryInput}
            onChange={handleChange}
            style={{ ...styles.input, height: 44, paddingRight: 40 }}
          />
          <FaSearch
            style={{
              position: "absolute",
              right: 15,
              top: "50%",
              transform: "translateY(-50%)",
              color: COLORS.textMuted,
            }}
          />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          padding: "0 20px 18px",
          overflowX: "auto",
        }}
      >
        {TABS.map((t) => {
          const active = tab === t.key
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              style={{
                height: 34,
                padding: "0 13px",
                borderRadius: 10,
                flexShrink: 0,
                background: active ? COLORS.accent : COLORS.card,
                border: `1px solid ${COLORS.border}`,
                color: active ? COLORS.onAccent : COLORS.textSecondary,
                fontFamily: FONTS.mono,
                fontSize: 10,
                letterSpacing: ".05em",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {!query.trim() && (
        <p
          style={{
            fontFamily: FONTS.body,
            fontSize: 13,
            color: COLORS.textFaint,
            textAlign: "center",
            padding: "50px 20px",
          }}
        >
          Digita per iniziare a cercare.
        </p>
      )}

      {query.trim() && tab === "people" && (
        <div style={{ padding: "0 20px" }}>
          {usersQuery.isLoading ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <Spinner animation="border" style={{ color: COLORS.accent }} />
            </div>
          ) : usersQuery.data?.content.length === 0 ? (
            <p
              style={{
                fontFamily: FONTS.body,
                fontSize: 13,
                color: COLORS.textFaint,
                textAlign: "center",
                padding: 40,
              }}
            >
              Nessun motociclista trovato.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {usersQuery.data?.content.map((u) => (
                <Link
                  key={u.id}
                  to={`/profile/${u.username}`}
                  style={{
                    ...styles.card,
                    padding: 13,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    textDecoration: "none",
                  }}
                >
                  <img
                    src={u.profilePicture}
                    alt={u.username}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      objectFit: "cover",
                      background: COLORS.surfaceRaised,
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontFamily: FONTS.heading,
                        fontWeight: 600,
                        fontSize: 15,
                        color: COLORS.text,
                      }}
                    >
                      {u.username}
                    </div>
                    {(u.name || u.surname) && (
                      <div
                        style={{
                          fontFamily: FONTS.mono,
                          fontSize: 10,
                          color: COLORS.textMuted,
                          marginTop: 2,
                        }}
                      >
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
        <div style={{ padding: "0 20px" }}>
          {modelsQuery.isLoading ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <Spinner animation="border" style={{ color: COLORS.accent }} />
            </div>
          ) : modelsQuery.data?.content.length === 0 ? (
            <p
              style={{
                fontFamily: FONTS.body,
                fontSize: 13,
                color: COLORS.textFaint,
                textAlign: "center",
                padding: 40,
              }}
            >
              Nessun modello trovato.
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              {modelsQuery.data?.content.map((model) => (
                <div
                  key={model.id}
                  onClick={() => setSelectedModel(model)}
                  style={{
                    ...styles.card,
                    cursor: "pointer",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{ aspectRatio: "16/10", background: COLORS.cardAlt }}
                  >
                    {model.imageUrl && (
                      <img
                        src={model.imageUrl}
                        alt={model.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    )}
                  </div>
                  <div style={{ padding: "10px 11px" }}>
                    <div
                      style={{
                        fontFamily: FONTS.heading,
                        fontWeight: 600,
                        fontSize: 14,
                      }}
                    >
                      {model.brand?.name} {model.name}
                    </div>
                    <div
                      style={{
                        fontFamily: FONTS.mono,
                        fontSize: 9,
                        color: COLORS.textMuted,
                        marginTop: 4,
                      }}
                    >
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
        <div style={{ padding: "0 20px" }}>
          {eventsQuery.isLoading ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <Spinner animation="border" style={{ color: COLORS.accent }} />
            </div>
          ) : eventsQuery.data?.content.length === 0 ? (
            <p
              style={{
                fontFamily: FONTS.body,
                fontSize: 13,
                color: COLORS.textFaint,
                textAlign: "center",
                padding: 40,
              }}
            >
              Nessun evento trovato.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {eventsQuery.data?.content.map((event) => {
                const start = new Date(event.startDateTime)
                return (
                  <Link
                    key={event.id}
                    to={`/events/${event.id}`}
                    style={{
                      ...styles.card,
                      padding: 14,
                      display: "flex",
                      gap: 12,
                      textDecoration: "none",
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        flexShrink: 0,
                        borderRadius: 10,
                        background: COLORS.surfaceRaised,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: FONTS.mono,
                        color: COLORS.accent,
                      }}
                    >
                      <span style={{ fontSize: 13 }}>{start.getDate()}</span>
                      <span style={{ fontSize: 8, color: COLORS.textMuted }}>
                        {start
                          .toLocaleDateString("it-IT", { month: "short" })
                          .toUpperCase()}
                      </span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: FONTS.heading,
                          fontWeight: 600,
                          fontSize: 15,
                          color: COLORS.text,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {event.title}
                      </div>
                      <div
                        style={{
                          fontFamily: FONTS.mono,
                          fontSize: 9.5,
                          color: COLORS.textMuted,
                          marginTop: 3,
                        }}
                      >
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
        <div style={{ padding: "0 20px" }}>
          {isSearchingPlaces ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <Spinner animation="border" style={{ color: COLORS.accent }} />
            </div>
          ) : places.length === 0 ? (
            <p
              style={{
                fontFamily: FONTS.body,
                fontSize: 13,
                color: COLORS.textFaint,
                textAlign: "center",
                padding: 40,
              }}
            >
              Nessun luogo trovato.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {places.map((place) => (
                <button
                  key={place.id}
                  type="button"
                  onClick={() => handlePlaceClick(place)}
                  style={{
                    ...styles.card,
                    padding: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    border: `1px solid ${COLORS.border}`,
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%",
                  }}
                >
                  <FaMapMarkerAlt
                    style={{ color: COLORS.accent, flexShrink: 0 }}
                  />
                  <span
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 14,
                      color: COLORS.text,
                    }}
                  >
                    {place.name}
                  </span>
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
