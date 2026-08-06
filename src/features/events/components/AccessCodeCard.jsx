import { useState } from "react"
import {
  useGetAccessCodeQuery,
  useRegenerateAccessCodeMutation,
} from "../eventsApi"
import { generateAccessCode } from "../../../utils/codeGenerator"
import { COLORS, FONTS, styles } from "../../../styles/theme"

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
    <div style={{ ...styles.card, padding: 18, marginBottom: 20 }}>
      <div style={{ ...styles.fieldLabel, marginBottom: 10 }}>
        CODICE DI ACCESSO
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            flex: 1,
            padding: "12px 14px",
            borderRadius: 12,
            background: COLORS.cardAlt,
            border: `1px solid ${COLORS.borderSoft}`,
            fontFamily: FONTS.mono,
            fontSize: 18,
            letterSpacing: ".15em",
            color: COLORS.accent,
          }}
        >
          {isLoading ? "······" : data?.accessCode}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          style={{ ...styles.secondaryButton, height: 46, padding: "0 14px" }}
        >
          {copied ? "OK" : "COPIA"}
        </button>
      </div>

      {!showConfirm ? (
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          style={{
            background: "none",
            border: "none",
            color: COLORS.textSecondary,
            fontFamily: FONTS.mono,
            fontSize: 10,
            cursor: "pointer",
          }}
        >
          RIGENERA CODICE
        </button>
      ) : (
        <form onSubmit={handleRegenerate}>
          <div
            style={{
              fontFamily: FONTS.body,
              fontSize: 12,
              color: COLORS.textSecondary,
              marginBottom: 8,
            }}
          >
            Chi ha già partecipato non è coinvolto: il nuovo codice servirà solo
            a chi si iscrive da ora in poi. Conferma con la tua password.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ ...styles.input, height: 42, flex: 1 }}
            />
            <button
              type="submit"
              disabled={isRegenerating}
              style={{
                ...styles.secondaryButton,
                height: 42,
                padding: "0 14px",
              }}
            >
              {isRegenerating ? "..." : "CONFERMA"}
            </button>
          </div>
          {errorMsg && (
            <div
              style={{
                fontFamily: FONTS.body,
                fontSize: 12,
                color: COLORS.danger,
                marginTop: 8,
              }}
            >
              {errorMsg}
            </div>
          )}
        </form>
      )}
    </div>
  )
}

export default AccessCodeCard
