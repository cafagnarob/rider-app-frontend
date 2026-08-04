import { Button, Form, Modal } from "react-bootstrap"
import { useUpdateProfileMutation } from "../usersApi"
import { useState } from "react"

function ProfileEditModal({ profile, onClose }) {
  const [updateProfile, { isLoading }] = useUpdateProfileMutation()
  const [errorMsg, setErrorMsg] = useState("")

  const [form, setForm] = useState({
    name: profile?.name || "",
    surname: profile?.surname || "",
    description: profile?.description || "",
    location: profile?.location || "",
    birthDate: profile?.birthDate || "",
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg("")
    try {
      await updateProfile({
        name: form.name || null,
        surname: form.surname || null,
        description: form.description || null,
        location: form.location || null,
        birthDate: form.birthDate || null,
      }).unwrap()
      onClose()
    } catch (err) {
      setErrorMsg(err.data?.message || "Errore durante il salvataggio.")
    }
  }

  return (
    <Modal show={!!profile} onHide={onClose} centered data-bs-theme="dark">
      {profile && (
        <Form onSubmit={handleSubmit}>
          <Modal.Header
            closeButton
            className="bg-dark text-light border-secondary"
          >
            <Modal.Title className="fs-5">Modifica profilo</Modal.Title>
          </Modal.Header>

          <Modal.Body className="bg-dark text-light">
            <div className="row">
              <div className="col-6">
                <Form.Group className="mb-3">
                  <Form.Label>Nome</Form.Label>
                  <Form.Control
                    type="text"
                    className="bg-transparent"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </Form.Group>
              </div>
              <div className="col-6">
                <Form.Group className="mb-3">
                  <Form.Label>Cognome</Form.Label>
                  <Form.Control
                    type="text"
                    className="bg-transparent"
                    value={form.surname}
                    onChange={(e) =>
                      setForm({ ...form, surname: e.target.value })
                    }
                  />
                </Form.Group>
              </div>
            </div>

            <Form.Group className="mb-3">
              <Form.Label>Bio</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                className="bg-transparent"
                placeholder="Raccontaci qualcosa di te..."
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Località</Form.Label>
              <Form.Control
                type="text"
                className="bg-transparent"
                placeholder="Latina, Italia"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Data di nascita</Form.Label>
              <Form.Control
                type="date"
                className="bg-transparent"
                max={new Date().toISOString().split("T")[0]}
                value={form.birthDate}
                onChange={(e) =>
                  setForm({ ...form, birthDate: e.target.value })
                }
              />
            </Form.Group>

            {errorMsg && (
              <div className="alert alert-danger py-2">{errorMsg}</div>
            )}
          </Modal.Body>

          <Modal.Footer className="bg-dark border-secondary">
            <Button
              variant="outline-light"
              onClick={onClose}
              disabled={isLoading}
            >
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="rounded-pill px-4 fw-bold border-0"
              style={{ backgroundColor: "#FFBE5D", color: "#000" }}
            >
              {isLoading ? "Salvataggio..." : "Salva"}
            </Button>
          </Modal.Footer>
        </Form>
      )}
    </Modal>
  )
}

export default ProfileEditModal
