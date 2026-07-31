import { useState } from "react"
import { useForgotPasswordMutation } from "../features/auth/authApi"
import { Button, Card } from "react-bootstrap"
import { Form } from "react-bootstrap"
import { IoCloseCircle } from "react-icons/io5"
import { Link } from "react-router-dom"

function ForgotPasswordPage() {
  const [email, setEmial] = useState("")
  const [forgotPassword, { isLoading, isSuccess, error }] =
    useForgotPasswordMutation()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await forgotPassword(email).unwrap
    } catch (err) {
      console.error("Richiesta reset fallita:", err)
    }
  }

  return (
    <Card className="min-vh-100 bg-black text-light p-3">
      <Card.Body className="d-flex flex-column h-100 ">
        <div className="d-flex w-100 justify-content-end mt-3">
          <Link to="/login" className="text-light">
            <IoCloseCircle className="fs-2" />
          </Link>
        </div>
        <div className="d-flex flex-column justify-content-center align-items-center flex-grow-1">
          <Card.Title className="py-5 fs-1">Password dimenticata</Card.Title>

          {isSuccess ? (
            <div className="alert alert-success">
              Se l'indirizzo è registrato, riceverai a breve un link per
              reimpostare la password. Controlla la tua casella di posta.
            </div>
          ) : (
            <Form
              onSubmit={handleSubmit}
              className="w-100"
              style={{ maxWidth: "400px" }}
            >
              <Form.Group
                className="mb-3"
                controlId="email"
                data-bs-theme="dark"
              >
                <Form.Label>E-mail</Form.Label>
                <Form.Control
                  type="email"
                  value={email}
                  placeholder="name@example.com"
                  className="bg-transparent"
                  onChange={(e) => setEmial(e.target.value)}
                  required
                />
              </Form.Group>

              {error && (
                <div className="alert alert-danger py-2">
                  Si è verificato un errore. Riprova più tardi.
                </div>
              )}

              <div className="d-flex justify-content-center">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-pill px-5 fw-bold my-3 border-0"
                  style={{ backgroundColor: "#FFBE5D", color: "#000" }}
                >
                  {isLoading ? "Invio in corso..." : "Invia link"}
                </Button>
              </div>
            </Form>
          )}
        </div>
      </Card.Body>
    </Card>
  )
}

export default ForgotPasswordPage
