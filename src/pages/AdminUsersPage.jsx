import { useRef, useState } from "react"
import { Spinner } from "react-bootstrap"
import { FaCheckCircle, FaBan, FaTrash } from "react-icons/fa"
import {
  useGetAdminUsersQuery,
  useDeactivateAdminUserMutation,
  useReactivateAdminUserMutation,
  useAdminDeleteUserMutation,
} from "../features/auth/adminApi"
import "../pages/CSS/AdminUsersPage.css"
import { Link } from "react-router-dom"

const SORT_OPTIONS = [
  { value: "createdAt", label: "Data registrazione" },
  { value: "lastLogin", label: "Ultimo accesso" },
  { value: "username", label: "Username" },
  { value: "email", label: "Email" },
]

function AdminUsersPage() {
  const [page, setPage] = useState(0)
  const [orderBy, setOrderBy] = useState("createdAt")

  const [userToDelete, setUserToDelete] = useState(null)
  const [deleteReason, setDeleteReason] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  const [queryInput, setQueryInput] = useState("")
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("")
  const timerRef = useRef(null)

  const { data, isLoading, isFetching, isError } = useGetAdminUsersQuery({
    query: query || undefined,
    status: status || undefined,
    page,
    orderBy,
  })
  const [deactivate, { isLoading: isDeactivating }] =
    useDeactivateAdminUserMutation()
  const [reactivate, { isLoading: isReactivating }] =
    useReactivateAdminUserMutation()
  const [adminDeleteUser, { isLoading: isDeleting }] =
    useAdminDeleteUserMutation()

  const [userToDeactivate, setUserToDeactivate] = useState(null)
  const [deactivateReason, setDeactivateReason] = useState("")

  const handleQueryChange = (e) => {
    const value = e.target.value
    setQueryInput(value)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setQuery(value)
      setPage(0)
    }, 400)
  }

  const handleDeactivate = async () => {
    try {
      await deactivate({
        id: userToDeactivate.id,
        reason: deactivateReason.trim() || null,
      }).unwrap()
      setUserToDeactivate(null)
      setDeactivateReason("")
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async () => {
    setErrorMsg("")
    try {
      await adminDeleteUser({
        id: userToDelete.id,
        reason: deleteReason.trim(),
      }).unwrap()
      setUserToDelete(null)
      setDeleteReason("")
    } catch (err) {
      setErrorMsg(err.data?.message || "Impossibile eliminare l'account.")
    }
  }

  if (isLoading) {
    return (
      <div className="centered-spinner">
        <Spinner animation="border" style={{ color: "#FF7A2F" }} />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="empty-state" style={{ margin: 20 }}>
        Impossibile caricare gli utenti.
      </div>
    )
  }

  return (
    <div>
      <div
        className="page-title"
        style={{ fontSize: 26, marginBottom: 10, color: "white" }}
      >
        UTENTI
      </div>
      <div className="header-row admin-users-page__header">
        <input
          type="search"
          className="input input--compact me-5"
          placeholder="Cerca per username o email..."
          value={queryInput}
          onChange={handleQueryChange}
          style={{ marginRight: 10 }}
        />

        <div className="options-row" style={{}}>
          {[
            { value: "", label: "TUTTI" },
            { value: "ACTIVE", label: "ATTIVI" },
            { value: "DEACTIVATED", label: "DISATTIVATI" },
            { value: "DELETED", label: "ELIMINATI" },
          ].map((opt) => (
            <button
              key={opt.value || "all"}
              type="button"
              className={`option-toggle ${status === opt.value ? "option-toggle--active" : ""}`}
              onClick={() => {
                setStatus(opt.value)
                setPage(0)
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <select
          className="select"
          style={{
            width: 220,
            fontFamily: "var(--font-heading)",
            marginLeft: 10,
          }}
          value={orderBy}
          onChange={(e) => {
            setOrderBy(e.target.value)
            setPage(0)
          }}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              Ordina per {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div
        className="admin-user-list"
        style={{ opacity: isFetching ? 0.6 : 1 }}
      >
        {data.content.map((user) => (
          <div key={user.id} className="card admin-user-row">
            <Link
              to={`/profile/${user.username}`}
              className="admin-user-row__info"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div className="admin-user-row__username">{user.username}</div>
              <div className="admin-user-row__email">{user.email}</div>
            </Link>
            <div className="admin-user-row__meta">
              <span className="admin-user-row__meta-item">
                ISCRITTO {new Date(user.createdAt).toLocaleDateString("it-IT")}
              </span>
              {user.lastLogin && (
                <span className="admin-user-row__meta-item">
                  ULTIMO ACCESSO{" "}
                  {new Date(user.lastLogin).toLocaleDateString("it-IT")}
                </span>
              )}
            </div>
            <div className="admin-user-row__actions">
              {user.deleted ? (
                <span
                  className="meta-badge"
                  style={{ color: "var(--color-danger)" }}
                >
                  ELIMINATO
                </span>
              ) : (
                <>
                  <span
                    className={`meta-badge ${user.active ? "meta-badge--accent" : ""}`}
                  >
                    {user.active ? "ATTIVO" : "DISATTIVATO"}
                  </span>
                  <button
                    type="button"
                    className={user.active ? "btn-danger-xs" : "btn-approve"}
                    disabled={isDeactivating || isReactivating}
                    onClick={() =>
                      user.active
                        ? setUserToDeactivate(user)
                        : reactivate(user.id)
                    }
                  >
                    {user.active ? (
                      <>
                        <FaBan size={10} /> DISATTIVA
                      </>
                    ) : (
                      <>
                        <FaCheckCircle size={10} /> RIATTIVA
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn-danger-xs"
                    onClick={() => setUserToDelete(user)}
                  >
                    <FaTrash size={10} /> ELIMINA
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {data.totalPages > 1 && (
        <div className="pagination-row">
          <button
            type="button"
            className="btn-secondary"
            style={{
              height: 40,
              padding: "0 16px",
              opacity: data.first ? 0.4 : 1,
            }}
            disabled={data.first || isFetching}
            onClick={() => setPage((p) => p - 1)}
          >
            PRECEDENTE
          </button>
          <span className="pagination-row__label">
            {data.number + 1} / {data.totalPages}
          </span>
          <button
            type="button"
            className="btn-secondary"
            style={{
              height: 40,
              padding: "0 16px",
              opacity: data.last ? 0.4 : 1,
            }}
            disabled={data.last || isFetching}
            onClick={() => setPage((p) => p + 1)}
          >
            SUCCESSIVA
          </button>
        </div>
      )}

      {userToDeactivate && (
        <div
          className="modal-overlay"
          onClick={() => setUserToDeactivate(null)}
        >
          <div className="card modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">
              DISATTIVARE "{userToDeactivate.username.toUpperCase()}"?
            </div>
            <p className="modal-text">
              L'utente riceverà un'email con il motivo. Potrai riattivare
              l'account in qualsiasi momento.
            </p>
            <div style={{ marginBottom: 16 }}>
              <div className="field-label form-group__label">
                MOTIVO (OPZIONALE)
              </div>
              <textarea
                className="textarea"
                rows={3}
                value={deactivateReason}
                onChange={(e) => setDeactivateReason(e.target.value)}
              />
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setUserToDeactivate(null)}
              >
                INDIETRO
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleDeactivate}
                disabled={isDeactivating}
              >
                {isDeactivating ? "..." : "CONFERMA DISATTIVAZIONE"}
              </button>
            </div>
          </div>
        </div>
      )}

      {userToDelete && (
        <div className="modal-overlay" onClick={() => setUserToDelete(null)}>
          <div className="card modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">
              ELIMINARE "{userToDelete.username.toUpperCase()}"?
            </div>
            <p className="modal-text">
              L'account verrà anonimizzato in modo permanente e irreversibile. I
              contenuti pubblici (post, commenti, percorsi) resteranno visibili
              senza più alcun collegamento all'identità dell'utente.
            </p>
            <div style={{ marginBottom: 16 }}>
              <div className="field-label form-group__label">
                MOTIVO (OBBLIGATORIO)
              </div>
              <textarea
                className="textarea"
                rows={3}
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
              />
            </div>
            {errorMsg && (
              <div className="error-text" style={{ marginBottom: 12 }}>
                {errorMsg}
              </div>
            )}
            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setUserToDelete(null)}
              >
                INDIETRO
              </button>
              <button
                type="button"
                className="btn-danger"
                disabled={!deleteReason.trim() || isDeleting}
                onClick={handleDelete}
              >
                {isDeleting ? "..." : "CONFERMA ELIMINAZIONE"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminUsersPage
