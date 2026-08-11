import { useState } from "react"
import { Link } from "react-router-dom"
import { FaTimes } from "react-icons/fa"
import { useForgotPasswordMutation } from "../features/auth/authApi"
import "./ForgotPasswordPage.css"

function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [forgotPassword, { isLoading, isSuccess, error }] =
    useForgotPasswordMutation()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await forgotPassword(email).unwrap()
    } catch (err) {
      console.error("Richiesta reset fallita:", err)
    }
  }

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-page__top-bar">
        <Link to="/login" className="forgot-password-page__close-link">
          <FaTimes size={22} />
        </Link>
      </div>

      <div className="forgot-password-page__content">
        <div className="page-heading">PASSWORD DIMENTICATA</div>

        {isSuccess ? (
          <div className="success-box success-box--narrow">
            Se l'indirizzo è registrato, riceverai a breve un link per
            reimpostare la password. Controlla la tua casella di posta.
          </div>
        ) : (
          <form className="forgot-password-page__form" onSubmit={handleSubmit}>
            <input
              type="email"
              className="input"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {error && (
              <div className="error-text">
                Si è verificato un errore. Riprova più tardi.
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? "..." : "INVIA LINK"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default ForgotPasswordPage
