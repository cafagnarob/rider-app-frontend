import { Badge, Button, Card, Modal, Spinner } from "react-bootstrap"
import { Link } from "react-router-dom"
import { CATEGORY_LABELS } from "../utils/constants"
import VehicleEditModal from "../features/vehicles/component/VehicleEditModal"
import {
  useDeleteVehicleMutation,
  useGetMyVehiclesQuery,
} from "../features/vehicles/vehiclesApi"
import { useState } from "react"

function GaragePage() {
  const { data: vehicles, isLoading, isError } = useGetMyVehiclesQuery()
  const [deleteVehicle, { isLoading: isDeleting }] = useDeleteVehicleMutation()

  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const handleDelete = async () => {
    try {
      await deleteVehicle(confirmDelete.id).unwrap()
      setConfirmDelete(null)
    } catch (err) {
      console.error("Eliminazione fallita:", err)
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="light" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="alert alert-danger">Impossibile caricare il garage.</div>
    )
  }

  if (vehicles.length === 0) {
    return (
      <div className="text-center py-5">
        <h2 className="mb-3">Il tuo garage è vuoto</h2>
        <p className="text-secondary mb-4">
          Aggiungi la tua prima moto scegliendola dal catalogo.
        </p>
        <Link to="/catalog">
          <Button
            className="rounded-pill px-4 fw-bold border-0"
            style={{ backgroundColor: "#FFBE5D", color: "#000" }}
          >
            Vai al catalogo
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Il mio garage</h2>
        <Link to="/catalog">
          <Button variant="outline-light" size="sm">
            + Aggiungi moto
          </Button>
        </Link>
      </div>

      <div className="row g-3">
        {vehicles.map((vehicle) => (
          <div className="col-12 col-md-6" key={vehicle.id}>
            <Card className="bg-dark text-light h-100 border-secondary">
              {(vehicle.photoUrl || vehicle.model.imageUrl) && (
                <div className="ratio ratio-16x9">
                  <img
                    src={vehicle.photoUrl || vehicle.model.imageUrl}
                    alt={vehicle.model.name}
                    style={{ objectFit: "cover" }}
                  />
                </div>
              )}

              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <Card.Title className="fs-6 mb-1">
                      {vehicle.nickname ||
                        `${vehicle.model.brand.name} ${vehicle.model.name}`}
                    </Card.Title>
                    {vehicle.nickname && (
                      <p className="text-secondary small mb-2">
                        {vehicle.model.brand.name} {vehicle.model.name}
                      </p>
                    )}
                  </div>
                  {vehicle.licensePlate && (
                    <Badge bg="light" text="dark" className="font-monospace">
                      {vehicle.licensePlate}
                    </Badge>
                  )}
                </div>

                <div className="d-flex gap-2 flex-wrap mb-3">
                  <Badge bg="secondary">{vehicle.year}</Badge>
                  <Badge bg="secondary">{vehicle.model.engineCc} cc</Badge>
                  <Badge bg="secondary">
                    {CATEGORY_LABELS[vehicle.model.category] ||
                      vehicle.model.category}
                  </Badge>
                  <Badge bg="secondary">
                    {vehicle.currentMileage.toLocaleString("it-IT")} km
                  </Badge>
                </div>

                <div className="d-flex gap-2">
                  <Button
                    variant="outline-light"
                    size="sm"
                    onClick={() => setEditing(vehicle)}
                  >
                    Modifica
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => setConfirmDelete(vehicle)}
                  >
                    Elimina
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </div>
        ))}
      </div>

      <VehicleEditModal
        key={editing?.id}
        vehicle={editing}
        onClose={() => setEditing(null)}
      />

      <Modal
        show={!!confirmDelete}
        onHide={() => setConfirmDelete(null)}
        centered
        data-bs-theme="dark"
      >
        <Modal.Header
          closeButton
          className="bg-dark text-light border-secondary"
        >
          <Modal.Title className="fs-5">Eliminare il veicolo?</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark text-light">
          Stai per eliminare{" "}
          <strong>
            {confirmDelete?.nickname ||
              `${confirmDelete?.model.brand.name} ${confirmDelete?.model.name}`}
          </strong>
          . I giri già registrati con questa moto verranno mantenuti, ma non
          saranno più collegati ad alcun veicolo. L'operazione non è
          reversibile.
        </Modal.Body>
        <Modal.Footer className="bg-dark border-secondary">
          <Button
            variant="outline-light"
            onClick={() => setConfirmDelete(null)}
          >
            Annulla
          </Button>
          <Button variant="danger" disabled={isDeleting} onClick={handleDelete}>
            {isDeleting ? "Eliminazione..." : "Elimina"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}
export default GaragePage
