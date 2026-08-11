import { useState } from "react"
import { Spinner } from "react-bootstrap"
import { useGetFeedQuery } from "../features/social/postsApi"
import NotificationBell from "../features/notification/components/NotificationBell"
import PostCard from "../features/social/components/PostCard"
import CreatePostModal from "../features/social/components/CreatePostModal"
import "../pages/CSS/FeedPage.css"

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
    <div className="page">
      <div className="feed-page__header">
        <div className="page-title" style={{ fontSize: 28 }}>
          FEED
        </div>

        <div className="feed-page__header-actions">
          <NotificationBell />
          <button
            type="button"
            className="btn-accent-sm"
            onClick={() => setShowCreate(true)}
          >
            + POST
          </button>
        </div>
      </div>

      <div className="tab-pills feed-page__tabs">
        {TABS.map((tab) => {
          const active = type === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              className={`tab-pill ${active ? "tab-pill--active" : ""}`}
              onClick={() => handleTabChange(tab.key)}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {isLoading && (
        <div className="centered-spinner">
          <Spinner animation="border" style={{ color: "#FF7A2F" }} />
        </div>
      )}

      {isError && (
        <div className="empty-state" style={{ margin: 20 }}>
          Impossibile caricare il feed.
        </div>
      )}

      {feed && feed.content.length === 0 && (
        <p className="feed-page__empty-text">
          {type === "FOLLOWING"
            ? "Non ci sono ancora post dagli utenti che segui."
            : "Nessun post da esplorare al momento."}
        </p>
      )}

      {feed && feed.content.length > 0 && (
        <div
          className="feed-page__list"
          style={{ opacity: isFetching ? 0.6 : 1 }}
        >
          {feed.content.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {feed && feed.totalPages > 1 && (
        <div className="pagination-row">
          <button
            type="button"
            className="btn-secondary"
            style={{
              height: 40,
              padding: "0 16px",
              opacity: feed.first ? 0.4 : 1,
            }}
            disabled={feed.first || isFetching}
            onClick={() => setPage((p) => p - 1)}
          >
            PRECEDENTE
          </button>
          <span className="pagination-row__label">
            {feed.number + 1} / {feed.totalPages}
          </span>
          <button
            type="button"
            className="btn-secondary"
            style={{
              height: 40,
              padding: "0 16px",
              opacity: feed.last ? 0.4 : 1,
            }}
            disabled={feed.last || isFetching}
            onClick={() => setPage((p) => p + 1)}
          >
            SUCCESSIVA
          </button>
        </div>
      )}

      <CreatePostModal show={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  )
}

export default FeedPage
