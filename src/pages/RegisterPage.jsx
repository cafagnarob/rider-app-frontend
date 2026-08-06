import { useState } from "react"
import { Link } from "react-router-dom"
import { useRegisterMutation } from "../features/auth/authApi"
import { COLORS, FONTS, styles } from "../styles/theme"
import PasswordInput from "../components/PasswordInput"

function RegisterPage() {
  const [form, setForm] = useState({
    username: "",
    name: "",
    surname: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const [errorMsg, setErrorMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  const [register, { isLoading }] = useRegisterMutation()

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg("")

    if (form.password !== form.confirmPassword) {
      setErrorMsg("Le password non coincidono.")
      return
    }

    try {
      await register(form).unwrap()
      setSuccessMsg(
        "Controlla la tua email per verificare l'account, poi accedi.",
      )
    } catch (err) {
      setErrorMsg(
        err.data?.message ||
          err.data?.errors?.[0] ||
          "Registrazione non riuscita.",
      )
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
            CREA IL TUO PROFILO
          </div>
        </div>

        {successMsg ? (
          <div
            style={{
              ...styles.emptyState,
              borderStyle: "solid",
              borderColor: COLORS.accentSoftBorder,
            }}
          >
            {successMsg}{" "}
            <Link to="/login" style={{ color: COLORS.accent }}>
              Vai al login
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <input
              type="text"
              placeholder="Nome in sella (username)"
              value={form.username}
              onChange={set("username")}
              style={styles.input}
              required
            />
            <input
              type="text"
              placeholder="Nome"
              value={form.name}
              onChange={set("name")}
              style={styles.input}
              required
            />
            <input
              type="text"
              placeholder="Cognome"
              value={form.surname}
              onChange={set("surname")}
              style={styles.input}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={set("email")}
              style={styles.input}
              required
            />
            <PasswordInput
              placeholder="Password (min 8 caratteri)"
              value={form.password}
              onChange={set("password")}
              minLength={8}
              required
            />

            <PasswordInput
              placeholder="Ripeti la password"
              value={form.confirmPassword}
              onChange={set("confirmPassword")}
              required
            />

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
              {isLoading ? "..." : "REGISTRATI"}
            </button>
          </form>
        )}

        <Link
          to="/login"
          style={{
            textAlign: "center",
            fontFamily: FONTS.mono,
            fontSize: 11,
            letterSpacing: ".06em",
            color: COLORS.textSecondary,
          }}
        >
          HAI GIÀ UN ACCOUNT? ACCEDI
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
export default RegisterPage
