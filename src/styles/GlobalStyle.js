import { createGlobalStyle } from "styled-components"

export const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    background: ${(props) => props.theme.colors.bg};
    color: ${(props) => props.theme.colors.text};
    font-family: ${(props) => props.theme.fonts.body};
  }

  @keyframes qjpulse {
    0% { opacity: .35; transform: scale(1); }
    70% { opacity: 0; transform: scale(2.4); }
    100% { opacity: 0; transform: scale(2.4); }
  }
`
