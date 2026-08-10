import { useState } from "react"
import { Link } from "react-router-dom"
import styled from "styled-components"
import { FaTimes } from "react-icons/fa"
import { useForgotPasswordMutation } from "../features/auth/authApi"
import { PrimaryButton, Input } from "../styles/primitives"

const PageWrapper = styled.div`
  min-height: 100vh;
  background: ${(props) => props.theme.colors.bg};
  display: flex;
  flex-direction: column;
`

const TopBar = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 20px;
`

const CloseLink = styled(Link)`
  color: ${(props) => props.theme.colors.textMuted};
  display: flex;
`

const Content = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
`

const Title = styled.div`
  font-family: ${(props) => props.theme.fonts.heading};
  font-weight: 700;
  font-size: 30px;
  margin-bottom: 30px;
  text-align: center;
`

const SuccessBox = styled.div`
  padding: 22px;
  border-radius: ${(props) => props.theme.radius.lg};
  background: ${(props) => props.theme.colors.card};
  border: 1px solid ${(props) => props.theme.colors.accentSoftBorder};
  font-size: 13px;
  line-height: 1.5;
  color: ${(props) => props.theme.colors.textSecondary};
  max-width: 360px;
  text-align: center;
`

const Form = styled.form`
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`

const ErrorText = styled.div`
  font-family: ${(props) => props.theme.fonts.body};
  font-size: 13px;
  color: ${(props) => props.theme.colors.danger};
`

function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [forgotPassword, { isLoading, isSuccess, error }] =
    useForgotPasswordMutation()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await forgotPassword(email).unwrap()
    } catch (err) {
      console.error("Richiesta reset fallita:", err)
    }
  }

  return (
    <PageWrapper>
      <TopBar>
        <CloseLink to="/login">
          <FaTimes size={22} />
        </CloseLink>
      </TopBar>

      <Content>
        <Title>PASSWORD DIMENTICATA</Title>

        {isSuccess ? (
          <SuccessBox>
            Se l'indirizzo è registrato, riceverai a breve un link per
            reimpostare la password. Controlla la tua casella di posta.
          </SuccessBox>
        ) : (
          <Form onSubmit={handleSubmit}>
            <Input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {error && (
              <ErrorText>
                Si è verificato un errore. Riprova più tardi.
              </ErrorText>
            )}

            <PrimaryButton type="submit" disabled={isLoading}>
              {isLoading ? "..." : "INVIA LINK"}
            </PrimaryButton>
          </Form>
        )}
      </Content>
    </PageWrapper>
  )
}

export default ForgotPasswordPage
