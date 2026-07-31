import { useState } from "react"
import { useNavigate, useSearchParams, Link } from "react-router-dom"
import { useResetPasswordMutation } from "../features/auth/authApi"
import { Button, Card, Form } from "react-bootstrap"
import { FaEye, FaEyeSlash } from "react-icons/fa"

function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")

  const [showPass, setShowPass] = useState(false)
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
      <Card className="min-vh-100 bg-black text-light p-3">
        <Card.Body className="d-flex">
          <div className="alert mt-5 text-center d-flex flex-column justify-content-center">
            <p>
              Link non valido o incompleto. Richiedi un nuovo link dalla
              pagina{" "}
            </p>
            <br />
            <p>
              <Link to="/forgot-password">password dimenticata</Link>.
            </p>
          </div>
        </Card.Body>
      </Card>
    )
  }

  return (
    <Card className="min-vh-100 bg-black text-light p-3">
      <Card.Body>
        <Card.Title className="py-5 fs-1">Nuova password</Card.Title>
        <Form onSubmit={handleSubmit}>
          <Form.Group
            className="mb-3 position-relative"
            controlId="newPassword"
            data-bs-theme="dark"
          >
            <Form.Label>Nuova password</Form.Label>
            <Form.Control
              type={showPass ? "text" : "password"}
              value={newPassword}
              placeholder="********"
              className="bg-transparent"
              onChange={(e) => setNewPassword(e.target.value)}
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

          <Form.Group
            className="mb-3"
            controlId="confirmPassword"
            data-bs-theme="dark"
          >
            <Form.Label>Conferma password</Form.Label>
            <Form.Control
              type={showPass ? "text" : "password"}
              value={confirmPassword}
              placeholder="********"
              className="bg-transparent"
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </Form.Group>

          {validationError && (
            <div className="alert alert-warning py-2">{validationError}</div>
          )}
          {error && (
            <div className="alert alert-danger py-2">
              Token non valido o scaduto. Richiedi un nuovo link.
            </div>
          )}

          <div className="d-flex justify-content-center">
            <Button
              type="submit"
              disabled={isLoading}
              className="rounded-pill px-5 fw-bold my-3 border-0"
              style={{ backgroundColor: "#FFBE5D", color: "#000" }}
            >
              {isLoading ? "Salvataggio..." : "Reimposta password"}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  )
}
export default ResetPasswordPage
