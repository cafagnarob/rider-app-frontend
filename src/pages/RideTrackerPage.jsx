import { useEffect, useState } from "react"
import { Spinner } from "react-bootstrap"
import { useSelector, useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import { useGetMyVehiclesQuery } from "../features/vehicles/vehiclesApi"
import {
  useStartRideMutation,
  useFinishRideMutation,
  useDeleteRideMutation,
} from "../features/rides/ridesApi"
import { rideStarted, rideCleared } from "../features/rides/rideSlice"
import { startTracking, stopTracking } from "../features/rides/trackingService"
import { formatDuration, toLocalDateTimeString } from "../utils/geo"
import { RIDE_TYPE_LABELS } from "../utils/constants"
import { COLORS, FONTS, styles } from "../styles/theme"

function RideTrackerPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const ride = useSelector((state) => state.ride)

  const { data: vehicles } = useGetMyVehiclesQuery()
  const [startRide, { isLoading: isStarting }] = useStartRideMutation()
  const [finishRide, { isLoading: isFinishing }] = useFinishRideMutation()

  const [form, setForm] = useState({ vehicleId: "", title: "", type: "TOUR" })
  const [notes, setNotes] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    if (!ride.rideId) return
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [ride.rideId])

  const [deleteRide, { isLoading: isDiscarding }] = useDeleteRideMutation()

  const handleStart = async (e) => {
    e.preventDefault()
    setErrorMsg("")
    try {
      const created = await startRide({
        vehicleId: form.vehicleId || null,
        title: form.title || null,
        type: form.type,
      }).unwrap()

      dispatch(
        rideStarted({ rideId: created.id, startedAt: created.startedAt }),
      )
      startTracking(setErrorMsg)
    } catch (err) {
      setErrorMsg(err.data?.message || "Impossibile avviare il giro.")
    }
  }

  const handleFinish = async () => {
    setErrorMsg("")

    if (ride.points.length === 0) {
      setErrorMsg(
        "Nessun punto GPS registrato: non è possibile salvare il giro.",
      )
      return
    }

    stopTracking()

    const endedAt = new Date()
    const elapsedSec = (endedAt - new Date(ride.startedAt)) / 1000
    const movingSec = Math.max(1, elapsedSec - ride.totalStopDurationSeconds)
    const avgSpeed = ride.distanceKm / (movingSec / 3600)

    try {
      await finishRide({
        rideId: ride.rideId,
        endedAt: toLocalDateTimeString(endedAt),
        distanceKm: Number(ride.distanceKm.toFixed(3)),
        avgSpeedKmH: Number(avgSpeed.toFixed(2)),
        maxSpeedKmH: Number(ride.maxSpeedKmH.toFixed(2)),
        stopsCount: ride.stopsCount,
        totalStopDurationSeconds: Math.round(ride.totalStopDurationSeconds),
        notes: notes || null,
        points: ride.points,
      }).unwrap()

      const finishedId = ride.rideId
      dispatch(rideCleared())
      navigate(`/rides/${finishedId}`)
    } catch (err) {
      setErrorMsg(err.data?.message || "Errore nel salvataggio del giro.")
      startTracking(setErrorMsg)
    }
  }

  const handleDiscard = async () => {
    stopTracking()
    try {
      await deleteRide(ride.rideId).unwrap()
    } catch (err) {
      console.error("Impossibile eliminare il giro scartato sul server:", err)
    } finally {
      dispatch(rideCleared())
    }
  }

  // --- giro in corso ---
  if (ride.rideId) {
    const lastPoint = ride.points[ride.points.length - 1]
    const elapsed = ride.startedAt
      ? Math.max(0, (now - new Date(ride.startedAt)) / 1000)
      : 0

    return (
      <div style={{ ...styles.pageBg, paddingTop: 20, paddingBottom: 40 }}>
        <div style={{ padding: "0 20px" }}>
          <div
            style={{
              ...styles.card,
              borderColor: COLORS.accentSoftBorder,
              padding: 22,
              textAlign: "center",
              marginBottom: 20,
            }}
          >
            <span
              style={{
                display: "inline-block",
                padding: "5px 12px",
                borderRadius: 9,
                marginBottom: 16,
                background: COLORS.dangerBg,
                border: `1px solid ${COLORS.dangerBorder}`,
                fontFamily: FONTS.mono,
                fontSize: 10,
                color: COLORS.danger,
              }}
            >
              ● REGISTRAZIONE IN CORSO
            </span>

            <div
              style={{
                fontFamily: FONTS.heading,
                fontWeight: 700,
                fontSize: 52,
                lineHeight: 1,
              }}
            >
              {ride.distanceKm.toFixed(2).replace(".", ",")}
            </div>
            <div
              style={{
                fontFamily: FONTS.mono,
                fontSize: 11,
                color: COLORS.textMuted,
                marginBottom: 26,
              }}
            >
              KM PERCORSI
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-around",
                marginBottom: 20,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: FONTS.heading,
                    fontWeight: 700,
                    fontSize: 22,
                  }}
                >
                  {lastPoint ? lastPoint.speedKmh.toFixed(0) : "0"}
                </div>
                <div
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: 9,
                    color: COLORS.textMuted,
                    marginTop: 3,
                  }}
                >
                  KM/H ATTUALI
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontFamily: FONTS.heading,
                    fontWeight: 700,
                    fontSize: 22,
                  }}
                >
                  {ride.maxSpeedKmH.toFixed(0)}
                </div>
                <div
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: 9,
                    color: COLORS.textMuted,
                    marginTop: 3,
                  }}
                >
                  KM/H MAX
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontFamily: FONTS.heading,
                    fontWeight: 700,
                    fontSize: 22,
                  }}
                >
                  {formatDuration(elapsed)}
                </div>
                <div
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: 9,
                    color: COLORS.textMuted,
                    marginTop: 3,
                  }}
                >
                  DURATA
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-around",
                paddingTop: 18,
                borderTop: `1px solid ${COLORS.borderSoft}`,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: FONTS.heading,
                    fontWeight: 600,
                    fontSize: 16,
                  }}
                >
                  {ride.points.length}
                </div>
                <div
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: 9,
                    color: COLORS.textMuted,
                    marginTop: 3,
                  }}
                >
                  PUNTI GPS
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontFamily: FONTS.heading,
                    fontWeight: 600,
                    fontSize: 16,
                  }}
                >
                  {ride.stopsCount}
                </div>
                <div
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: 9,
                    color: COLORS.textMuted,
                    marginTop: 3,
                  }}
                >
                  SOSTE
                </div>
              </div>
            </div>
          </div>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder="Note sul giro (opzionale)"
            style={{
              width: "100%",
              borderRadius: 14,
              background: COLORS.card,
              border: `1px solid ${COLORS.borderStrong}`,
              color: COLORS.text,
              fontFamily: FONTS.body,
              fontSize: 14,
              lineHeight: 1.5,
              padding: 14,
              outline: "none",
              resize: "none",
              boxSizing: "border-box",
              marginBottom: 16,
            }}
          />

          {errorMsg && (
            <div
              style={{
                fontFamily: FONTS.body,
                fontSize: 13,
                color: COLORS.danger,
                marginBottom: 14,
              }}
            >
              {errorMsg}
            </div>
          )}

          <button
            type="button"
            disabled={isFinishing}
            onClick={handleFinish}
            style={{
              width: "100%",
              height: 56,
              borderRadius: 15,
              background: COLORS.danger,
              border: "none",
              color: "#fff",
              fontFamily: FONTS.heading,
              fontWeight: 700,
              fontSize: 17,
              letterSpacing: ".05em",
              textTransform: "uppercase",
              cursor: "pointer",
              marginBottom: 10,
              opacity: isFinishing ? 0.6 : 1,
            }}
          >
            {isFinishing ? (
              <Spinner size="sm" animation="border" />
            ) : (
              "TERMINA GIRO"
            )}
          </button>
          <button
            type="button"
            onClick={handleDiscard}
            disabled={isDiscarding}
            style={{
              width: "100%",
              background: "none",
              border: "none",
              color: COLORS.textMuted,
              fontFamily: FONTS.mono,
              fontSize: 11,
              cursor: "pointer",
              padding: 8,
              opacity: isDiscarding ? 0.5 : 1,
            }}
          >
            {isDiscarding ? "ELIMINAZIONE..." : "SCARTA SENZA SALVARE"}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ ...styles.pageBg, paddingTop: 20, paddingBottom: 40 }}>
      <div style={{ padding: "0 20px" }}>
        <div style={{ ...styles.pageTitle, fontSize: 26, marginBottom: 20 }}>
          REGISTRA UN'USCITA
        </div>

        <form
          onSubmit={handleStart}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          <div>
            <div style={{ ...styles.fieldLabel, marginBottom: 8 }}>MOTO</div>
            <select
              value={form.vehicleId}
              onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
              style={styles.input}
            >
              <option value="">Nessuna moto</option>
              {vehicles?.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nickname || `${v.model.brand.name} ${v.model.name}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ ...styles.fieldLabel, marginBottom: 8 }}>TITOLO</div>
            <input
              type="text"
              maxLength={100}
              placeholder="Giro al Passo dello Stelvio"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              style={styles.input}
            />
          </div>

          <div>
            <div style={{ ...styles.fieldLabel, marginBottom: 8 }}>TIPO</div>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              style={styles.input}
            >
              {Object.entries(RIDE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {errorMsg && (
            <div
              style={{
                fontFamily: FONTS.body,
                fontSize: 13,
                color: COLORS.danger,
              }}
            >
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isStarting}
            style={{ ...styles.primaryButton, opacity: isStarting ? 0.6 : 1 }}
          >
            {isStarting ? "..." : "INIZIA"}
          </button>
        </form>
      </div>
    </div>
  )
}

export default RideTrackerPage
