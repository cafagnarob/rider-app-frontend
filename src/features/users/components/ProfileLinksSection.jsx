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
import { COLORS, FONTS, styles } from "../../../styles/theme"

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
    <div style={{ ...styles.card, padding: 18, marginBottom: 16 }}>
      <div style={{ ...styles.fieldLabel, marginBottom: 14 }}>LINK SOCIAL</div>

      {links.length === 0 ? (
        <p
          style={{
            fontFamily: FONTS.body,
            fontSize: 13,
            color: COLORS.textFaint,
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
              <div
                key={link.id}
                style={{ display: "flex", alignItems: "center", gap: 10 }}
              >
                <Icon size={17} color={COLORS.textSecondary} />
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    color: COLORS.accent,
                    fontFamily: FONTS.body,
                    fontSize: 13,
                    textDecoration: "none",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {link.url}
                </a>
                <button
                  type="button"
                  onClick={() => handleDelete(link.id)}
                  disabled={isDeleting}
                  style={{
                    background: "none",
                    border: "none",
                    color: COLORS.danger,
                    cursor: "pointer",
                    padding: 4,
                    flexShrink: 0,
                  }}
                >
                  <FaTrash size={12} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {availablePlatforms.length > 0 && (
        <form onSubmit={handleAdd} style={{ display: "flex", gap: 8 }}>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            required
            style={{
              ...styles.input,
              height: 40,
              fontSize: 12,
              width: 118,
              flexShrink: 0,
            }}
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
            placeholder="https://..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            style={{
              ...styles.input,
              height: 40,
              fontSize: 12,
              flex: 1,
              minWidth: 0,
            }}
          />
          <button
            type="submit"
            disabled={isAdding || !platform}
            style={{
              height: 40,
              padding: "0 13px",
              borderRadius: 12,
              background: COLORS.accent,
              flexShrink: 0,
              border: "none",
              color: COLORS.onAccent,
              fontFamily: FONTS.mono,
              fontSize: 10.5,
              cursor: "pointer",
              opacity: isAdding || !platform ? 0.5 : 1,
            }}
          >
            AGGIUNGI
          </button>
        </form>
      )}

      {errorMsg && (
        <div
          style={{
            fontFamily: FONTS.body,
            fontSize: 12,
            color: COLORS.danger,
            marginTop: 10,
          }}
        >
          {errorMsg}
        </div>
      )}
    </div>
  )
}

export default ProfileLinksSection
