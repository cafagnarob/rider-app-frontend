import { Link } from "react-router-dom"

function Navbar() {
  return (
    <nav className="navbar navbar-expand navbar-dark bg-dark px-3">
      <Link className="navbar-brand" to="/">
        Rider App
      </Link>
      <div className="navbar-nav">
        <Link className="nav-link" to="/events">
          Eventi
        </Link>
        <Link className="nav-link" to="/login">
          Login
        </Link>
      </div>
    </nav>
  )
}
export default Navbar
