import { useState } from "react"
import { useNavigate, useSearchParams, Link } from "react-router-dom"
import { useResetPasswordMutation } from "../features/auth/authApi"
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
      <div className="centered-page">
        <div className="empty-state empty-state--narrow">
          Link non valido o incompleto. Richiedi un nuovo link dalla pagina{" "}
          <Link to="/forgot-password" className="link-accent">
            password dimenticata
          </Link>
          .
        </div>
      </div>
    )
  }

  return (
    <div className="centered-page">
      <div className="page-heading">NUOVA PASSWORD</div>

      <form
        className="form-stack"
        style={{ width: "100%", maxWidth: 360 }}
        onSubmit={handleSubmit}
      >
        <div>
          <div className="field-label form-group__label">NUOVA PASSWORD</div>
          <PasswordInput
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>

        <div>
          <div className="field-label form-group__label">CONFERMA PASSWORD</div>
          <PasswordInput
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        {validationError && (
          <div className="warning-text">{validationError}</div>
        )}
        {error && (
          <div className="error-text">
            Token non valido o scaduto. Richiedi un nuovo link.
          </div>
        )}

        <button
          type="submit"
          className="btn-primary"
          disabled={isLoading}
          style={{ opacity: isLoading ? 0.6 : 1 }}
        >
          {isLoading ? "..." : "REIMPOSTA PASSWORD"}
        </button>
      </form>
    </div>
  )
}

export default ResetPasswordPage
