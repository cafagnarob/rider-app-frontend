import { useState } from "react"
import { useNavigate, useSearchParams, Link } from "react-router-dom"
import { useResetPasswordMutation } from "../features/auth/authApi"

import { COLORS, FONTS, styles } from "../styles/theme"
import PasswordInput from "../components/PasswordInput"

function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [validationError, setValidationError] = useState("")

  const [resetPassword, { isLoading, error }] = useResetPasswordMutation()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setValidationError("")

    if (newPassword !== confirmPassword) {
      setValidationError("Le Password non coincidono.")
      return
    }
    try {
      await resetPassword({ token, newPassword }).unwrap()
      navigate("/login")
    } catch (err) {
      console.error("Reset fallito: ", err)
    }
  }

  if (!token) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: COLORS.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div
          style={{ ...styles.emptyState, maxWidth: 360, textAlign: "center" }}
        >
          Link non valido o incompleto. Richiedi un nuovo link dalla pagina{" "}
          <Link to="/forgot-password" style={{ color: COLORS.accent }}>
            password dimenticata
          </Link>
          .
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: COLORS.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          fontFamily: FONTS.heading,
          fontWeight: 700,
          fontSize: 30,
          marginBottom: 30,
        }}
      >
        NUOVA PASSWORD
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: 360,
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <div>
          <div style={{ ...styles.fieldLabel, marginBottom: 8 }}>
            NUOVA PASSWORD
          </div>
          <PasswordInput
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>

        <div>
          <div style={{ ...styles.fieldLabel, marginBottom: 8 }}>
            CONFERMA PASSWORD
          </div>
          <PasswordInput
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        {validationError && (
          <div
            style={{
              fontFamily: FONTS.body,
              fontSize: 13,
              color: COLORS.accent,
            }}
          >
            {validationError}
          </div>
        )}
        {error && (
          <div
            style={{
              fontFamily: FONTS.body,
              fontSize: 13,
              color: COLORS.danger,
            }}
          >
            Token non valido o scaduto. Richiedi un nuovo link.
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          style={{ ...styles.primaryButton, opacity: isLoading ? 0.6 : 1 }}
        >
          {isLoading ? "..." : "REIMPOSTA PASSWORD"}
        </button>
      </form>
    </div>
  )
}
export default ResetPasswordPage
