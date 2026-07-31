import { useState } from "react"
import { useLoginMutation } from "../features/auth/authApi"
import { useDispatch } from "react-redux"
import { Link, useNavigate } from "react-router-dom"
import { setCredentials } from "../features/auth/authSlice"
import { Button, Card, Form } from "react-bootstrap"
import { IoCloseCircle } from "react-icons/io5"
import { FaEye, FaEyeSlash } from "react-icons/fa"

function LoginPage() {
  const [showPass, setShowPass] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [formData, setFormData] = useState({ username: "", password: "" })

  const [login, { isLoading, error }] = useLoginMutation()
  const dispach = useDispatch()
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const result = await login(formData).unwrap()
      dispach(
        setCredentials({ token: result.accessToken, remember: rememberMe }),
      )
      navigate("/")
    } catch (err) {
      console.error("login fallito", err)
    }
  }

  return (
    <Card className="min-vh-100 bg-black text-light p-3">
      <Card.Body className="d-flex flex-column justify-content-between">
        <div>
          <div className="d-flex w-100 justify-content-end mt-3">
            <Link to="/" className="text-light">
              <IoCloseCircle className="fs-2" />
            </Link>
          </div>
          <Card.Title className="py-5 fs-1">Accedi a Rider App</Card.Title>
          <Form onSubmit={handleSubmit}>
            <Form.Group
              className="mb-3"
              controlId="username"
              data-bs-theme="dark"
            >
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={formData.username}
                placeholder="il tuo username"
                className="bg-transparent"
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group
              className="mb-3 position-relative"
              controlId="password"
              data-bs-theme="dark"
            >
              <Form.Label>Password</Form.Label>
              <Form.Control
                type={showPass ? "text" : "password"}
                value={formData.password}
                name="password"
                placeholder="********"
                className="bg-transparent"
                onChange={handleChange}
                required
              />
              <span
                onClick={() => setShowPass(!showPass)}
                style={{
                  cursor: "pointer",
                  position: "absolute",
                  right: "12px",
                  top: "38px",
                }}
              >
                {showPass ? <FaEyeSlash /> : <FaEye />}
              </span>
            </Form.Group>
            <div className="d-flex justify-content-between mt-3 ">
              <Form.Check
                type="switch"
                id="remember-switch"
                label="Remember me"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ fontSize: "13px" }}
                className="mb-3"
              />
              <Link
                to="/forgot-password"
                className="text-decoration-none"
                style={{ color: "#FFBE5D" }}
              >
                Password dimenticata
              </Link>
            </div>

            {error && (
              <div className="alert alert-danger py-2">
                Credenziali non valide o errore del server.
              </div>
            )}

            <div className="d-flex justify-content-center flex-column align-items-center">
              <Button
                type="submit"
                disabled={isLoading}
                className="my-3 border-0 rounded-pill px-5 fw-bold"
                style={{ backgroundColor: "#FFBE5D" }}
              >
                {isLoading ? "Accesso in corso..." : "Accedi"}
              </Button>
              <Link
                to="/register"
                className="text-decoration-none"
                style={{ color: "#FFBE5D" }}
              >
                Registrati
              </Link>
            </div>
          </Form>
        </div>

        <p className="text-center">
          Continuando, accetti i{" "}
          <a href="#" className="text-light">
            termini di servizio
          </a>{" "}
          e{" "}
          <a href="#" className="text-light">
            informativa sulla privacy
          </a>
        </p>
      </Card.Body>
    </Card>
  )
}

export default LoginPage
