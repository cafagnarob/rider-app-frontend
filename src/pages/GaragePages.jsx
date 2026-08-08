import { Spinner } from "react-bootstrap"
import { Link, useNavigate } from "react-router-dom"
import { useGetMyVehiclesQuery } from "../features/vehicles/vehiclesApi"
import {
  useClearVehicleMutation,
  useGetCurrentUserQuery,
  useSelectVehicleMutation,
} from "../features/users/usersApi"
import { COLORS, FONTS, styles } from "../styles/theme"

function GaragePage() {
  const { data: profile } = useGetCurrentUserQuery()
  const [selectVehicle, { isLoading: isSelecting }] = useSelectVehicleMutation()
  const [clearVehicle, { isLoading: isClearing }] = useClearVehicleMutation()

  const activeVehicleId = profile?.currentVehicle?.id

  const { data: vehicles, isLoading, isError } = useGetMyVehiclesQuery()

  const navigate = useNavigate()

  const handleToggleActive = async (vehicleId) => {
    try {
      if (activeVehicleId === vehicleId) {
        await clearVehicle().unwrap()
      } else {
        await selectVehicle(vehicleId).unwrap()
      }
    } catch (err) {
      console.error("Cambio moto attiva fallito:", err)
    }
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
        Impossibile caricare il garage.
      </div>
    )
  }

  return (
    <div style={{ ...styles.pageBg, paddingTop: 20, paddingBottom: 40 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 20px 20px",
        }}
      >
        <div style={{ ...styles.pageTitle, fontSize: 28 }}>IL MIO GARAGE</div>
        <Link
          to="/garage/new"
          style={{
            height: 40,
            padding: "0 15px",
            borderRadius: 12,
            background: COLORS.accent,
            border: "none",
            color: COLORS.onAccent,
            fontFamily: FONTS.heading,
            fontWeight: 700,
            fontSize: 15,
            letterSpacing: ".04em",
            display: "inline-flex",
            alignItems: "center",
            textDecoration: "none",
          }}
        >
          + MOTO
        </Link>
      </div>

      {vehicles.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div
            style={{
              fontFamily: FONTS.heading,
              fontWeight: 700,
              fontSize: 22,
              marginBottom: 10,
            }}
          >
            IL TUO GARAGE È VUOTO
          </div>
          <p
            style={{
              fontFamily: FONTS.body,
              fontSize: 13,
              color: COLORS.textSecondary,
              marginBottom: 22,
            }}
          >
            Aggiungi la tua prima moto scegliendola dal catalogo.
          </p>
          <Link
            to="/catalog"
            style={{
              ...styles.primaryButton,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 32px",
              textDecoration: "none",
            }}
          >
            VAI AL CATALOGO
          </Link>
        </div>
      ) : (
        <div
          style={{
            padding: "0 20px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {vehicles.map((vehicle) => {
            const isActive = vehicle.id === activeVehicleId
            const label =
              vehicle.nickname ||
              `${vehicle.model.brand.name} ${vehicle.model.name}`

            return (
              <div
                key={vehicle.id}
                onClick={() => navigate(`/garage/${vehicle.id}`)}
                style={{
                  ...styles.card,
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: 14,
                  cursor: "pointer",
                  borderColor: isActive
                    ? COLORS.accentSoftBorder
                    : COLORS.border,
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 12,
                    overflow: "hidden",
                    background: COLORS.cardAlt,
                    flexShrink: 0,
                  }}
                >
                  {(vehicle.photoUrl || vehicle.model.imageUrl) && (
                    <img
                      src={vehicle.photoUrl || vehicle.model.imageUrl}
                      alt={label}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {isActive && (
                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: 6,
                        marginBottom: 4,
                        background: COLORS.accentSoftBg,
                        border: `1px solid ${COLORS.accentSoftBorder}`,
                        fontFamily: FONTS.mono,
                        fontSize: 9,
                        color: COLORS.accent,
                      }}
                    >
                      PRINCIPALE
                    </span>
                  )}
                  <div
                    style={{
                      fontFamily: FONTS.heading,
                      fontWeight: 700,
                      fontSize: 18,
                      lineHeight: 1.15,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      fontFamily: FONTS.mono,
                      fontSize: 10,
                      color: COLORS.textMuted,
                      marginTop: 3,
                    }}
                  >
                    {vehicle.model.brand.name} {vehicle.model.name}
                    {vehicle.licensePlate && ` · ${vehicle.licensePlate}`}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleToggleActive(vehicle.id)
                  }}
                  disabled={isSelecting || isClearing}
                  style={{
                    height: 32,
                    padding: "0 11px",
                    borderRadius: 9,
                    flexShrink: 0,
                    background: isActive ? COLORS.accent : COLORS.card,
                    border: `1px solid ${isActive ? COLORS.accent : COLORS.borderStrong}`,
                    color: isActive ? COLORS.onAccent : COLORS.textSecondary,
                    fontFamily: FONTS.mono,
                    fontSize: 9,
                    cursor: "pointer",
                  }}
                >
                  {isActive ? "ATTIVA" : "USA"}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default GaragePage
