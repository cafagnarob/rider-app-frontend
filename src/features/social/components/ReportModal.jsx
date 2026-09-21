import { useState } from "react"

const REASON_LABELS = {
  SPAM: "Spam",
  CONTENUTO_OFFENSIVO: "Contenuto offensivo",
  MOLESTIE: "Molestie",
  PROFILO_FALSO: "Profilo falso",
  ALTRO: "Altro",
}

function ReportModal({ title, onClose, onSubmit }) {
  const [reason, setReason] = useState(null)
  const [note, setNote] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!reason) return
    setErrorMsg("")
    setIsSubmitting(true)
    try {
      await onSubmit({ reason, note: note.trim() || null })
      setSent(true)
    } catch (err) {
      setErrorMsg(err.data?.message || "Impossibile inviare la segnalazione.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="card modal-card" onClick={(e) => e.stopPropagation()}>
        {sent ? (
          <>
            <div className="modal-title">SEGNALAZIONE INVIATA</div>
            <p className="modal-text">
              Grazie, la esamineremo il prima possibile.
            </p>
            <button
              type="button"
              className="btn-primary"
              style={{ width: "100%" }}
              onClick={onClose}
            >
              CHIUDI
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="modal-title">{title}</div>

            <div style={{ marginBottom: 16 }}>
              <div className="field-label form-group__label">MOTIVO</div>
              <select
                className="select"
                style={{ fontFamily: "var(--font-heading)" }}
                value={reason || ""}
                onChange={(e) => setReason(e.target.value || null)}
                required
              >
                <option value="">Seleziona un motivo</option>
                {Object.entries(REASON_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div className="field-label form-group__label">
                DETTAGLI (OPZIONALE)
              </div>
              <textarea
                className="textarea"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            {errorMsg && (
              <div className="error-text" style={{ marginBottom: 12 }}>
                {errorMsg}
              </div>
            )}

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>
                ANNULLA
              </button>
              <button
                type="submit"
                className="btn-danger"
                disabled={!reason || isSubmitting}
              >
                {isSubmitting ? "..." : "INVIA SEGNALAZIONE"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default ReportModal
