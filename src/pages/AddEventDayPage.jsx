import { useRef, useState } from "react"
import { useParams, useNavigate, Link, useLocation } from "react-router-dom"
import { Spinner } from "react-bootstrap"
import { FaArrowLeft } from "react-icons/fa"
import {
  useGetEventByIdQuery,
  useAddEventDayMutation,
} from "../features/events/eventsApi"
import { useGetMyRoutesQuery } from "../features/routesMap/routesApi"
import { searchPlaces } from "../utils/geocoding"
import { COLORS, FONTS, styles } from "../styles/theme"

const DAY_DRAFT_KEY = "eventDayDraft"

const loadDayDraft = (tripId) => {
  try {
    const saved = localStorage.getItem(DAY_DRAFT_KEY)
    if (!saved) return null
    const parsed = JSON.parse(saved)
    return parsed.tripId === tripId ? parsed.form : null
  } catch {
    return null
  }
}

const DAY_TYPE_OPTIONS = [
  {
    value: "STANDARD",
    label: "TAPPA IN MOTO",
    hint: "Un percorso da fare quel giorno",
  },
  {
    value: "RADUNO",
    label: "SOSTA",
    hint: "Un punto di ritrovo, senza tragitto",
  },
]

const emptyDayForm = {
  title: "",
  description: "",
  type: "STANDARD",
  routeId: "",
  meetingPointLat: null,
  meetingPointLng: null,
  meetingPointLabel: "",
  startDateTime: "",
  endDateTime: "",
}

function AddEventDayPage() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const { data: trip, isLoading: isLoadingTrip } = useGetEventByIdQuery(tripId)
  const { data: routesPage, isLoading: isLoadingRoutes } = useGetMyRoutesQuery({
    page: 0,
    size: 50,
  })
  const [addEventDay, { isLoading: isSaving }] = useAddEventDayMutation()

  const dayDraft = loadDayDraft(tripId)

  const [dayForm, setDayForm] = useState({
    ...emptyDayForm,
    ...dayDraft,
    routeId: location.state?.newRouteId || dayDraft?.routeId || "",
  })

  const [errorMsg, setErrorMsg] = useState("")

  const [placeSearch, setPlaceSearch] = useState("")
  const [placeResults, setPlaceResults] = useState([])
  const placeTimerRef = useRef(null)

  const persistDraft = (next) => {
    try {
      localStorage.setItem(
        DAY_DRAFT_KEY,
        JSON.stringify({ tripId, form: next }),
      )
    } catch {
      // localStorage non disponibile
    }
  }

  const set = (field) => (e) => {
    const value = e.target.value
    setDayForm((prev) => {
      const next = { ...prev, [field]: value }
      persistDraft(next)
      return next
    })
  }

  const saveDraft = () => persistDraft(dayForm)

  const handleTypeChange = (value) => {
    setDayForm((prev) => {
      const next = {
        ...prev,
        type: value,
      }
      persistDraft(next)
      return next
    })
  }

  const handlePlaceSearchChange = (e) => {
    const value = e.target.value
    setPlaceSearch(value)
    clearTimeout(placeTimerRef.current)
    placeTimerRef.current = setTimeout(async () => {
      if (!value.trim()) {
        setPlaceResults([])
        return
      }
      try {
        setPlaceResults(await searchPlaces(value))
      } catch {
        setPlaceResults([])
      }
    }, 500)
  }

  const handlePickPlace = (place) => {
    setDayForm((prev) => {
      const next = {
        ...prev,
        meetingPointLat: place.latitude,
        meetingPointLng: place.longitude,
        meetingPointLabel: place.name,
      }
      persistDraft(next)
      return next
    })
    setPlaceSearch("")
    setPlaceResults([])
  }

  const clearMeetingPoint = () => {
    setDayForm((prev) => {
      const next = {
        ...prev,
        meetingPointLat: null,
        meetingPointLng: null,
        meetingPointLabel: "",
      }
      persistDraft(next)
      return next
    })
  }

  const selectedRoute = routesPage?.content?.find(
    (r) => r.id === dayForm.routeId,
  )

  const handleAddDay = async (e) => {
    e.preventDefault()
    setErrorMsg("")

    if (dayForm.type === "STANDARD" && !dayForm.routeId) {
      setErrorMsg("Una tappa in moto richiede un percorso.")
      return
    }
    if (
      dayForm.type === "RADUNO" &&
      !dayForm.routeId &&
      !(dayForm.meetingPointLat && dayForm.meetingPointLng)
    ) {
      setErrorMsg("Una sosta richiede un percorso oppure un punto di ritrovo.")
      return
    }
    if (
      !dayForm.startDateTime ||
      !dayForm.endDateTime ||
      new Date(dayForm.endDateTime) <= new Date(dayForm.startDateTime)
    ) {
      setErrorMsg("La fine deve essere successiva all'inizio.")
      return
    }

    try {
      await addEventDay({
        tripId,
        title: dayForm.title,
        description: dayForm.description,
        type: dayForm.type,
        routeId: dayForm.routeId || null,
        meetingPointLat: !dayForm.routeId ? dayForm.meetingPointLat : null,
        meetingPointLng: !dayForm.routeId ? dayForm.meetingPointLng : null,
        startDateTime: dayForm.startDateTime + ":00",
        endDateTime: dayForm.endDateTime + ":00",
      }).unwrap()

      setDayForm(emptyDayForm)
      try {
        localStorage.removeItem(DAY_DRAFT_KEY)
      } catch {
        // localStorage non disponibile
      }
    } catch (err) {
      setErrorMsg(err.data?.message || "Impossibile aggiungere il giorno.")
    }
  }

  if (isLoadingTrip) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <Spinner animation="border" style={{ color: COLORS.accent }} />
      </div>
    )
  }

  if (!trip || trip.type !== "MULTI_DAY_TRIP") {
    return (
      <div style={{ ...styles.emptyState, margin: 20 }}>
        Viaggio non trovato.
      </div>
    )
  }

  const dayNumber = (trip.children?.length || 0) + 1

  return (
    <div style={{ ...styles.pageBg, paddingTop: 20, paddingBottom: 40 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 20px 6px",
        }}
      >
        <button
          type="button"
          onClick={() => navigate(`/events/${tripId}`)}
          style={styles.iconButton}
        >
          <FaArrowLeft />
        </button>
        <div>
          <div style={{ ...styles.pageTitle, fontSize: 22, lineHeight: 1.15 }}>
            {trip.title}
          </div>
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 10,
              color: COLORS.textMuted,
              marginTop: 2,
            }}
          >
            AGGIUNGI I GIORNI DEL VIAGGIO
          </div>
        </div>
      </div>

      {trip.children?.length > 0 && (
        <div style={{ padding: "18px 20px 0" }}>
          <div style={{ ...styles.fieldLabel, marginBottom: 10 }}>
            GIORNI GIÀ AGGIUNTI
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {trip.children.map((day, index) => (
              <div
                key={day.id}
                style={{
                  ...styles.card,
                  padding: "11px 13px",
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                }}
              >
                <span
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: COLORS.cardAlt,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: FONTS.mono,
                    fontSize: 11,
                    color: COLORS.accent,
                  }}
                >
                  {index + 1}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: FONTS.heading,
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    {day.title}
                  </div>
                  <div
                    style={{
                      fontFamily: FONTS.mono,
                      fontSize: 9,
                      color: COLORS.textMuted,
                      marginTop: 2,
                    }}
                  >
                    {new Date(day.startDateTime).toLocaleDateString("it-IT", {
                      day: "numeric",
                      month: "short",
                    })}
                    {" · "}
                    {day.type === "RADUNO" ? "SOSTA" : "TAPPA"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <form
        onSubmit={handleAddDay}
        style={{
          padding: "20px 20px 0",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div style={{ ...styles.fieldLabel }}>GIORNO {dayNumber}</div>

        <div>
          <div style={{ display: "flex", gap: 8 }}>
            {DAY_TYPE_OPTIONS.map((opt) => {
              const active = dayForm.type === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleTypeChange(opt.value)}
                  style={{
                    flex: 1,
                    textAlign: "left",
                    padding: "11px 13px",
                    borderRadius: 12,
                    background: active ? COLORS.accentSoftBg : COLORS.card,
                    border: `1px solid ${active ? COLORS.accentSoftBorder : COLORS.borderStrong}`,
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      fontFamily: FONTS.heading,
                      fontWeight: 700,
                      fontSize: 13,
                      color: active ? COLORS.accent : COLORS.text,
                    }}
                  >
                    {opt.label}
                  </div>
                  <div
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 10.5,
                      color: COLORS.textMuted,
                      marginTop: 2,
                    }}
                  >
                    {opt.hint}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <div style={{ ...styles.fieldLabel, marginBottom: 8 }}>
            TITOLO DEL GIORNO
          </div>
          <input
            type="text"
            placeholder={
              dayForm.type === "RADUNO"
                ? "Sosta ad Assisi"
                : "Roma verso Firenze"
            }
            value={dayForm.title}
            onChange={set("title")}
            required
            style={styles.input}
          />
        </div>

        <div>
          <div style={{ ...styles.fieldLabel, marginBottom: 8 }}>
            DESCRIZIONE
          </div>
          <textarea
            value={dayForm.description}
            onChange={set("description")}
            required
            rows={2}
            style={{
              width: "100%",
              borderRadius: 14,
              background: COLORS.card,
              border: `1px solid ${COLORS.borderStrong}`,
              color: COLORS.text,
              fontFamily: FONTS.body,
              fontSize: 14,
              lineHeight: 1.5,
              padding: 12,
              outline: "none",
              resize: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div>
          <div style={{ ...styles.fieldLabel, marginBottom: 8 }}>
            PERCORSO {dayForm.type === "RADUNO" ? "(OPZIONALE)" : ""}
          </div>
          {isLoadingRoutes ? (
            <Spinner
              size="sm"
              animation="border"
              style={{ color: COLORS.accent }}
            />
          ) : (
            <>
              <select
                value={dayForm.routeId}
                onChange={set("routeId")}
                style={styles.input}
              >
                <option value="">
                  {dayForm.type === "RADUNO"
                    ? "Nessun percorso"
                    : "Seleziona un percorso"}
                </option>
                {routesPage?.content?.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} (
                    {(r.distanceMeters / 1000).toFixed(1).replace(".", ",")} km)
                  </option>
                ))}
              </select>
              <div
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 12,
                  color: COLORS.textFaint,
                  marginTop: 8,
                }}
              >
                Non trovi quello che cerchi?{" "}
                <Link
                  to="/routes/new"
                  state={{
                    returnTo: `/events/${tripId}/days/new`,
                    resumeDraft: true,
                  }}
                  onClick={saveDraft}
                  style={{ color: COLORS.accent }}
                >
                  Crea un nuovo percorso
                </Link>
              </div>
            </>
          )}

          {dayForm.type === "RADUNO" && !dayForm.routeId && (
            <div style={{ marginTop: 12, position: "relative" }}>
              {dayForm.meetingPointLabel ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "11px 14px",
                    borderRadius: 12,
                    background: COLORS.accentSoftBg,
                    border: `1px solid ${COLORS.accentSoftBorder}`,
                  }}
                >
                  <span
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 13,
                      color: COLORS.accent,
                    }}
                  >
                    {dayForm.meetingPointLabel}
                  </span>
                  <button
                    type="button"
                    onClick={clearMeetingPoint}
                    style={{
                      background: "none",
                      border: "none",
                      color: COLORS.accent,
                      cursor: "pointer",
                      fontFamily: FONTS.mono,
                      fontSize: 10,
                    }}
                  >
                    CAMBIA
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Cerca una città o un luogo..."
                    value={placeSearch}
                    onChange={handlePlaceSearchChange}
                    style={styles.input}
                  />
                  {placeResults.length > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        marginTop: 6,
                        zIndex: 10,
                        ...styles.card,
                        overflow: "hidden",
                      }}
                    >
                      {placeResults.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => handlePickPlace(r)}
                          style={{
                            display: "block",
                            width: "100%",
                            textAlign: "left",
                            padding: "11px 13px",
                            background: "none",
                            border: "none",
                            borderBottom: `1px solid ${COLORS.borderSoft}`,
                            color: COLORS.text,
                            fontFamily: FONTS.body,
                            fontSize: 13,
                            cursor: "pointer",
                          }}
                        >
                          {r.name}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...styles.fieldLabel, marginBottom: 8 }}>INIZIO</div>
            <input
              type="datetime-local"
              value={dayForm.startDateTime}
              onChange={set("startDateTime")}
              required
              style={{ ...styles.input, width: "100%" }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...styles.fieldLabel, marginBottom: 8 }}>FINE</div>
            <input
              type="datetime-local"
              value={dayForm.endDateTime}
              onChange={set("endDateTime")}
              required
              style={{ ...styles.input, width: "100%" }}
            />
            {selectedRoute && (
              <div
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 10,
                  color: COLORS.textFaint,
                  marginTop: 6,
                }}
              >
                Durata stimata: {Math.ceil(selectedRoute.durationSeconds / 60)}{" "}
                min
              </div>
            )}
          </div>
        </div>

        {errorMsg && (
          <div
            style={{
              fontFamily: FONTS.body,
              fontSize: 13,
              color: COLORS.danger,
            }}
          >
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={isSaving}
          style={{ ...styles.secondaryButton, opacity: isSaving ? 0.6 : 1 }}
        >
          {isSaving ? "..." : `AGGIUNGI GIORNO ${dayNumber}`}
        </button>

        <Link
          to={`/events/${tripId}`}
          style={{
            ...styles.primaryButton,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textDecoration: "none",
          }}
        >
          HO FINITO · VAI AL VIAGGIO
        </Link>
      </form>
    </div>
  )
}

export default AddEventDayPage
