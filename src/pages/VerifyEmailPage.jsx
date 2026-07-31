import { Link, useSearchParams } from "react-router-dom"
import { useVerifyEmailQuery } from "../features/auth/authApi"
import { Button, Card, Spinner } from "react-bootstrap"

function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")

  const { data, isLoading, isError, isSuccess } = useVerifyEmailQuery(token, {
    skip: !token,
  })

  return (
    <Card className="min-vh-100 bg-black text-light p-3">
      <Card.Body className="d-flex flex-column justify-content-center align-items-center text-center">
        <Card.Title className="fs-1 mb-4">Verifica email</Card.Title>

        {!token && (
          <div className="alert mt-5 text-center d-flex flex-column justify-content-center">
            Link non valido o incompleto. Controlla di aver copiato l'intero
            indirizzo dall'email che hai ricevuto.
          </div>
        )}

        {isLoading && (
          <div className="d-flex flex-column align-items-center">
            <Spinner animation="border" variant="light" />
            <p className="mt-3">Verifica in corso...</p>
          </div>
        )}

        {isError && (
          <div className="alert alert-danger">
            Token non valido o scaduto. Puoi richiedere un nuovo link di
            verifica.
          </div>
        )}

        {isSuccess && (
          <div className="alert alert-success">
            Email verificata con successo! Ora puoi accedere al tuo account.
          </div>
        )}

        {(isSuccess || isError) && (
          <Link to="/login">
            <Button
              className="rounded-pill px-5 fw-bold mt-3 border-0"
              style={{ backgroundColor: "#FFBE5D", color: "#000" }}
            >
              Vai al login
            </Button>
          </Link>
        )}
      </Card.Body>
    </Card>
  )
}

export default VerifyEmailPage
