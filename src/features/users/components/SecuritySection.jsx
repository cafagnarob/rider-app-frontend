import { useState } from "react"
import { useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import {
  useChangePasswordMutation,
  useDeactivateAccountMutation,
  useDeleteAccountMutation,
  useUpdateEmailMutation,
  useUpdateUsernameMutation,
} from "../usersApi"
import { logout } from "../../auth/authSlice"
import PasswordInput from "../../../components/PasswordInput"

const feedbackColor = {
  success: "#4ADE80",
  danger: "var(--color-danger)",
  warning: "var(--color-accent)",
}

function SecuritySection({ profile }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [activeForm, setActiveForm] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [showDeactivate, setShowDeactivate] = useState(false)

  const [deleteAccount, { isLoading: isDeleting }] = useDeleteAccountMutation()
  const [showDelete, setShowDelete] = useState(false)
  const [deletePassword, setDeletePassword] = useState("")
  const [deleteConfirmText, setDeleteConfirmText] = useState("")

  const canConfirmDelete =
    deleteConfirmText.trim().toUpperCase() === "ELIMINA" &&
    deletePassword.trim().length > 0

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
      forceReLoginWithMessage("Password aggiornata, accedi di nuovo.")
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
      forceReLoginWithMessage("Username aggiornato, accedi di nuovo.")
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
      forceReLoginWithMessage("Email aggiornata, accedi di nuovo.")
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

  const handleDelete = async () => {
    try {
      await deleteAccount(deletePassword).unwrap()
      dispatch(logout())
      navigate("/login")
    } catch (err) {
      setFeedback({
        type: "danger",
        text:
          err.data?.message || "Errore durante l'eliminazione dell'account.",
      })
      setShowDelete(false)
    }
  }

  const handleLogout = () => {
    dispatch(logout())
    navigate("/login")
  }

  const forceReLoginWithMessage = (message) => {
    sessionStorage.setItem("loginInfoMessage", message)
    dispatch(logout())
    navigate("/login")
  }

  return (
    <>
      <div className="card section-card">
        <div className="field-label section-card__label">
          ACCOUNT E SICUREZZA
        </div>

        {feedback && (
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 13,
              color: feedbackColor[feedback.type],
              marginBottom: 14,
            }}
          >
            {feedback.text}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="settings-row">
            <div>
              <div className="settings-row__label">Username</div>
              <div className="settings-row__value">@{profile.username}</div>
            </div>
            <button
              type="button"
              className="btn-secondary"
              style={{ height: 34, padding: "0 13px", fontSize: 10 }}
              onClick={() => toggle("username")}
            >
              MODIFICA
            </button>
          </div>

          {activeForm === "username" && (
            <form className="inline-edit-form" onSubmit={handleUsername}>
              <div>
                <div className="field-label" style={{ marginBottom: 6 }}>
                  NUOVO USERNAME
                </div>
                <input
                  type="text"
                  className="input"
                  style={{ height: 42 }}
                  value={userForm.newUsername}
                  onChange={(e) =>
                    setUserForm({ ...userForm, newUsername: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <div className="field-label" style={{ marginBottom: 6 }}>
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
                className="btn-accent-secondary"
                disabled={isChangingUser}
              >
                {isChangingUser ? "..." : "CONFERMA"}
              </button>
            </form>
          )}

          <div className="settings-row">
            <div>
              <div className="settings-row__label">Email</div>
              <div className="settings-row__value">{profile.email}</div>
            </div>
            <button
              type="button"
              className="btn-secondary"
              style={{ height: 34, padding: "0 13px", fontSize: 10 }}
              onClick={() => toggle("email")}
            >
              MODIFICA
            </button>
          </div>

          {activeForm === "email" && (
            <form className="inline-edit-form" onSubmit={handleEmail}>
              <div>
                <div className="field-label" style={{ marginBottom: 6 }}>
                  NUOVA EMAIL
                </div>
                <input
                  type="email"
                  className="input"
                  style={{ height: 42 }}
                  value={mailForm.newEmail}
                  onChange={(e) =>
                    setMailForm({ ...mailForm, newEmail: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <div className="field-label" style={{ marginBottom: 6 }}>
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
                className="btn-accent-secondary"
                disabled={isChangingMail}
              >
                {isChangingMail ? "..." : "CONFERMA"}
              </button>
            </form>
          )}

          <div className="settings-row">
            <div>
              <div className="settings-row__label">Password</div>
              <div className="settings-row__value">••••••••</div>
            </div>
            <button
              type="button"
              className="btn-secondary"
              style={{ height: 34, padding: "0 13px", fontSize: 10 }}
              onClick={() => toggle("password")}
            >
              MODIFICA
            </button>
          </div>

          {activeForm === "password" && (
            <form className="inline-edit-form" onSubmit={handlePassword}>
              <div>
                <div className="field-label" style={{ marginBottom: 6 }}>
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
                <div className="field-label" style={{ marginBottom: 6 }}>
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
                <div className="field-label" style={{ marginBottom: 6 }}>
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
                className="btn-accent-secondary"
                disabled={isChangingPw}
              >
                {isChangingPw ? "..." : "CONFERMA"}
              </button>
            </form>
          )}

          <button
            type="button"
            className="text-btn text-btn--secondary"
            style={{ fontSize: 11, textAlign: "left", marginTop: 4 }}
            onClick={handleLogout}
          >
            ESCI DALL'ACCOUNT
          </button>
        </div>
      </div>

      <div className="card section-card section-card--danger">
        <div className="field-label section-card__label section-card__label--danger">
          ZONA PERICOLOSA
        </div>
        <p className="section-card__text">
          Disattivando l'account non potrai più accedere finché non verrà
          riattivato da un amministratore. I tuoi contenuti non vengono
          eliminati.
        </p>
        <button
          type="button"
          className="btn-danger-sm"
          onClick={() => setShowDeactivate(true)}
        >
          DISATTIVA ACCOUNT
        </button>

        <p className="section-card__text" style={{ marginTop: 20 }}>
          Eliminando l'account, i tuoi dati privati (giri, veicoli, follow)
          verranno cancellati definitivamente; i contenuti già condivisi (post,
          commenti, percorsi) resteranno visibili ma senza più alcun
          collegamento alla tua identità. L'operazione non è reversibile.
        </p>
        <button
          type="button"
          className="btn-danger-sm"
          onClick={() => setShowDelete(true)}
        >
          ELIMINA ACCOUNT DEFINITIVAMENTE
        </button>
      </div>

      {showDeactivate && (
        <div className="modal-overlay" onClick={() => setShowDeactivate(false)}>
          <div className="card modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">DISATTIVARE L'ACCOUNT?</div>
            <p className="modal-text">
              Verrai disconnesso immediatamente e non potrai più accedere con
              queste credenziali. Sei sicuro di voler procedere?
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowDeactivate(false)}
              >
                ANNULLA
              </button>
              <button
                type="button"
                className="btn-danger"
                disabled={isDeactivating}
                onClick={handleDeactivate}
              >
                {isDeactivating ? "..." : "DISATTIVA"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDelete && (
        <div className="modal-overlay" onClick={() => setShowDelete(false)}>
          <div className="card modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">
              ELIMINARE DEFINITIVAMENTE L'ACCOUNT?
            </div>
            <p className="modal-text">
              Questa azione è permanente e non può essere annullata da nessuno,
              nemmeno da un amministratore.
            </p>

            <div style={{ marginBottom: 12 }}>
              <div className="field-label" style={{ marginBottom: 6 }}>
                PASSWORD ATTUALE
              </div>
              <PasswordInput
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                style={{ height: 42 }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <div className="field-label" style={{ marginBottom: 6 }}>
                SCRIVI "ELIMINA" PER CONFERMARE
              </div>
              <input
                type="text"
                className="input"
                style={{ height: 42 }}
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowDelete(false)}
              >
                ANNULLA
              </button>
              <button
                type="button"
                className="btn-danger"
                disabled={!canConfirmDelete || isDeleting}
                onClick={handleDelete}
              >
                {isDeleting ? "..." : "ELIMINA DEFINITIVAMENTE"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default SecuritySection
