import { useState } from "react"
import { useLoginMutation } from "../features/auth/authApi"
import { useDispatch } from "react-redux"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { setCredentials } from "../features/auth/authSlice"
import { COLORS, FONTS, styles } from "../styles/theme"
import PasswordInput from "../components/PasswordInput"

function LoginPage() {
  const [errorMsg, setErrorMsg] = useState("")
  const [remember, setRemember] = useState(true)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  const [login, { isLoading }] = useLoginMutation()
  const dispach = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg("")
    try {
      const result = await login({ username, password }).unwrap()
      dispach(setCredentials({ token: result.accessToken, remember }))
      navigate(location.state?.from?.pathname || "/", { replace: true })
    } catch (err) {
      setErrorMsg(err.data?.message || "Credenziali non valide.")
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
      <div
        style={{
          position: "relative",
          height: 250,
          flexShrink: 0,
          backgroundColor: "#0E0F12",
          backgroundImage:
            "repeating-linear-gradient(135deg, rgba(255,255,255,.045) 0 8px, transparent 8px 16px)",
          borderBottom: `1px solid ${COLORS.borderSoft}`,
        }}
      >
        <span
          style={{
            position: "absolute",
            left: 20,
            bottom: 16,
            fontFamily: FONTS.mono,
            fontSize: 10,
            letterSpacing: ".1em",
            color: COLORS.textMuted,
          }}
        >
          FOTO · MOTO IN CURVA, PASSO ALPINO
        </span>
      </div>

      <div
        style={{
          padding: "26px 20px 30px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
          flex: 1,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: FONTS.heading,
              fontWeight: 700,
              fontSize: 42,
              lineHeight: 0.95,
              letterSpacing: ".01em",
            }}
          >
            QJ RIDERS
          </div>
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 11,
              letterSpacing: ".14em",
              color: COLORS.accent,
              marginTop: 9,
            }}
          >
            BENTORNATO IN SELLA
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 20 }}
        >
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
            required
          />
          <PasswordInput
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontFamily: FONTS.mono,
              fontSize: 11,
              color: COLORS.textSecondary,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            RICORDAMI
          </label>

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
            style={styles.primaryButton}
          >
            {isLoading ? "..." : "ACCEDI"}
          </button>
        </form>

        <Link
          to="/forgot-password"
          style={{
            textAlign: "center",
            fontFamily: FONTS.mono,
            fontSize: 11,
            letterSpacing: ".06em",
            color: COLORS.textSecondary,
          }}
        >
          PASSWORD DIMENTICATA?
        </Link>

        <Link
          to="/register"
          style={{
            textAlign: "center",
            fontFamily: FONTS.mono,
            fontSize: 11,
            letterSpacing: ".06em",
            color: COLORS.textSecondary,
          }}
        >
          NON HAI UN ACCOUNT? REGISTRATI
        </Link>

        <div
          style={{
            marginTop: "auto",
            fontSize: 12,
            lineHeight: 1.5,
            color: COLORS.textFaint,
          }}
        >
          Sessione protetta con token JWT. Il profilo e le moto si completano
          dopo il primo accesso.
        </div>
      </div>
    </div>
  )
}

export default LoginPage
