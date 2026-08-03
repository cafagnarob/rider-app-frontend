import { Badge, Button, Form, Modal } from "react-bootstrap"
import { CATEGORY_LABELS } from "../../../utils/constants"
import { useNavigate } from "react-router-dom"
import {
  useAddVehicleMutation,
  useGetMyVehiclesQuery,
} from "../../vehicles/vehiclesApi"
import { useState } from "react"

function ModelDetailModal({ model, onClose }) {
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    year: "",
    initialMileage: "",
    nickname: "",
    licensePlate: "",
  })

  const { data: myVehicles } = useGetMyVehiclesQuery()
  const [addVehicle, { isLoading: isAdding, error }] = useAddVehicleMutation()

  const ownedCount =
    myVehicles?.filter((v) => v.model.id === model?.id).length || 0

  const handleClose = () => {
    setShowForm(false)
    setForm({ year: "", initialMileage: "", nickname: "", licensePlate: "" })
    onClose()
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    try {
      await addVehicle({
        data: {
          modelId: model.id,
          nickname: form.nickname || null,
          year: Number(form.year),
          initialMileage: Number(form.initialMileage),
          licensePlate: form.licensePlate
            ? form.licensePlate.toUpperCase()
            : null,
        },
      }).unwrap()
      handleClose()
    } catch (err) {
      console.error("Aggiunta veicolo fallita:", err)
    }
  }

  return (
    <Modal show={!!model} onHide={handleClose} centered data-bs-theme="dark">
      {model && (
        <>
          <Modal.Header
            closeButton
            className="bg-dark text-light border-secondary"
          >
            <Modal.Title className="fs-5">
              {model.brand?.name} {model.name}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body className="bg-dark text-light">
            {model.imageUrl && (
              <div className="ratio ratio-16x9 mb-3">
                <img
                  src={model.imageUrl}
                  alt={model.name}
                  style={{ objectFit: "cover", borderRadius: "0.5rem" }}
                />
              </div>
            )}

            <div className="d-flex gap-2 flex-wrap mb-3">
              <Badge bg="secondary">
                {CATEGORY_LABELS[model.category] || model.category}
              </Badge>
              <Badge bg="secondary">
                {model.yearEnd
                  ? `${model.yearStart} – ${model.yearEnd}`
                  : `dal ${model.yearStart}`}
              </Badge>
              {ownedCount > 0 && (
                <Badge bg="warning" text="dark">
                  Nel tuo garage ({ownedCount})
                </Badge>
              )}
            </div>

            <dl className="row mb-0">
              <dt className="col-6 text-secondary fw-normal">Cilindrata</dt>
              <dd className="col-6 text-end">{model.engineCc} cc</dd>

              <dt className="col-6 text-secondary fw-normal">Potenza</dt>
              <dd className="col-6 text-end">{model.horsePower} CV</dd>

              {model.weightKg && (
                <>
                  <dt className="col-6 text-secondary fw-normal">Peso</dt>
                  <dd className="col-6 text-end">{model.weightKg} kg</dd>
                </>
              )}
            </dl>
            {showForm && (
              <Form
                onSubmit={handleAdd}
                className="mt-4 pt-3 border-top border-secondary"
              >
                <div className="row">
                  <div className="col-6">
                    <Form.Group className="mb-3">
                      <Form.Label>Anno</Form.Label>
                      <Form.Control
                        type="number"
                        className="bg-transparent"
                        value={form.year}
                        min={model.yearStart}
                        max={model.yearEnd || new Date().getFullYear()}
                        onChange={(e) =>
                          setForm({ ...form, year: e.target.value })
                        }
                        required
                      />
                    </Form.Group>
                  </div>
                  <div className="col-6">
                    <Form.Group className="mb-3">
                      <Form.Label>Km attuali</Form.Label>
                      <Form.Control
                        type="number"
                        className="bg-transparent"
                        value={form.initialMileage}
                        min={0}
                        onChange={(e) =>
                          setForm({ ...form, initialMileage: e.target.value })
                        }
                        required
                      />
                    </Form.Group>
                  </div>
                </div>

                <Form.Group className="mb-3">
                  <Form.Label>Targa (opzionale)</Form.Label>
                  <Form.Control
                    type="text"
                    className="bg-transparent text-uppercase"
                    placeholder="AB12345"
                    value={form.licensePlate}
                    pattern="[A-Za-z]{2}[0-9]{5}"
                    title="Formato: due lettere seguite da cinque cifre (es. AB12345)"
                    onChange={(e) =>
                      setForm({ ...form, licensePlate: e.target.value })
                    }
                  />
                  <Form.Text className="text-secondary">
                    Formato: AB12345
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Soprannome (opzionale)</Form.Label>
                  <Form.Control
                    type="text"
                    className="bg-transparent"
                    placeholder="La Rossa"
                    value={form.nickname}
                    onChange={(e) =>
                      setForm({ ...form, nickname: e.target.value })
                    }
                  />
                </Form.Group>

                {error && (
                  <div className="alert alert-danger py-2">
                    {error.data?.message || "Errore durante il salvataggio."}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isAdding}
                  className="w-100 rounded-pill fw-bold border-0"
                  style={{ backgroundColor: "#FFBE5D", color: "#000" }}
                >
                  {isAdding ? "Salvataggio..." : "Conferma"}
                </Button>
              </Form>
            )}
          </Modal.Body>

          {!showForm && (
            <Modal.Footer className="bg-dark border-secondary">
              {ownedCount > 0 && (
                <Button
                  variant="outline-light"
                  onClick={() => navigate("/garage")}
                >
                  Vai al garage
                </Button>
              )}

              <Button
                className="rounded-pill px-4 fw-bold border-0"
                style={{ backgroundColor: "#FFBE5D", color: "#000" }}
                onClick={() => setShowForm(true)}
              >
                Aggiungi al garage
              </Button>
            </Modal.Footer>
          )}
        </>
      )}
    </Modal>
  )
}

export default ModelDetailModal
