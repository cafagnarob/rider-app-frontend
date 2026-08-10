import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.jsx"
import "bootstrap/dist/css/bootstrap.min.css"
import { Provider } from "react-redux"
import { BrowserRouter } from "react-router-dom"
import { store } from "./app/store.js"
import "./styles/shared.css"

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>,
)
