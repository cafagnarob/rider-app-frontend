import { useState } from "react"
import { Button, Card, Form } from "react-bootstrap"
import { FaEye, FaEyeSlash } from "react-icons/fa"
import { IoCloseCircle } from "react-icons/io5"
import { Link } from "react-router-dom"
import { useRegisterMutation } from "../features/auth/authApi"

function RegisterPage() {
  const [showPass, setShowPass] = useState(false)
  const [validationError, setValidationError] = useState("")
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    surname: "",
    email: "",
    password: "",
  })

  const [confirmPassword, setConfirmPassword] = useState("")

  const [register, { isLoading, isSuccess, error }] = useRegisterMutation()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setValidationError("")

    if (formData.password !== confirmPassword) {
      setValidationError("Le password non coincidono.")
      return
    }

    try {
      await register(formData).unwrap()
    } catch (err) {
      console.error("Registrazione fallita:", err)
    }
  }

  if (isSuccess) {
    return (
      <Card className="min-vh-100 bg-black text-light p-3">
        <Card.Body className="d-flex flex-column justify-content-center align-items-center text-center">
          <Card.Title className="fs-1 mb-4">Ci siamo quasi</Card.Title>
          <div className="alert alert-success">
            Registrazione completata. Ti abbiamo inviato un'email per verificare
            il tuo account: il link è valido per 24 ore.
          </div>
          <Link to="/login">
            <Button
              className="rounded-pill px-5 fw-bold mt-3 border-0"
              style={{ backgroundColor: "#FFBE5D", color: "#000" }}
            >
              Vai al login
            </Button>
          </Link>
        </Card.Body>
      </Card>
    )
  }

  return (
    <Card className="min-vh-100 bg-black text-light p-3">
      <Card.Body>
        <div className="d-flex w-100 justify-content-end mt-3">
          <Link to="/" className="text-light">
            <IoCloseCircle className="fs-2" />
          </Link>
        </div>
        <Card.Title className="py-4 fs-1">Crea il tuo account</Card.Title>

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

          <div className="row">
            <div className="col-6">
              <Form.Group
                className="mb-3"
                controlId="name"
                data-bs-theme="dark"
              >
                <Form.Label>Nome</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  className="bg-transparent"
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </div>
            <div className="col-6">
              <Form.Group
                className="mb-3"
                controlId="surname"
                data-bs-theme="dark"
              >
                <Form.Label>Cognome</Form.Label>
                <Form.Control
                  type="text"
                  name="surname"
                  value={formData.surname}
                  className="bg-transparent"
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </div>
          </div>

          <Form.Group className="mb-3" controlId="email" data-bs-theme="dark">
            <Form.Label>E-mail</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={formData.email}
              placeholder="name@example.com"
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
              name="password"
              value={formData.password}
              placeholder="********"
              className="bg-transparent"
              onChange={handleChange}
              minLength={8}
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
            <Form.Text className="text-secondary">
              Almeno 8 caratteri.
            </Form.Text>
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
              {error.data?.errors ? (
                <ul className="mb-0 ps-3">
                  {error.data.errors.map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
              ) : (
                error.data?.message ||
                "Si è verificato un errore. Riprova più tardi."
              )}
            </div>
          )}

          <div className="d-flex justify-content-center">
            <Button
              type="submit"
              disabled={isLoading}
              className="rounded-pill px-5 fw-bold my-3 border-0"
              style={{ backgroundColor: "#FFBE5D", color: "#000" }}
            >
              {isLoading ? "Registrazione..." : "Registrati"}
            </Button>
          </div>
        </Form>

        <p className="text-center mt-2">
          Hai già un account?{" "}
          <Link
            to="/login"
            style={{ color: "#FFBE5D" }}
            className="text-decoration-none"
          >
            Accedi
          </Link>
        </p>
      </Card.Body>
    </Card>
  )
}
export default RegisterPage
