import { useRef, useState } from "react"
import { Spinner } from "react-bootstrap"
import { useNavigate, useParams } from "react-router-dom"
import ModelDetailModal from "../features/catalog/components/ModelDetailModal"
import {
  useGetBrandsQuery,
  useGetModelsQuery,
} from "../features/catalog/catalogApi"
import { CATEGORY_LABELS, CC_RANGES } from "../utils/constants"
import { COLORS, FONTS, styles } from "../styles/theme"
import { useGetMyVehiclesQuery } from "../features/vehicles/vehiclesApi"
import { FaArrowLeft, FaFilter, FaSortAmountDown } from "react-icons/fa"

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
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <Spinner animation="border" style={{ color: COLORS.accent }} />
      </div>
    )
  }

  if (isError) {
    return (
      <div style={{ ...styles.emptyState, margin: 20 }}>
        Impossibile caricare i modelli.
      </div>
    )
  }

  return (
    <div style={{ ...styles.pageBg, paddingTop: 20, paddingBottom: 40 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 20px 16px",
        }}
      >
        <button
          type="button"
          onClick={() => navigate("/catalog")}
          style={styles.iconButton}
        >
          <FaArrowLeft />
        </button>
        <div style={{ ...styles.pageTitle, fontSize: 24 }}>
          {brand?.name || "Modelli"}
        </div>
      </div>

      <div
        style={{ padding: "0 20px", display: "flex", gap: 8, marginBottom: 16 }}
      >
        <input
          type="search"
          placeholder="Cerca modello..."
          value={searchInput}
          onChange={handleSearchChange}
          style={{ ...styles.input, height: 44, flex: 1, minWidth: 0 }}
        />

        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => {
              setShowFilters((v) => !v)
              setShowSort(false)
            }}
            style={{
              ...styles.iconButton,
              position: "relative",
              borderColor: hasActiveFilters
                ? COLORS.accentSoftBorder
                : COLORS.borderStrong,
              color: hasActiveFilters ? COLORS.accent : COLORS.text,
            }}
          >
            <FaFilter size={15} />
            {hasActiveFilters && (
              <span
                style={{
                  position: "absolute",
                  top: 6,
                  right: 6,
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: COLORS.accent,
                }}
              />
            )}
          </button>

          {showFilters && (
            <>
              <div
                style={{ position: "fixed", inset: 0, zIndex: 19 }}
                onClick={() => setShowFilters(false)}
              />
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  zIndex: 20,
                  width: 230,
                  ...styles.card,
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                <div>
                  <div style={{ ...styles.fieldLabel, marginBottom: 7 }}>
                    CILINDRATA
                  </div>
                  <select
                    value={ccRange}
                    onChange={handleCcChange}
                    style={{
                      ...styles.input,
                      height: 40,
                      fontSize: 13,
                      width: "100%",
                    }}
                  >
                    {CC_RANGES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div style={{ ...styles.fieldLabel, marginBottom: 7 }}>
                    CATEGORIA
                  </div>
                  <select
                    value={category}
                    onChange={handleCategoryChange}
                    style={{
                      ...styles.input,
                      height: 40,
                      fontSize: 13,
                      width: "100%",
                    }}
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
                    onClick={clearFilters}
                    style={{
                      background: "none",
                      border: "none",
                      color: COLORS.danger,
                      fontFamily: FONTS.mono,
                      fontSize: 10,
                      cursor: "pointer",
                      textAlign: "left",
                      padding: 0,
                    }}
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
            onClick={() => {
              setShowSort((v) => !v)
              setShowFilters(false)
            }}
            style={styles.iconButton}
          >
            <FaSortAmountDown size={15} />
          </button>

          {showSort && (
            <>
              <div
                style={{ position: "fixed", inset: 0, zIndex: 19 }}
                onClick={() => setShowSort(false)}
              />
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  zIndex: 20,
                  width: 170,
                  ...styles.card,
                  padding: 6,
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                {ORDER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => selectOrder(opt.value)}
                    style={{
                      textAlign: "left",
                      padding: "9px 10px",
                      borderRadius: 9,
                      border: "none",
                      cursor: "pointer",
                      background:
                        orderBy === opt.value
                          ? COLORS.accentSoftBg
                          : "transparent",
                      color:
                        orderBy === opt.value ? COLORS.accent : COLORS.text,
                      fontFamily: FONTS.body,
                      fontSize: 13,
                    }}
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
        <p
          style={{
            fontFamily: FONTS.body,
            fontSize: 13,
            color: COLORS.textFaint,
            textAlign: "center",
            padding: "40px 20px",
          }}
        >
          Nessun modello corrisponde ai criteri di ricerca.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            padding: "0 20px",
            opacity: isFetching ? 0.6 : 1,
          }}
        >
          {pageData.content.map((model) => {
            const isOwned = ownedModelIds.has(model.id)
            return (
              <div
                key={model.id}
                onClick={() => setSelectedModel(model)}
                style={{
                  ...styles.card,
                  cursor: "pointer",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                {isOwned && (
                  <span
                    style={{
                      position: "absolute",
                      top: 8,
                      left: 8,
                      zIndex: 1,
                      padding: "3px 8px",
                      borderRadius: 7,
                      background: "rgba(10,10,12,.85)",
                      border: `1px solid ${COLORS.accentSoftBorder}`,
                      fontFamily: FONTS.mono,
                      fontSize: 8.5,
                      color: COLORS.accent,
                    }}
                  >
                    IN GARAGE
                  </span>
                )}
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
                      lineHeight: 1.2,
                      marginBottom: 6,
                    }}
                  >
                    {model.name}
                  </div>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    <span
                      style={{
                        padding: "2px 7px",
                        borderRadius: 6,
                        background: COLORS.cardAlt,
                        border: `1px solid ${COLORS.borderSoft}`,
                        fontFamily: FONTS.mono,
                        fontSize: 8.5,
                        color: COLORS.textSecondary,
                      }}
                    >
                      {model.engineCc} CC
                    </span>
                    <span
                      style={{
                        padding: "2px 7px",
                        borderRadius: 6,
                        background: COLORS.cardAlt,
                        border: `1px solid ${COLORS.borderSoft}`,
                        fontFamily: FONTS.mono,
                        fontSize: 8.5,
                        color: COLORS.textSecondary,
                      }}
                    >
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
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 16,
            padding: "24px 20px",
          }}
        >
          <button
            type="button"
            disabled={pageData.first || isFetching}
            onClick={() => setPage((p) => p - 1)}
            style={{
              ...styles.secondaryButton,
              height: 40,
              padding: "0 16px",
              opacity: pageData.first ? 0.4 : 1,
            }}
          >
            PRECEDENTE
          </button>
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: 11,
              color: COLORS.textMuted,
            }}
          >
            {pageData.number + 1} / {pageData.totalPages}
          </span>
          <button
            type="button"
            disabled={pageData.last || isFetching}
            onClick={() => setPage((p) => p + 1)}
            style={{
              ...styles.secondaryButton,
              height: 40,
              padding: "0 16px",
              opacity: pageData.last ? 0.4 : 1,
            }}
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
