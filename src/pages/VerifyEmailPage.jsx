import { Link, useSearchParams } from "react-router-dom"
import { Spinner } from "react-bootstrap"
import { useVerifyEmailQuery } from "../features/auth/authApi"

function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")

  const { isLoading, isError, isSuccess } = useVerifyEmailQuery(token, {
    skip: !token,
  })

  return (
    <div className="centered-page centered-page--text">
      <div className="page-heading" style={{ marginBottom: 26 }}>
        VERIFICA EMAIL
      </div>

      {!token && (
        <div className="empty-state empty-state--narrow">
          Link non valido o incompleto. Controlla di aver copiato l'intero
          indirizzo dall'email che hai ricevuto.
        </div>
      )}

      {isLoading && (
        <div className="loading-block">
          <Spinner animation="border" style={{ color: "#FF7A2F" }} />
          <p className="loading-block__text">Verifica in corso...</p>
        </div>
      )}

      {isError && (
        <div className="empty-state empty-state--narrow empty-state--danger">
          Token non valido o scaduto. Puoi richiedere un nuovo link di verifica.
        </div>
      )}

      {isSuccess && (
        <div className="success-box success-box--narrow">
          Email verificata con successo! Ora puoi accedere al tuo account.
        </div>
      )}

      {(isSuccess || isError) && (
        <Link to="/login" className="btn-primary btn-link-wrap mt-20">
          VAI AL LOGIN
        </Link>
      )}
    </div>
  )
}

export default VerifyEmailPage
