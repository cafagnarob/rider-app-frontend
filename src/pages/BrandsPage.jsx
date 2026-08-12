import { Spinner } from "react-bootstrap"
import { useGetBrandsQuery } from "../features/catalog/catalogApi"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import "../pages/CSS/BrandsPage.css"

function BrandsPage() {
  const { data: brands, isLoading, isError } = useGetBrandsQuery()
  const navigate = useNavigate()

  const [search, setSearch] = useState("")

  const filteredBrands = brands?.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()),
  )

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <Spinner animation="border" style={{ color: "#FF7A2F" }} />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="empty-state empty-state-margin">
        Impossibile caricare i brand. Riprova più tardi.
      </div>
    )
  }

  return (
    <div className="page">
      <div className="brands-page__header">
        <div className="page-title brands-page__title">CATALOGO</div>
        <input
          type="search"
          className="input input--compact"
          placeholder="Cerca brand..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filteredBrands.length === 0 ? (
        <p className="no-results-text">
          Nessun brand corrisponde alla ricerca.
        </p>
      ) : (
        <div className="grid-3 px-20">
          {filteredBrands.map((brand) => (
            <div
              key={brand.id}
              className="card"
              style={{ cursor: "pointer", overflow: "hidden" }}
              onClick={() => navigate(`/catalog/${brand.id}`)}
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
  )
}
export default BrandsPage
