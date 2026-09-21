import { useState } from "react"
import {
  useDismissReportMutation,
  useGetAdminReportsQuery,
  useResolveReportMutation,
} from "../features/auth/adminApi"
import { Spinner } from "react-bootstrap"
import { Link } from "react-router-dom"

const REASON_LABELS = {
  SPAM: "SPAM",
  CONTENUTO_OFFENSIVO: "CONTENUTO OFFENSIVO",
  MOLESTIE: "MOLESTIE",
  PROFILO_FALSO: "PROFILO FALSO",
  ALTRO: "ALTRO",
}
const TARGET_LABELS = { POST: "POST", COMMENT: "COMMENTO", USER: "PROFILO" }

function AdminReportsPage() {
  const [status, setStatus] = useState("PENDING")
  const [targetType, setTargetType] = useState("")
  const [page, setPage] = useState(0)

  const { data, isLoading, isFetching, isError } = useGetAdminReportsQuery({
    status: status || undefined,
    targetType: targetType || undefined,
    page,
  })
  const [dismissReport, { isLoading: isDismissing }] =
    useDismissReportMutation()
  const [resolveReport, { isLoading: isResolving }] = useResolveReportMutation()

  const [reportToResolve, setReportToResolve] = useState(null)
  const [resolveReason, setResolveReason] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  const handleDismiss = async (id) => {
    try {
      await dismissReport(id).unwrap()
    } catch (err) {
      console.error(err)
    }
  }

  const handleResolve = async () => {
    setErrorMsg("")
    try {
      await resolveReport({
        id: reportToResolve.id,
        reason: resolveReason.trim() || null,
      }).unwrap()
      setReportToResolve(null)
      setResolveReason("")
    } catch (err) {
      setErrorMsg(err.data?.message || "Impossibile rimuovere il contenuto.")
    }
  }

  return (
    <div className="page">
      <div className="page-title" style={{ fontSize: 26, marginBottom: 16 }}>
        SEGNALAZIONI
      </div>

      <div className="field-row" style={{ marginBottom: 16 }}>
        <select
          className="select"
          style={{ fontFamily: "var(--font-heading)" }}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(0)
          }}
        >
          <option value="PENDING">IN ATTESA</option>
          <option value="DISMISSED">RESPINTE</option>
          <option value="ACTIONED">GESTITE</option>
        </select>

        <select
          className="select"
          style={{ fontFamily: "var(--font-heading)" }}
          value={targetType}
          onChange={(e) => {
            setTargetType(e.target.value)
            setPage(0)
          }}
        >
          <option value="">TUTTI I TIPI</option>
          <option value="POST">POST</option>
          <option value="COMMENT">COMMENTI</option>
          <option value="USER">PROFILI</option>
        </select>
      </div>

      {isLoading && (
        <div className="centered-spinner">
          <Spinner animation="border" style={{ color: "#FF7A2F" }} />
        </div>
      )}

      {isError && (
        <div className="empty-state" style={{ margin: 20 }}>
          Impossibile caricare le segnalazioni.
        </div>
      )}

      {data && data.content.length === 0 && (
        <p className="empty-list-text">Nessuna segnalazione trovata.</p>
      )}

      {data && data.content.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            opacity: isFetching ? 0.6 : 1,
          }}
        >
          {data.content.map((r) => (
            <div key={r.id} className="card" style={{ padding: 14 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      marginBottom: 6,
                      flexWrap: "wrap",
                    }}
                  >
                    <span className="badge-sm badge-sm--accent">
                      {TARGET_LABELS[r.targetType]}
                    </span>
                    <span className="badge-sm">{REASON_LABELS[r.reason]}</span>
                    {r.pendingReportCountForTarget > 1 && (
                      <span
                        className="badge-sm"
                        style={{ color: "var(--color-danger)" }}
                      >
                        {r.pendingReportCountForTarget} SEGNALAZIONI
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 13,
                      color: "var(--color-text-secondary)",
                      marginBottom: 4,
                    }}
                  >
                    "{r.targetPreview}"
                  </div>

                  <div className="duration-hint">
                    Segnalato da {r.reporterUsername} ·{" "}
                    {new Date(r.createdAt).toLocaleDateString("it-IT", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>

                  {r.note && (
                    <p className="prose" style={{ marginTop: 8, fontSize: 13 }}>
                      {r.note}
                    </p>
                  )}

                  {r.targetType === "USER" && (
                    <Link
                      to={`/profile/${r.targetPreview}`}
                      className="text-btn text-btn--accent"
                      style={{ marginTop: 8, display: "inline-block" }}
                    >
                      VAI AL PROFILO
                    </Link>
                  )}
                  {(r.targetType === "POST" || r.targetType === "COMMENT") &&
                    r.linkedPostId && (
                      <Link
                        to={`/posts/${r.linkedPostId}`}
                        className="text-btn text-btn--accent"
                        style={{ marginTop: 8, display: "inline-block" }}
                      >
                        VAI AL POST
                      </Link>
                    )}
                </div>

                {r.status === "PENDING" && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      flexShrink: 0,
                    }}
                  >
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ padding: "6px 12px", fontSize: 11 }}
                      disabled={isDismissing}
                      onClick={() => handleDismiss(r.id)}
                    >
                      RESPINGI
                    </button>
                    {r.targetType !== "USER" && (
                      <button
                        type="button"
                        className="btn-danger-xs"
                        onClick={() => setReportToResolve(r)}
                      >
                        RIMUOVI CONTENUTO
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {data && data.totalPages > 1 && (
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

      {reportToResolve && (
        <div className="modal-overlay" onClick={() => setReportToResolve(null)}>
          <div className="card modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">RIMUOVERE IL CONTENUTO?</div>
            <p className="modal-text">
              L'autore riceverà una notifica con il motivo. L'operazione non è
              reversibile.
            </p>
            <div style={{ marginBottom: 16 }}>
              <div className="field-label form-group__label">
                MOTIVO (OPZIONALE)
              </div>
              <textarea
                className="textarea"
                rows={3}
                value={resolveReason}
                onChange={(e) => setResolveReason(e.target.value)}
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
                onClick={() => setReportToResolve(null)}
              >
                INDIETRO
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleResolve}
                disabled={isResolving}
              >
                {isResolving ? "..." : "CONFERMA RIMOZIONE"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminReportsPage
