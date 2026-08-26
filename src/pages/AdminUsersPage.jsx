import { useState } from "react"
import { Spinner } from "react-bootstrap"
import { FaCheckCircle, FaBan } from "react-icons/fa"
import {
  useGetAdminUsersQuery,
  useDeactivateAdminUserMutation,
  useReactivateAdminUserMutation,
} from "../features/auth/adminApi"
import "../pages/CSS/AdminUsersPage.css"

const SORT_OPTIONS = [
  { value: "createdAt", label: "Data registrazione" },
  { value: "lastLogin", label: "Ultimo accesso" },
  { value: "username", label: "Username" },
  { value: "email", label: "Email" },
]

function AdminUsersPage() {
  const [page, setPage] = useState(0)
  const [orderBy, setOrderBy] = useState("createdAt")

  const { data, isLoading, isFetching, isError } = useGetAdminUsersQuery({
    page,
    orderBy,
  })
  const [deactivate, { isLoading: isDeactivating }] =
    useDeactivateAdminUserMutation()
  const [reactivate, { isLoading: isReactivating }] =
    useReactivateAdminUserMutation()

  const handleToggle = (user) => {
    if (user.active) deactivate(user.id)
    else reactivate(user.id)
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
      <div className="header-row admin-users-page__header">
        <div className="page-title" style={{ fontSize: 26 }}>
          UTENTI
        </div>
        <select
          className="select"
          style={{ width: 220 }}
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
            <div className="admin-user-row__info">
              <div className="admin-user-row__username">{user.username}</div>
              <div className="admin-user-row__email">{user.email}</div>
            </div>
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
              <span
                className={`meta-badge ${user.active ? "meta-badge--accent" : ""}`}
              >
                {user.active ? "ATTIVO" : "DISATTIVATO"}
              </span>
              <button
                type="button"
                className={user.active ? "btn-danger-xs" : "btn-approve"}
                disabled={isDeactivating || isReactivating}
                onClick={() => handleToggle(user)}
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
    </div>
  )
}

export default AdminUsersPage
