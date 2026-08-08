import { Link, useSearchParams } from "react-router-dom"
import { useVerifyEmailQuery } from "../features/auth/authApi"
import { Spinner } from "react-bootstrap"
import { COLORS, FONTS, styles } from "../styles/theme"

function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")

  const { isLoading, isError, isSuccess } = useVerifyEmailQuery(token, {
    skip: !token,
  })

  return (
    <div
      style={{
        minHeight: "100vh",
        background: COLORS.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: FONTS.heading,
          fontWeight: 700,
          fontSize: 30,
          marginBottom: 26,
        }}
      >
        VERIFICA EMAIL
      </div>

      {!token && (
        <div style={{ ...styles.emptyState, maxWidth: 360 }}>
          Link non valido o incompleto. Controlla di aver copiato l'intero
          indirizzo dall'email che hai ricevuto.
        </div>
      )}

      {isLoading && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
          }}
        >
          <Spinner animation="border" style={{ color: COLORS.accent }} />
          <p
            style={{
              fontFamily: FONTS.body,
              fontSize: 13,
              color: COLORS.textSecondary,
            }}
          >
            Verifica in corso...
          </p>
        </div>
      )}

      {isError && (
        <div
          style={{
            ...styles.emptyState,
            borderColor: COLORS.dangerBorder,
            maxWidth: 360,
          }}
        >
          Token non valido o scaduto. Puoi richiedere un nuovo link di verifica.
        </div>
      )}

      {isSuccess && (
        <div
          style={{
            ...styles.emptyState,
            borderStyle: "solid",
            borderColor: COLORS.accentSoftBorder,
            maxWidth: 360,
          }}
        >
          Email verificata con successo! Ora puoi accedere al tuo account.
        </div>
      )}

      {(isSuccess || isError) && (
        <Link
          to="/login"
          style={{
            ...styles.primaryButton,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 32px",
            textDecoration: "none",
            marginTop: 20,
          }}
        >
          VAI AL LOGIN
        </Link>
      )}
    </div>
  )
}

export default VerifyEmailPage
