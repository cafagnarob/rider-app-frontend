import { useDispatch, useSelector } from "react-redux"
import { Link, useNavigate } from "react-router-dom"
import { useGetCurrentUserQuery } from "../../features/users/usersApi"
import { logout } from "../../features/auth/authSlice"
import { Container, Dropdown, Nav, Navbar as BsNavbar } from "react-bootstrap"
import NotificationBell from "../../features/notification/components/NotificationBell"

function Navbar() {
  const token = useSelector((state) => state.auth.token)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { data: currentUser } = useGetCurrentUserQuery(undefined, {
    skip: !token,
  })

  const handleLogout = () => {
    dispatch(logout())
    navigate("/login")
  }

  return (
    <BsNavbar expand="lg" variant="dark" bg="dark">
      <Container>
        <BsNavbar.Brand as={Link} to="/">
          Rider App
        </BsNavbar.Brand>
        <BsNavbar.Toggle aria-controls="main-nav" />
        <BsNavbar.Collapse id="main-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/events">
              Eventi
            </Nav.Link>
          </Nav>

          <Nav>
            {token ? (
              <>
                <NotificationBell />
                <Dropdown align="end">
                  <Dropdown.Toggle variant="dark" id="user-menu">
                    {currentUser?.username || "Account"}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item as={Link} to="/profile">
                      Profilo
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} to="/garage">
                      Garage
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} to="/invites">
                      Inviti
                    </Dropdown.Item>
                    <Nav.Link as={Link} to="/catalog">
                      Catalogo
                    </Nav.Link>
                    <Dropdown.Divider />
                    {currentUser?.currentVehicle && (
                      <>
                        <Dropdown.ItemText className="small text-secondary">
                          {currentUser.currentVehicle.nickname ||
                            `${currentUser.currentVehicle.brandName} ${currentUser.currentVehicle.modelName}`}
                        </Dropdown.ItemText>
                        <Dropdown.Divider />
                      </>
                    )}
                    <Dropdown.Item onClick={handleLogout}>Esci</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">
                  Accedi
                </Nav.Link>
                <Nav.Link as={Link} to="/register">
                  Registrati
                </Nav.Link>
              </>
            )}
          </Nav>
        </BsNavbar.Collapse>
      </Container>
    </BsNavbar>
  )
}
export default Navbar
