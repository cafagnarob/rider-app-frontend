import { useState } from "react"
import { Badge, Button, Card, Spinner } from "react-bootstrap"
import { useNavigate, useParams } from "react-router-dom"
import ModelDetailModal from "../features/catalog/components/ModelDetailModal"
import {
  useGetBrandsQuery,
  useGetModelsQuery,
} from "../features/catalog/catalogApi"
import { CATEGORY_LABELS } from "../utils/constants"

function ModelsPage() {
  const { brandId } = useParams()
  const navigate = useNavigate()

  const [page, setPage] = useState(0)
  const [selectedModel, setSelectedModel] = useState(null)

  const {
    data: pageData,
    isLoading,
    isFetching,
    isError,
  } = useGetModelsQuery({ brandId, page })
  const { data: brands } = useGetBrandsQuery()

  const brand = brands?.find((b) => b.id === brandId)

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="light" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="alert alert-danger">Impossibile caricare i modelli.</div>
    )
  }

  return (
    <>
      <div className="d-flex align-items-center gap-3 mb-4">
        <Button
          variant="outline-light"
          size="sm"
          onClick={() => navigate("/catalog")}
        >
          ← Indietro
        </Button>
        <h2 className="mb-0">{brand?.name || "Modelli"}</h2>
      </div>

      {pageData.content.length === 0 ? (
        <p className="text-secondary">
          Nessun modello disponibile per questo brand.
        </p>
      ) : (
        <div className="row g-3" style={{ opacity: isFetching ? 0.5 : 1 }}>
          {pageData.content.map((model) => (
            <div className="col-12 col-md-6 col-lg-4" key={model.id}>
              <Card
                className="bg-dark text-light h-100 border-secondary"
                style={{ cursor: "pointer" }}
                onClick={() => setSelectedModel(model)}
              >
                {model.imageUrl && (
                  <div className="ratio ratio-16x9">
                    <img
                      src={model.imageUrl}
                      alt={model.name}
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                )}
                <Card.Body>
                  <Card.Title className="fs-6">{model.name}</Card.Title>
                  <div className="d-flex gap-2 flex-wrap">
                    <Badge bg="secondary">{model.engineCc} cc</Badge>
                    <Badge bg="secondary">
                      {CATEGORY_LABELS[model.category] || model.category}
                    </Badge>
                  </div>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
      )}

      {pageData.totalPages > 1 && (
        <div className="d-flex justify-content-center align-items-center gap-3 mt-4">
          <Button
            variant="outline-light"
            size="sm"
            disabled={pageData.first || isFetching}
            onClick={() => setPage((p) => p - 1)}
          >
            Precedente
          </Button>
          <span className="text-secondary">
            Pagina {pageData.number + 1} di {pageData.totalPages}
          </span>
          <Button
            variant="outline-light"
            size="sm"
            disabled={pageData.last || isFetching}
            onClick={() => setPage((p) => p + 1)}
          >
            Successiva
          </Button>
        </div>
      )}

      <ModelDetailModal
        model={selectedModel}
        onClose={() => setSelectedModel(null)}
      />
    </>
  )
}

export default ModelsPage
