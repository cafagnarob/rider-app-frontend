import { useState } from "react"
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
    <div className="card section-card">
      <div className="field-label section-card__label">LINK SOCIAL</div>

      {links.length === 0 ? (
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 13,
            color: "var(--color-text-faint)",
            marginBottom: availablePlatforms.length > 0 ? 16 : 0,
          }}
        >
          Non hai ancora aggiunto nessun link.
        </p>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginBottom: 16,
          }}
        >
          {links.map((link) => {
            const Icon = PLATFORM_ICONS[link.platform] || FaGlobe
            return (
              <div key={link.id} className="link-row">
                <Icon size={17} color="var(--color-text-secondary)" />
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-row__url"
                >
                  {link.url}
                </a>
                <button
                  type="button"
                  className="link-row__delete"
                  disabled={isDeleting}
                  onClick={() => handleDelete(link.id)}
                >
                  <FaTrash size={12} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {availablePlatforms.length > 0 && (
        <form className="inline-add-form" onSubmit={handleAdd}>
          <select
            className="select"
            style={{ height: 40, fontSize: 12, width: 118, flexShrink: 0 }}
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            required
          >
            <option value="">Scegli</option>
            {availablePlatforms.map((p) => (
              <option key={p} value={p}>
                {PLATFORM_LABELS[p]}
              </option>
            ))}
          </select>
          <input
            type="url"
            className="input"
            style={{ height: 40, fontSize: 12, flex: 1, minWidth: 0 }}
            placeholder="https://..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <button
            type="submit"
            className="btn-accent-sm"
            style={{ padding: "0 13px", fontSize: 10.5 }}
            disabled={isAdding || !platform}
          >
            AGGIUNGI
          </button>
        </form>
      )}

      {errorMsg && (
        <div className="error-text" style={{ fontSize: 12, marginTop: 10 }}>
          {errorMsg}
        </div>
      )}
    </div>
  )
}

export default ProfileLinksSection
