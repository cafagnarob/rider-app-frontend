import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Spinner } from "react-bootstrap"
import { FaArrowLeft } from "react-icons/fa"
import {
  useGetBrandsQuery,
  useGetModelsQuery,
} from "../features/catalog/catalogApi"
import { useAddVehicleMutation } from "../features/vehicles/vehiclesApi"
import { CATEGORY_LABELS } from "../utils/constants"
import "./AddVehicleWizardPage.css"

const STEPS = ["MARCA", "MODELLO", "DETTAGLI"]

function AddVehicleWizardPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)

  const [brandSearch, setBrandSearch] = useState("")
  const [selectedBrand, setSelectedBrand] = useState(null)

  const [modelSearch, setModelSearch] = useState("")
  const [selectedModel, setSelectedModel] = useState(null)

  const [form, setForm] = useState({
    year: "",
    initialMileage: "",
    nickname: "",
    licensePlate: "",
  })
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [errorMsg, setErrorMsg] = useState("")

  const { data: brands, isLoading: isLoadingBrands } = useGetBrandsQuery()
  const { data: modelsPage, isLoading: isLoadingModels } = useGetModelsQuery(
    {
      brandId: selectedBrand?.id,
      name: modelSearch || undefined,
      page: 0,
      size: 30,
    },
    { skip: !selectedBrand },
  )

  const [addVehicle, { isLoading: isSaving }] = useAddVehicleMutation()

  const filteredBrands = brands?.filter((b) =>
    b.name.toLowerCase().includes(brandSearch.toLowerCase()),
  )

  const handlePickBrand = (brand) => {
    setSelectedBrand(brand)
    setStep(1)
  }

  const handlePickModel = (model) => {
    setSelectedModel(model)
    setForm((prev) => ({ ...prev, year: model.yearStart || "" }))
    setStep(2)
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg("")
    try {
      const created = await addVehicle({
        data: {
          modelId: selectedModel.id,
          nickname: form.nickname || null,
          year: Number(form.year),
          initialMileage: Number(form.initialMileage),
          licensePlate: form.licensePlate
            ? form.licensePlate.toUpperCase()
            : null,
        },
        photo,
      }).unwrap()
      navigate(`/garage/${created.id}`)
    } catch (err) {
      setErrorMsg(err.data?.message || "Impossibile aggiungere il veicolo.")
    }
  }

  const goBack = () => {
    if (step === 0) navigate(-1)
    else setStep((s) => s - 1)
  }

  return (
    <div className="page">
      <div className="wizard-header">
        <button type="button" className="btn-icon" onClick={goBack}>
          <FaArrowLeft />
        </button>
        <div className="wizard-header__title">AGGIUNGI MOTO</div>
      </div>

      <div className="wizard-steps">
        {STEPS.map((label, i) => (
          <div key={label} className="wizard-step">
            <div
              className={`wizard-step__bar ${i <= step ? "wizard-step__bar--done" : ""}`}
            />
            <div
              className={`wizard-step__label ${i === step ? "wizard-step__label--current" : ""}`}
            >
              {i + 1}. {label}
            </div>
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="px-20">
          <input
            type="search"
            className="input search-input"
            placeholder="Cerca marca..."
            value={brandSearch}
            onChange={(e) => setBrandSearch(e.target.value)}
          />

          {isLoadingBrands ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <Spinner animation="border" style={{ color: "#FF7A2F" }} />
            </div>
          ) : (
            <div className="grid-3">
              {filteredBrands?.map((brand) => (
                <div
                  key={brand.id}
                  className="card"
                  style={{ cursor: "pointer", overflow: "hidden" }}
                  onClick={() => handlePickBrand(brand)}
                >
                  <div className="brand-tile__image">
                    {brand.logoUrl ? (
                      <img src={brand.logoUrl} alt={brand.name} />
                    ) : (
                      <span className="brand-tile__fallback">
                        {brand.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="brand-tile__name">
                    <span>{brand.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="px-20">
          <div className="field-label" style={{ marginBottom: 12 }}>
            {selectedBrand?.name.toUpperCase()}
          </div>
          <input
            type="search"
            className="input search-input"
            placeholder="Cerca modello..."
            value={modelSearch}
            onChange={(e) => setModelSearch(e.target.value)}
          />

          {isLoadingModels ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <Spinner animation="border" style={{ color: "#FF7A2F" }} />
            </div>
          ) : modelsPage?.content.length === 0 ? (
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 13,
                color: "var(--color-text-faint)",
                textAlign: "center",
                padding: 40,
              }}
            >
              Nessun modello trovato.
            </p>
          ) : (
            <div className="grid-2">
              {modelsPage?.content.map((model) => (
                <div
                  key={model.id}
                  className="card"
                  style={{ cursor: "pointer", overflow: "hidden" }}
                  onClick={() => handlePickModel(model)}
                >
                  <div className="model-tile__image">
                    {model.imageUrl && (
                      <img src={model.imageUrl} alt={model.name} />
                    )}
                  </div>
                  <div className="model-tile__info">
                    <div className="model-tile__name">{model.name}</div>
                    <div className="model-tile__meta">
                      {model.engineCc} CC ·{" "}
                      {CATEGORY_LABELS[model.category] || model.category}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 2 && selectedModel && (
        <form onSubmit={handleSubmit} className="form-stack px-20">
          <div className="card selected-model-summary">
            <div className="selected-model-summary__thumb">
              {selectedModel.imageUrl && (
                <img src={selectedModel.imageUrl} alt="" />
              )}
            </div>
            <div>
              <div className="selected-model-summary__name">
                {selectedBrand?.name} {selectedModel.name}
              </div>
              <div className="selected-model-summary__meta">
                {selectedModel.engineCc} CC
              </div>
            </div>
          </div>

          <div>
            <div className="field-label form-group__label">
              FOTO (OPZIONALE)
            </div>
            <div className="photo-upload">
              <div className="photo-upload__preview">
                {photoPreview && <img src={photoPreview} alt="" />}
              </div>
              <label className="btn-secondary photo-upload__label">
                {photo ? "CAMBIA FOTO" : "AGGIUNGI FOTO"}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handlePhotoChange}
                />
              </label>
            </div>
          </div>

          <div className="field-row">
            <div className="field-col">
              <div className="field-label form-group__label">ANNO</div>
              <input
                type="number"
                className="input"
                value={form.year}
                min={selectedModel.yearStart}
                max={selectedModel.yearEnd || new Date().getFullYear()}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
                required
              />
            </div>
            <div className="field-col">
              <div className="field-label form-group__label">KM ATTUALI</div>
              <input
                type="number"
                className="input"
                min={0}
                value={form.initialMileage}
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
              placeholder="AB12345"
              value={form.licensePlate}
              pattern="[A-Za-z]{2}[0-9]{5}"
              title="Formato: due lettere seguite da cinque cifre (es. AB12345)"
              onChange={(e) =>
                setForm({ ...form, licensePlate: e.target.value })
              }
              style={{ textTransform: "uppercase" }}
            />
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
              onChange={(e) => setForm({ ...form, nickname: e.target.value })}
            />
          </div>

          {errorMsg && <div className="error-text">{errorMsg}</div>}

          <button type="submit" className="btn-primary" disabled={isSaving}>
            {isSaving ? "..." : "AGGIUNGI AL GARAGE"}
          </button>
        </form>
      )}
    </div>
  )
}

export default AddVehicleWizardPage
