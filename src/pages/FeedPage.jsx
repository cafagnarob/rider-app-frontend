import { useState } from "react"
import { Spinner } from "react-bootstrap"
import { useGetFeedQuery } from "../features/social/postsApi"
import PostCard from "../features/social/components/PostCard"
import CreatePostModal from "../features/social/components/CreatePostModal"
import { COLORS, FONTS, styles } from "../styles/theme"

const TABS = [
  { key: "FOLLOWING", label: "SEGUITI" },
  { key: "EXPLORE", label: "ESPLORA" },
]

function FeedPage() {
  const [type, setType] = useState("FOLLOWING")
  const [page, setPage] = useState(0)

  const feedArgs = { type, page }
  const {
    data: feed,
    isLoading,
    isFetching,
    isError,
  } = useGetFeedQuery(feedArgs)

  const handleTabChange = (newType) => {
    setType(newType)
    setPage(0)
  }

  const [showCreate, setShowCreate] = useState(false)

  return (
    <>
      <div style={{ ...styles.pageBg, paddingTop: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 20px",
          }}
        >
          <div style={{ ...styles.pageTitle, fontSize: 28 }}>FEED</div>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            style={{
              height: 40,
              padding: "0 15px",
              borderRadius: 12,
              background: COLORS.accent,
              border: "none",
              color: COLORS.onAccent,
              fontFamily: FONTS.heading,
              fontWeight: 700,
              fontSize: 15,
              letterSpacing: ".04em",
              cursor: "pointer",
            }}
          >
            + POST
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, padding: "18px 20px 0" }}>
          {TABS.map((tab) => {
            const active = type === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabChange(tab.key)}
                style={{
                  height: 36,
                  padding: "0 16px",
                  borderRadius: 11,
                  background: active ? COLORS.accent : COLORS.card,
                  border: `1px solid ${COLORS.border}`,
                  color: active ? COLORS.onAccent : COLORS.textSecondary,
                  fontFamily: FONTS.mono,
                  fontSize: 11,
                  letterSpacing: ".08em",
                  cursor: "pointer",
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {isLoading && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <Spinner animation="border" style={{ color: COLORS.accent }} />
          </div>
        )}

        {isError && (
          <div style={{ ...styles.emptyState, margin: "20px" }}>
            Impossibile caricare il feed.
          </div>
        )}

        {feed && feed.content.length === 0 && (
          <p
            style={{
              ...styles.fieldLabel,
              textTransform: "none",
              letterSpacing: "normal",
              textAlign: "center",
              padding: "60px 20px",
            }}
          >
            {type === "FOLLOWING"
              ? "Non ci sono ancora post dagli utenti che segui."
              : "Nessun post da esplorare al momento."}
          </p>
        )}

        {feed && feed.content.length > 0 && (
          <div style={{ opacity: isFetching ? 0.6 : 1, marginTop: 4 }}>
            {feed.content.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {feed && feed.totalPages > 1 && (
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
              disabled={feed.first || isFetching}
              onClick={() => setPage((p) => p - 1)}
              style={{
                ...styles.secondaryButton,
                height: 40,
                padding: "0 16px",
                opacity: feed.first ? 0.4 : 1,
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
              {feed.number + 1} / {feed.totalPages}
            </span>
            <button
              type="button"
              disabled={feed.last || isFetching}
              onClick={() => setPage((p) => p + 1)}
              style={{
                ...styles.secondaryButton,
                height: 40,
                padding: "0 16px",
                opacity: feed.last ? 0.4 : 1,
              }}
            >
              SUCCESSIVA
            </button>
          </div>
        )}

        <CreatePostModal
          show={showCreate}
          onClose={() => setShowCreate(false)}
        />
      </div>
    </>
  )
}

export default FeedPage
