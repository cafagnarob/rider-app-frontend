import { useParams, useNavigate } from "react-router-dom"
import { Spinner } from "react-bootstrap"
import { FaArrowLeft } from "react-icons/fa"
import { useGetModelByIdQuery } from "../features/catalog/catalogApi"
import { CATEGORY_LABELS } from "../utils/constants"

function ModelDetailPage() {
  const { modelId } = useParams()
  const navigate = useNavigate()
  const { data: model, isLoading, isError } = useGetModelByIdQuery(modelId)

  if (isLoading) {
    return (
      <div className="centered-spinner">
        <Spinner animation="border" style={{ color: "#FF7A2F" }} />
      </div>
    )
  }

  if (isError || !model) {
    return (
      <div className="empty-state" style={{ margin: 20 }}>
        Modello non trovato.
      </div>
    )
  }

  return (
    <div className="page">
      <div className="icon-header">
        <button type="button" className="btn-icon" onClick={() => navigate(-1)}>
          <FaArrowLeft />
        </button>
      </div>

      <div className="px-20">
        {model.imageUrl && (
          <div
            style={{
              aspectRatio: "16/9",
              borderRadius: 16,
              overflow: "hidden",
              background: "var(--color-card-alt)",
              marginBottom: 16,
            }}
          >
            <img
              src={model.imageUrl}
              alt={model.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        )}

        <div className="page-title" style={{ marginBottom: 4 }}>
          {model.brand?.name} {model.name}
        </div>

        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            margin: "12px 0 20px",
          }}
        >
          <span className="meta-badge">
            {CATEGORY_LABELS[model.category] || model.category}
          </span>
          <span className="meta-badge">
            {model.yearEnd
              ? `${model.yearStart} – ${model.yearEnd}`
              : `DAL ${model.yearStart}`}
          </span>
        </div>

        <div
          className="stat-grid"
          style={{
            gridTemplateColumns: model.weightKg ? "1fr 1fr 1fr" : "1fr 1fr",
          }}
        >
          <div className="stat-cell">
            <span className="stat-label">CILINDRATA</span>
            <span className="stat-value" style={{ fontSize: 17 }}>
              {model.engineCc} CC
            </span>
          </div>
          <div className="stat-cell">
            <span className="stat-label">POTENZA</span>
            <span className="stat-value" style={{ fontSize: 17 }}>
              {model.horsePower} CV
            </span>
          </div>
          {model.weightKg && (
            <div className="stat-cell">
              <span className="stat-label">PESO</span>
              <span className="stat-value" style={{ fontSize: 17 }}>
                {model.weightKg} KG
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ModelDetailPage
