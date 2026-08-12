import { useRef, useState } from "react"
import { Spinner } from "react-bootstrap"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useGetMyRoutesQuery } from "../features/routesMap/routesApi"
import { useCreateEventMutation } from "../features/events/eventsApi"
import { toLocalDateTimeString, addSecondsToLocalDateTime } from "../utils/geo"
import { generateAccessCode } from "../utils/codeGenerator"
import { useInviteUserMutation } from "../features/events/invitesApi"
import InviteSelector from "../features/events/components/InviteSelector"
import { searchPlaces } from "../utils/geocoding"
import "../pages/CSS/EventCreatePage.css"

const DRAFT_KEY = "eventDraft"

const loadDraft = () => {
  try {
    const saved = localStorage.getItem(DRAFT_KEY)
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

const EVENT_TYPE_OPTIONS = [
  {
    value: "STANDARD",
    label: "GIRO",
    hint: "Un percorso su strada, con partenza e arrivo",
  },
  {
    value: "RADUNO",
    label: "RADUNO",
    hint: "Un punto di ritrovo, senza un tragitto obbligato",
  },
  {
    value: "MULTI_DAY_TRIP",
    label: "VIAGGIO",
    hint: "Più giorni, ciascuno con il proprio programma",
  },
]

const VISIBILITY_OPTIONS = [
  { value: "PUBLIC", label: "PUBBLICO", hint: "Visibile a tutti" },
  {
    value: "PRIVATE_CODE",
    label: "CON CODICE",
    hint: "Visibile a chi ha il codice",
  },
  { value: "INVITE_ONLY", label: "SU INVITO", hint: "Solo persone invitate" },
]

function EventCreatePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { data: routesPage, isLoading: isLoadingRoutes } = useGetMyRoutesQuery({
    page: 0,
    size: 50,
  })
  const [createEvent, { isLoading }] = useCreateEventMutation()

  const draft = loadDraft()

  const [inviteUsernames, setInviteUsernames] = useState(
    draft?.inviteUsernames || [],
  )
  const [inviteUser] = useInviteUserMutation()

  const [inviteSummary, setInviteSummary] = useState(null)
  const [createdEventId, setCreatedEventId] = useState(null)

  const [form, setForm] = useState({
    title: draft?.title || "",
    description: draft?.description || "",
    type: draft?.type || "STANDARD",
    routeId: location.state?.newRouteId || draft?.routeId || "",
    meetingPointLat: draft?.meetingPointLat || null,
    meetingPointLng: draft?.meetingPointLng || null,
    meetingPointLabel: draft?.meetingPointLabel || "",
    startDateTime: draft?.startDateTime || "",
    endDateTime: draft?.endDateTime || "",
    maxParticipants: draft?.maxParticipants ?? 10,
    visibility: draft?.visibility || "PUBLIC",
    autoApprove: draft?.autoApprove || false,
    accessCode: draft?.accessCode || generateAccessCode(),
  })
  const [errorMsg, setErrorMsg] = useState("")

  const [placeSearch, setPlaceSearch] = useState("")
  const [placeResults, setPlaceResults] = useState([])
  const placeTimerRef = useRef(null)

  const persist = (next) => {
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ ...next, inviteUsernames }),
      )
    } catch {
      // localStorage non disponibile
    }
  }

  const saveDraft = () => persist({ ...form })

  const regenerateCode = () => {
    setForm((prev) => {
      const next = { ...prev, accessCode: generateAccessCode() }
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(next))
      } catch {
        // localStorage non disponibile
      }
      return next
    })
  }

  const set = (field) => (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      persist(next)
      return next
    })
  }

  const updateInvitees = (list) => {
    setInviteUsernames(list)
    persist(form)
  }

  const nowLocal = toLocalDateTimeString(new Date()).slice(0, 16)

  const selectedRoute = routesPage?.content?.find((r) => r.id === form.routeId)

  const minEndDateTime =
    selectedRoute && form.startDateTime
      ? addSecondsToLocalDateTime(
          form.startDateTime,
          selectedRoute.durationSeconds,
        )
      : form.startDateTime || nowLocal

  const handleTypeChange = (value) => {
    setForm((prev) => {
      const next = { ...prev, type: value }
      if (value === "MULTI_DAY_TRIP") {
        next.routeId = ""
        next.meetingPointLat = null
        next.meetingPointLng = null
        next.meetingPointLabel = ""
      }
      persist(next)
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
    setForm((prev) => {
      const next = {
        ...prev,
        meetingPointLat: place.latitude,
        meetingPointLng: place.longitude,
        meetingPointLabel: place.name,
      }
      persist(next)
      return next
    })
    setPlaceSearch("")
    setPlaceResults([])
  }

  const clearMeetingPoint = () => {
    setForm((prev) => {
      const next = {
        ...prev,
        meetingPointLat: null,
        meetingPointLng: null,
        meetingPointLabel: "",
      }
      persist(next)
      return next
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg("")

    if (form.type === "STANDARD" && !form.routeId) {
      setErrorMsg("Un giro richiede un percorso.")
      return
    }
    if (
      form.type === "RADUNO" &&
      !form.routeId &&
      !(form.meetingPointLat && form.meetingPointLng)
    ) {
      setErrorMsg("Un raduno richiede un percorso oppure un punto di ritrovo.")
      return
    }
    if (selectedRoute && form.startDateTime) {
      const minEnd = new Date(
        addSecondsToLocalDateTime(
          form.startDateTime,
          selectedRoute.durationSeconds,
        ),
      )
      if (new Date(form.endDateTime) < minEnd) {
        const minutes = Math.ceil(selectedRoute.durationSeconds / 60)
        setErrorMsg(
          `La fine deve essere almeno ${minutes} minuti dopo l'inizio, la durata stimata del percorso.`,
        )
        return
      }
    } else if (new Date(form.endDateTime) <= new Date(form.startDateTime)) {
      setErrorMsg("La data di fine deve essere successiva a quella di inizio.")
      return
    }
    if (form.visibility === "PRIVATE_CODE" && !form.accessCode.trim()) {
      setErrorMsg("Inserisci un codice di accesso per un evento con codice.")
      return
    }

    try {
      const created = await createEvent({
        title: form.title,
        description: form.description,
        type: form.type,
        routeId: form.routeId || null,
        meetingPointLat: !form.routeId ? form.meetingPointLat : null,
        meetingPointLng: !form.routeId ? form.meetingPointLng : null,
        startDateTime: form.startDateTime + ":00",
        endDateTime: form.endDateTime + ":00",
        maxParticipants:
          form.visibility === "INVITE_ONLY"
            ? 999
            : Number(form.maxParticipants),
        visibility: form.visibility,
        autoApprove: form.visibility === "PUBLIC" ? form.autoApprove : false,
        accessCode: form.visibility === "PRIVATE_CODE" ? form.accessCode : null,
      }).unwrap()

      localStorage.removeItem(DRAFT_KEY)

      if (form.type === "MULTI_DAY_TRIP") {
        navigate(`/events/${created.id}/days/new`)
        return
      }

      if (form.visibility === "INVITE_ONLY" && inviteUsernames.length > 0) {
        const results = await Promise.allSettled(
          inviteUsernames.map((username) =>
            inviteUser({ eventId: created.id, username }).unwrap(),
          ),
        )
        const failed = inviteUsernames.filter(
          (_, i) => results[i].status === "rejected",
        )

        setCreatedEventId(created.id)
        setInviteSummary({
          total: inviteUsernames.length,
          success: inviteUsernames.length - failed.length,
          failed,
        })
        return
      }
      navigate(`/events/${created.id}`)
    } catch (err) {
      setErrorMsg(err.data?.message || "Impossibile creare l'evento.")
    }
  }

  if (inviteSummary) {
    return (
      <div className="invite-summary">
        <div className="invite-summary__title">EVENTO CREATO</div>

        <div className="card invite-summary__card">
          <div className="invite-summary__label">INVITI INVIATI</div>
          <div className="invite-summary__count">
            {inviteSummary.success}/{inviteSummary.total}
          </div>

          {inviteSummary.failed.length > 0 && (
            <div className="invite-summary__detail">
              Non è stato possibile invitare: {inviteSummary.failed.join(", ")}.
              Potrai riprovare dalla pagina dell'evento.
            </div>
          )}
        </div>

        <button
          type="button"
          className="btn-primary invite-summary__button"
          onClick={() => navigate(`/events/${createdEventId}`)}
        >
          VAI ALL'EVENTO
        </button>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="px-20" style={{ paddingBottom: 20 }}>
        <div className="page-title">CREA UN EVENTO</div>
      </div>

      <form onSubmit={handleSubmit} className="form-stack px-20">
        <div>
          <div className="field-label form-group__label">TIPO DI EVENTO</div>
          <div className="options-stack">
            {EVENT_TYPE_OPTIONS.map((opt) => {
              const active = form.type === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  className={`option-card ${active ? "option-card--active" : ""}`}
                  onClick={() => handleTypeChange(opt.value)}
                >
                  <div
                    className={`option-card__title ${active ? "option-card--active" : ""}`}
                  >
                    {opt.label}
                  </div>
                  <div className="option-card__hint">{opt.hint}</div>
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <div className="field-label form-group__label">TITOLO</div>
          <input
            type="text"
            className="input"
            placeholder={
              form.type === "MULTI_DAY_TRIP"
                ? "Tour delle Dolomiti"
                : "Giro dei trulli"
            }
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

        {form.type !== "MULTI_DAY_TRIP" && (
          <div>
            <div className="field-label form-group__label">
              PERCORSO {form.type === "RADUNO" ? "(OPZIONALE)" : ""}
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
                  value={form.routeId}
                  onChange={set("routeId")}
                >
                  <option value="">
                    {form.type === "RADUNO"
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
                    state={{ returnTo: "/events/new", resumeDraft: true }}
                    onClick={saveDraft}
                    className="helper-text__link"
                  >
                    Crea un nuovo percorso
                  </Link>
                </div>
              </>
            )}

            {form.type === "RADUNO" && !form.routeId && (
              <div className="meeting-point">
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
        )}

        <div className="field-row">
          <div className="field-col">
            <div className="field-label form-group__label">INIZIO</div>
            <input
              type="datetime-local"
              className="input"
              min={nowLocal}
              value={form.startDateTime}
              onChange={set("startDateTime")}
              required
            />
          </div>
          <div className="field-col">
            <div className="field-label form-group__label">FINE</div>
            <input
              type="datetime-local"
              className="input"
              min={minEndDateTime}
              value={form.endDateTime}
              onChange={set("endDateTime")}
              required
            />
            {selectedRoute && (
              <div className="duration-hint">
                Durata stimata: {Math.ceil(selectedRoute.durationSeconds / 60)}{" "}
                min
              </div>
            )}
          </div>
        </div>

        {form.visibility !== "INVITE_ONLY" && (
          <div>
            <div className="field-label form-group__label">
              {form.type === "MULTI_DAY_TRIP"
                ? "NUMERO MASSIMO DI PARTECIPANTI AL VIAGGIO"
                : "NUMERO MASSIMO DI PARTECIPANTI"}
            </div>
            <input
              type="number"
              className="input"
              min={1}
              value={form.maxParticipants}
              onChange={set("maxParticipants")}
              required
            />
          </div>
        )}

        <div>
          <div className="field-label form-group__label">VISIBILITÀ</div>
          <div className="options-stack">
            {VISIBILITY_OPTIONS.map((opt) => {
              const active = form.visibility === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  className={`option-card ${active ? "option-card--active" : ""}`}
                  onClick={() => {
                    setForm((prev) => {
                      const next = {
                        ...prev,
                        visibility: opt.value,
                        accessCode:
                          opt.value === "PRIVATE_CODE" && !prev.accessCode
                            ? generateAccessCode()
                            : prev.accessCode,
                      }
                      persist(next)
                      return next
                    })
                  }}
                >
                  <div
                    className={`option-card__title ${active ? "option-card--active" : ""}`}
                  >
                    {opt.label}
                  </div>
                  <div className="option-card__hint">{opt.hint}</div>
                </button>
              )
            })}
          </div>
        </div>

        {form.visibility === "PUBLIC" && (
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.autoApprove}
              onChange={set("autoApprove")}
            />
            Accetta automaticamente le richieste di partecipazione
          </label>
        )}

        {form.visibility === "PRIVATE_CODE" && (
          <div>
            <div className="field-label form-group__label">
              CODICE DI ACCESSO
            </div>
            <div className="access-code-box">
              <div className="access-code-box__code">{form.accessCode}</div>
              <button
                type="button"
                className="btn-secondary"
                style={{ height: "auto", padding: "0 16px" }}
                onClick={regenerateCode}
              >
                RIGENERA
              </button>
            </div>
          </div>
        )}

        {form.visibility === "INVITE_ONLY" &&
          form.type !== "MULTI_DAY_TRIP" && (
            <div>
              <div className="field-label form-group__label">
                INVITA DAI TUOI CONTATTI
              </div>
              <InviteSelector
                selected={inviteUsernames}
                onChange={updateInvitees}
              />
            </div>
          )}

        {errorMsg && <div className="error-text">{errorMsg}</div>}

        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading
            ? "..."
            : form.type === "MULTI_DAY_TRIP"
              ? "CREA IL VIAGGIO"
              : "CREA EVENTO"}
        </button>
      </form>
    </div>
  )
}

export default EventCreatePage
