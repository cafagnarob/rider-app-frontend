import { useState } from "react"
import { Button, Form, Modal, Spinner } from "react-bootstrap"
import {
  useDeleteVehiclePhotoMutation,
  useUpdateVehicleMutation,
  useUpdateVehiclePhotoMutation,
} from "../vehiclesApi"

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

  const isBusy = isSaving || isUploading || isRemoving
  const currentImage = preview || vehicle?.photoUrl

  return (
    <Modal show={!!vehicle} onHide={onClose} centered data-bs-theme="dark">
      {vehicle && (
        <Form onSubmit={handleSubmit}>
          <Modal.Header
            closeButton
            className="bg-dark text-light border-secondary"
          >
            <Modal.Title className="fs-5">
              Modifica {vehicle.model.brand.name} {vehicle.model.name}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body className="bg-dark text-light">
            <div className="mb-3">
              {currentImage ? (
                <div className="ratio ratio-16x9 mb-2">
                  <img
                    src={currentImage}
                    alt="Foto veicolo"
                    style={{ objectFit: "cover", borderRadius: "0.5rem" }}
                  />
                </div>
              ) : (
                <div
                  className="d-flex align-items-center justify-content-center border border-secondary rounded mb-2"
                  style={{ height: "140px" }}
                >
                  <span className="text-secondary small">Nessuna foto</span>
                </div>
              )}

              <div className="d-flex gap-2 align-items-center">
                <Form.Control
                  type="file"
                  accept="image/*"
                  size="sm"
                  className="bg-transparent"
                  onChange={handleFileChange}
                />
                {vehicle.photoUrl && !newPhoto && (
                  <Button
                    variant="outline-danger"
                    size="sm"
                    disabled={isBusy}
                    onClick={handleRemovePhoto}
                  >
                    {isRemoving ? (
                      <Spinner size="sm" animation="border" />
                    ) : (
                      "Rimuovi"
                    )}
                  </Button>
                )}
              </div>
              {preview && (
                <Form.Text className="text-warning">
                  Nuova foto selezionata — verrà caricata al salvataggio.
                </Form.Text>
              )}
            </div>

            <Form.Group className="mb-3">
              <Form.Label>Soprannome</Form.Label>
              <Form.Control
                type="text"
                className="bg-transparent"
                value={form.nickname}
                onChange={(e) => setForm({ ...form, nickname: e.target.value })}
              />
            </Form.Group>

            <div className="row">
              <div className="col-6">
                <Form.Group className="mb-3">
                  <Form.Label>Anno</Form.Label>
                  <Form.Control
                    type="number"
                    className="bg-transparent"
                    value={form.year}
                    min={vehicle.model.yearStart}
                    max={vehicle.model.yearEnd || new Date().getFullYear()}
                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                  />
                </Form.Group>
              </div>
              <div className="col-6">
                <Form.Group className="mb-3">
                  <Form.Label>Colore</Form.Label>
                  <Form.Control
                    type="text"
                    className="bg-transparent"
                    value={form.color}
                    onChange={(e) =>
                      setForm({ ...form, color: e.target.value })
                    }
                  />
                </Form.Group>
              </div>
            </div>

            <Form.Group className="mb-3">
              <Form.Label>Targa</Form.Label>
              <Form.Control
                type="text"
                className="bg-transparent text-uppercase"
                value={form.licensePlate}
                onChange={(e) =>
                  setForm({ ...form, licensePlate: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Numero di telaio (VIN)</Form.Label>
              <Form.Control
                type="text"
                className="bg-transparent text-uppercase font-monospace"
                maxLength={17}
                value={form.vin}
                onChange={(e) => setForm({ ...form, vin: e.target.value })}
              />
            </Form.Group>

            {errorMsg && (
              <div className="alert alert-danger py-2">{errorMsg}</div>
            )}
          </Modal.Body>

          <Modal.Footer className="bg-dark border-secondary">
            <Button
              variant="outline-light"
              onClick={handleClose}
              disabled={isBusy}
            >
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={isBusy}
              className="rounded-pill px-4 fw-bold border-0"
              style={{ backgroundColor: "#FFBE5D", color: "#000" }}
            >
              {isBusy ? "Salvataggio..." : "Salva"}
            </Button>
          </Modal.Footer>
        </Form>
      )}
    </Modal>
  )
}

export default VehicleEditModal
