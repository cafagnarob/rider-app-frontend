import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  useAddVehicleMutation,
  useGetMyVehiclesQuery,
} from "../../vehicles/vehiclesApi"
import { CATEGORY_LABELS } from "../../../utils/constants"

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

  if (!model) return null

  return (
    <div className="sheet-overlay" onClick={handleClose}>
      <div className="sheet-panel" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header" style={{ display: "block" }}>
          <div
            className="page-title"
            style={{ fontSize: 20, lineHeight: 1.15 }}
          >
            {model.brand?.name} {model.name}
          </div>
        </div>

        <div style={{ padding: 20 }}>
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

          <div
            style={{
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              marginBottom: 16,
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
            {ownedCount > 0 && (
              <span className="meta-badge meta-badge--accent">
                NEL TUO GARAGE ({ownedCount})
              </span>
            )}
          </div>

          <div
            className="stat-grid"
            style={{
              gridTemplateColumns: model.weightKg ? "1fr 1fr 1fr" : "1fr 1fr",
              marginBottom: showForm ? 20 : 4,
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

          {showForm && (
            <form
              onSubmit={handleAdd}
              style={{
                marginTop: 20,
                paddingTop: 18,
                borderTop: "1px solid var(--color-border-soft)",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <div className="field-row">
                <div className="field-col">
                  <div className="field-label form-group__label">ANNO</div>
                  <input
                    type="number"
                    className="input"
                    style={{ width: "100%" }}
                    value={form.year}
                    min={model.yearStart}
                    max={model.yearEnd || new Date().getFullYear()}
                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                    required
                  />
                </div>
                <div className="field-col">
                  <div className="field-label form-group__label">
                    KM ATTUALI
                  </div>
                  <input
                    type="number"
                    className="input"
                    style={{ width: "100%" }}
                    value={form.initialMileage}
                    min={0}
                    onChange={(e) =>
                      setForm({ ...form, initialMileage: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <div className="field-label form-group__label">
                  TARGA (OPZIONALE)
                </div>
                <input
                  type="text"
                  className="input"
                  style={{ textTransform: "uppercase" }}
                  placeholder="AB12345"
                  value={form.licensePlate}
                  pattern="[A-Za-z]{2}[0-9]{5}"
                  title="Formato: due lettere seguite da cinque cifre (es. AB12345)"
                  onChange={(e) =>
                    setForm({ ...form, licensePlate: e.target.value })
                  }
                />
                <div className="duration-hint">FORMATO: AB12345</div>
              </div>

              <div>
                <div className="field-label form-group__label">
                  SOPRANNOME (OPZIONALE)
                </div>
                <input
                  type="text"
                  className="input"
                  placeholder="La Rossa"
                  value={form.nickname}
                  onChange={(e) =>
                    setForm({ ...form, nickname: e.target.value })
                  }
                />
              </div>

              {error && (
                <div className="error-text">
                  {error.data?.message || "Errore durante il salvataggio."}
                </div>
              )}

              <button
                type="submit"
                className="btn-primary"
                disabled={isAdding}
                style={{ opacity: isAdding ? 0.6 : 1 }}
              >
                {isAdding ? "..." : "CONFERMA"}
              </button>
            </form>
          )}
        </div>

        {!showForm && (
          <div className="sheet-footer">
            {ownedCount > 0 && (
              <button
                type="button"
                className="btn-secondary"
                style={{ flex: 1 }}
                onClick={() => navigate("/garage")}
              >
                VAI AL GARAGE
              </button>
            )}
            <button
              type="button"
              className="btn-primary"
              style={{
                flex: ownedCount > 0 ? 1 : undefined,
                width: ownedCount > 0 ? undefined : "100%",
              }}
              onClick={() => setShowForm(true)}
            >
              AGGIUNGI AL GARAGE
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ModelDetailModal
