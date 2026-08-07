import { useState } from "react"
import {
  useGetCurrentUserQuery,
  useUpdateProfilePictureMutation,
} from "../features/users/usersApi"
import { Spinner } from "react-bootstrap"
import { Link } from "react-router-dom"
import ProfileEditModal from "../features/users/components/ProfileEditModal"
import ProfileLinksSection from "../features/users/components/ProfileLinksSection"
import SecuritySection from "../features/users/components/SecuritySection"
import { useGetMyInvitesQuery } from "../features/events/invitesApi"
import { COLORS, FONTS, styles } from "../styles/theme"
import { FaChevronRight } from "react-icons/fa"

const MENU_ITEMS = [
  { to: "/garage", label: "Garage" },
  { to: "/routes", label: "Percorsi" },
  { to: "/catalog", label: "Catalogo moto" },
  { to: "/notifications", label: "Notifiche" },
]

function ProfilePage() {
  const { data: profile, isLoading, isError } = useGetCurrentUserQuery()
  const [updatePicture, { isLoading: isUploading }] =
    useUpdateProfilePictureMutation()

  const { data: myInvites } = useGetMyInvitesQuery()

  const [showEdit, setShowEdit] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const handlePictureChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Il file selezionato non è un'immagine.")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("L'immagine non può superare i 5 MB.")
      return
    }
    setErrorMsg("")
    try {
      await updatePicture(file).unwrap()
    } catch (err) {
      setErrorMsg(err.data?.message || "Errore durante il caricamento.")
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
        Impossibile caricare il profilo.
      </div>
    )
  }

  return (
    <div style={{ ...styles.pageBg, paddingTop: 20, paddingBottom: 40 }}>
      <div style={{ padding: "0 20px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 18,
          }}
        >
          <div style={{ position: "relative", flexShrink: 0 }}>
            <img
              src={profile.profilePicture}
              alt={profile.username}
              style={{
                width: 90,
                height: 90,
                borderRadius: "50%",
                objectFit: "cover",
                background: COLORS.surfaceRaised,
              }}
            />
            {isUploading && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  background: "rgba(6,6,7,.65)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Spinner
                  size="sm"
                  animation="border"
                  style={{ color: COLORS.accent }}
                />
              </div>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: FONTS.heading,
                fontWeight: 700,
                fontSize: 22,
                lineHeight: 1.15,
              }}
            >
              {profile.name} {profile.surname}
            </div>
            <div
              style={{
                fontFamily: FONTS.mono,
                fontSize: 11,
                color: COLORS.textMuted,
                marginBottom: 10,
              }}
            >
              @{profile.username}
            </div>
            <label
              style={{
                ...styles.secondaryButton,
                height: 32,
                padding: "0 12px",
                fontSize: 11,
                display: "inline-flex",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              CAMBIA FOTO
              <input
                type="file"
                accept="image/*"
                hidden
                disabled={isUploading}
                onChange={handlePictureChange}
              />
            </label>
          </div>
        </div>

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

        {profile.description && (
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.5,
              color: "rgba(255,255,255,.85)",
              marginBottom: 16,
            }}
          >
            {profile.description}
          </p>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginBottom: 18,
          }}
        >
          {profile.location && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontFamily: FONTS.body,
                fontSize: 13,
              }}
            >
              <span style={{ color: COLORS.textMuted }}>Località</span>
              <span>{profile.location}</span>
            </div>
          )}
          {profile.birthDate && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontFamily: FONTS.body,
                fontSize: 13,
              }}
            >
              <span style={{ color: COLORS.textMuted }}>Data di nascita</span>
              <span>
                {new Date(profile.birthDate).toLocaleDateString("it-IT")}
              </span>
            </div>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontFamily: FONTS.body,
              fontSize: 13,
            }}
          >
            <span style={{ color: COLORS.textMuted }}>Iscritto dal</span>
            <span>
              {new Date(profile.createdAt).toLocaleDateString("it-IT")}
            </span>
          </div>
        </div>

        {profile.currentVehicle && (
          <Link
            to="/garage"
            style={{
              display: "inline-block",
              marginBottom: 18,
              textDecoration: "none",
            }}
          >
            <span
              style={{
                padding: "6px 12px",
                borderRadius: 9,
                background: COLORS.accentSoftBg,
                border: `1px solid ${COLORS.accentSoftBorder}`,
                fontFamily: FONTS.mono,
                fontSize: 11,
                color: COLORS.accent,
              }}
            >
              MOTO ATTIVA ·{" "}
              {profile.currentVehicle.nickname ||
                `${profile.currentVehicle.brandName} ${profile.currentVehicle.modelName}`}
            </span>
          </Link>
        )}

        <button
          type="button"
          onClick={() => setShowEdit(true)}
          style={{ ...styles.primaryButton, width: "100%", marginBottom: 28 }}
        >
          MODIFICA PROFILO
        </button>

        <div style={{ ...styles.fieldLabel, marginBottom: 10 }}>
          IL MIO ACCOUNT
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginBottom: 28,
          }}
        >
          {MENU_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "13px 15px",
                borderRadius: 13,
                background: COLORS.card,
                border: `1px solid ${COLORS.border}`,
                textDecoration: "none",
                color: COLORS.text,
                fontFamily: FONTS.body,
                fontSize: 14,
              }}
            >
              {item.label}
              <FaChevronRight size={11} color={COLORS.textFaint} />
            </Link>
          ))}

          <Link
            to="/invites"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "13px 15px",
              borderRadius: 13,
              background: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              textDecoration: "none",
              color: COLORS.text,
              fontFamily: FONTS.body,
              fontSize: 14,
            }}
          >
            <span>Inviti ricevuti</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {myInvites?.length > 0 && (
                <span
                  style={{
                    minWidth: 20,
                    height: 20,
                    borderRadius: 10,
                    background: COLORS.accent,
                    color: COLORS.onAccent,
                    fontFamily: FONTS.mono,
                    fontSize: 11,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 6px",
                  }}
                >
                  {myInvites.length}
                </span>
              )}
              <FaChevronRight size={11} color={COLORS.textFaint} />
            </div>
          </Link>
        </div>

        <ProfileLinksSection links={profile.links || []} />
        <SecuritySection profile={profile} />
      </div>

      <ProfileEditModal
        key={showEdit ? "open" : "closed"}
        profile={showEdit ? profile : null}
        onClose={() => setShowEdit(false)}
      />
    </div>
  )
}

export default ProfilePage
