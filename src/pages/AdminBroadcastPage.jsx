import { useState } from "react"
import { useBroadcastNotificationMutation } from "../features/auth/adminApi"

function AdminBroadcastPage() {
  const [message, setMessage] = useState("")
  const [broadcast, { isLoading }] = useBroadcastNotificationMutation()
  const [errorMsg, setErrorMsg] = useState("")
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg("")
    setSent(false)
    try {
      await broadcast(message.trim()).unwrap()
      setSent(true)
      setMessage("")
    } catch (err) {
      setErrorMsg(err.data?.message || "Impossibile inviare la notifica.")
    }
  }

  return (
    <div className="page">
      <div className="page-title" style={{ fontSize: 26, marginBottom: 16 }}>
        NOTIFICA BROADCAST
      </div>

      <p className="duration-hint" style={{ marginBottom: 20 }}>
        Il messaggio verrà inviato a tutti gli utenti attivi come notifica di
        sistema.
      </p>

      <form onSubmit={handleSubmit} className="form-stack">
        <div>
          <div className="field-label form-group__label">MESSAGGIO</div>
          <textarea
            className="textarea"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
        </div>

        {errorMsg && <div className="error-text">{errorMsg}</div>}
        {sent && (
          <div
            className="empty-state"
            style={{
              borderColor: "var(--color-accent-soft-border)",
              color: "var(--color-accent)",
            }}
          >
            Notifica inviata con successo.
          </div>
        )}

        <button
          type="submit"
          className="btn-primary"
          disabled={isLoading || !message.trim()}
        >
          {isLoading ? "..." : "INVIA A TUTTI"}
        </button>
      </form>
    </div>
  )
}

export default AdminBroadcastPage
