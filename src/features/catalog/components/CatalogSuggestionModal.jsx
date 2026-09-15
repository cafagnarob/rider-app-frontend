import { useState } from "react"
import { useSubmitCatalogSuggestionMutation } from "../catalogApi"
import { CATEGORY_LABELS } from "../../../utils/constants"

function CatalogSuggestionModal({ onClose }) {
  const [submitSuggestion, { isLoading }] = useSubmitCatalogSuggestionMutation()
  const [form, setForm] = useState({
    brandName: "",
    modelName: "",
    engineCc: "",
    category: "",
    yearStart: "",
    yearEnd: "",
    horsePower: "",
    weightKg: "",
    note: "",
  })
  const [errorMsg, setErrorMsg] = useState("")
  const [sent, setSent] = useState(false)

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg("")
    try {
      await submitSuggestion({
        brandName: form.brandName,
        modelName: form.modelName || null,
        engineCc: form.engineCc ? Number(form.engineCc) : null,
        category: form.category || null,
        yearStart: form.yearStart ? Number(form.yearStart) : null,
        yearEnd: form.yearEnd ? Number(form.yearEnd) : null,
        horsePower: form.horsePower ? Number(form.horsePower) : null,
        weightKg: form.weightKg ? Number(form.weightKg) : null,
        note: form.note || null,
      }).unwrap()
      setSent(true)
    } catch (err) {
      setErrorMsg(err.data?.message || "Impossibile inviare la segnalazione.")
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="card modal-card" onClick={(e) => e.stopPropagation()}>
        {sent ? (
          <>
            <div className="modal-title">SEGNALAZIONE INVIATA</div>
            <p className="modal-text">
              Grazie! Valuteremo di aggiungere il modello al catalogo.
            </p>
            <button
              type="button"
              className="btn-primary"
              style={{ width: "100%" }}
              onClick={onClose}
            >
              CHIUDI
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="modal-title">NON TROVI LA TUA MOTO?</div>
            <p className="modal-text" style={{ marginBottom: 16 }}>
              Compila i campi che conosci, valuteremo di aggiungere il modello
              al catalogo.
            </p>

            <div style={{ marginBottom: 12 }}>
              <div className="field-label form-group__label">BRAND</div>
              <input
                type="text"
                className="input"
                placeholder="Es. Benelli"
                value={form.brandName}
                onChange={set("brandName")}
                required
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <div className="field-label form-group__label">MODELLO</div>
              <input
                type="text"
                className="input"
                placeholder="Es. TRK 502"
                value={form.modelName}
                onChange={set("modelName")}
              />
            </div>

            <div className="field-row" style={{ marginBottom: 12 }}>
              <div className="field-col">
                <div className="field-label form-group__label">
                  CILINDRATA (CC)
                </div>
                <input
                  type="number"
                  className="input"
                  min={0}
                  value={form.engineCc}
                  onChange={set("engineCc")}
                />
              </div>
              <div className="field-col">
                <div className="field-label form-group__label">CATEGORIA</div>
                <select
                  className="select"
                  value={form.category}
                  onChange={set("category")}
                >
                  <option value="">Non so</option>
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field-row" style={{ marginBottom: 12 }}>
              <div className="field-col">
                <div className="field-label form-group__label">ANNO INIZIO</div>
                <input
                  type="number"
                  className="input"
                  placeholder="Es. 2018"
                  value={form.yearStart}
                  onChange={set("yearStart")}
                />
              </div>
              <div className="field-col">
                <div className="field-label form-group__label">ANNO FINE</div>
                <input
                  type="number"
                  className="input"
                  placeholder="Se ancora prodotta, lascia vuoto"
                  value={form.yearEnd}
                  onChange={set("yearEnd")}
                />
              </div>
            </div>

            <div className="field-row" style={{ marginBottom: 12 }}>
              <div className="field-col">
                <div className="field-label form-group__label">
                  POTENZA (CV)
                </div>
                <input
                  type="number"
                  className="input"
                  min={0}
                  value={form.horsePower}
                  onChange={set("horsePower")}
                />
              </div>
              <div className="field-col">
                <div className="field-label form-group__label">PESO (KG)</div>
                <input
                  type="number"
                  className="input"
                  min={0}
                  value={form.weightKg}
                  onChange={set("weightKg")}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div className="field-label form-group__label">
                NOTE (LINK A FOTO, ALTRI DETTAGLI)
              </div>
              <textarea
                className="textarea"
                rows={2}
                value={form.note}
                onChange={set("note")}
              />
            </div>

            {errorMsg && (
              <div className="error-text" style={{ marginBottom: 12 }}>
                {errorMsg}
              </div>
            )}

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>
                ANNULLA
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isLoading}
              >
                {isLoading ? "..." : "INVIA"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default CatalogSuggestionModal
