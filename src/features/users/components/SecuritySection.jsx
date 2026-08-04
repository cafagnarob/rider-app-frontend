import { useState } from "react"
import { useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import {
  useChangePasswordMutation,
  useDeactivateAccountMutation,
  useUpdateEmailMutation,
  useUpdateUsernameMutation,
} from "../usersApi"
import { logout } from "../../auth/authSlice"
import { Button, Card, Form, Modal } from "react-bootstrap"

function SecuritySection({ profile }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [activeForm, setActiveForm] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [showDeactivate, setShowDeactivate] = useState(false)

  const [changePassword, { isLoading: isChangingPw }] =
    useChangePasswordMutation()
  const [updateUsername, { isLoading: isChangingUser }] =
    useUpdateUsernameMutation()
  const [updateEmail, { isLoading: isChangingMail }] = useUpdateEmailMutation()
  const [deactivate, { isLoading: isDeactivating }] =
    useDeactivateAccountMutation()

  const [pwForm, setPwForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirm: "",
  })
  const [userForm, setUserForm] = useState({
    currentPassword: "",
    newUsername: "",
  })
  const [mailForm, setMailForm] = useState({
    currentPassword: "",
    newEmail: "",
  })

  const closeForm = () => {
    setActiveForm(null)
    setPwForm({ oldPassword: "", newPassword: "", confirm: "" })
    setUserForm({ currentPassword: "", newUsername: "" })
    setMailForm({ currentPassword: "", newEmail: "" })
  }

  const handlePassword = async (e) => {
    e.preventDefault()
    setFeedback(null)
    if (pwForm.newPassword !== pwForm.confirm) {
      setFeedback({ type: "warning", text: "Le password non coincidono." })
      return
    }
    try {
      await changePassword({
        oldPassword: pwForm.oldPassword,
        newPassword: pwForm.newPassword,
      }).unwrap()
      setFeedback({ type: "success", text: "Password aggiornata." })
      closeForm()
    } catch (err) {
      setFeedback({
        type: "danger",
        text: err.data?.message || "Errore durante il cambio password.",
      })
    }
  }

  const handleUsername = async (e) => {
    e.preventDefault()
    setFeedback(null)
    try {
      await updateUsername(userForm).unwrap()
      setFeedback({ type: "success", text: "Username aggiornato." })
      closeForm()
    } catch (err) {
      setFeedback({
        type: "danger",
        text: err.data?.message || "Errore durante il cambio username.",
      })
    }
  }

  const handleEmail = async (e) => {
    e.preventDefault()
    setFeedback(null)
    try {
      await updateEmail(mailForm).unwrap()
      setFeedback({ type: "success", text: "Email aggiornata." })
      closeForm()
    } catch (err) {
      setFeedback({
        type: "danger",
        text: err.data?.message || "Errore durante il cambio email.",
      })
    }
  }

  const handleDeactivate = async () => {
    try {
      await deactivate().unwrap()
      dispatch(logout())
      navigate("/login")
    } catch (err) {
      setFeedback({
        type: "danger",
        text: err.data?.message || "Errore durante la disattivazione.",
      })
      setShowDeactivate(false)
    }
  }

  return (
    <>
      <Card className="bg-dark text-light border-secondary mb-4">
        <Card.Body>
          <Card.Title className="fs-6 mb-3">Account e sicurezza</Card.Title>

          {feedback && (
            <div className={`alert alert-${feedback.type} py-2`}>
              {feedback.text}
            </div>
          )}

          <div className="d-flex flex-column gap-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="mb-0">Username</p>
                <small className="text-secondary">@{profile.username}</small>
              </div>
              <Button
                variant="outline-light"
                size="sm"
                onClick={() =>
                  setActiveForm(activeForm === "username" ? null : "username")
                }
              >
                Modifica
              </Button>
            </div>

            {activeForm === "username" && (
              <Form
                onSubmit={handleUsername}
                className="border-top border-secondary pt-3"
              >
                <Form.Group className="mb-2">
                  <Form.Label className="small">Nuovo username</Form.Label>
                  <Form.Control
                    type="text"
                    size="sm"
                    className="bg-transparent text-light"
                    value={userForm.newUsername}
                    onChange={(e) =>
                      setUserForm({ ...userForm, newUsername: e.target.value })
                    }
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="small">Password attuale</Form.Label>
                  <Form.Control
                    type="password"
                    size="sm"
                    className="bg-transparent text-light"
                    value={userForm.currentPassword}
                    onChange={(e) =>
                      setUserForm({
                        ...userForm,
                        currentPassword: e.target.value,
                      })
                    }
                    required
                  />
                </Form.Group>
                <Button
                  type="submit"
                  size="sm"
                  variant="warning"
                  disabled={isChangingUser}
                >
                  {isChangingUser ? "Salvataggio..." : "Conferma"}
                </Button>
              </Form>
            )}

            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="mb-0">Email</p>
                <small className="text-secondary">{profile.email}</small>
              </div>
              <Button
                variant="outline-light"
                size="sm"
                onClick={() =>
                  setActiveForm(activeForm === "email" ? null : "email")
                }
              >
                Modifica
              </Button>
            </div>

            {activeForm === "email" && (
              <Form
                onSubmit={handleEmail}
                className="border-top border-secondary pt-3"
              >
                <Form.Group className="mb-2">
                  <Form.Label className="small">Nuova email</Form.Label>
                  <Form.Control
                    type="email"
                    size="sm"
                    className="bg-transparent text-light"
                    value={mailForm.newEmail}
                    onChange={(e) =>
                      setMailForm({ ...mailForm, newEmail: e.target.value })
                    }
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="small">Password attuale</Form.Label>
                  <Form.Control
                    type="password"
                    size="sm"
                    className="bg-transparent text-light"
                    value={mailForm.currentPassword}
                    onChange={(e) =>
                      setMailForm({
                        ...mailForm,
                        currentPassword: e.target.value,
                      })
                    }
                    required
                  />
                </Form.Group>
                <Button
                  type="submit"
                  size="sm"
                  variant="warning"
                  disabled={isChangingMail}
                >
                  {isChangingMail ? "Salvataggio..." : "Conferma"}
                </Button>
              </Form>
            )}

            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="mb-0">Password</p>
                <small className="text-secondary">••••••••</small>
              </div>
              <Button
                variant="outline-light"
                size="sm"
                onClick={() =>
                  setActiveForm(activeForm === "password" ? null : "password")
                }
              >
                Modifica
              </Button>
            </div>

            {activeForm === "password" && (
              <Form
                onSubmit={handlePassword}
                className="border-top border-secondary pt-3"
              >
                <Form.Group className="mb-2">
                  <Form.Label className="small">Password attuale</Form.Label>
                  <Form.Control
                    type="password"
                    size="sm"
                    className="bg-transparent text-light"
                    value={pwForm.oldPassword}
                    onChange={(e) =>
                      setPwForm({ ...pwForm, oldPassword: e.target.value })
                    }
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label className="small">Nuova password</Form.Label>
                  <Form.Control
                    type="password"
                    size="sm"
                    minLength={8}
                    className="bg-transparent text-light"
                    value={pwForm.newPassword}
                    onChange={(e) =>
                      setPwForm({ ...pwForm, newPassword: e.target.value })
                    }
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="small">
                    Conferma nuova password
                  </Form.Label>
                  <Form.Control
                    type="password"
                    size="sm"
                    className="bg-transparent text-light"
                    value={pwForm.confirm}
                    onChange={(e) =>
                      setPwForm({ ...pwForm, confirm: e.target.value })
                    }
                    required
                  />
                </Form.Group>
                <Button
                  type="submit"
                  size="sm"
                  variant="warning"
                  disabled={isChangingPw}
                >
                  {isChangingPw ? "Salvataggio..." : "Conferma"}
                </Button>
              </Form>
            )}
          </div>
        </Card.Body>
      </Card>

      <Card className="bg-dark text-light border-danger mb-4">
        <Card.Body>
          <Card.Title className="fs-6 mb-2 text-danger">
            Zona pericolosa
          </Card.Title>
          <p className="small text-secondary mb-3">
            Disattivando l'account non potrai più accedere finché non verrà
            riattivato da un amministratore. I tuoi contenuti non vengono
            eliminati.
          </p>
          <Button
            variant="outline-danger"
            size="sm"
            onClick={() => setShowDeactivate(true)}
          >
            Disattiva account
          </Button>
        </Card.Body>
      </Card>

      <Modal
        show={showDeactivate}
        onHide={() => setShowDeactivate(false)}
        centered
        data-bs-theme="dark"
      >
        <Modal.Header
          closeButton
          className="bg-dark text-light border-secondary"
        >
          <Modal.Title className="fs-5">Disattivare l'account?</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark text-light">
          Verrai disconnesso immediatamente e non potrai più accedere con queste
          credenziali. Sei sicuro di voler procedere?
        </Modal.Body>
        <Modal.Footer className="bg-dark border-secondary">
          <Button
            variant="outline-light"
            onClick={() => setShowDeactivate(false)}
          >
            Annulla
          </Button>
          <Button
            variant="danger"
            disabled={isDeactivating}
            onClick={handleDeactivate}
          >
            {isDeactivating ? "Disattivazione..." : "Disattiva"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default SecuritySection
