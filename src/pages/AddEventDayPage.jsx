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
import "../pages/CSS/AddEventDayPage.css"

const DAY_DRAFT_KEY = "eventDayDraft"

function toDateTimeLocalValue(date) {
  const pad = (n) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatDurationMinutes(totalMinutes) {
  if (totalMinutes < 60) return `${totalMinutes} min`
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}min`
}

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
  bufferMinutes: 0,
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

  const [datePrefillApplied, setDatePrefillApplied] = useState(false)

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
      const next = { ...prev, type: value }
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

  const isFirstDay = trip ? trip.children.length === 0 : true
  const expectedDate = trip
    ? isFirstDay
      ? trip.startDateTime.slice(0, 10)
      : (() => {
          const lastDay = trip.children[trip.children.length - 1]
          const next = new Date(lastDay.startDateTime)
          next.setDate(next.getDate() + 1)
          return toDateTimeLocalValue(next).slice(0, 10)
        })()
    : null

  if (trip && !datePrefillApplied && !dayForm.startDateTime) {
    setDatePrefillApplied(true)

    let suggestedTime = null
    if (trip.children.length === 0) {
      if (location.state?.suggestedStartDateTime) {
        suggestedTime = location.state.suggestedStartDateTime.slice(11, 16)
      }
    } else {
      const lastDay = trip.children[trip.children.length - 1]
      if (lastDay?.startDateTime) {
        suggestedTime = lastDay.startDateTime.slice(11, 16)
      }
    }

    if (suggestedTime) {
      setDayForm((prev) => {
        const next = {
          ...prev,
          startDateTime: `${expectedDate}T${suggestedTime}`,
        }
        persistDraft(next)
        return next
      })
    }
  }

  const handleAddDay = async (e) => {
    e.preventDefault()
    setErrorMsg("")

    const finalStartDateTime = dayForm.startDateTime
      ? `${expectedDate}T${dayForm.startDateTime.slice(11, 16)}`
      : null

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
    if (!finalStartDateTime) {
      setErrorMsg("Specifica la data di inizio del giorno.")
      return
    }
    if (dayForm.type === "RADUNO") {
      if (
        !dayForm.endDateTime ||
        new Date(dayForm.endDateTime) <= new Date(dayForm.startDateTime)
      ) {
        setErrorMsg("La fine deve essere successiva all'inizio.")
        return
      }
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
        startDateTime: finalStartDateTime + ":00",
        endDateTime:
          dayForm.type === "RADUNO" ? dayForm.endDateTime + ":00" : null,
        bufferMinutes:
          dayForm.type === "STANDARD"
            ? Number(dayForm.bufferMinutes) || 0
            : null,
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
      <div className="centered-spinner">
        <Spinner animation="border" style={{ color: "#FF7A2F" }} />
      </div>
    )
  }

  if (!trip || trip.type !== "MULTI_DAY_TRIP") {
    return <div className="card empty-state-margin">Viaggio non trovato.</div>
  }

  const dayNumber = (trip.children?.length || 0) + 1

  const currentTimeValue = dayForm.startDateTime
    ? dayForm.startDateTime.slice(11, 16)
    : ""

  const setDayTime = (e) => {
    const time = e.target.value
    setDayForm((prev) => {
      const next = { ...prev, startDateTime: `${expectedDate}T${time}` }
      persistDraft(next)
      return next
    })
  }

  const setDayEndTime = (e) => {
    const time = e.target.value
    setDayForm((prev) => {
      const next = { ...prev, endDateTime: `${expectedDate}T${time}` }
      persistDraft(next)
      return next
    })
  }

  const currentEndTimeValue = dayForm.endDateTime
    ? dayForm.endDateTime.slice(11, 16)
    : ""

  return (
    <div className="add-day-page">
      <div className="add-day-page__header">
        <button
          type="button"
          className="btn-icon"
          onClick={() => navigate(`/events/${tripId}`)}
        >
          <FaArrowLeft />
        </button>
        <div>
          <div className="add-day-page__trip-title">{trip.title}</div>
          <div className="add-day-page__header-subtitle">
            AGGIUNGI I GIORNI DEL VIAGGIO
          </div>
        </div>
      </div>

      <div
        className={`add-day-page__body ${trip.children?.length > 0 ? "add-day-page__body--split" : ""}`}
      >
        {trip.children?.length > 0 && (
          <div className="add-day-page__days-section">
            <div className="field-label form-group__label">
              GIORNI GIÀ AGGIUNTI
            </div>
            <div className="add-day-page__days-list">
              {trip.children.map((day, index) => (
                <div key={day.id} className="card day-item">
                  <span className="day-item__badge">{index + 1}</span>
                  <div className="day-item__info">
                    <div className="day-item__title">{day.title}</div>
                    <div className="day-item__meta">
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

        <form className="add-day-page__form" onSubmit={handleAddDay}>
          <div className="field-label">GIORNO {dayNumber}</div>

          <div>
            <div className="type-options">
              {DAY_TYPE_OPTIONS.map((opt) => {
                const active = dayForm.type === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`type-option ${active ? "type-option--active" : ""}`}
                    onClick={() => handleTypeChange(opt.value)}
                  >
                    <div className="type-option__label">{opt.label}</div>
                    <div className="type-option__hint">{opt.hint}</div>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <div className="field-label form-group__label">
              TITOLO DEL GIORNO
            </div>
            <input
              type="text"
              className="input"
              placeholder={
                dayForm.type === "RADUNO"
                  ? "Sosta ad Assisi"
                  : "Roma verso Firenze"
              }
              value={dayForm.title}
              onChange={set("title")}
              required
            />
          </div>

          <div>
            <div className="field-label form-group__label">DESCRIZIONE</div>
            <textarea
              className="textarea"
              value={dayForm.description}
              onChange={set("description")}
              required
              rows={2}
            />
          </div>

          <div>
            <div className="field-label form-group__label">
              PERCORSO {dayForm.type === "RADUNO" ? "(OPZIONALE)" : ""}
            </div>
            {isLoadingRoutes ? (
              <Spinner
                size="sm"
                animation="border"
                style={{ color: "#FF7A2F" }}
              />
            ) : (
              <>
                <select
                  className="select"
                  value={dayForm.routeId}
                  onChange={set("routeId")}
                >
                  <option value="">
                    {dayForm.type === "RADUNO"
                      ? "Nessun percorso"
                      : "Seleziona un percorso"}
                  </option>
                  {routesPage?.content?.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} (
                      {(r.distanceMeters / 1000).toFixed(1).replace(".", ",")}{" "}
                      km)
                    </option>
                  ))}
                </select>
                <div className="helper-text">
                  Non trovi quello che cerchi?{" "}
                  <Link
                    to="/routes/new"
                    state={{
                      returnTo: `/events/${tripId}/days/new`,
                      resumeDraft: true,
                    }}
                    onClick={saveDraft}
                    className="helper-text__link"
                  >
                    Crea un nuovo percorso
                  </Link>
                </div>
              </>
            )}

            {dayForm.type === "RADUNO" && !dayForm.routeId && (
              <div className="meeting-point">
                {dayForm.meetingPointLabel ? (
                  <div className="meeting-point__chip">
                    <span className="meeting-point__label">
                      {dayForm.meetingPointLabel}
                    </span>
                    <button
                      type="button"
                      className="meeting-point__change-btn"
                      onClick={clearMeetingPoint}
                    >
                      CAMBIA
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      className="input"
                      placeholder="Cerca una città o un luogo..."
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
                  </>
                )}
              </div>
            )}
          </div>

          <div className="date-row">
            <div className="date-group">
              <div className="field-label form-group__label">INIZIO</div>
              <div className="add-day-page__first-day-date">
                {new Date(`${expectedDate}T00:00:00`)
                  .toLocaleDateString("it-IT", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })
                  .toUpperCase()}
              </div>
              <input
                type="time"
                className="input"
                value={currentTimeValue}
                onChange={setDayTime}
                required
              />
              <div className="helper-text">
                {isFirstDay
                  ? "Il primo giorno inizia lo stesso giorno dell'evento — puoi solo scegliere l'orario"
                  : "La data segue automaticamente il giorno precedente — puoi solo scegliere l'orario"}
              </div>
            </div>

            {dayForm.type === "RADUNO" && (
              <div className="date-group">
                <div className="field-label form-group__label">FINE</div>
                <div className="add-day-page__first-day-date">
                  {new Date(`${expectedDate}T00:00:00`)
                    .toLocaleDateString("it-IT", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })
                    .toUpperCase()}
                </div>
                <input
                  type="time"
                  className="input"
                  value={currentEndTimeValue}
                  onChange={setDayEndTime}
                  required
                />
                <div className="helper-text">
                  Stessa data dell'inizio — puoi solo scegliere l'orario
                </div>
              </div>
            )}
          </div>

          {dayForm.type === "STANDARD" && (
            <div>
              <div className="field-label form-group__label">
                AGGIUNGI TEMPO (MINUTI, OPZIONALE)
              </div>
              <input
                type="number"
                className="input"
                min={0}
                value={dayForm.bufferMinutes}
                onChange={set("bufferMinutes")}
              />
              {selectedRoute && (
                <div className="add-day-page__duration-estimate">
                  <span className="duration-hint">Durata stimata: </span>
                  {formatDurationMinutes(
                    Math.ceil(selectedRoute.durationSeconds / 60) +
                      (Number(dayForm.bufferMinutes) || 0),
                  )}
                </div>
              )}
            </div>
          )}

          {errorMsg && <div className="error-text">{errorMsg}</div>}

          <button type="submit" className="btn-secondary" disabled={isSaving}>
            {isSaving ? "..." : `AGGIUNGI GIORNO ${dayNumber}`}
          </button>

          <Link to={`/events/${tripId}`} className="finish-link">
            HO FINITO · VAI AL VIAGGIO
          </Link>
        </form>
      </div>
    </div>
  )
}

export default AddEventDayPage
