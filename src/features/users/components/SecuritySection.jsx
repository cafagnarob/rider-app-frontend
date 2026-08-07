import { useState } from "react"
import { useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import {
  useChangePasswordMutation,
  useDeactivateAccountMutation,
  useUpdateEmailMutation,
  useUpdateUsernameMutation,
} from "../usersApi"
import { logout } from "../../auth/authSlice"

import { COLORS, FONTS, styles } from "../../../styles/theme"
import PasswordInput from "../../../components/PasswordInput"

const feedbackColor = {
  success: "#4ADE80",
  danger: COLORS.danger,
  warning: COLORS.accent,
}

function SecuritySection({ profile }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [activeForm, setActiveForm] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [showDeactivate, setShowDeactivate] = useState(false)

  const [changePassword, { isLoading: isChangingPw }] =
    useChangePasswordMutation()
  const [updateUsername, { isLoading: isChangingUser }] =
    useUpdateUsernameMutation()
  const [updateEmail, { isLoading: isChangingMail }] = useUpdateEmailMutation()
  const [deactivate, { isLoading: isDeactivating }] =
    useDeactivateAccountMutation()

  const [pwForm, setPwForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirm: "",
  })
  const [userForm, setUserForm] = useState({
    currentPassword: "",
    newUsername: "",
  })
  const [mailForm, setMailForm] = useState({
    currentPassword: "",
    newEmail: "",
  })

  const closeForm = () => {
    setActiveForm(null)
    setPwForm({ oldPassword: "", newPassword: "", confirm: "" })
    setUserForm({ currentPassword: "", newUsername: "" })
    setMailForm({ currentPassword: "", newEmail: "" })
  }

  const toggle = (form) => setActiveForm((cur) => (cur === form ? null : form))

  const handlePassword = async (e) => {
    e.preventDefault()
    setFeedback(null)
    if (pwForm.newPassword !== pwForm.confirm) {
      setFeedback({ type: "warning", text: "Le password non coincidono." })
      return
    }
    try {
      await changePassword({
        oldPassword: pwForm.oldPassword,
        newPassword: pwForm.newPassword,
      }).unwrap()
      setFeedback({ type: "success", text: "Password aggiornata." })
      closeForm()
    } catch (err) {
      setFeedback({
        type: "danger",
        text: err.data?.message || "Errore durante il cambio password.",
      })
    }
  }

  const handleUsername = async (e) => {
    e.preventDefault()
    setFeedback(null)
    try {
      await updateUsername(userForm).unwrap()
      setFeedback({ type: "success", text: "Username aggiornato." })
      closeForm()
    } catch (err) {
      setFeedback({
        type: "danger",
        text: err.data?.message || "Errore durante il cambio username.",
      })
    }
  }

  const handleEmail = async (e) => {
    e.preventDefault()
    setFeedback(null)
    try {
      await updateEmail(mailForm).unwrap()
      setFeedback({ type: "success", text: "Email aggiornata." })
      closeForm()
    } catch (err) {
      setFeedback({
        type: "danger",
        text: err.data?.message || "Errore durante il cambio email.",
      })
    }
  }

  const handleDeactivate = async () => {
    try {
      await deactivate().unwrap()
      dispatch(logout())
      navigate("/login")
    } catch (err) {
      setFeedback({
        type: "danger",
        text: err.data?.message || "Errore durante la disattivazione.",
      })
      setShowDeactivate(false)
    }
  }

  const handleLogout = () => {
    dispatch(logout())
    navigate("/login")
  }

  const rowStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  }

  return (
    <>
      <div style={{ ...styles.card, padding: 18, marginBottom: 16 }}>
        <div style={{ ...styles.fieldLabel, marginBottom: 14 }}>
          ACCOUNT E SICUREZZA
        </div>

        {feedback && (
          <div
            style={{
              fontFamily: FONTS.body,
              fontSize: 13,
              color: feedbackColor[feedback.type],
              marginBottom: 14,
            }}
          >
            {feedback.text}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={rowStyle}>
            <div>
              <div style={{ fontFamily: FONTS.body, fontSize: 14 }}>
                Username
              </div>
              <div
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 10,
                  color: COLORS.textMuted,
                  marginTop: 2,
                }}
              >
                @{profile.username}
              </div>
            </div>
            <button
              type="button"
              onClick={() => toggle("username")}
              style={{
                ...styles.secondaryButton,
                height: 34,
                padding: "0 13px",
                fontSize: 10,
              }}
            >
              MODIFICA
            </button>
          </div>

          {activeForm === "username" && (
            <form
              onSubmit={handleUsername}
              style={{
                paddingTop: 14,
                borderTop: `1px solid ${COLORS.borderSoft}`,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div>
                <div style={{ ...styles.fieldLabel, marginBottom: 6 }}>
                  NUOVO USERNAME
                </div>
                <input
                  type="text"
                  value={userForm.newUsername}
                  onChange={(e) =>
                    setUserForm({ ...userForm, newUsername: e.target.value })
                  }
                  required
                  style={{ ...styles.input, height: 42 }}
                />
              </div>
              <div>
                <div style={{ ...styles.fieldLabel, marginBottom: 6 }}>
                  PASSWORD ATTUALE
                </div>
                <PasswordInput
                  value={userForm.currentPassword}
                  onChange={(e) =>
                    setUserForm({
                      ...userForm,
                      currentPassword: e.target.value,
                    })
                  }
                  required
                  style={{ height: 42 }}
                />
              </div>
              <button
                type="submit"
                disabled={isChangingUser}
                style={{
                  ...styles.secondaryButton,
                  background: COLORS.accent,
                  color: COLORS.onAccent,
                  border: "none",
                }}
              >
                {isChangingUser ? "..." : "CONFERMA"}
              </button>
            </form>
          )}

          <div style={rowStyle}>
            <div>
              <div style={{ fontFamily: FONTS.body, fontSize: 14 }}>Email</div>
              <div
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 10,
                  color: COLORS.textMuted,
                  marginTop: 2,
                }}
              >
                {profile.email}
              </div>
            </div>
            <button
              type="button"
              onClick={() => toggle("email")}
              style={{
                ...styles.secondaryButton,
                height: 34,
                padding: "0 13px",
                fontSize: 10,
              }}
            >
              MODIFICA
            </button>
          </div>

          {activeForm === "email" && (
            <form
              onSubmit={handleEmail}
              style={{
                paddingTop: 14,
                borderTop: `1px solid ${COLORS.borderSoft}`,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div>
                <div style={{ ...styles.fieldLabel, marginBottom: 6 }}>
                  NUOVA EMAIL
                </div>
                <input
                  type="email"
                  value={mailForm.newEmail}
                  onChange={(e) =>
                    setMailForm({ ...mailForm, newEmail: e.target.value })
                  }
                  required
                  style={{ ...styles.input, height: 42 }}
                />
              </div>
              <div>
                <div style={{ ...styles.fieldLabel, marginBottom: 6 }}>
                  PASSWORD ATTUALE
                </div>
                <PasswordInput
                  value={mailForm.currentPassword}
                  onChange={(e) =>
                    setMailForm({
                      ...mailForm,
                      currentPassword: e.target.value,
                    })
                  }
                  required
                  style={{ height: 42 }}
                />
              </div>
              <button
                type="submit"
                disabled={isChangingMail}
                style={{
                  ...styles.secondaryButton,
                  background: COLORS.accent,
                  color: COLORS.onAccent,
                  border: "none",
                }}
              >
                {isChangingMail ? "..." : "CONFERMA"}
              </button>
            </form>
          )}

          <div style={rowStyle}>
            <div>
              <div style={{ fontFamily: FONTS.body, fontSize: 14 }}>
                Password
              </div>
              <div
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 10,
                  color: COLORS.textMuted,
                  marginTop: 2,
                }}
              >
                ••••••••
              </div>
            </div>
            <button
              type="button"
              onClick={() => toggle("password")}
              style={{
                ...styles.secondaryButton,
                height: 34,
                padding: "0 13px",
                fontSize: 10,
              }}
            >
              MODIFICA
            </button>
          </div>

          {activeForm === "password" && (
            <form
              onSubmit={handlePassword}
              style={{
                paddingTop: 14,
                borderTop: `1px solid ${COLORS.borderSoft}`,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div>
                <div style={{ ...styles.fieldLabel, marginBottom: 6 }}>
                  PASSWORD ATTUALE
                </div>
                <PasswordInput
                  value={pwForm.oldPassword}
                  onChange={(e) =>
                    setPwForm({ ...pwForm, oldPassword: e.target.value })
                  }
                  required
                  style={{ height: 42 }}
                />
              </div>
              <div>
                <div style={{ ...styles.fieldLabel, marginBottom: 6 }}>
                  NUOVA PASSWORD
                </div>
                <PasswordInput
                  value={pwForm.newPassword}
                  onChange={(e) =>
                    setPwForm({ ...pwForm, newPassword: e.target.value })
                  }
                  minLength={8}
                  required
                  style={{ height: 42 }}
                />
              </div>
              <div>
                <div style={{ ...styles.fieldLabel, marginBottom: 6 }}>
                  CONFERMA NUOVA PASSWORD
                </div>
                <PasswordInput
                  value={pwForm.confirm}
                  onChange={(e) =>
                    setPwForm({ ...pwForm, confirm: e.target.value })
                  }
                  required
                  style={{ height: 42 }}
                />
              </div>
              <button
                type="submit"
                disabled={isChangingPw}
                style={{
                  ...styles.secondaryButton,
                  background: COLORS.accent,
                  color: COLORS.onAccent,
                  border: "none",
                }}
              >
                {isChangingPw ? "..." : "CONFERMA"}
              </button>
            </form>
          )}

          <button
            type="button"
            onClick={handleLogout}
            style={{
              background: "none",
              border: "none",
              color: COLORS.textSecondary,
              fontFamily: FONTS.mono,
              fontSize: 11,
              cursor: "pointer",
              textAlign: "left",
              padding: 0,
              marginTop: 4,
            }}
          >
            ESCI DALL'ACCOUNT
          </button>
        </div>
      </div>

      <div
        style={{
          ...styles.card,
          padding: 18,
          marginBottom: 16,
          borderColor: COLORS.dangerBorder,
        }}
      >
        <div
          style={{
            ...styles.fieldLabel,
            color: COLORS.danger,
            marginBottom: 8,
          }}
        >
          ZONA PERICOLOSA
        </div>
        <p
          style={{
            fontFamily: FONTS.body,
            fontSize: 12.5,
            color: COLORS.textSecondary,
            lineHeight: 1.5,
            marginBottom: 14,
          }}
        >
          Disattivando l'account non potrai più accedere finché non verrà
          riattivato da un amministratore. I tuoi contenuti non vengono
          eliminati.
        </p>
        <button
          type="button"
          onClick={() => setShowDeactivate(true)}
          style={{
            height: 36,
            padding: "0 14px",
            borderRadius: 11,
            background: COLORS.dangerBg,
            border: `1px solid ${COLORS.dangerBorder}`,
            color: COLORS.danger,
            fontFamily: FONTS.mono,
            fontSize: 10.5,
            cursor: "pointer",
          }}
        >
          DISATTIVA ACCOUNT
        </button>
      </div>

      {showDeactivate && (
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
          onClick={() => setShowDeactivate(false)}
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
              DISATTIVARE L'ACCOUNT?
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
              Verrai disconnesso immediatamente e non potrai più accedere con
              queste credenziali. Sei sicuro di voler procedere?
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={() => setShowDeactivate(false)}
                style={{ ...styles.secondaryButton, flex: 1 }}
              >
                ANNULLA
              </button>
              <button
                type="button"
                onClick={handleDeactivate}
                disabled={isDeactivating}
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
                {isDeactivating ? "..." : "DISATTIVA"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default SecuritySection
