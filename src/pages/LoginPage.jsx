import { useState } from "react"
import { useDispatch } from "react-redux"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { useLoginMutation } from "../features/auth/authApi"
import { setCredentials } from "../features/auth/authSlice"
import PasswordInput from "../components/PasswordInput"

function LoginPage() {
  const [errorMsg, setErrorMsg] = useState("")
  const [remember, setRemember] = useState(true)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  const [login, { isLoading }] = useLoginMutation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg("")
    try {
      const result = await login({ username, password }).unwrap()
      dispatch(setCredentials({ token: result.accessToken, remember }))
      navigate(location.state?.from?.pathname || "/", { replace: true })
    } catch (err) {
      setErrorMsg(err.data?.message || "Credenziali non valide.")
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
          <div className="auth-page__brand-subtitle">BENTORNATO IN SELLA</div>
        </div>

        <form className="auth-page__form" onSubmit={handleSubmit}>
          <input
            type="text"
            className="input"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <PasswordInput
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <label className="auth-page__remember-label">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            RICORDAMI
          </label>

          {errorMsg && <div className="error-text">{errorMsg}</div>}

          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? "..." : "ACCEDI"}
          </button>
        </form>

        <Link to="/forgot-password" className="auth-page__link">
          PASSWORD DIMENTICATA?
        </Link>
        <Link to="/register" className="auth-page__link">
          NON HAI UN ACCOUNT? REGISTRATI
        </Link>

        <div className="auth-page__footer-note">
          Sessione protetta con token JWT. Il profilo e le moto si completano
          dopo il primo accesso.
        </div>
      </div>
    </div>
  )
}

export default LoginPage
