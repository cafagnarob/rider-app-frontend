import { useState } from "react"
import { Spinner } from "react-bootstrap"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useGetMyRoutesQuery } from "../features/routesMap/routesApi"
import { useCreateEventMutation } from "../features/events/eventsApi"
import { toLocalDateTimeString, addSecondsToLocalDateTime } from "../utils/geo"
import { generateAccessCode } from "../utils/codeGenerator"
import { COLORS, FONTS, styles } from "../styles/theme"
import { useInviteUserMutation } from "../features/events/invitesApi"
import InviteSelector from "../features/events/components/InviteSelector"

const DRAFT_KEY = "eventDraft"

const loadDraft = () => {
  try {
    const saved = localStorage.getItem(DRAFT_KEY)
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

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

  const updateInvitees = (list) => {
    setInviteUsernames(list)
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ ...form, inviteUsernames: list }),
      )
    } catch {
      // localStorage non disponibile
    }
  }

  const [inviteSummary, setInviteSummary] = useState(null)
  const [createdEventId, setCreatedEventId] = useState(null)

  const [form, setForm] = useState({
    title: draft?.title || "",
    description: draft?.description || "",
    routeId: location.state?.newRouteId || draft?.routeId || "",
    startDateTime: draft?.startDateTime || "",
    endDateTime: draft?.endDateTime || "",
    maxParticipants: draft?.maxParticipants ?? 10,
    visibility: draft?.visibility || "PUBLIC",
    autoApprove: draft?.autoApprove || false,
    accessCode: draft?.accessCode || generateAccessCode(),
  })
  const [errorMsg, setErrorMsg] = useState("")

  const saveDraft = () => {
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ ...form, inviteUsernames }),
      )
    } catch {
      // localStorage non disponibile
    }
  }

  const regenerateCode = () => {
    setForm((prev) => {
      const next = {
        ...prev,
        accessCode: generateAccessCode(),
      }
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
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(next))
      } catch {
        // localStorage non disponibile, continuo senza salvare la bozza
      }
      return next
    })
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg("")

    if (!form.routeId) {
      setErrorMsg("Seleziona un percorso.")
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
        routeId: form.routeId,
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
      <div
        style={{
          ...styles.pageBg,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          textAlign: "center",
          gap: 16,
        }}
      >
        <div
          style={{ fontFamily: FONTS.heading, fontWeight: 700, fontSize: 28 }}
        >
          EVENTO CREATO
        </div>

        <div
          style={{ ...styles.card, padding: 18, maxWidth: 360, width: "100%" }}
        >
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 11,
              color: COLORS.textSecondary,
              marginBottom: 10,
            }}
          >
            INVITI INVIATI
          </div>
          <div
            style={{
              fontFamily: FONTS.heading,
              fontWeight: 700,
              fontSize: 32,
              color: COLORS.accent,
            }}
          >
            {inviteSummary.success}/{inviteSummary.total}
          </div>

          {inviteSummary.failed.length > 0 && (
            <div
              style={{
                fontFamily: FONTS.body,
                fontSize: 12,
                color: COLORS.textFaint,
                marginTop: 10,
                lineHeight: 1.5,
              }}
            >
              Non è stato possibile invitare: {inviteSummary.failed.join(", ")}.
              Potrai riprovare dalla pagina dell'evento.
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => navigate(`/events/${createdEventId}`)}
          style={{ ...styles.primaryButton, maxWidth: 300, width: "100%" }}
        >
          VAI ALL'EVENTO
        </button>
      </div>
    )
  }

  return (
    <div style={{ ...styles.pageBg, paddingTop: 20, paddingBottom: 40 }}>
      <div style={{ padding: "0 20px 20px" }}>
        <div style={{ ...styles.pageTitle, fontSize: 28 }}>CREA UN EVENTO</div>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          padding: "0 20px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <div>
          <div style={{ ...styles.fieldLabel, marginBottom: 8 }}>TITOLO</div>
          <input
            type="text"
            placeholder="Giro dei trulli"
            value={form.title}
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
            value={form.description}
            onChange={set("description")}
            required
            rows={3}
            style={{
              width: "100%",
              borderRadius: 14,
              background: COLORS.card,
              border: `1px solid ${COLORS.borderStrong}`,
              color: COLORS.text,
              fontFamily: FONTS.body,
              fontSize: 15,
              lineHeight: 1.5,
              padding: 14,
              outline: "none",
              resize: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div>
          <div style={{ ...styles.fieldLabel, marginBottom: 8 }}>PERCORSO</div>
          {isLoadingRoutes ? (
            <Spinner
              size="sm"
              animation="border"
              style={{ color: COLORS.accent }}
            />
          ) : routesPage?.content?.length === 0 ? (
            <div style={{ ...styles.emptyState, fontSize: 13 }}>
              Non hai ancora nessun percorso.{" "}
              <Link
                to="/routes/new"
                state={{ returnTo: "/events/new", resumeDraft: true }}
                onClick={saveDraft}
                style={{ color: COLORS.accent }}
              >
                Creane uno
              </Link>{" "}
              prima di continuare.
            </div>
          ) : (
            <>
              <select
                value={form.routeId}
                onChange={set("routeId")}
                required
                style={styles.input}
              >
                <option value="">Seleziona un percorso</option>
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
                  state={{ returnTo: "/events/new", resumeDraft: true }}
                  onClick={saveDraft}
                  style={{ color: COLORS.accent }}
                >
                  Crea un nuovo percorso
                </Link>
              </div>
            </>
          )}
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...styles.fieldLabel, marginBottom: 8 }}>INIZIO</div>
            <input
              type="datetime-local"
              min={nowLocal}
              value={form.startDateTime}
              onChange={set("startDateTime")}
              required
              style={styles.input}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...styles.fieldLabel, marginBottom: 8 }}>FINE</div>
            <input
              type="datetime-local"
              min={minEndDateTime}
              value={form.endDateTime}
              onChange={set("endDateTime")}
              required
              style={styles.input}
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

        {form.visibility !== "INVITE_ONLY" && (
          <div>
            <div style={{ ...styles.fieldLabel, marginBottom: 8 }}>
              NUMERO MASSIMO DI PARTECIPANTI
            </div>
            <input
              type="number"
              min={1}
              value={form.maxParticipants}
              onChange={set("maxParticipants")}
              required
              style={styles.input}
            />
          </div>
        )}

        <div>
          <div style={{ ...styles.fieldLabel, marginBottom: 8 }}>
            VISIBILITÀ
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {VISIBILITY_OPTIONS.map((opt) => {
              const active = form.visibility === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
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
                      try {
                        localStorage.setItem(DRAFT_KEY, JSON.stringify(next))
                      } catch {
                        // localStorage non disponibile
                      }
                      return next
                    })
                  }}
                  style={{
                    textAlign: "left",
                    padding: "13px 15px",
                    borderRadius: 13,
                    background: active ? COLORS.accentSoftBg : COLORS.card,
                    border: `1px solid ${active ? COLORS.accentSoftBorder : COLORS.borderStrong}`,
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      fontFamily: FONTS.heading,
                      fontWeight: 700,
                      fontSize: 15,
                      color: active ? COLORS.accent : COLORS.text,
                    }}
                  >
                    {opt.label}
                  </div>
                  <div
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 12,
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

        {form.visibility === "PUBLIC" && (
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontFamily: FONTS.body,
              fontSize: 13,
              color: COLORS.textSecondary,
              cursor: "pointer",
            }}
          >
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
            <div style={{ ...styles.fieldLabel, marginBottom: 8 }}>
              CODICE DI ACCESSO
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div
                style={{
                  flex: 1,
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: COLORS.cardAlt,
                  border: `1px solid ${COLORS.borderSoft}`,
                  fontFamily: FONTS.mono,
                  fontSize: 17,
                  letterSpacing: ".12em",
                  color: COLORS.accent,
                }}
              >
                {form.accessCode}
              </div>
              <button
                type="button"
                onClick={regenerateCode}
                style={{
                  ...styles.secondaryButton,
                  height: "auto",
                  padding: "0 16px",
                }}
              >
                RIGENERA
              </button>
            </div>
          </div>
        )}

        {form.visibility === "INVITE_ONLY" && (
          <div>
            <div style={{ ...styles.fieldLabel, marginBottom: 8 }}>
              INVITA DAI TUOI CONTATTI
            </div>
            <InviteSelector
              selected={inviteUsernames}
              onChange={updateInvitees}
            />
          </div>
        )}

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
          disabled={isLoading}
          style={{ ...styles.primaryButton, opacity: isLoading ? 0.6 : 1 }}
        >
          {isLoading ? "..." : "CREA EVENTO"}
        </button>
      </form>
    </div>
  )
}

export default EventCreatePage
