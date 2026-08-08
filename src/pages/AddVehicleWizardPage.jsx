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
import { COLORS, FONTS, styles } from "../styles/theme"

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
    <div style={{ ...styles.pageBg, paddingTop: 20, paddingBottom: 40 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 20px 8px",
        }}
      >
        <button type="button" onClick={goBack} style={styles.iconButton}>
          <FaArrowLeft />
        </button>
        <div style={{ ...styles.pageTitle, fontSize: 22 }}>AGGIUNGI MOTO</div>
      </div>

      <div style={{ display: "flex", gap: 6, padding: "0 20px 20px" }}>
        {STEPS.map((label, i) => (
          <div key={label} style={{ flex: 1 }}>
            <div
              style={{
                height: 3,
                borderRadius: 2,
                background: i <= step ? COLORS.accent : COLORS.borderSoft,
                marginBottom: 6,
              }}
            />
            <div
              style={{
                fontFamily: FONTS.mono,
                fontSize: 9,
                letterSpacing: ".06em",
                color: i === step ? COLORS.accent : COLORS.textFaint,
              }}
            >
              {i + 1}. {label}
            </div>
          </div>
        ))}
      </div>

      {step === 0 && (
        <div style={{ padding: "0 20px" }}>
          <input
            type="search"
            placeholder="Cerca marca..."
            value={brandSearch}
            onChange={(e) => setBrandSearch(e.target.value)}
            style={{ ...styles.input, height: 46, marginBottom: 16 }}
          />

          {isLoadingBrands ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <Spinner animation="border" style={{ color: COLORS.accent }} />
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 10,
              }}
            >
              {filteredBrands?.map((brand) => (
                <div
                  key={brand.id}
                  onClick={() => handlePickBrand(brand)}
                  style={{
                    ...styles.card,
                    cursor: "pointer",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      aspectRatio: "1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: COLORS.cardAlt,
                      padding: 14,
                    }}
                  >
                    {brand.logoUrl ? (
                      <img
                        src={brand.logoUrl}
                        alt={brand.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          fontFamily: FONTS.heading,
                          fontWeight: 700,
                          fontSize: 26,
                          color: COLORS.textFaint,
                        }}
                      >
                        {brand.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div style={{ padding: "8px 6px", textAlign: "center" }}>
                    <span
                      style={{
                        fontFamily: FONTS.heading,
                        fontWeight: 600,
                        fontSize: 12,
                      }}
                    >
                      {brand.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 1 && (
        <div style={{ padding: "0 20px" }}>
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 10,
              color: COLORS.textMuted,
              marginBottom: 12,
            }}
          >
            {selectedBrand?.name.toUpperCase()}
          </div>
          <input
            type="search"
            placeholder="Cerca modello..."
            value={modelSearch}
            onChange={(e) => setModelSearch(e.target.value)}
            style={{ ...styles.input, height: 46, marginBottom: 16 }}
          />

          {isLoadingModels ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <Spinner animation="border" style={{ color: COLORS.accent }} />
            </div>
          ) : modelsPage?.content.length === 0 ? (
            <p
              style={{
                fontFamily: FONTS.body,
                fontSize: 13,
                color: COLORS.textFaint,
                textAlign: "center",
                padding: 40,
              }}
            >
              Nessun modello trovato.
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              {modelsPage?.content.map((model) => (
                <div
                  key={model.id}
                  onClick={() => handlePickModel(model)}
                  style={{
                    ...styles.card,
                    cursor: "pointer",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{ aspectRatio: "16/10", background: COLORS.cardAlt }}
                  >
                    {model.imageUrl && (
                      <img
                        src={model.imageUrl}
                        alt={model.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    )}
                  </div>
                  <div style={{ padding: "10px 11px" }}>
                    <div
                      style={{
                        fontFamily: FONTS.heading,
                        fontWeight: 600,
                        fontSize: 14,
                      }}
                    >
                      {model.name}
                    </div>
                    <div
                      style={{
                        fontFamily: FONTS.mono,
                        fontSize: 9,
                        color: COLORS.textMuted,
                        marginTop: 4,
                      }}
                    >
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
        <form
          onSubmit={handleSubmit}
          style={{
            padding: "0 20px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div
            style={{
              ...styles.card,
              padding: 14,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                overflow: "hidden",
                background: COLORS.cardAlt,
                flexShrink: 0,
              }}
            >
              {selectedModel.imageUrl && (
                <img
                  src={selectedModel.imageUrl}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              )}
            </div>
            <div>
              <div
                style={{
                  fontFamily: FONTS.heading,
                  fontWeight: 700,
                  fontSize: 16,
                }}
              >
                {selectedBrand?.name} {selectedModel.name}
              </div>
              <div
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 9.5,
                  color: COLORS.textMuted,
                  marginTop: 3,
                }}
              >
                {selectedModel.engineCc} CC
              </div>
            </div>
          </div>

          <div>
            <div style={{ ...styles.fieldLabel, marginBottom: 8 }}>
              FOTO (OPZIONALE)
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 74,
                  height: 74,
                  borderRadius: 14,
                  overflow: "hidden",
                  background: COLORS.cardAlt,
                  flexShrink: 0,
                }}
              >
                {photoPreview && (
                  <img
                    src={photoPreview}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                )}
              </div>
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

          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ ...styles.fieldLabel, marginBottom: 8 }}>ANNO</div>
              <input
                type="number"
                value={form.year}
                min={selectedModel.yearStart}
                max={selectedModel.yearEnd || new Date().getFullYear()}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
                required
                style={{ ...styles.input, width: "100%" }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ ...styles.fieldLabel, marginBottom: 8 }}>
                KM ATTUALI
              </div>
              <input
                type="number"
                min={0}
                value={form.initialMileage}
                onChange={(e) =>
                  setForm({ ...form, initialMileage: e.target.value })
                }
                required
                style={{ ...styles.input, width: "100%" }}
              />
            </div>
          </div>

          <div>
            <div style={{ ...styles.fieldLabel, marginBottom: 8 }}>
              TARGA (OPZIONALE)
            </div>
            <input
              type="text"
              placeholder="AB12345"
              value={form.licensePlate}
              pattern="[A-Za-z]{2}[0-9]{5}"
              title="Formato: due lettere seguite da cinque cifre (es. AB12345)"
              onChange={(e) =>
                setForm({ ...form, licensePlate: e.target.value })
              }
              style={{ ...styles.input, textTransform: "uppercase" }}
            />
          </div>

          <div>
            <div style={{ ...styles.fieldLabel, marginBottom: 8 }}>
              SOPRANNOME (OPZIONALE)
            </div>
            <input
              type="text"
              placeholder="La Rossa"
              value={form.nickname}
              onChange={(e) => setForm({ ...form, nickname: e.target.value })}
              style={styles.input}
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

          <button
            type="submit"
            disabled={isSaving}
            style={{ ...styles.primaryButton, opacity: isSaving ? 0.6 : 1 }}
          >
            {isSaving ? "..." : "AGGIUNGI AL GARAGE"}
          </button>
        </form>
      )}
    </div>
  )
}

export default AddVehicleWizardPage
