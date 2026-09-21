import { useState } from "react"
import {
  useGetCatalogSuggestionsQuery,
  useUpdateCatalogSuggestionStatusMutation,
} from "../features/auth/adminApi"
import { Spinner } from "react-bootstrap"

const STATUS_LABELS = {
  PENDING: "IN ATTESA",
  ADDED: "AGGIUNTA",
  DISMISSED: "RIFIUTATA",
}

function AdminCatalogSuggestionsPage() {
  const [status, setStatus] = useState("PENDING")
  const [page, setPage] = useState(0)

  const { data, isLoading, isFetching, isError } =
    useGetCatalogSuggestionsQuery({
      status: status || undefined,
      page,
    })
  const [updateStatus] = useUpdateCatalogSuggestionStatusMutation()

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateStatus({ id, status: newStatus }).unwrap()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="page">
      <div className="page-title" style={{ fontSize: 26, marginBottom: 16 }}>
        SEGNALAZIONI CATALOGO
      </div>

      <div className="options-row" style={{ marginBottom: 16 }}>
        {[
          { value: "", label: "TUTTE" },
          ...Object.entries(STATUS_LABELS).map(([value, label]) => ({
            value,
            label,
          })),
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
          {data.content.map((s) => (
            <div key={s.id} className="card" style={{ padding: 14 }}>
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
                      fontFamily: "var(--font-heading)",
                      fontWeight: 700,
                      fontSize: 16,
                    }}
                  >
                    {s.brandName} {s.modelName && `— ${s.modelName}`}
                  </div>
                  <div className="duration-hint" style={{ marginTop: 4 }}>
                    Segnalato da {s.reporterUsername} ·{" "}
                    {new Date(s.createdAt).toLocaleDateString("it-IT", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      marginTop: 8,
                      flexWrap: "wrap",
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    {s.engineCc && <span>{s.engineCc} CC</span>}
                    {s.category && <span>{s.category}</span>}
                    {(s.yearStart || s.yearEnd) && (
                      <span>
                        {s.yearStart ?? "?"}–{s.yearEnd ?? "?"}
                      </span>
                    )}
                    {s.horsePower && <span>{s.horsePower} CV</span>}
                    {s.weightKg && <span>{s.weightKg} KG</span>}
                  </div>

                  {s.note && (
                    <p className="prose" style={{ marginTop: 8, fontSize: 13 }}>
                      {s.note}
                    </p>
                  )}

                  <span
                    className="badge-sm"
                    style={{ marginTop: 8, display: "inline-block" }}
                  >
                    {STATUS_LABELS[s.status]}
                  </span>
                </div>

                {s.status === "PENDING" && (
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
                      className="btn-approve"
                      style={{ padding: "6px 12px", fontSize: 11 }}
                      onClick={() => handleStatusChange(s.id, "ADDED")}
                    >
                      AGGIUNTA
                    </button>
                    <button
                      type="button"
                      className="btn-reject"
                      style={{ padding: "6px 12px", fontSize: 11 }}
                      onClick={() => handleStatusChange(s.id, "DISMISSED")}
                    >
                      RIFIUTA
                    </button>
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
    </div>
  )
}

export default AdminCatalogSuggestionsPage
