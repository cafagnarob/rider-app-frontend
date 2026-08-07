import { useState } from "react"
import { Spinner } from "react-bootstrap"
import { useParams, useNavigate } from "react-router-dom"
import { FaArrowLeft, FaTrash } from "react-icons/fa"
import {
  useGetRideByIdQuery,
  useDeleteRideMutation,
} from "../features/rides/ridesApi"
import RideMap from "../components/map/RideMap"
import { RIDE_TYPE_LABELS } from "../utils/constants"
import { formatDuration } from "../utils/geo"
import RideCharts from "../features/rides/components/RideCharts"
import { COLORS, FONTS, styles } from "../styles/theme"

function RideDetailPage() {
  const { rideId } = useParams()
  const navigate = useNavigate()
  const { data: ride, isLoading, isError } = useGetRideByIdQuery(rideId)
  const [deleteRide, { isLoading: isDeleting }] = useDeleteRideMutation()
  const [confirm, setConfirm] = useState(false)

  const handleDelete = async () => {
    try {
      await deleteRide(rideId).unwrap()
      navigate("/rides")
    } catch (err) {
      console.error("Eliminazione fallita:", err)
    }
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <Spinner animation="border" style={{ color: COLORS.accent }} />
      </div>
    )
  }

  if (isError)
    return (
      <div style={{ ...styles.emptyState, margin: 20 }}>Giro non trovato.</div>
    )

  const duration = ride.endedAt
    ? (new Date(ride.endedAt) - new Date(ride.startedAt)) / 1000
    : 0

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
          onClick={() => navigate(-1)}
          style={styles.iconButton}
        >
          <FaArrowLeft />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: FONTS.heading,
              fontWeight: 700,
              fontSize: 20,
              lineHeight: 1.15,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {ride.title || "Uscita senza titolo"}
          </div>
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 10,
              color: COLORS.textMuted,
              marginTop: 2,
            }}
          >
            {new Date(ride.startedAt).toLocaleString("it-IT")}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setConfirm(true)}
          style={{ ...styles.iconButton, color: COLORS.danger, flexShrink: 0 }}
        >
          <FaTrash size={13} />
        </button>
      </div>

      <div
        style={{
          margin: "0 20px 18px",
          borderRadius: 18,
          overflow: "hidden",
          border: `1px solid ${COLORS.border}`,
        }}
      >
        <RideMap points={ride.points} />
      </div>

      <div style={{ ...styles.card, padding: 16, margin: "0 20px 16px" }}>
        <RideCharts points={ride.points} />
      </div>

      <div style={{ padding: "0 20px" }}>
        <div
          style={{
            ...styles.statGrid,
            gridTemplateColumns: "1fr 1fr 1fr",
            marginBottom: 20,
          }}
        >
          <div style={styles.statCell}>
            <span style={styles.statLabel}>DISTANZA</span>
            <span style={styles.statValue}>
              {ride.distanceKm != null
                ? ride.distanceKm.toFixed(1).replace(".", ",")
                : "—"}
            </span>
          </div>
          <div style={styles.statCell}>
            <span style={styles.statLabel}>MEDIA</span>
            <span style={styles.statValue}>
              {ride.avgSpeedKmH != null ? ride.avgSpeedKmH.toFixed(0) : "—"}
            </span>
          </div>
          <div style={styles.statCell}>
            <span style={styles.statLabel}>MASSIMA</span>
            <span style={styles.statValue}>
              {ride.maxSpeedKmH != null ? ride.maxSpeedKmH.toFixed(0) : "—"}
            </span>
          </div>
          <div style={styles.statCell}>
            <span style={styles.statLabel}>DURATA</span>
            <span style={{ ...styles.statValue, fontSize: 17 }}>
              {formatDuration(duration)}
            </span>
          </div>
          <div style={styles.statCell}>
            <span style={styles.statLabel}>SOSTE</span>
            <span style={styles.statValue}>{ride.stopsCount}</span>
          </div>
          <div style={styles.statCell}>
            <span style={styles.statLabel}>TEMPO FERMO</span>
            <span style={{ ...styles.statValue, fontSize: 17 }}>
              {formatDuration(ride.totalStopDurationSeconds)}
            </span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            marginBottom: ride.notes ? 18 : 0,
          }}
        >
          {ride.type && (
            <span
              style={{
                padding: "4px 10px",
                borderRadius: 8,
                background: COLORS.cardAlt,
                border: `1px solid ${COLORS.borderSoft}`,
                fontFamily: FONTS.mono,
                fontSize: 9.5,
                color: COLORS.textSecondary,
              }}
            >
              {RIDE_TYPE_LABELS[ride.type] || ride.type}
            </span>
          )}
          {ride.vehicle && (
            <span
              style={{
                padding: "4px 10px",
                borderRadius: 8,
                background: COLORS.accentSoftBg,
                border: `1px solid ${COLORS.accentSoftBorder}`,
                fontFamily: FONTS.mono,
                fontSize: 9.5,
                color: COLORS.accent,
              }}
            >
              {ride.vehicle.nickname ||
                `${ride.vehicle.brandName} ${ride.vehicle.modelName}`}
            </span>
          )}
          <span
            style={{
              padding: "4px 10px",
              borderRadius: 8,
              background: COLORS.cardAlt,
              border: `1px solid ${COLORS.borderSoft}`,
              fontFamily: FONTS.mono,
              fontSize: 9.5,
              color: COLORS.textSecondary,
            }}
          >
            {ride.points.length} PUNTI GPS
          </span>
        </div>

        {ride.notes && (
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.5,
              color: "rgba(255,255,255,.85)",
            }}
          >
            {ride.notes}
          </p>
        )}
      </div>

      {confirm && (
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
          onClick={() => setConfirm(false)}
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
              ELIMINARE IL GIRO?
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
              Il tracciato e le statistiche verranno persi definitivamente.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={() => setConfirm(false)}
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

export default RideDetailPage
