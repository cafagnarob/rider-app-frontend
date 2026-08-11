import { useState } from "react"
import { FaTimes } from "react-icons/fa"
import { useUpdateProfileMutation } from "../usersApi"
import PlaceSearchInput from "../../../components/PlaceSearchInput"

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
  const [locationValue, setLocationValue] = useState(
    profile?.location ? { label: profile.location } : null,
  )
  const [locationChanged, setLocationChanged] = useState(false)

  const handleLocationChange = (place) => {
    setLocationValue(place)
    setLocationChanged(true)
  }

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg("")
    try {
      const payload = {
        name: form.name || null,
        surname: form.surname || null,
        description: form.description || null,
        birthDate: form.birthDate || null,
      }
      if (locationChanged) {
        payload.location = locationValue?.label || null
        payload.locationLat = locationValue?.lat ?? null
        payload.locationLng = locationValue?.lng ?? null
      }
      await updateProfile(payload).unwrap()
      onClose()
    } catch (err) {
      setErrorMsg(err.data?.message || "Errore durante il salvataggio.")
    }
  }

  if (!profile) return null

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet-panel" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="sheet-header">
            <button type="button" className="btn-icon" onClick={onClose}>
              <FaTimes />
            </button>
            <div className="sheet-header__title">MODIFICA PROFILO</div>
            <button
              type="submit"
              className="sheet-save-btn"
              disabled={isLoading}
              style={{ opacity: isLoading ? 0.5 : 1 }}
            >
              {isLoading ? "..." : "SALVA"}
            </button>
          </div>

          <div className="sheet-body">
            <div className="field-row">
              <div className="field-col">
                <div className="field-label form-group__label">NOME</div>
                <input
                  type="text"
                  className="input"
                  value={form.name}
                  onChange={set("name")}
                />
              </div>
              <div className="field-col">
                <div className="field-label form-group__label">COGNOME</div>
                <input
                  type="text"
                  className="input"
                  value={form.surname}
                  onChange={set("surname")}
                />
              </div>
            </div>

            <div>
              <div className="field-label form-group__label">BIO</div>
              <textarea
                className="textarea"
                value={form.description}
                onChange={set("description")}
                rows={3}
                placeholder="Raccontaci qualcosa di te..."
              />
            </div>

            <div>
              <div className="field-label form-group__label">LOCALITÀ</div>
              <PlaceSearchInput
                value={locationValue}
                onChange={handleLocationChange}
              />
            </div>

            <div>
              <div className="field-label form-group__label">
                DATA DI NASCITA
              </div>
              <input
                type="date"
                className="input"
                max={new Date().toISOString().split("T")[0]}
                value={form.birthDate}
                onChange={set("birthDate")}
              />
            </div>

            {errorMsg && <div className="error-text">{errorMsg}</div>}
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProfileEditModal
