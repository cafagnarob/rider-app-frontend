import { useState } from "react"
import {
  useDeleteVehiclePhotoMutation,
  useUpdateVehicleMutation,
  useUpdateVehiclePhotoMutation,
} from "../vehiclesApi"
import { COLORS, FONTS, styles } from "../../../styles/theme"
import { FaTimes, FaTrash } from "react-icons/fa"

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
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(6,6,7,.72)",
        zIndex: 200,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          maxHeight: "92vh",
          overflowY: "auto",
          background: COLORS.bg,
          borderRadius: "24px 24px 0 0",
          border: `1px solid ${COLORS.borderSoft}`,
          borderBottom: "none",
        }}
      >
        <form onSubmit={handleSubmit}>
          <div
            style={{
              position: "sticky",
              top: 0,
              background: COLORS.bg,
              zIndex: 2,
              borderBottom: `1px solid ${COLORS.borderSoft}`,
              padding: "20px 20px 14px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <button
              type="button"
              onClick={handleClose}
              style={styles.iconButton}
            >
              <FaTimes />
            </button>
            <div
              style={{
                flex: 1,
                ...styles.pageTitle,
                fontSize: 20,
                lineHeight: 1.15,
              }}
            >
              {vehicle.model.brand.name} {vehicle.model.name}
            </div>
            <button
              type="submit"
              disabled={isBusy}
              style={{
                height: 40,
                padding: "0 16px",
                borderRadius: 13,
                background: COLORS.accent,
                border: "none",
                color: COLORS.onAccent,
                fontFamily: FONTS.heading,
                fontWeight: 700,
                fontSize: 15,
                letterSpacing: ".05em",
                cursor: "pointer",
                opacity: isBusy ? 0.5 : 1,
              }}
            >
              {isSaving || isUploading ? "..." : "SALVA"}
            </button>
          </div>

          <div
            style={{
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div>
              <div style={{ ...styles.fieldLabel, marginBottom: 8 }}>FOTO</div>

              {currentImage ? (
                <div
                  style={{
                    height: 160,
                    borderRadius: 14,
                    overflow: "hidden",
                    background: COLORS.cardAlt,
                    marginBottom: 10,
                  }}
                >
                  <img
                    src={currentImage}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    height: 100,
                    borderRadius: 14,
                    background: COLORS.card,
                    border: `1px dashed ${COLORS.borderStrong}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 10,
                  }}
                >
                  <span
                    style={{
                      fontFamily: FONTS.mono,
                      fontSize: 11,
                      color: COLORS.textFaint,
                    }}
                  >
                    NESSUNA FOTO
                  </span>
                </div>
              )}

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <label
                  style={{
                    ...styles.secondaryButton,
                    height: 36,
                    padding: "0 14px",
                    fontSize: 12,
                    display: "inline-flex",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                >
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
                    onClick={handleRemovePhoto}
                    disabled={isBusy}
                    style={{
                      height: 36,
                      padding: "0 12px",
                      borderRadius: 10,
                      background: COLORS.dangerBg,
                      border: `1px solid ${COLORS.dangerBorder}`,
                      color: COLORS.danger,
                      fontFamily: FONTS.mono,
                      fontSize: 10,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      opacity: isBusy ? 0.5 : 1,
                    }}
                  >
                    <FaTrash size={10} /> {isRemoving ? "..." : "RIMUOVI"}
                  </button>
                )}
              </div>

              {preview && (
                <div
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 12,
                    color: COLORS.accent,
                    marginTop: 8,
                  }}
                >
                  Nuova foto selezionata — verrà caricata al salvataggio.
                </div>
              )}
            </div>

            <div>
              <div style={{ ...styles.fieldLabel, marginBottom: 8 }}>
                SOPRANNOME
              </div>
              <input
                type="text"
                value={form.nickname}
                onChange={set("nickname")}
                style={styles.input}
              />
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...styles.fieldLabel, marginBottom: 8 }}>
                  ANNO
                </div>
                <input
                  type="number"
                  value={form.year}
                  min={vehicle.model.yearStart}
                  max={vehicle.model.yearEnd || new Date().getFullYear()}
                  onChange={set("year")}
                  style={{ ...styles.input, width: "100%" }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...styles.fieldLabel, marginBottom: 8 }}>
                  COLORE
                </div>
                <input
                  type="text"
                  value={form.color}
                  onChange={set("color")}
                  style={{ ...styles.input, width: "100%" }}
                />
              </div>
            </div>

            <div>
              <div style={{ ...styles.fieldLabel, marginBottom: 8 }}>TARGA</div>
              <input
                type="text"
                value={form.licensePlate}
                onChange={set("licensePlate")}
                style={{ ...styles.input, textTransform: "uppercase" }}
              />
            </div>

            <div>
              <div style={{ ...styles.fieldLabel, marginBottom: 8 }}>
                NUMERO DI TELAIO (VIN)
              </div>
              <input
                type="text"
                maxLength={17}
                value={form.vin}
                onChange={set("vin")}
                style={{
                  ...styles.input,
                  textTransform: "uppercase",
                  fontFamily: FONTS.mono,
                }}
              />
            </div>

            {errorMsg && (
              <div
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 13,
                  color: COLORS.danger,
                }}
              >
                {errorMsg}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default VehicleEditModal
