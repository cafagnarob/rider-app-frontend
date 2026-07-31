import { Badge, Button, Modal } from "react-bootstrap"
import { CATEGORY_LABELS } from "../../../utils/constants"

function ModelDetailModal({ model, onClose }) {
  return (
    <Modal show={!!model} onHide={onClose} centered data-bs-theme="dark">
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
          </Modal.Body>

          <Modal.Footer className="bg-dark border-secondary">
            <Button variant="outline-light" onClick={onClose}>
              Chiudi
            </Button>
            <Button
              className="rounded-pill px-4 fw-bold border-0"
              style={{ backgroundColor: "#FFBE5D", color: "#000" }}
              onClick={() => console.log("Aggiungi al garage:", model.id)}
            >
              Aggiungi al garage
            </Button>
          </Modal.Footer>
        </>
      )}
    </Modal>
  )
}

export default ModelDetailModal
