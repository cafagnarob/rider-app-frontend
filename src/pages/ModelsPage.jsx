import { useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Spinner } from "react-bootstrap"
import { FaArrowLeft, FaFilter, FaSortAmountDown } from "react-icons/fa"
import ModelDetailModal from "../features/catalog/components/ModelDetailModal"
import {
  useGetBrandsQuery,
  useGetModelsQuery,
} from "../features/catalog/catalogApi"
import { useGetMyVehiclesQuery } from "../features/vehicles/vehiclesApi"
import { CATEGORY_LABELS, CC_RANGES } from "../utils/constants"
import "../pages/CSS/ModelsPage.css"

const ORDER_OPTIONS = [
  { value: "name", label: "Nome" },
  { value: "engineCc", label: "Cilindrata" },
  { value: "yearStart", label: "Anno" },
  { value: "horsePower", label: "Potenza" },
]

function ModelsPage() {
  const { brandId } = useParams()
  const navigate = useNavigate()

  const [page, setPage] = useState(0)
  const [selectedModel, setSelectedModel] = useState(null)

  const [showFilters, setShowFilters] = useState(false)
  const [showSort, setShowSort] = useState(false)

  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [orderBy, setOrderBy] = useState("name")
  const timerRef = useRef(null)

  const [ccRange, setCcRange] = useState("")

  const [minCc, maxCc] = ccRange
    ? ccRange.split("-").map((v) => (v === "" ? undefined : Number(v)))
    : [undefined, undefined]

  const {
    data: pageData,
    isLoading,
    isFetching,
    isError,
  } = useGetModelsQuery({
    brandId,
    name: search || undefined,
    category: category || undefined,
    minCc,
    maxCc,
    page,
    orderBy,
  })

  const { data: brands } = useGetBrandsQuery()
  const { data: vehicles } = useGetMyVehiclesQuery()

  const ownedModelIds = new Set((vehicles || []).map((v) => v.model.id))
  const brand = brands?.find((b) => b.id === brandId)
  const hasActiveFilters = Boolean(ccRange || category)

  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchInput(value)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setSearch(value)
      setPage(0)
    }, 400)
  }

  const handleCategoryChange = (e) => {
    setCategory(e.target.value)
    setPage(0)
  }

  const handleCcChange = (e) => {
    setCcRange(e.target.value)
    setPage(0)
  }

  const selectOrder = (value) => {
    setOrderBy(value)
    setPage(0)
    setShowSort(false)
  }

  const clearFilters = () => {
    setCcRange("")
    setCategory("")
    setPage(0)
  }

  if (isLoading) {
    return (
      <div className="centered-spinner">
        <Spinner animation="border" style={{ color: "#FF7A2F" }} />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="empty-state" style={{ margin: 20 }}>
        Impossibile caricare i modelli.
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header models-page__header">
        <button
          type="button"
          className="btn-icon"
          onClick={() => navigate("/catalog")}
        >
          <FaArrowLeft />
        </button>
        <div className="page-header__title">{brand?.name || "Modelli"}</div>
      </div>

      <div className="models-page__toolbar">
        <input
          type="search"
          className="input models-page__search-input"
          style={{ height: 44 }}
          placeholder="Cerca modello..."
          value={searchInput}
          onChange={handleSearchChange}
        />

        <div style={{ position: "relative" }}>
          <button
            type="button"
            className={`btn-icon ${hasActiveFilters ? "btn-icon--active" : ""}`}
            style={{ position: "relative" }}
            onClick={() => {
              setShowFilters((v) => !v)
              setShowSort(false)
            }}
          >
            <FaFilter size={15} />
            {hasActiveFilters && <span className="btn-icon__dot" />}
          </button>

          {showFilters && (
            <>
              <div
                className="popover-overlay"
                onClick={() => setShowFilters(false)}
              />
              <div className="card popover-panel filter-panel">
                <div>
                  <div className="field-label filter-panel__field-label">
                    CILINDRATA
                  </div>
                  <select
                    className="select select--compact"
                    style={{ width: "100%" }}
                    value={ccRange}
                    onChange={handleCcChange}
                  >
                    {CC_RANGES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="field-label filter-panel__field-label">
                    CATEGORIA
                  </div>
                  <select
                    className="select select--compact"
                    style={{ width: "100%" }}
                    value={category}
                    onChange={handleCategoryChange}
                  >
                    <option value="">Tutte</option>
                    {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                {hasActiveFilters && (
                  <button
                    type="button"
                    className="filter-panel__clear-btn"
                    onClick={clearFilters}
                  >
                    RIMUOVI FILTRI
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        <div style={{ position: "relative" }}>
          <button
            type="button"
            className="btn-icon"
            onClick={() => {
              setShowSort((v) => !v)
              setShowFilters(false)
            }}
          >
            <FaSortAmountDown size={15} />
          </button>

          {showSort && (
            <>
              <div
                className="popover-overlay"
                onClick={() => setShowSort(false)}
              />
              <div className="card popover-panel sort-panel">
                {ORDER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`dropdown-option ${orderBy === opt.value ? "dropdown-option--active" : ""}`}
                    onClick={() => selectOrder(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {pageData.content.length === 0 ? (
        <p className="no-results-text">
          Nessun modello corrisponde ai criteri di ricerca.
        </p>
      ) : (
        <div className="model-grid" style={{ opacity: isFetching ? 0.6 : 1 }}>
          {pageData.content.map((model) => {
            const isOwned = ownedModelIds.has(model.id)
            return (
              <div
                key={model.id}
                className="card model-card"
                onClick={() => setSelectedModel(model)}
              >
                {isOwned && (
                  <span className="model-card__owned-badge">IN GARAGE</span>
                )}
                <div className="model-card__image">
                  {model.imageUrl && (
                    <img src={model.imageUrl} alt={model.name} />
                  )}
                </div>
                <div className="model-card__info">
                  <div className="model-card__name">{model.name}</div>
                  <div className="model-card__badges">
                    <span className="model-card__badge">
                      {model.engineCc} CC
                    </span>
                    <span className="model-card__badge">
                      {CATEGORY_LABELS[model.category] || model.category}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {pageData.totalPages > 1 && (
        <div className="pagination-row">
          <button
            type="button"
            className="btn-secondary"
            style={{
              height: 40,
              padding: "0 16px",
              opacity: pageData.first ? 0.4 : 1,
            }}
            disabled={pageData.first || isFetching}
            onClick={() => setPage((p) => p - 1)}
          >
            PRECEDENTE
          </button>
          <span className="pagination-row__label">
            {pageData.number + 1} / {pageData.totalPages}
          </span>
          <button
            type="button"
            className="btn-secondary"
            style={{
              height: 40,
              padding: "0 16px",
              opacity: pageData.last ? 0.4 : 1,
            }}
            disabled={pageData.last || isFetching}
            onClick={() => setPage((p) => p + 1)}
          >
            SUCCESSIVA
          </button>
        </div>
      )}

      <ModelDetailModal
        model={selectedModel}
        onClose={() => setSelectedModel(null)}
      />
    </div>
  )
}

export default ModelsPage
