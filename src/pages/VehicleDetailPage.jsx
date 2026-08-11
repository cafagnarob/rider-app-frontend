import { useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { Spinner } from "react-bootstrap"
import { FaArrowLeft, FaTrash } from "react-icons/fa"
import {
  useGetMyVehiclesQuery,
  useDeleteVehicleMutation,
} from "../features/vehicles/vehiclesApi"
import {
  useGetCurrentUserQuery,
  useSelectVehicleMutation,
  useClearVehicleMutation,
} from "../features/users/usersApi"
import { useGetMyRidesQuery } from "../features/rides/ridesApi"
import { useGetPostsByVehicleQuery } from "../features/social/postsApi"
import VehicleEditModal from "../features/vehicles/components/VehicleEditModal"
import { CATEGORY_LABELS, RIDE_TYPE_LABELS } from "../utils/constants"
import "./VehicleDetailPage.css"

function VehicleDetailPage() {
  const { vehicleId } = useParams()
  const navigate = useNavigate()

  const { data: vehicles, isLoading } = useGetMyVehiclesQuery()
  const { data: profile } = useGetCurrentUserQuery()
  const [selectVehicle, { isLoading: isSelecting }] = useSelectVehicleMutation()
  const [clearVehicle, { isLoading: isClearing }] = useClearVehicleMutation()
  const [deleteVehicle, { isLoading: isDeleting }] = useDeleteVehicleMutation()

  const { data: ridesPage } = useGetMyRidesQuery({
    vehicleId,
    page: 0,
    size: 10,
  })
  const { data: postsPage } = useGetPostsByVehicleQuery({
    vehicleId,
    page: 0,
    size: 9,
  })

  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (isLoading) {
    return (
      <div className="centered-spinner">
        <Spinner animation="border" style={{ color: "#FF7A2F" }} />
      </div>
    )
  }

  const vehicle = vehicles?.find((v) => v.id === vehicleId)

  if (!vehicle) {
    return (
      <div className="empty-state" style={{ margin: 20 }}>
        Veicolo non trovato.
      </div>
    )
  }

  const isActive = vehicle.id === profile?.currentVehicle?.id
  const label =
    vehicle.nickname || `${vehicle.model.brand.name} ${vehicle.model.name}`

  const handleToggleActive = () => {
    if (isActive) clearVehicle()
    else selectVehicle(vehicle.id)
  }

  const handleDelete = async () => {
    try {
      await deleteVehicle(vehicle.id).unwrap()
      navigate("/garage")
    } catch (err) {
      console.error("Eliminazione fallita:", err)
    }
  }

  return (
    <div className="page">
      <div className="vehicle-detail-page__header">
        <button type="button" className="btn-icon" onClick={() => navigate(-1)}>
          <FaArrowLeft />
        </button>
        <button
          type="button"
          className="vehicle-detail-page__delete-btn"
          onClick={() => setConfirmDelete(true)}
        >
          <FaTrash size={10} /> ELIMINA
        </button>
      </div>

      {(vehicle.photoUrl || vehicle.model.imageUrl) && (
        <div className="vehicle-detail-page__hero">
          <img src={vehicle.photoUrl || vehicle.model.imageUrl} alt={label} />
        </div>
      )}

      <div className="px-20">
        {isActive && (
          <div className="vehicle-detail-page__badge-wrap">
            <span className="meta-badge meta-badge--accent">PRINCIPALE</span>
          </div>
        )}

        <div className="page-title vehicle-detail-page__title">{label}</div>
        {vehicle.nickname && (
          <div className="vehicle-detail-page__subtitle">
            {vehicle.model.brand.name} {vehicle.model.name}
          </div>
        )}

        <div className="vehicle-detail-page__pills">
          <span className="meta-badge">{vehicle.year}</span>
          <span className="meta-badge">{vehicle.model.engineCc} CC</span>
          <span className="meta-badge">
            {CATEGORY_LABELS[vehicle.model.category] || vehicle.model.category}
          </span>
          <span className="meta-badge">
            {vehicle.currentMileage.toLocaleString("it-IT")} KM
          </span>
          {vehicle.licensePlate && (
            <span className="meta-badge">{vehicle.licensePlate}</span>
          )}
          {vehicle.vin && <span className="meta-badge">VIN {vehicle.vin}</span>}
          {vehicle.color && <span className="meta-badge">{vehicle.color}</span>}
        </div>

        <div className="vehicle-detail-page__actions">
          <button
            type="button"
            className={`action-btn ${isActive ? "action-btn--toggle-active" : "action-btn--toggle-inactive"}`}
            disabled={isSelecting || isClearing}
            onClick={handleToggleActive}
          >
            {isActive ? "DISATTIVA" : "RENDI PRINCIPALE"}
          </button>
          <button
            type="button"
            className="btn-secondary action-btn"
            onClick={() => setEditing(true)}
          >
            MODIFICA
          </button>
        </div>

        <div className="vehicle-detail-page__section">
          <div className="vehicle-detail-page__section-header">
            <div className="section-title">PERCORSI</div>
            {ridesPage?.totalElements > 0 && (
              <span className="vehicle-detail-page__count">
                {ridesPage.totalElements} TOTALI
              </span>
            )}
          </div>

          {!ridesPage || ridesPage.content.length === 0 ? (
            <p className="vehicle-detail-page__empty-text">
              Nessun giro registrato con questa moto.
            </p>
          ) : (
            <div className="vehicle-detail-page__ride-list">
              {ridesPage.content.map((ride) => (
                <Link
                  key={ride.id}
                  to={`/rides/${ride.id}`}
                  className="card mini-list-row"
                >
                  <div>
                    <div className="mini-list-row__title">
                      {ride.title || "Giro senza titolo"}
                    </div>
                    <div className="mini-list-row__meta">
                      {new Date(ride.startedAt).toLocaleDateString("it-IT")} ·{" "}
                      {RIDE_TYPE_LABELS[ride.type] || ride.type}
                    </div>
                  </div>
                  {ride.distanceKm != null && (
                    <span className="meta-badge">
                      {ride.distanceKm.toFixed(1).replace(".", ",")} KM
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="vehicle-detail-page__section">
          <div className="section-title">POST</div>
          {!postsPage || postsPage.content.length === 0 ? (
            <p
              className="vehicle-detail-page__empty-text"
              style={{ marginTop: 12 }}
            >
              Nessun post con questa moto.
            </p>
          ) : (
            <div className="rounded-post-grid">
              {postsPage.content.map((post) => (
                <Link
                  key={post.id}
                  to={`/posts/${post.id}`}
                  className="rounded-post-grid__item"
                >
                  {post.media?.[0] && (
                    <img src={post.media[0].mediaUrl} alt="" />
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="section-title">STATISTICHE</div>
          <div className="empty-state" style={{ marginTop: 12 }}>
            Statistiche di velocità e altre metriche specifiche per questa moto
            arriveranno presto.
          </div>
        </div>
      </div>

      {editing && (
        <VehicleEditModal vehicle={vehicle} onClose={() => setEditing(false)} />
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(false)}>
          <div className="card modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">ELIMINARE IL VEICOLO?</div>
            <p className="modal-text">
              Stai per eliminare{" "}
              <strong style={{ color: "var(--color-text)" }}>{label}</strong>. I
              giri già registrati con questa moto verranno mantenuti, ma non
              saranno più collegati ad alcun veicolo. L'operazione non è
              reversibile.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setConfirmDelete(false)}
              >
                ANNULLA
              </button>
              <button
                type="button"
                className="btn-danger"
                disabled={isDeleting}
                onClick={handleDelete}
              >
                {isDeleting ? "..." : "ELIMINA"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VehicleDetailPage
