import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.jsx"
import "bootstrap/dist/css/bootstrap.min.css"
import { Provider } from "react-redux"
import { BrowserRouter } from "react-router-dom"
import { store } from "./app/store.js"
import { ThemeProvider } from "styled-components"
import { theme } from "./styles/theme"
import { GlobalStyle } from "./styles/GlobalStyle"

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <GlobalStyle />
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </Provider>,
)
