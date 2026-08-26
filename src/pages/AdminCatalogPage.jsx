import { useState } from "react"
import { useGetBrandsQuery } from "../features/catalog/catalogApi"
import {
  useCreateAdminBrandMutation,
  useCreateAdminModelMutation,
} from "../features/auth/adminApi"
import { CATEGORY_LABELS } from "../utils/constants"

const emptyModelForm = {
  brandId: "",
  name: "",
  engineCc: "",
  category: Object.keys(CATEGORY_LABELS)[0] || "",
  yearStart: new Date().getFullYear(),
  yearEnd: "",
  horsePower: "",
  weightKg: "",
}

function AdminBrandForm() {
  const [name, setName] = useState("")
  const [logo, setLogo] = useState(null)
  const [errorMsg, setErrorMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")
  const [createBrand, { isLoading }] = useCreateAdminBrandMutation()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg("")
    setSuccessMsg("")
    if (!logo) {
      setErrorMsg("Il logo è obbligatorio.")
      return
    }
    try {
      const created = await createBrand({ name, logo }).unwrap()
      setSuccessMsg(`Brand "${created.name}" creato.`)
      setName("")
      setLogo(null)
      e.target.reset()
    } catch (err) {
      setErrorMsg(err.data?.message || "Errore durante la creazione.")
    }
  }

  return (
    <form className="form-stack admin-catalog-form" onSubmit={handleSubmit}>
      <div>
        <div className="field-label form-group__label">NOME BRAND</div>
        <input
          type="text"
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <div className="field-label form-group__label">LOGO</div>
        <input
          type="file"
          accept="image/*"
          className="admin-file-input"
          onChange={(e) => setLogo(e.target.files?.[0] || null)}
          required
        />
      </div>
      {errorMsg && <div className="error-text">{errorMsg}</div>}
      {successMsg && (
        <div className="admin-feedback--success">{successMsg}</div>
      )}
      <button
        type="submit"
        className="btn-primary"
        disabled={isLoading}
        style={{ opacity: isLoading ? 0.6 : 1 }}
      >
        {isLoading ? "..." : "CREA BRAND"}
      </button>
    </form>
  )
}

function AdminModelForm() {
  const { data: brands } = useGetBrandsQuery()
  const [form, setForm] = useState(emptyModelForm)
  const [image, setImage] = useState(null)
  const [errorMsg, setErrorMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")
  const [createModel, { isLoading }] = useCreateAdminModelMutation()

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg("")
    setSuccessMsg("")
    try {
      const created = await createModel({
        data: {
          brandId: form.brandId,
          name: form.name,
          engineCc: Number(form.engineCc),
          category: form.category,
          yearStart: Number(form.yearStart),
          yearEnd: form.yearEnd ? Number(form.yearEnd) : null,
          horsePower: Number(form.horsePower),
          weightKg: form.weightKg ? Number(form.weightKg) : null,
        },
        image,
      }).unwrap()
      setSuccessMsg(`Modello "${created.name}" creato.`)
      setForm(emptyModelForm)
      setImage(null)
      e.target.reset()
    } catch (err) {
      setErrorMsg(err.data?.message || "Errore durante la creazione.")
    }
  }

  return (
    <form className="form-stack admin-catalog-form" onSubmit={handleSubmit}>
      <div>
        <div className="field-label form-group__label">BRAND</div>
        <select
          className="select"
          value={form.brandId}
          onChange={set("brandId")}
          required
        >
          <option value="">Seleziona un brand</option>
          {brands?.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="field-label form-group__label">NOME MODELLO</div>
        <input
          type="text"
          className="input"
          value={form.name}
          onChange={set("name")}
          required
        />
      </div>

      <div className="field-row">
        <div className="field-col">
          <div className="field-label form-group__label">CILINDRATA (CC)</div>
          <input
            type="number"
            className="input"
            value={form.engineCc}
            onChange={set("engineCc")}
            required
          />
        </div>
        <div className="field-col">
          <div className="field-label form-group__label">POTENZA (CV)</div>
          <input
            type="number"
            className="input"
            value={form.horsePower}
            onChange={set("horsePower")}
            required
          />
        </div>
      </div>

      <div>
        <div className="field-label form-group__label">CATEGORIA</div>
        <select
          className="select"
          value={form.category}
          onChange={set("category")}
          required
        >
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="field-row">
        <div className="field-col">
          <div className="field-label form-group__label">ANNO INIZIO</div>
          <input
            type="number"
            className="input"
            value={form.yearStart}
            onChange={set("yearStart")}
            required
          />
        </div>
        <div className="field-col">
          <div className="field-label form-group__label">
            ANNO FINE (OPZIONALE)
          </div>
          <input
            type="number"
            className="input"
            value={form.yearEnd}
            onChange={set("yearEnd")}
            placeholder="In produzione"
          />
        </div>
      </div>

      <div>
        <div className="field-label form-group__label">PESO KG (OPZIONALE)</div>
        <input
          type="number"
          className="input"
          value={form.weightKg}
          onChange={set("weightKg")}
        />
      </div>

      <div>
        <div className="field-label form-group__label">
          IMMAGINE (OPZIONALE)
        </div>
        <input
          type="file"
          accept="image/*"
          className="admin-file-input"
          onChange={(e) => setImage(e.target.files?.[0] || null)}
        />
      </div>

      {errorMsg && <div className="error-text">{errorMsg}</div>}
      {successMsg && (
        <div className="admin-feedback--success">{successMsg}</div>
      )}

      <button
        type="submit"
        className="btn-primary"
        disabled={isLoading}
        style={{ opacity: isLoading ? 0.6 : 1 }}
      >
        {isLoading ? "..." : "CREA MODELLO"}
      </button>
    </form>
  )
}

function AdminCatalogPage() {
  const [tab, setTab] = useState("brand")

  return (
    <div>
      <div className="page-title" style={{ fontSize: 26, marginBottom: 20 }}>
        CATALOGO
      </div>

      <div className="tab-pills admin-catalog-page__tabs">
        <button
          type="button"
          className={`tab-pill ${tab === "brand" ? "tab-pill--active" : ""}`}
          onClick={() => setTab("brand")}
        >
          NUOVO BRAND
        </button>
        <button
          type="button"
          className={`tab-pill ${tab === "model" ? "tab-pill--active" : ""}`}
          onClick={() => setTab("model")}
        >
          NUOVO MODELLO
        </button>
      </div>

      {tab === "brand" ? <AdminBrandForm /> : <AdminModelForm />}
    </div>
  )
}

export default AdminCatalogPage
