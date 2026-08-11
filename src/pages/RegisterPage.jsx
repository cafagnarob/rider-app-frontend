import { useState } from "react"
import { Link } from "react-router-dom"
import { useRegisterMutation } from "../features/auth/authApi"
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
    <div className="auth-page">
      <div className="auth-page__hero">
        <span className="auth-page__hero-caption">
          FOTO · MOTO IN CURVA, PASSO ALPINO
        </span>
      </div>

      <div className="auth-page__body">
        <div>
          <div className="auth-page__brand-title">QJ RIDERS</div>
          <div className="auth-page__brand-subtitle">CREA IL TUO PROFILO</div>
        </div>

        {successMsg ? (
          <div className="success-box">
            {successMsg}{" "}
            <Link to="/login" className="link-accent">
              Vai al login
            </Link>
          </div>
        ) : (
          <form className="auth-page__form" onSubmit={handleSubmit}>
            <input
              type="text"
              className="input"
              placeholder="Nome in sella (username)"
              value={form.username}
              onChange={set("username")}
              required
            />
            <input
              type="text"
              className="input"
              placeholder="Nome"
              value={form.name}
              onChange={set("name")}
              required
            />
            <input
              type="text"
              className="input"
              placeholder="Cognome"
              value={form.surname}
              onChange={set("surname")}
              required
            />
            <input
              type="email"
              className="input"
              placeholder="Email"
              value={form.email}
              onChange={set("email")}
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

            {errorMsg && <div className="error-text">{errorMsg}</div>}

            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? "..." : "REGISTRATI"}
            </button>
          </form>
        )}

        <Link to="/login" className="auth-page__link">
          HAI GIÀ UN ACCOUNT? ACCEDI
        </Link>

        <div className="auth-page__footer-note">
          Sessione protetta con token JWT. Il profilo e le moto si completano
          dopo il primo accesso.
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
