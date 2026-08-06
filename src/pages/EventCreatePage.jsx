import { useState } from "react"
import { Button, Form, Spinner } from "react-bootstrap"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useGetMyRoutesQuery } from "../features/routesMap/routesApi"
import { useCreateEventMutation } from "../features/events/eventsApi"
import { toLocalDateTimeString } from "../utils/geo"

const DRAFT_KEY = "eventDraft"

const loadDraft = () => {
  try {
    const saved = localStorage.getItem(DRAFT_KEY)
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

const generateCode = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase()

function EventCreatePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { data: routesPage, isLoading: isLoadingRoutes } = useGetMyRoutesQuery({
    page: 0,
    size: 50,
  })
  const [createEvent, { isLoading }] = useCreateEventMutation()

  const draft = loadDraft()

  const [form, setForm] = useState({
    title: draft?.title || "",
    description: draft?.description || "",
    routeId: location.state?.newRouteId || draft?.routeId || "",
    startDateTime: draft?.startDateTime || "",
    endDateTime: draft?.endDateTime || "",
    maxParticipants: draft?.maxParticipants ?? 10,
    visibility: draft?.visibility || "PUBLIC",
    autoApprove: draft?.autoApprove || false,
    accessCode: draft?.accessCode || generateCode(),
  })
  const [errorMsg, setErrorMsg] = useState("")

  const saveDraft = () => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form))
    } catch {
      // localStorage non disponibile
    }
  }

  const regenerateCode = () => {
    setForm((prev) => {
      const next = {
        ...prev,
        accessCode: generateCode(),
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg("")

    if (!form.routeId) {
      setErrorMsg("Seleziona un percorso.")
      return
    }
    if (new Date(form.endDateTime) <= new Date(form.startDateTime)) {
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
        maxParticipants: Number(form.maxParticipants),
        visibility: form.visibility,
        autoApprove: form.visibility === "PUBLIC" ? form.autoApprove : false,
        accessCode: form.visibility === "PRIVATE_CODE" ? form.accessCode : null,
      }).unwrap()
      localStorage.removeItem(DRAFT_KEY)
      navigate(`/events/${created.id}`)
    } catch (err) {
      setErrorMsg(err.data?.message || "Impossibile creare l'evento.")
    }
  }

  return (
    <div style={{ maxWidth: "540px", margin: "0 auto" }}>
      <h2 className="mb-4">Crea un evento</h2>

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Titolo</Form.Label>
          <Form.Control
            type="text"
            className="bg-transparent text-light"
            placeholder="Giro dei trulli"
            value={form.title}
            onChange={set("title")}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Descrizione</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            className="bg-transparent text-light"
            value={form.description}
            onChange={set("description")}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Percorso</Form.Label>
          {isLoadingRoutes ? (
            <Spinner size="sm" animation="border" variant="light" />
          ) : routesPage?.content?.length === 0 ? (
            <div className="alert alert-warning py-2 small mb-0">
              Non hai ancora nessun percorso.{" "}
              <Link
                to="/routes/new"
                state={{ returnTo: "/events/new", resumeDraft: true }}
                onClick={saveDraft}
              >
                Creane uno
              </Link>{" "}
              prima di continuare.
            </div>
          ) : (
            <>
              <Form.Select
                className="bg-transparent text-light"
                value={form.routeId}
                onChange={set("routeId")}
                required
              >
                <option value="">Seleziona un percorso</option>
                {routesPage?.content?.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({(r.distanceMeters / 1000).toFixed(1)} km)
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-secondary">
                Non trovi quello che cerchi?{" "}
                <Link
                  to="/routes/new"
                  state={{
                    returnTo: "/events/new",
                    resumeDraft: true,
                  }}
                  onClick={saveDraft}
                >
                  Crea un nuovo percorso
                </Link>
              </Form.Text>
            </>
          )}
        </Form.Group>

        <div className="row">
          <div className="col-6">
            <Form.Group className="mb-3">
              <Form.Label>Inizio</Form.Label>
              <Form.Control
                type="datetime-local"
                className="bg-transparent text-light"
                min={nowLocal}
                value={form.startDateTime}
                onChange={set("startDateTime")}
                required
              />
            </Form.Group>
          </div>
          <div className="col-6">
            <Form.Group className="mb-3">
              <Form.Label>Fine</Form.Label>
              <Form.Control
                type="datetime-local"
                className="bg-transparent text-light"
                min={form.startDateTime || nowLocal}
                value={form.endDateTime}
                onChange={set("endDateTime")}
                required
              />
            </Form.Group>
          </div>
        </div>

        <Form.Group className="mb-3">
          <Form.Label>Numero massimo di partecipanti</Form.Label>
          <Form.Control
            type="number"
            min={1}
            className="bg-transparent text-light"
            value={form.maxParticipants}
            onChange={set("maxParticipants")}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Visibilità</Form.Label>
          <Form.Select
            className="bg-transparent text-light"
            value={form.visibility}
            onChange={(e) => {
              const value = e.target.value

              setForm((prev) => ({
                ...prev,
                visibility: value,
                accessCode:
                  value === "PRIVATE_CODE" && !prev.accessCode
                    ? generateCode()
                    : prev.accessCode,
              }))
            }}
          >
            <option value="PUBLIC">Pubblico — visibile a tutti</option>
            <option value="PRIVATE_CODE">
              Con codice — visibile a chi ha il codice
            </option>
            <option value="INVITE_ONLY">Solo su invito</option>
          </Form.Select>
        </Form.Group>

        {form.visibility === "PUBLIC" && (
          <Form.Check
            type="switch"
            id="auto-approve"
            label="Accetta automaticamente le richieste di partecipazione"
            className="mb-3"
            checked={form.autoApprove}
            onChange={set("autoApprove")}
          />
        )}

        {form.visibility === "PRIVATE_CODE" && (
          <Form.Group className="mb-3">
            <Form.Label>Codice di accesso</Form.Label>
            <Form.Control
              type="text"
              className="bg-transparent text-light"
              value={form.accessCode}
              readOnly
            />
            <Button type="button" onClick={regenerateCode}>
              Rigenera codice
            </Button>
          </Form.Group>
        )}

        {form.visibility === "INVITE_ONLY" && (
          <div className="alert alert-info small py-2">
            Potrai invitare persone specifiche dopo aver creato l'evento.
          </div>
        )}

        {errorMsg && <div className="alert alert-danger py-2">{errorMsg}</div>}

        <div className="d-grid">
          <Button
            type="submit"
            disabled={isLoading}
            className="rounded-pill fw-bold border-0"
            style={{ backgroundColor: "#FFBE5D", color: "#000" }}
          >
            {isLoading ? "Creazione..." : "Crea evento"}
          </Button>
        </div>
      </Form>
    </div>
  )
}

export default EventCreatePage
