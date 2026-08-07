import { useUpdateProfileMutation } from "../usersApi"
import { useState } from "react"
import { COLORS, FONTS, styles } from "../../../styles/theme"
import { FaTimes } from "react-icons/fa"

function ProfileEditModal({ profile, onClose }) {
  const [updateProfile, { isLoading }] = useUpdateProfileMutation()
  const [errorMsg, setErrorMsg] = useState("")

  const [form, setForm] = useState({
    name: profile?.name || "",
    surname: profile?.surname || "",
    description: profile?.description || "",
    location: profile?.location || "",
    birthDate: profile?.birthDate || "",
  })

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg("")
    try {
      await updateProfile({
        name: form.name || null,
        surname: form.surname || null,
        description: form.description || null,
        location: form.location || null,
        birthDate: form.birthDate || null,
      }).unwrap()
      onClose()
    } catch (err) {
      setErrorMsg(err.data?.message || "Errore durante il salvataggio.")
    }
  }

  if (!profile) return null
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
      onClick={onClose}
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
        <form onSubmit={handleSubmit}>
          <div
            style={{
              position: "sticky",
              top: 0,
              background: COLORS.bg,
              zIndex: 2,
              borderBottom: `1px solid ${COLORS.borderSoft}`,
              padding: "20px 20px 14px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <button type="button" onClick={onClose} style={styles.iconButton}>
              <FaTimes />
            </button>
            <div style={{ flex: 1, ...styles.pageTitle, fontSize: 20 }}>
              MODIFICA PROFILO
            </div>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                height: 40,
                padding: "0 16px",
                borderRadius: 13,
                background: COLORS.accent,
                border: "none",
                color: COLORS.onAccent,
                fontFamily: FONTS.heading,
                fontWeight: 700,
                fontSize: 15,
                letterSpacing: ".05em",
                cursor: "pointer",
                opacity: isLoading ? 0.5 : 1,
              }}
            >
              {isLoading ? "..." : "SALVA"}
            </button>
          </div>

          <div
            style={{
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...styles.fieldLabel, marginBottom: 8 }}>
                  NOME
                </div>
                <input
                  type="text"
                  value={form.name}
                  onChange={set("name")}
                  style={{ ...styles.input, width: "100%" }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...styles.fieldLabel, marginBottom: 8 }}>
                  COGNOME
                </div>
                <input
                  type="text"
                  value={form.surname}
                  onChange={set("surname")}
                  style={{ ...styles.input, width: "100%" }}
                />
              </div>
            </div>

            <div>
              <div style={{ ...styles.fieldLabel, marginBottom: 8 }}>BIO</div>
              <textarea
                value={form.description}
                onChange={set("description")}
                rows={3}
                placeholder="Raccontaci qualcosa di te..."
                style={{
                  width: "100%",
                  borderRadius: 14,
                  background: COLORS.card,
                  border: `1px solid ${COLORS.borderStrong}`,
                  color: COLORS.text,
                  fontFamily: FONTS.body,
                  fontSize: 15,
                  lineHeight: 1.5,
                  padding: 14,
                  outline: "none",
                  resize: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <div style={{ ...styles.fieldLabel, marginBottom: 8 }}>
                LOCALITÀ
              </div>
              <input
                type="text"
                placeholder="Latina, Italia"
                value={form.location}
                onChange={set("location")}
                style={styles.input}
              />
            </div>

            <div>
              <div style={{ ...styles.fieldLabel, marginBottom: 8 }}>
                DATA DI NASCITA
              </div>
              <input
                type="date"
                max={new Date().toISOString().split("T")[0]}
                value={form.birthDate}
                onChange={set("birthDate")}
                style={styles.input}
              />
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
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProfileEditModal
