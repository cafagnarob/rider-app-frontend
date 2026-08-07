import { useState } from "react"
import { Spinner } from "react-bootstrap"
import { Link } from "react-router-dom"
import { useGetMyRidesQuery } from "../features/rides/ridesApi"
import { RIDE_TYPE_LABELS } from "../utils/constants"
import NotificationBell from "../features/notification/components/NotificationBell"
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

function RidesHistoryPage() {
  const [page, setPage] = useState(0)
  const { data, isLoading, isFetching, isError } = useGetMyRidesQuery({ page })

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
        Impossibile caricare lo storico.
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
          padding: "0 20px 18px",
        }}
      >
        <div style={{ ...styles.pageTitle, fontSize: 26 }}>I MIEI GIRI</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <NotificationBell />
          <Link
            to="/rides/new"
            style={{
              height: 40,
              padding: "0 15px",
              borderRadius: 12,
              background: COLORS.accent,
              border: "none",
              color: COLORS.onAccent,
              fontFamily: FONTS.heading,
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: ".04em",
              display: "inline-flex",
              alignItems: "center",
              textDecoration: "none",
            }}
          >
            + USCITA
          </Link>
        </div>
      </div>

      {data.content.length === 0 ? (
        <p
          style={{
            fontFamily: FONTS.body,
            fontSize: 13,
            color: COLORS.textFaint,
            textAlign: "center",
            padding: "60px 20px",
          }}
        >
          Non hai ancora registrato nessuna uscita.
        </p>
      ) : (
        <div
          style={{
            padding: "0 20px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            opacity: isFetching ? 0.6 : 1,
          }}
        >
          {data.content.map((ride) => (
            <Link
              key={ride.id}
              to={`/rides/${ride.id}`}
              style={{ textDecoration: "none" }}
            >
              <div style={{ ...styles.card, padding: 16 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 10,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: FONTS.heading,
                        fontWeight: 700,
                        fontSize: 17,
                        lineHeight: 1.15,
                        color: COLORS.text,
                      }}
                    >
                      {ride.title || "Uscita senza titolo"}
                    </div>
                    <div
                      style={{
                        fontFamily: FONTS.mono,
                        fontSize: 10,
                        color: COLORS.textMuted,
                        marginTop: 3,
                      }}
                    >
                      {new Date(ride.startedAt).toLocaleDateString("it-IT", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                  {ride.inProgress && (
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: 8,
                        background: COLORS.dangerBg,
                        border: `1px solid ${COLORS.dangerBorder}`,
                        fontFamily: FONTS.mono,
                        fontSize: 9,
                        color: COLORS.danger,
                        flexShrink: 0,
                      }}
                    >
                      IN CORSO
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {ride.type && (
                    <span style={pillStyle}>
                      {RIDE_TYPE_LABELS[ride.type] || ride.type}
                    </span>
                  )}
                  {ride.distanceKm != null && (
                    <span style={pillStyle}>
                      {ride.distanceKm.toFixed(1).replace(".", ",")} KM
                    </span>
                  )}
                  {ride.avgSpeedKmH != null && (
                    <span style={pillStyle}>
                      {ride.avgSpeedKmH.toFixed(0)} KM/H MEDIA
                    </span>
                  )}
                  {ride.vehicle && (
                    <span
                      style={{
                        ...pillStyle,
                        background: COLORS.accentSoftBg,
                        border: `1px solid ${COLORS.accentSoftBorder}`,
                        color: COLORS.accent,
                      }}
                    >
                      {ride.vehicle.nickname ||
                        `${ride.vehicle.brandName} ${ride.vehicle.modelName}`}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {data.totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 16,
            padding: "24px 20px",
          }}
        >
          <button
            type="button"
            disabled={data.first || isFetching}
            onClick={() => setPage((p) => p - 1)}
            style={{
              ...styles.secondaryButton,
              height: 40,
              padding: "0 16px",
              opacity: data.first ? 0.4 : 1,
            }}
          >
            PRECEDENTE
          </button>
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: 11,
              color: COLORS.textMuted,
            }}
          >
            {data.number + 1} / {data.totalPages}
          </span>
          <button
            type="button"
            disabled={data.last || isFetching}
            onClick={() => setPage((p) => p + 1)}
            style={{
              ...styles.secondaryButton,
              height: 40,
              padding: "0 16px",
              opacity: data.last ? 0.4 : 1,
            }}
          >
            SUCCESSIVA
          </button>
        </div>
      )}
    </div>
  )
}

export default RidesHistoryPage
