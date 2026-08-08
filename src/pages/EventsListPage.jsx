import { useRef, useState } from "react"
import { Spinner } from "react-bootstrap"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { FaLock, FaTimes } from "react-icons/fa"
import {
  useSearchEventsQuery,
  useGetOrganizedEventsQuery,
  useGetParticipatingEventsQuery,
} from "../features/events/eventsApi"
import { EVENT_TYPE_LABELS, VISIBILITY_LABELS } from "../utils/constants"
import { COLORS, FONTS, styles } from "../styles/theme"
import NotificationBell from "../features/notification/components/NotificationBell"

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
    <div style={{ ...styles.pageBg, paddingTop: 20, paddingBottom: 20 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 20px",
        }}
      >
        <div style={{ ...styles.pageTitle, fontSize: 28 }}>EVENTI</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <NotificationBell />
          <Link
            to="/events/new"
            style={{
              height: 40,
              padding: "0 15px",
              borderRadius: 12,
              background: COLORS.accent,
              border: "none",
              color: COLORS.onAccent,
              fontFamily: FONTS.heading,
              fontWeight: 700,
              fontSize: 15,
              letterSpacing: ".04em",
              display: "inline-flex",
              alignItems: "center",
              textDecoration: "none",
            }}
          >
            + CREA
          </Link>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, padding: "18px 20px 0" }}>
        {TABS.map((t) => {
          const active = tab === t.key
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => handleTab(t.key)}
              style={{
                height: 36,
                padding: "0 14px",
                borderRadius: 11,
                background: active ? COLORS.accent : COLORS.card,
                border: `1px solid ${COLORS.border}`,
                color: active ? COLORS.onAccent : COLORS.textSecondary,
                fontFamily: FONTS.mono,
                fontSize: 10.5,
                letterSpacing: ".06em",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {tab === "search" && (
        <div style={{ padding: "16px 20px 0" }}>
          <input
            type="search"
            placeholder="Cerca per titolo..."
            value={titleInput}
            onChange={handleSearchChange}
            style={{ ...styles.input, height: 46 }}
          />
        </div>
      )}

      {geoFilter && (
        <div style={{ padding: "0 20px 12px" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 12px",
              borderRadius: 9,
              background: COLORS.accentSoftBg,
              border: `1px solid ${COLORS.accentSoftBorder}`,
              fontFamily: FONTS.mono,
              fontSize: 10.5,
              color: COLORS.accent,
            }}
          >
            VICINO A {geoFilter.placeName?.toUpperCase()}
            <button
              type="button"
              onClick={() => setGeoFilter(null)}
              style={{
                background: "none",
                border: "none",
                color: COLORS.accent,
                cursor: "pointer",
                padding: 0,
                display: "flex",
              }}
            >
              <FaTimes size={10} />
            </button>
          </span>
        </div>
      )}

      {isLoading && (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <Spinner animation="border" style={{ color: COLORS.accent }} />
        </div>
      )}

      {isError && (
        <div style={{ ...styles.emptyState, margin: "20px" }}>
          Impossibile caricare gli eventi.
        </div>
      )}

      {data && data.content.length === 0 && (
        <p
          style={{
            fontFamily: FONTS.body,
            fontSize: 13,
            color: COLORS.textFaint,
            textAlign: "center",
            padding: "60px 20px",
          }}
        >
          Nessun evento trovato.
        </p>
      )}

      {data && data.content.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            padding: "18px 20px 0",
            opacity: isFetching ? 0.6 : 1,
          }}
        >
          {data.content.map((event) => {
            const start = new Date(event.startDateTime)
            return (
              <div
                key={event.id}
                onClick={() => navigate(`/events/${event.id}`)}
                style={{
                  ...styles.card,
                  padding: 16,
                  cursor: "pointer",
                  display: "flex",
                  gap: 13,
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
                  <span style={{ fontSize: 15, lineHeight: 1 }}>
                    {start.getDate().toString().padStart(2, "0")}
                  </span>
                  <span
                    style={{
                      fontSize: 9,
                      color: COLORS.textMuted,
                      marginTop: 2,
                    }}
                  >
                    {start
                      .toLocaleDateString("it-IT", { month: "short" })
                      .toUpperCase()}
                  </span>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      marginBottom: 4,
                    }}
                  >
                    {event.locked && (
                      <FaLock
                        style={{
                          fontSize: 11,
                          color: COLORS.textMuted,
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <span
                      style={{
                        fontFamily: FONTS.heading,
                        fontWeight: 600,
                        fontSize: 18,
                        lineHeight: 1.1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {event.title}
                    </span>
                    {event.organizer && (
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 7,
                          background: COLORS.accentSoftBg,
                          border: `1px solid ${COLORS.accentSoftBorder}`,
                          fontFamily: FONTS.mono,
                          fontSize: 9,
                          color: COLORS.accent,
                          flexShrink: 0,
                        }}
                      >
                        TUO
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      fontFamily: FONTS.mono,
                      fontSize: 10,
                      color: COLORS.textMuted,
                      marginBottom: 8,
                    }}
                  >
                    {event.organizerUsername} ·{" "}
                    {start.toLocaleTimeString("it-IT", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>

                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {event.type !== "STANDARD" && (
                      <span
                        style={{
                          padding: "3px 9px",
                          borderRadius: 8,
                          background: COLORS.cardAlt,
                          border: `1px solid ${COLORS.borderSoft}`,
                          fontFamily: FONTS.mono,
                          fontSize: 9.5,
                          color: COLORS.accent,
                        }}
                      >
                        {EVENT_TYPE_LABELS[event.type]}
                      </span>
                    )}
                    <span
                      style={{
                        padding: "3px 9px",
                        borderRadius: 8,
                        background: COLORS.cardAlt,
                        border: `1px solid ${COLORS.borderSoft}`,
                        fontFamily: FONTS.mono,
                        fontSize: 9.5,
                        color: COLORS.textSecondary,
                      }}
                    >
                      {VISIBILITY_LABELS[event.visibility]}
                    </span>
                    <span
                      style={{
                        padding: "3px 9px",
                        borderRadius: 8,
                        background: COLORS.cardAlt,
                        border: `1px solid ${COLORS.borderSoft}`,
                        fontFamily: FONTS.mono,
                        fontSize: 9.5,
                        color: COLORS.textSecondary,
                      }}
                    >
                      {event.currentParticipants}/{event.maxParticipants}
                    </span>
                    {event.myParticipationStatus && (
                      <span
                        style={{
                          padding: "3px 9px",
                          borderRadius: 8,
                          fontFamily: FONTS.mono,
                          fontSize: 9.5,
                          background:
                            event.myParticipationStatus === "ACCEPTED"
                              ? "#173323"
                              : COLORS.accentSoftBg,
                          border: `1px solid ${event.myParticipationStatus === "ACCEPTED" ? "rgba(52,199,89,.35)" : COLORS.accentSoftBorder}`,
                          color:
                            event.myParticipationStatus === "ACCEPTED"
                              ? "#4ADE80"
                              : COLORS.accent,
                        }}
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
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 16,
            padding: "24px 20px",
          }}
        >
          <button
            type="button"
            disabled={data.first || isFetching}
            onClick={() => setPage((p) => p - 1)}
            style={{
              ...styles.secondaryButton,
              height: 40,
              padding: "0 16px",
              opacity: data.first ? 0.4 : 1,
            }}
          >
            PRECEDENTE
          </button>
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: 11,
              color: COLORS.textMuted,
            }}
          >
            {data.number + 1} / {data.totalPages}
          </span>
          <button
            type="button"
            disabled={data.last || isFetching}
            onClick={() => setPage((p) => p + 1)}
            style={{
              ...styles.secondaryButton,
              height: 40,
              padding: "0 16px",
              opacity: data.last ? 0.4 : 1,
            }}
          >
            SUCCESSIVA
          </button>
        </div>
      )}
    </div>
  )
}

export default EventsListPage
