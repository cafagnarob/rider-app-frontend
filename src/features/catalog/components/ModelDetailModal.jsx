import { CATEGORY_LABELS } from "../../../utils/constants"
import { useNavigate } from "react-router-dom"
import {
  useAddVehicleMutation,
  useGetMyVehiclesQuery,
} from "../../vehicles/vehiclesApi"
import { useState } from "react"
import { COLORS, FONTS, styles } from "../../../styles/theme"

function ModelDetailModal({ model, onClose }) {
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    year: "",
    initialMileage: "",
    nickname: "",
    licensePlate: "",
  })

  const { data: myVehicles } = useGetMyVehiclesQuery()
  const [addVehicle, { isLoading: isAdding, error }] = useAddVehicleMutation()

  const ownedCount =
    myVehicles?.filter((v) => v.model.id === model?.id).length || 0

  const handleClose = () => {
    setShowForm(false)
    setForm({ year: "", initialMileage: "", nickname: "", licensePlate: "" })
    onClose()
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    try {
      await addVehicle({
        data: {
          modelId: model.id,
          nickname: form.nickname || null,
          year: Number(form.year),
          initialMileage: Number(form.initialMileage),
          licensePlate: form.licensePlate
            ? form.licensePlate.toUpperCase()
            : null,
        },
      }).unwrap()
      handleClose()
    } catch (err) {
      console.error("Aggiunta veicolo fallita:", err)
    }
  }

  if (!model) return null
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(6,6,7,.72)",
        zIndex: 200,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          maxHeight: "92vh",
          overflowY: "auto",
          background: COLORS.bg,
          borderRadius: "24px 24px 0 0",
          border: `1px solid ${COLORS.borderSoft}`,
          borderBottom: "none",
        }}
      >
        <div
          style={{
            position: "sticky",
            top: 0,
            background: COLORS.bg,
            zIndex: 2,
            borderBottom: `1px solid ${COLORS.borderSoft}`,
            padding: "20px 20px 14px",
          }}
        >
          <div style={{ ...styles.pageTitle, fontSize: 20, lineHeight: 1.15 }}>
            {model.brand?.name} {model.name}
          </div>
        </div>

        <div style={{ padding: 20 }}>
          {model.imageUrl && (
            <div
              style={{
                aspectRatio: "16/9",
                borderRadius: 16,
                overflow: "hidden",
                background: COLORS.cardAlt,
                marginBottom: 16,
              }}
            >
              <img
                src={model.imageUrl}
                alt={model.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              marginBottom: 16,
            }}
          >
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
              {CATEGORY_LABELS[model.category] || model.category}
            </span>
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
              {model.yearEnd
                ? `${model.yearStart} – ${model.yearEnd}`
                : `DAL ${model.yearStart}`}
            </span>
            {ownedCount > 0 && (
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
                NEL TUO GARAGE ({ownedCount})
              </span>
            )}
          </div>

          <div
            style={{
              ...styles.statGrid,
              gridTemplateColumns: model.weightKg ? "1fr 1fr 1fr" : "1fr 1fr",
              marginBottom: showForm ? 20 : 4,
            }}
          >
            <div style={styles.statCell}>
              <span style={styles.statLabel}>CILINDRATA</span>
              <span style={{ ...styles.statValue, fontSize: 17 }}>
                {model.engineCc} CC
              </span>
            </div>
            <div style={styles.statCell}>
              <span style={styles.statLabel}>POTENZA</span>
              <span style={{ ...styles.statValue, fontSize: 17 }}>
                {model.horsePower} CV
              </span>
            </div>
            {model.weightKg && (
              <div style={styles.statCell}>
                <span style={styles.statLabel}>PESO</span>
                <span style={{ ...styles.statValue, fontSize: 17 }}>
                  {model.weightKg} KG
                </span>
              </div>
            )}
          </div>

          {showForm && (
            <form
              onSubmit={handleAdd}
              style={{
                marginTop: 20,
                paddingTop: 18,
                borderTop: `1px solid ${COLORS.borderSoft}`,
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ ...styles.fieldLabel, marginBottom: 8 }}>
                    ANNO
                  </div>
                  <input
                    type="number"
                    value={form.year}
                    min={model.yearStart}
                    max={model.yearEnd || new Date().getFullYear()}
                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                    required
                    style={{ ...styles.input, width: "100%" }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ ...styles.fieldLabel, marginBottom: 8 }}>
                    KM ATTUALI
                  </div>
                  <input
                    type="number"
                    value={form.initialMileage}
                    min={0}
                    onChange={(e) =>
                      setForm({ ...form, initialMileage: e.target.value })
                    }
                    required
                    style={{ ...styles.input, width: "100%" }}
                  />
                </div>
              </div>

              <div>
                <div style={{ ...styles.fieldLabel, marginBottom: 8 }}>
                  TARGA (OPZIONALE)
                </div>
                <input
                  type="text"
                  placeholder="AB12345"
                  value={form.licensePlate}
                  pattern="[A-Za-z]{2}[0-9]{5}"
                  title="Formato: due lettere seguite da cinque cifre (es. AB12345)"
                  onChange={(e) =>
                    setForm({ ...form, licensePlate: e.target.value })
                  }
                  style={{ ...styles.input, textTransform: "uppercase" }}
                />
                <div
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: 9.5,
                    color: COLORS.textFaint,
                    marginTop: 6,
                  }}
                >
                  FORMATO: AB12345
                </div>
              </div>

              <div>
                <div style={{ ...styles.fieldLabel, marginBottom: 8 }}>
                  SOPRANNOME (OPZIONALE)
                </div>
                <input
                  type="text"
                  placeholder="La Rossa"
                  value={form.nickname}
                  onChange={(e) =>
                    setForm({ ...form, nickname: e.target.value })
                  }
                  style={styles.input}
                />
              </div>

              {error && (
                <div
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 13,
                    color: COLORS.danger,
                  }}
                >
                  {error.data?.message || "Errore durante il salvataggio."}
                </div>
              )}

              <button
                type="submit"
                disabled={isAdding}
                style={{ ...styles.primaryButton, opacity: isAdding ? 0.6 : 1 }}
              >
                {isAdding ? "..." : "CONFERMA"}
              </button>
            </form>
          )}
        </div>

        {!showForm && (
          <div
            style={{
              position: "sticky",
              bottom: 0,
              background: COLORS.bg,
              borderTop: `1px solid ${COLORS.borderSoft}`,
              padding: 20,
              display: "flex",
              gap: 10,
            }}
          >
            {ownedCount > 0 && (
              <button
                type="button"
                onClick={() => navigate("/garage")}
                style={{ ...styles.secondaryButton, flex: 1 }}
              >
                VAI AL GARAGE
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowForm(true)}
              style={{
                ...styles.primaryButton,
                flex: ownedCount > 0 ? 1 : undefined,
                width: ownedCount > 0 ? undefined : "100%",
              }}
            >
              AGGIUNGI AL GARAGE
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ModelDetailModal
