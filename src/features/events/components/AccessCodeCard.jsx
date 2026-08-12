import { useState } from "react"
import {
  useGetAccessCodeQuery,
  useRegenerateAccessCodeMutation,
} from "../eventsApi"
import { generateAccessCode } from "../../../utils/codeGenerator"

function AccessCodeCard({ eventId }) {
  const { data, isLoading } = useGetAccessCodeQuery(eventId)
  const [regenerate, { isLoading: isRegenerating }] =
    useRegenerateAccessCodeMutation()

  const [showConfirm, setShowConfirm] = useState(false)
  const [password, setPassword] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (!data?.accessCode) return
    navigator.clipboard.writeText(data.accessCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleRegenerate = async (e) => {
    e.preventDefault()
    setErrorMsg("")
    try {
      await regenerate({
        eventId,
        currentPassword: password,
        newAccessCode: generateAccessCode(),
      }).unwrap()
      setPassword("")
      setShowConfirm(false)
    } catch (err) {
      setErrorMsg(err.data?.message || "Impossibile rigenerare il codice.")
    }
  }

  return (
    <div className="card section-card">
      <div className="field-label section-card__label">CODICE DI ACCESSO</div>

      <div className="code-display-row">
        <div className="code-display-box">
          {isLoading ? "······" : data?.accessCode}
        </div>
        <button
          type="button"
          className="btn-secondary code-copy-btn"
          onClick={handleCopy}
        >
          {copied ? "OK" : "COPIA"}
        </button>
      </div>

      {!showConfirm ? (
        <button
          type="button"
          className="text-btn text-btn--secondary"
          style={{ fontSize: 10 }}
          onClick={() => setShowConfirm(true)}
        >
          RIGENERA CODICE
        </button>
      ) : (
        <form onSubmit={handleRegenerate}>
          <div className="code-hint-text">
            Chi ha già partecipato non è coinvolto: il nuovo codice servirà solo
            a chi si iscrive da ora in poi. Conferma con la tua password.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="password"
              className="input"
              style={{ height: 42, flex: 1 }}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="submit"
              className="btn-secondary"
              style={{ height: 42, padding: "0 14px" }}
              disabled={isRegenerating}
            >
              {isRegenerating ? "..." : "CONFERMA"}
            </button>
          </div>
          {errorMsg && (
            <div className="error-text" style={{ fontSize: 12, marginTop: 8 }}>
              {errorMsg}
            </div>
          )}
        </form>
      )}
    </div>
  )
}

export default AccessCodeCard
