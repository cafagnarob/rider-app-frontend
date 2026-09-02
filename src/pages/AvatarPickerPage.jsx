import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { FaArrowLeft } from "react-icons/fa"
import {
  useGetCurrentUserQuery,
  useUpdateProfilePictureMutation,
  useSelectAvatarMutation,
} from "../features/users/usersApi"
import { HELMET_TYPES } from "../utils/helmetAvatars"
import Avatar from "../components/Avatar"
import "../pages/CSS/AvatarPickerPage.css"

function AvatarPickerPage() {
  const navigate = useNavigate()
  const { data: profile } = useGetCurrentUserQuery()
  const [selectAvatar, { isLoading: isSelecting }] = useSelectAvatarMutation()
  const [updatePicture, { isLoading: isUploading }] =
    useUpdateProfilePictureMutation()
  const [errorMsg, setErrorMsg] = useState("")
  const [activeType, setActiveType] = useState(null)

  const handlePick = async (url) => {
    setErrorMsg("")
    try {
      await selectAvatar(url).unwrap()
    } catch (err) {
      setErrorMsg(err.data?.message || "Impossibile selezionare l'avatar.")
    }
  }

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Il file selezionato non è un'immagine.")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("L'immagine non può superare i 5 MB.")
      return
    }
    setErrorMsg("")
    try {
      await updatePicture(file).unwrap()
    } catch (err) {
      setErrorMsg(err.data?.message || "Errore durante il caricamento.")
    }
  }

  return (
    <div className="page">
      <div className="icon-header">
        <button
          type="button"
          className="btn-icon"
          onClick={() => (activeType ? setActiveType(null) : navigate(-1))}
        >
          <FaArrowLeft />
        </button>
        <div className="page-header__title">
          {activeType ? `CASCO ${activeType.label}` : "SCEGLI AVATAR"}
        </div>
      </div>

      <div className="px-20">
        <div className="avatar-picker__current">
          <Avatar
            src={profile?.profilePicture}
            alt=""
            className="avatar-picker__current-img"
          />
        </div>

        {!activeType && (
          <>
            <label className="btn-secondary btn-block avatar-picker__upload-btn">
              {isUploading ? "CARICAMENTO..." : "CARICA UNA TUA FOTO"}
              <input
                type="file"
                accept="image/*"
                hidden
                disabled={isUploading}
                onChange={handleUpload}
              />
            </label>

            {errorMsg && (
              <div className="error-text" style={{ marginTop: 12 }}>
                {errorMsg}
              </div>
            )}

            <div className="field-label" style={{ margin: "24px 0 12px" }}>
              OPPURE SCEGLI UN TIPO DI CASCO
            </div>

            <div className="avatar-picker__type-grid">
              {HELMET_TYPES.map((type) => (
                <button
                  key={type.key}
                  type="button"
                  className="avatar-picker__type-tile"
                  onClick={() => setActiveType(type)}
                >
                  <img src={type.colors[0].url} alt={type.label} />
                  <span className="avatar-picker__type-label">
                    {type.label}
                  </span>
                  <span className="avatar-picker__type-count">
                    {type.colors.length} VARIANTI
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {activeType && (
          <>
            {errorMsg && (
              <div
                className="error-text"
                style={{ marginTop: 12, marginBottom: 12 }}
              >
                {errorMsg}
              </div>
            )}

            <div className="field-label" style={{ margin: "24px 0 12px" }}>
              SCEGLI IL COLORE
            </div>

            <div className="avatar-picker__grid">
              {activeType.colors.map((avatar) => (
                <button
                  key={avatar.id}
                  type="button"
                  className={`avatar-picker__tile ${profile?.profilePicture === avatar.url ? "avatar-picker__tile--selected" : ""}`}
                  disabled={isSelecting}
                  title={avatar.label}
                  onClick={() => handlePick(avatar.url)}
                >
                  <img src={avatar.url} alt={avatar.label} />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default AvatarPickerPage
