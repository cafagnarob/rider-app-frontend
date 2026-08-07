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
import { COLORS, FONTS, styles } from "../styles/theme"

const pillStyle = {
  padding: "4px 10px",
  borderRadius: 8,
  background: COLORS.cardAlt,
  border: `1px solid ${COLORS.borderSoft}`,
  fontFamily: FONTS.mono,
  fontSize: 9.5,
  color: COLORS.textSecondary,
}

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
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <Spinner animation="border" style={{ color: COLORS.accent }} />
      </div>
    )
  }

  const vehicle = vehicles?.find((v) => v.id === vehicleId)

  if (!vehicle) {
    return (
      <div style={{ ...styles.emptyState, margin: 20 }}>
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
    <div style={{ ...styles.pageBg, paddingTop: 20, paddingBottom: 40 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 20px 16px",
        }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={styles.iconButton}
        >
          <FaArrowLeft />
        </button>
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          style={{
            marginLeft: "auto",
            height: 40,
            padding: "0 13px",
            borderRadius: 12,
            background: COLORS.dangerBg,
            border: `1px solid ${COLORS.dangerBorder}`,
            color: COLORS.danger,
            fontFamily: FONTS.mono,
            fontSize: 10,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <FaTrash size={10} /> ELIMINA
        </button>
      </div>

      {(vehicle.photoUrl || vehicle.model.imageUrl) && (
        <div
          style={{
            height: 220,
            margin: "0 20px 18px",
            borderRadius: 18,
            overflow: "hidden",
            background: COLORS.cardAlt,
          }}
        >
          <img
            src={vehicle.photoUrl || vehicle.model.imageUrl}
            alt={label}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      )}

      <div style={{ padding: "0 20px" }}>
        {isActive && (
          <span
            style={{
              display: "inline-block",
              padding: "4px 10px",
              borderRadius: 8,
              marginBottom: 8,
              background: COLORS.accentSoftBg,
              border: `1px solid ${COLORS.accentSoftBorder}`,
              fontFamily: FONTS.mono,
              fontSize: 10,
              color: COLORS.accent,
            }}
          >
            PRINCIPALE
          </span>
        )}

        <div style={{ ...styles.pageTitle, fontSize: 28, marginBottom: 4 }}>
          {label}
        </div>
        {vehicle.nickname && (
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 11,
              color: COLORS.textMuted,
              marginBottom: 16,
            }}
          >
            {vehicle.model.brand.name} {vehicle.model.name}
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            marginBottom: 18,
          }}
        >
          <span style={pillStyle}>{vehicle.year}</span>
          <span style={pillStyle}>{vehicle.model.engineCc} CC</span>
          <span style={pillStyle}>
            {CATEGORY_LABELS[vehicle.model.category] || vehicle.model.category}
          </span>
          <span style={pillStyle}>
            {vehicle.currentMileage.toLocaleString("it-IT")} KM
          </span>
          {vehicle.licensePlate && (
            <span style={pillStyle}>{vehicle.licensePlate}</span>
          )}
          {vehicle.vin && <span style={pillStyle}>VIN {vehicle.vin}</span>}
          {vehicle.color && <span style={pillStyle}>{vehicle.color}</span>}
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
          <button
            type="button"
            onClick={handleToggleActive}
            disabled={isSelecting || isClearing}
            style={{
              height: 38,
              padding: "0 15px",
              borderRadius: 11,
              background: isActive ? COLORS.accent : COLORS.card,
              border: `1px solid ${isActive ? COLORS.accent : COLORS.borderStrong}`,
              color: isActive ? COLORS.onAccent : COLORS.textSecondary,
              fontFamily: FONTS.mono,
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            {isActive ? "DISATTIVA" : "RENDI PRINCIPALE"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(true)}
            style={{
              ...styles.secondaryButton,
              height: 38,
              padding: "0 15px",
              fontSize: 11,
            }}
          >
            MODIFICA
          </button>
        </div>

        <div style={{ marginBottom: 28 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 12,
            }}
          >
            <div style={styles.sectionTitle}>PERCORSI</div>
            {ridesPage?.totalElements > 0 && (
              <span
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 10,
                  color: COLORS.textMuted,
                }}
              >
                {ridesPage.totalElements} TOTALI
              </span>
            )}
          </div>

          {!ridesPage || ridesPage.content.length === 0 ? (
            <p
              style={{
                fontFamily: FONTS.body,
                fontSize: 13,
                color: COLORS.textFaint,
              }}
            >
              Nessun giro registrato con questa moto.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {ridesPage.content.map((ride) => (
                <Link
                  key={ride.id}
                  to={`/rides/${ride.id}`}
                  style={{
                    ...styles.card,
                    padding: 13,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    textDecoration: "none",
                    color: COLORS.text,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: FONTS.heading,
                        fontWeight: 600,
                        fontSize: 15,
                      }}
                    >
                      {ride.title || "Giro senza titolo"}
                    </div>
                    <div
                      style={{
                        fontFamily: FONTS.mono,
                        fontSize: 9.5,
                        color: COLORS.textMuted,
                        marginTop: 2,
                      }}
                    >
                      {new Date(ride.startedAt).toLocaleDateString("it-IT")} ·{" "}
                      {RIDE_TYPE_LABELS[ride.type] || ride.type}
                    </div>
                  </div>
                  {ride.distanceKm != null && (
                    <span style={pillStyle}>
                      {ride.distanceKm.toFixed(1).replace(".", ",")} KM
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginBottom: 28 }}>
          <div style={styles.sectionTitle}>POST</div>
          {!postsPage || postsPage.content.length === 0 ? (
            <p
              style={{
                fontFamily: FONTS.body,
                fontSize: 13,
                color: COLORS.textFaint,
                marginTop: 12,
              }}
            >
              Nessun post con questa moto.
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 6,
                marginTop: 12,
              }}
            >
              {postsPage.content.map((post) => (
                <Link key={post.id} to={`/posts/${post.id}`}>
                  <div
                    style={{
                      aspectRatio: "1",
                      borderRadius: 10,
                      overflow: "hidden",
                      background: COLORS.cardAlt,
                    }}
                  >
                    {post.media?.[0] && (
                      <img
                        src={post.media[0].mediaUrl}
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <div style={styles.sectionTitle}>STATISTICHE</div>
          <div style={{ ...styles.emptyState, marginTop: 12 }}>
            Statistiche di velocità e altre metriche specifiche per questa moto
            arriveranno presto.
          </div>
        </div>
      </div>

      {editing && (
        <VehicleEditModal vehicle={vehicle} onClose={() => setEditing(false)} />
      )}

      {confirmDelete && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(6,6,7,.72)",
            zIndex: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
          onClick={() => setConfirmDelete(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              ...styles.card,
              padding: 22,
              width: "100%",
              maxWidth: 340,
            }}
          >
            <div
              style={{
                fontFamily: FONTS.heading,
                fontWeight: 700,
                fontSize: 20,
                marginBottom: 10,
              }}
            >
              ELIMINARE IL VEICOLO?
            </div>
            <p
              style={{
                fontFamily: FONTS.body,
                fontSize: 13,
                color: COLORS.textSecondary,
                lineHeight: 1.5,
                marginBottom: 18,
              }}
            >
              Stai per eliminare{" "}
              <strong style={{ color: COLORS.text }}>{label}</strong>. I giri
              già registrati con questa moto verranno mantenuti, ma non saranno
              più collegati ad alcun veicolo. L'operazione non è reversibile.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                style={{ ...styles.secondaryButton, flex: 1 }}
              >
                ANNULLA
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 15,
                  background: COLORS.danger,
                  border: "none",
                  color: "#fff",
                  fontFamily: FONTS.heading,
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: "pointer",
                }}
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
