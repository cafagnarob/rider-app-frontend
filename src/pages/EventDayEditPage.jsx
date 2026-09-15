import { useState, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Spinner } from "react-bootstrap"
import { FaArrowLeft } from "react-icons/fa"
import {
  useGetEventByIdQuery,
  useUpdateEventDayMutation,
} from "../features/events/eventsApi"
import { useGetMyRoutesQuery } from "../features/routesMap/routesApi"
import { searchPlaces } from "../utils/geocoding"
import { toLocalDateTimeString, addSecondsToLocalDateTime } from "../utils/geo"

function buildInitialForm(day) {
  return {
    title: day.title,
    description: day.description,
    startDateTime: toLocalDateTimeString(new Date(day.startDateTime)).slice(
      0,
      16,
    ),
    endDateTime:
      day.type === "RADUNO"
        ? toLocalDateTimeString(new Date(day.endDateTime)).slice(0, 16)
        : "",
    routeId: day.route?.id || "",
    meetingPointLat: day.route ? null : day.meetingPointLat,
    meetingPointLng: day.route ? null : day.meetingPointLng,
    meetingPointLabel: day.route ? "" : day.meetingPointAddress || "",
    bufferMinutes: 0,
  }
}

function EventDayEditPage() {
  const { tripId, dayId } = useParams()
  const navigate = useNavigate()

  const { data: day, isLoading } = useGetEventByIdQuery(dayId)
  const { data: routesPage, isLoading: isLoadingRoutes } = useGetMyRoutesQuery({
    page: 0,
    size: 50,
  })
  const [updateEventDay, { isLoading: isSaving }] = useUpdateEventDayMutation()

  const [form, setForm] = useState(null)
  const [initializedFor, setInitializedFor] = useState(null)
  const [errorMsg, setErrorMsg] = useState("")
  const [placeSearch, setPlaceSearch] = useState("")
  const [placeResults, setPlaceResults] = useState([])
  const placeTimerRef = useRef(null)

  if (day && initializedFor !== day.id) {
    setInitializedFor(day.id)
    setForm(buildInitialForm(day))
  }

  const set = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
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
    setForm((prev) => ({
      ...prev,
      meetingPointLat: place.latitude,
      meetingPointLng: place.longitude,
      meetingPointLabel: place.name,
    }))
    setPlaceSearch("")
    setPlaceResults([])
  }

  const clearMeetingPoint = () => {
    setForm((prev) => ({
      ...prev,
      meetingPointLat: null,
      meetingPointLng: null,
      meetingPointLabel: "",
    }))
  }

  if (isLoading || !form) {
    return (
      <div className="centered-spinner">
        <Spinner animation="border" style={{ color: "#FF7A2F" }} />
      </div>
    )
  }

  if (!day.organizer) {
    return (
      <div className="empty-state empty-state-margin">
        Non sei l'organizzatore di questo viaggio.
      </div>
    )
  }

  const selectedRoute = routesPage?.content?.find((r) => r.id === form.routeId)

  const estimatedEndDateTime =
    day.type === "STANDARD" && selectedRoute && form.startDateTime
      ? addSecondsToLocalDateTime(
          form.startDateTime,
          selectedRoute.durationSeconds +
            (Number(form.bufferMinutes) || 0) * 60,
        )
      : null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg("")

    if (
      day.type === "RADUNO" &&
      form.endDateTime &&
      new Date(form.endDateTime) <= new Date(form.startDateTime)
    ) {
      setErrorMsg("La data di fine deve essere successiva a quella di inizio.")
      return
    }

    const payload = {
      title: form.title,
      description: form.description,
      startDateTime: form.startDateTime + ":00",
      routeId: form.routeId || null,
    }

    if (!form.routeId) {
      payload.meetingPointLat = form.meetingPointLat
      payload.meetingPointLng = form.meetingPointLng
    }

    if (day.type === "RADUNO") {
      payload.endDateTime = form.endDateTime ? form.endDateTime + ":00" : null
    } else {
      payload.bufferMinutes = Number(form.bufferMinutes) || 0
    }

    try {
      await updateEventDay({ tripId, dayId, data: payload }).unwrap()
      navigate(`/events/${tripId}`)
    } catch (err) {
      setErrorMsg(err.data?.message || "Impossibile salvare le modifiche.")
    }
  }

  return (
    <div className="page">
      <div className="px-20" style={{ paddingBottom: 20 }}>
        <button type="button" className="btn-icon" onClick={() => navigate(-1)}>
          <FaArrowLeft />
        </button>
        <div className="page-title" style={{ marginTop: 12 }}>
          MODIFICA GIORNO
        </div>
      </div>

      <form onSubmit={handleSubmit} className="form-stack px-20">
        <div>
          <div className="field-label form-group__label">TITOLO DEL GIORNO</div>
          <input
            type="text"
            className="input"
            value={form.title}
            onChange={set("title")}
            required
          />
        </div>

        <div>
          <div className="field-label form-group__label">DESCRIZIONE</div>
          <textarea
            className="textarea"
            value={form.description}
            onChange={set("description")}
            required
            rows={3}
          />
        </div>

        <div>
          <div className="field-label form-group__label">
            PERCORSO {day.type === "RADUNO" ? "(OPZIONALE)" : ""}
          </div>
          {isLoadingRoutes ? (
            <Spinner
              size="sm"
              animation="border"
              style={{ color: "#FF7A2F" }}
            />
          ) : (
            <select
              className="select"
              value={form.routeId}
              onChange={set("routeId")}
            >
              <option value="">
                {day.type === "RADUNO"
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
          )}

          {day.type === "RADUNO" && !form.routeId && (
            <div className="meeting-point" style={{ marginTop: 10 }}>
              <div className="field-label form-group__label">
                PUNTO DI RITROVO
              </div>
              {form.meetingPointLabel ? (
                <div className="meeting-point__chip">
                  <span className="meeting-point__label">
                    {form.meetingPointLabel}
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

        <div className="field-row">
          <div className="field-col">
            <div className="field-label form-group__label">INIZIO</div>
            <input
              type="datetime-local"
              className="input"
              value={form.startDateTime}
              onChange={set("startDateTime")}
              required
            />
          </div>

          {day.type === "RADUNO" && (
            <div className="field-col">
              <div className="field-label form-group__label">FINE</div>
              <input
                type="datetime-local"
                className="input"
                value={form.endDateTime}
                onChange={set("endDateTime")}
                required
              />
            </div>
          )}
        </div>

        {day.type === "STANDARD" && (
          <div>
            <div className="field-label form-group__label">FINE STIMATA</div>
            {estimatedEndDateTime ? (
              <div className="empty-state" style={{ padding: "14px 16px" }}>
                {new Date(estimatedEndDateTime).toLocaleString("it-IT", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            ) : (
              <div className="duration-hint">
                Seleziona un percorso per calcolare la fine stimata
              </div>
            )}
            <div style={{ marginTop: 10 }}>
              <div className="field-label form-group__label">
                AGGIUNGI TEMPO (MINUTI, OPZIONALE)
              </div>
              <input
                type="number"
                className="input"
                min={0}
                value={form.bufferMinutes}
                onChange={set("bufferMinutes")}
              />
            </div>
          </div>
        )}

        {errorMsg && <div className="error-text">{errorMsg}</div>}

        <button type="submit" className="btn-primary" disabled={isSaving}>
          {isSaving ? "..." : "SALVA MODIFICHE"}
        </button>
      </form>
    </div>
  )
}

export default EventDayEditPage
