import { useRef, useState } from "react"
import { Badge, Button, Card, Form, Spinner } from "react-bootstrap"
import { useNavigate, useParams } from "react-router-dom"
import ModelDetailModal from "../features/catalog/components/ModelDetailModal"
import {
  useGetBrandsQuery,
  useGetModelsQuery,
} from "../features/catalog/catalogApi"
import { CATEGORY_LABELS, CC_RANGES } from "../utils/constants"

function ModelsPage() {
  const { brandId } = useParams()
  const navigate = useNavigate()

  const [page, setPage] = useState(0)
  const [selectedModel, setSelectedModel] = useState(null)

  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [orderBy, setOrderBy] = useState("name")
  const timerRef = useRef(null)

  const [ccRange, setCcRange] = useState("")

  const [minCc, maxCc] = ccRange
    ? ccRange.split("-").map((v) => (v === "" ? undefined : Number(v)))
    : [undefined, undefined]

  const handleCcChange = (e) => {
    setCcRange(e.target.value)
    setPage(0)
  }

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

  const brand = brands?.find((b) => b.id === brandId)

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

  const handleOrderChange = (e) => {
    setOrderBy(e.target.value)
    setPage(0)
  }

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

      <div className="row g-2 mb-4">
        <div className="col-12 col-md-4">
          <Form.Control
            type="search"
            placeholder="Cerca modello..."
            className="bg-transparent"
            value={searchInput}
            onChange={handleSearchChange}
          />
        </div>
        <div className="col-6 col-md-3">
          <Form.Select
            className="bg-transparent"
            value={ccRange}
            onChange={handleCcChange}
          >
            {CC_RANGES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Form.Select>
        </div>
        <div className="col-6 col-md-2">
          <Form.Select
            className="bg-transparent "
            value={category}
            onChange={handleCategoryChange}
          >
            <option value="">Tutte le categorie</option>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Form.Select>
        </div>
        <div className="col-6 col-md-2">
          <Form.Select
            className="bg-transparent "
            value={orderBy}
            onChange={handleOrderChange}
          >
            <option value="name">Nome</option>
            <option value="engineCc">Cilindrata</option>
            <option value="yearStart">Anno</option>
            <option value="horsePower">Potenza</option>
          </Form.Select>
        </div>
      </div>

      {pageData.content.length === 0 ? (
        <p className="text-secondary">
          Nessun modello corrisponde ai criteri di ricerca.
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
