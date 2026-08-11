import { useState } from "react"
import { FaTimes, FaTrash } from "react-icons/fa"
import {
  useUpdateVehicleMutation,
  useUpdateVehiclePhotoMutation,
  useDeleteVehiclePhotoMutation,
} from "../vehiclesApi"
import "./VehicleEditModal.css"

function VehicleEditModal({ vehicle, onClose }) {
  const [updateVehicle, { isLoading: isSaving }] = useUpdateVehicleMutation()
  const [updatePhoto, { isLoading: isUploading }] =
    useUpdateVehiclePhotoMutation()
  const [deletePhoto, { isLoading: isRemoving }] =
    useDeleteVehiclePhotoMutation()

  const [form, setForm] = useState({
    nickname: vehicle?.nickname || "",
    year: vehicle?.year || "",
    licensePlate: vehicle?.licensePlate || "",
    vin: vehicle?.vin || "",
    color: vehicle?.color || "",
  })

  const [newPhoto, setNewPhoto] = useState(null)
  const [preview, setPreview] = useState(null)
  const [errorMsg, setErrorMsg] = useState("")

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleFileChange = (e) => {
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
    if (preview) URL.revokeObjectURL(preview)

    setErrorMsg("")
    setNewPhoto(file)
    setPreview(URL.createObjectURL(file))
  }

  const cleanupPreview = () => {
    if (preview) URL.revokeObjectURL(preview)
  }

  const handleClose = () => {
    cleanupPreview()
    onClose()
  }

  const handleRemovePhoto = async () => {
    try {
      await deletePhoto(vehicle.id).unwrap()
    } catch (err) {
      setErrorMsg(err.data?.message || "Impossibile rimuovere la foto.")
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg("")
    try {
      await updateVehicle({
        vehicleId: vehicle.id,
        nickname: form.nickname || null,
        year: Number(form.year),
        licensePlate: form.licensePlate
          ? form.licensePlate.toUpperCase()
          : null,
        vin: form.vin ? form.vin.toUpperCase() : null,
        color: form.color || null,
      }).unwrap()
      if (newPhoto) {
        await updatePhoto({ vehicleId: vehicle.id, photo: newPhoto }).unwrap()
      }
      handleClose()
    } catch (err) {
      setErrorMsg(err.data?.message || "Errore durante il salvataggio.")
    }
  }

  if (!vehicle) return null

  const isBusy = isSaving || isUploading || isRemoving
  const currentImage = preview || vehicle?.photoUrl

  return (
    <div className="sheet-overlay" onClick={handleClose}>
      <div className="sheet-panel" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="sheet-header">
            <button type="button" className="btn-icon" onClick={handleClose}>
              <FaTimes />
            </button>
            <div className="sheet-header__title">
              {vehicle.model.brand.name} {vehicle.model.name}
            </div>
            <button
              type="submit"
              className="sheet-save-btn"
              disabled={isBusy}
              style={{ opacity: isBusy ? 0.5 : 1 }}
            >
              {isSaving || isUploading ? "..." : "SALVA"}
            </button>
          </div>

          <div className="sheet-body">
            <div>
              <div className="field-label form-group__label">FOTO</div>

              {currentImage ? (
                <div className="photo-field__preview">
                  <img src={currentImage} alt="" />
                </div>
              ) : (
                <div className="photo-field__placeholder">
                  <span className="photo-field__placeholder-text">
                    NESSUNA FOTO
                  </span>
                </div>
              )}

              <div className="photo-field__actions">
                <label className="btn-secondary photo-field__change-label">
                  {currentImage ? "CAMBIA FOTO" : "AGGIUNGI FOTO"}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleFileChange}
                  />
                </label>
                {vehicle.photoUrl && !newPhoto && (
                  <button
                    type="button"
                    className="photo-field__remove-btn"
                    disabled={isBusy}
                    style={{ opacity: isBusy ? 0.5 : 1 }}
                    onClick={handleRemovePhoto}
                  >
                    <FaTrash size={10} /> {isRemoving ? "..." : "RIMUOVI"}
                  </button>
                )}
              </div>

              {preview && (
                <div className="photo-field__hint">
                  Nuova foto selezionata — verrà caricata al salvataggio.
                </div>
              )}
            </div>

            <div>
              <div className="field-label form-group__label">SOPRANNOME</div>
              <input
                type="text"
                className="input"
                value={form.nickname}
                onChange={set("nickname")}
              />
            </div>

            <div className="field-row">
              <div className="field-col">
                <div className="field-label form-group__label">ANNO</div>
                <input
                  type="number"
                  className="input"
                  value={form.year}
                  min={vehicle.model.yearStart}
                  max={vehicle.model.yearEnd || new Date().getFullYear()}
                  onChange={set("year")}
                />
              </div>
              <div className="field-col">
                <div className="field-label form-group__label">COLORE</div>
                <input
                  type="text"
                  className="input"
                  value={form.color}
                  onChange={set("color")}
                />
              </div>
            </div>

            <div>
              <div className="field-label form-group__label">TARGA</div>
              <input
                type="text"
                className="input"
                style={{ textTransform: "uppercase" }}
                value={form.licensePlate}
                onChange={set("licensePlate")}
              />
            </div>

            <div>
              <div className="field-label form-group__label">
                NUMERO DI TELAIO (VIN)
              </div>
              <input
                type="text"
                className="input"
                maxLength={17}
                style={{
                  textTransform: "uppercase",
                  fontFamily: "var(--font-mono)",
                }}
                value={form.vin}
                onChange={set("vin")}
              />
            </div>

            {errorMsg && <div className="error-text">{errorMsg}</div>}
          </div>
        </form>
      </div>
    </div>
  )
}

export default VehicleEditModal
