import { Button, Card, Form, InputGroup } from "react-bootstrap"
import {
  FaFacebook,
  FaGlobe,
  FaInstagram,
  FaTiktok,
  FaTrash,
  FaYoutube,
} from "react-icons/fa"
import {
  useAddProfileLinkMutation,
  useDeleteProfileLinkMutation,
} from "../usersApi"
import { useState } from "react"
import { PLATFORM_LABELS } from "../../../utils/constants"

const PLATFORM_ICONS = {
  INSTAGRAM: FaInstagram,
  FACEBOOK: FaFacebook,
  YOUTUBE: FaYoutube,
  TIKTOK: FaTiktok,
  WEBSITE: FaGlobe,
}

function ProfileLinksSection({ links }) {
  const [addLink, { isLoading: isAdding }] = useAddProfileLinkMutation()
  const [deleteLink, { isLoading: isDeleting }] = useDeleteProfileLinkMutation()

  const [platform, setPlatform] = useState("")
  const [url, setUrl] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  const usedPlatforms = links.map((l) => l.platform)
  const availablePlatforms = Object.keys(PLATFORM_LABELS).filter(
    (p) => !usedPlatforms.includes(p),
  )

  const handleAdd = async (e) => {
    e.preventDefault()
    setErrorMsg("")
    try {
      await addLink({ platform, url }).unwrap()
      setPlatform("")
      setUrl("")
    } catch (err) {
      setErrorMsg(err.data?.message || "Impossibile aggiungere il link.")
    }
  }

  const handleDelete = async (linkId) => {
    setErrorMsg("")
    try {
      await deleteLink(linkId).unwrap()
    } catch (err) {
      setErrorMsg(err.data?.message || "Impossibile rimuovere il link.")
    }
  }

  return (
    <Card className="bg-dark text-light border-secondary mb-4">
      <Card.Body>
        <Card.Title className="fs-6 mb-3">Link social</Card.Title>
        {links.length === 0 ? (
          <p className="text-secondary small">
            Non hai ancora aggiunto nessun link.
          </p>
        ) : (
          <div className="d-flex flex-column gap-2 mb-3">
            {links.map((link) => {
              const Icon = PLATFORM_ICONS[link.platform] || FaGlobe
              return (
                <div key={link.id} className="d-flex align-items-center gap-2">
                  <Icon className="fs-5" />
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-decoration-none flex-grow-1 text-truncate"
                    style={{ color: "#FFBE5D" }}
                  >
                    {link.url}
                  </a>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    disabled={isDeleting}
                    onClick={() => handleDelete(link.id)}
                  >
                    <FaTrash />
                  </Button>
                </div>
              )
            })}
          </div>
        )}

        {availablePlatforms.length > 0 && (
          <Form onSubmit={handleAdd}>
            <InputGroup size="sm" data-bs-theme="dark">
              <Form.Select
                className="bg-transparent text-light"
                style={{ maxWidth: "140px" }}
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                required
              >
                <option value="">Piattaforma</option>
                {availablePlatforms.map((p) => (
                  <option key={p} value={p}>
                    {PLATFORM_LABELS[p]}
                  </option>
                ))}
              </Form.Select>
              <Form.Control
                type="url"
                className="bg-transparent text-light"
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
              <Button
                type="submit"
                variant="outline-warning"
                disabled={isAdding || !platform}
              >
                Aggiungi
              </Button>
            </InputGroup>
          </Form>
        )}

        {errorMsg && (
          <div className="alert alert-danger py-2 mt-3 mb-0">{errorMsg}</div>
        )}
      </Card.Body>
    </Card>
  )
}

export default ProfileLinksSection
