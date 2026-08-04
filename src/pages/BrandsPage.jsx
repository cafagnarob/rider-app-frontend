import { Card, Form, Spinner } from "react-bootstrap"
import { useGetBrandsQuery } from "../features/catalog/catalogApi"
import { useNavigate } from "react-router-dom"
import { useState } from "react"

function BrandsPage() {
  const { data: brands, isLoading, isError } = useGetBrandsQuery()
  const navigate = useNavigate()

  const [search, setSearch] = useState("")

  const filteredBrands = brands?.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()),
  )

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="light" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="alert alert-danger">
        Impossibile caricare i brand. Riprova più tardi.
      </div>
    )
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4 gap-3">
        <h2 className="mb-0">Scegli un brand</h2>
        <Form.Control
          type="search"
          placeholder="Cerca brand..."
          className="bg-transparent text-light"
          style={{ maxWidth: "260px" }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {filteredBrands.length === 0 ? (
        <p className="text-secondary">Nessun brand corrisponde alla ricerca.</p>
      ) : (
        <div className="row g-3">
          {filteredBrands.map((brand) => (
            <div className="col-6 col-md-4 col-lg-3" key={brand.id}>
              <Card
                className="bg-dark text-light h-100 border-secondary"
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`/catalog/${brand.id}`)}
              >
                <div className="ratio ratio-1x1 d-flex align-items-center justify-content-center">
                  {brand.logoUrl ? (
                    <img
                      src={brand.logoUrl}
                      alt={brand.name}
                      style={{ objectFit: "contain", padding: "1rem" }}
                    />
                  ) : (
                    <div className="d-flex align-items-center justify-content-center h-100">
                      <span className="fs-1 fw-bold text-secondary">
                        {brand.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <Card.Body className="text-center py-2">
                  <Card.Title className="fs-6 mb-0">{brand.name}</Card.Title>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
export default BrandsPage
