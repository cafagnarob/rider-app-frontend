import { useState } from "react"
import { Modal, Button, Form, Spinner } from "react-bootstrap"
import { FaTimes } from "react-icons/fa"
import { useCreatePostMutation } from "../postsApi"

const MAX_FILES = 5
const MAX_SIZE = 5 * 1024 * 1024

function CreatePostModal({ show, onClose }) {
  const [createPost, { isLoading }] = useCreatePostMutation()

  const [text, setText] = useState("")
  const [items, setItems] = useState([])
  const [errorMsg, setErrorMsg] = useState("")

  const revokeAll = (list) =>
    list.forEach((i) => URL.revokeObjectURL(i.preview))

  const handleClose = () => {
    revokeAll(items)
    setItems([])
    setText("")
    setErrorMsg("")
    onClose()
  }

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || [])
    if (selected.length === 0) return

    if (items.length + selected.length > MAX_FILES) {
      setErrorMsg(`Puoi caricare al massimo ${MAX_FILES} immagini.`)
      return
    }

    const invalid = selected.find(
      (f) => !f.type.startsWith("image/") || f.size > MAX_SIZE,
    )
    if (invalid) {
      setErrorMsg("Ogni file deve essere un'immagine sotto i 5 MB.")
      return
    }

    setErrorMsg("")
    setItems((prev) => [
      ...prev,
      ...selected.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
      })),
    ])
    e.target.value = ""
  }

  const handleRemove = (id) => {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id)
      if (target) URL.revokeObjectURL(target.preview)
      return prev.filter((i) => i.id !== id)
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg("")

    if (items.length === 0) {
      setErrorMsg("Aggiungi almeno un'immagine.")
      return
    }

    try {
      await createPost({
        data: {
          text: text.trim() || null,
          eventId: null,
          rideId: null,
          includeRoutePhoto: false,
        },
        files: items.map((i) => i.file),
      }).unwrap()
      handleClose()
    } catch (err) {
      setErrorMsg(err.data?.message || "Errore durante la pubblicazione.")
    }
  }

  return (
    <Modal show={show} onHide={handleClose} centered data-bs-theme="dark">
      <Form onSubmit={handleSubmit}>
        <Modal.Header
          closeButton
          className="bg-dark text-light border-secondary"
        >
          <Modal.Title className="fs-5">Nuovo post</Modal.Title>
        </Modal.Header>

        <Modal.Body className="bg-dark text-light">
          {items.length > 0 && (
            <div className="d-flex gap-2 flex-wrap mb-3">
              {items.map((item) => (
                <div key={item.id} className="position-relative">
                  <img
                    src={item.preview}
                    alt=""
                    style={{
                      width: "90px",
                      height: "90px",
                      objectFit: "cover",
                      borderRadius: "0.5rem",
                    }}
                  />
                  <Button
                    variant="danger"
                    size="sm"
                    className="position-absolute top-0 end-0 p-0 d-flex align-items-center justify-content-center"
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                    }}
                    onClick={() => handleRemove(item.id)}
                  >
                    <FaTimes size={11} />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="mb-3">
            <label className="btn btn-outline-light btn-sm mb-0">
              {items.length === 0 ? "Scegli immagini" : "Aggiungi altre"}
              <input
                type="file"
                accept="image/*"
                multiple
                hidden
                disabled={items.length >= MAX_FILES}
                onChange={handleFileChange}
              />
            </label>
            <Form.Text className="text-secondary ms-2">
              {items.length}/{MAX_FILES}
            </Form.Text>
          </div>

          <Form.Group>
            <Form.Control
              as="textarea"
              rows={3}
              maxLength={1000}
              className="bg-transparent text-light"
              placeholder="Scrivi qualcosa..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </Form.Group>

          {errorMsg && (
            <div className="alert alert-danger py-2 mt-3 mb-0">{errorMsg}</div>
          )}
        </Modal.Body>

        <Modal.Footer className="bg-dark border-secondary">
          <Button
            variant="outline-light"
            onClick={handleClose}
            disabled={isLoading}
          >
            Annulla
          </Button>
          <Button
            type="submit"
            disabled={isLoading || items.length === 0}
            className="rounded-pill px-4 fw-bold border-0"
            style={{ backgroundColor: "#FFBE5D", color: "#000" }}
          >
            {isLoading ? (
              <>
                <Spinner size="sm" animation="border" className="me-2" />
                Pubblicazione...
              </>
            ) : (
              "Pubblica"
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default CreatePostModal
