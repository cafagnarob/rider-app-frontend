import styled from "styled-components"

export const Card = styled.div`
  border-radius: ${(props) => props.theme.radius.xl};
  background: ${(props) => props.theme.colors.card};
  border: 1px solid ${(props) => props.theme.colors.border};
`

export const PrimaryButton = styled.button`
  height: 56px;
  border-radius: 15px;
  background: ${(props) => props.theme.colors.accent};
  border: none;
  color: ${(props) => props.theme.colors.onAccent};
  font-family: ${(props) => props.theme.fonts.heading};
  font-weight: 700;
  font-size: 19px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  opacity: ${(props) => (props.disabled ? 0.6 : 1)};

  &:disabled {
    cursor: not-allowed;
  }
`

export const SecondaryButton = styled.button`
  height: 48px;
  border-radius: ${(props) => props.theme.radius.md};
  background: ${(props) => props.theme.colors.card};
  border: 1px solid ${(props) => props.theme.colors.borderStrong};
  color: ${(props) => props.theme.colors.text};
  font-family: ${(props) => props.theme.fonts.heading};
  font-weight: 600;
  font-size: 16px;
  letter-spacing: 0.05em;
  cursor: pointer;
`

export const Input = styled.input`
  width: 100%;
  height: 52px;
  border-radius: ${(props) => props.theme.radius.md};
  background: ${(props) => props.theme.colors.card};
  border: 1px solid ${(props) => props.theme.colors.borderStrong};
  color: ${(props) => props.theme.colors.text};
  font-family: ${(props) => props.theme.fonts.body};
  font-size: 15px;
  padding: 0 15px;
  outline: none;
  box-sizing: border-box;

  &::placeholder {
    color: ${(props) => props.theme.colors.textFaint};
  }

  &:focus {
    border-color: ${(props) => props.theme.colors.accent};
  }
`

export const PageTitle = styled.h1`
  font-family: ${(props) => props.theme.fonts.heading};
  font-weight: 700;
  font-size: 28px;
  line-height: 1;
  margin: 0;
`

export const FieldLabel = styled.div`
  font-family: ${(props) => props.theme.fonts.mono};
  font-size: 10px;
  letter-spacing: 0.14em;
  color: ${(props) => props.theme.colors.textMuted};
  text-transform: uppercase;
`

export const IconButton = styled.button`
  width: 44px;
  height: 44px;
  border-radius: ${(props) => props.theme.radius.md};
  background: ${(props) => props.theme.colors.cardAlt};
  border: 1px solid ${(props) => props.theme.colors.borderStrong};
  color: ${(props) => props.theme.colors.text};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
`
