import { Spinner } from "react-bootstrap"
import { useGetBrandsQuery } from "../features/catalog/catalogApi"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { COLORS, FONTS, styles } from "../styles/theme"

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
        <Spinner animation="border" style={{ color: COLORS.accent }} />
      </div>
    )
  }

  if (isError) {
    return (
      <div style={{ ...styles.emptyState, margin: 20 }}>
        Impossibile caricare i brand. Riprova più tardi.
      </div>
    )
  }

  return (
    <div style={{ ...styles.pageBg, paddingTop: 20, paddingBottom: 40 }}>
      <div style={{ padding: "0 20px 18px" }}>
        <div style={{ ...styles.pageTitle, fontSize: 28, marginBottom: 14 }}>
          CATALOGO
        </div>
        <input
          type="search"
          placeholder="Cerca brand..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...styles.input, height: 46 }}
        />
      </div>

      {filteredBrands.length === 0 ? (
        <p
          style={{
            fontFamily: FONTS.body,
            fontSize: 13,
            color: COLORS.textFaint,
            textAlign: "center",
            padding: "40px 20px",
          }}
        >
          Nessun brand corrisponde alla ricerca.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 10,
            padding: "0 20px",
          }}
        >
          {filteredBrands.map((brand) => (
            <div
              key={brand.id}
              onClick={() => navigate(`/catalog/${brand.id}`)}
              style={{ ...styles.card, cursor: "pointer", overflow: "hidden" }}
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
                      fontSize: 30,
                      color: COLORS.textFaint,
                    }}
                  >
                    {brand.name.charAt(0)}
                  </span>
                )}
              </div>
              <div style={{ padding: "9px 8px", textAlign: "center" }}>
                <span
                  style={{
                    fontFamily: FONTS.heading,
                    fontWeight: 600,
                    fontSize: 13,
                    lineHeight: 1.2,
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
  )
}
export default BrandsPage
