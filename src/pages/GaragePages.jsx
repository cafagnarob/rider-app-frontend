import { useGetCurrentUserQuery } from "../features/users/usersApi"
import { useGetMyVehiclesQuery } from "../features/vehicles/vehiclesApi"
import { useNavigate, Link } from "react-router-dom"
import { Spinner } from "react-bootstrap"
import "./GaragePage.css"
import {
  useSelectVehicleMutation,
  useClearVehicleMutation,
} from "../features/users/usersApi"

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
      <div className="centered-spinner">
        <Spinner animation="border" style={{ color: "#FF7A2F" }} />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="empty-state" style={{ margin: 20 }}>
        Impossibile caricare il garage.
      </div>
    )
  }

  return (
    <div className="page">
      <div className="header-row garage-page__header">
        <div className="page-title" style={{ fontSize: 28 }}>
          IL MIO GARAGE
        </div>
        <Link to="/garage/new" className="btn-accent-sm">
          + MOTO
        </Link>
      </div>

      {vehicles.length === 0 ? (
        <div className="empty-hero">
          <div className="empty-hero__title">IL TUO GARAGE È VUOTO</div>
          <p className="empty-hero__text">
            Aggiungi la tua prima moto scegliendola dal catalogo.
          </p>
          <Link to="/catalog" className="btn-primary empty-hero__cta">
            VAI AL CATALOGO
          </Link>
        </div>
      ) : (
        <div className="vehicle-list">
          {vehicles.map((vehicle) => {
            const isActive = vehicle.id === activeVehicleId
            const label =
              vehicle.nickname ||
              `${vehicle.model.brand.name} ${vehicle.model.name}`

            return (
              <div
                key={vehicle.id}
                className={`card vehicle-card ${isActive ? "vehicle-card--active" : ""}`}
                onClick={() => navigate(`/garage/${vehicle.id}`)}
              >
                <div className="vehicle-card__thumb">
                  {(vehicle.photoUrl || vehicle.model.imageUrl) && (
                    <img
                      src={vehicle.photoUrl || vehicle.model.imageUrl}
                      alt={label}
                    />
                  )}
                </div>

                <div className="vehicle-card__info">
                  {isActive && (
                    <span className="vehicle-card__badge">PRINCIPALE</span>
                  )}
                  <div className="vehicle-card__name">{label}</div>
                  <div className="vehicle-card__meta">
                    {vehicle.model.brand.name} {vehicle.model.name}
                    {vehicle.licensePlate && ` · ${vehicle.licensePlate}`}
                  </div>
                </div>

                <button
                  type="button"
                  className={`vehicle-card__toggle ${isActive ? "vehicle-card__toggle--active" : ""}`}
                  disabled={isSelecting || isClearing}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleToggleActive(vehicle.id)
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
