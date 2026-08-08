import { useState } from "react"
import { useForgotPasswordMutation } from "../features/auth/authApi"

import { Link } from "react-router-dom"
import { COLORS, FONTS, styles } from "../styles/theme"
import { FaTimes } from "react-icons/fa"

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
    <div
      style={{
        minHeight: "100vh",
        background: COLORS.bg,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ display: "flex", justifyContent: "flex-end", padding: 20 }}>
        <Link to="/login" style={{ color: COLORS.textMuted, display: "flex" }}>
          <FaTimes size={22} />
        </Link>
      </div>

      <div
        style={{
          flex: 1,
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
            textAlign: "center",
          }}
        >
          PASSWORD DIMENTICATA
        </div>

        {isSuccess ? (
          <div
            style={{
              ...styles.emptyState,
              borderStyle: "solid",
              borderColor: COLORS.accentSoftBorder,
              maxWidth: 360,
              textAlign: "center",
            }}
          >
            Se l'indirizzo è registrato, riceverai a breve un link per
            reimpostare la password. Controlla la tua casella di posta.
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{
              width: "100%",
              maxWidth: 360,
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />

            {error && (
              <div
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 13,
                  color: COLORS.danger,
                }}
              >
                Si è verificato un errore. Riprova più tardi.
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              style={{ ...styles.primaryButton, opacity: isLoading ? 0.6 : 1 }}
            >
              {isLoading ? "..." : "INVIA LINK"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default ForgotPasswordPage
