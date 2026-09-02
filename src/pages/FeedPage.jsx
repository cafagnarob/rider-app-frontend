import { useState } from "react"
import { Spinner } from "react-bootstrap"
import { useGetFeedQuery } from "../features/social/postsApi"
import NotificationBell from "../features/notification/components/NotificationBell"
import PostCard from "../features/social/components/PostCard"
import CreatePostModal from "../features/social/components/CreatePostModal"
import "../pages/CSS/FeedPage.css"
import { Link } from "react-router-dom"
import { useGetCurrentUserQuery } from "../features/users/usersApi"
import { useGetUserPostsQuery } from "../features/social/postsApi"
import Avatar from "../components/Avatar"

const TABS = [
  { key: "FOLLOWING", label: "SEGUITI" },
  { key: "EXPLORE", label: "ESPLORA" },
  { key: "MINE", label: "IL MIO PROFILO" },
]

function FeedPage() {
  const [type, setType] = useState("FOLLOWING")
  const [page, setPage] = useState(0)

  const { data: me } = useGetCurrentUserQuery()

  const {
    data: myPosts,
    isLoading: isLoadingMine,
    isFetching: isFetchingMine,
  } = useGetUserPostsQuery(
    { userId: me?.id, page },
    { skip: type !== "MINE" || !me?.id, refetchOnMountOrArgChange: true },
  )

  const feedArgs = { type, page }
  const {
    data: feed,
    isLoading,
    isFetching,
    isError,
  } = useGetFeedQuery(feedArgs, {
    skip: type === "MINE",
    refetchOnMountOrArgChange: true,
  })

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
          <div className="mobile-only">
            <NotificationBell />
          </div>
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
              className={`tab-pill ${tab.key === "MINE" ? "tab-pill--avatar" : ""} ${active ? "tab-pill--active" : ""}`}
              onClick={() => handleTabChange(tab.key)}
            >
              {tab.key === "MINE" ? (
                <Avatar
                  src={me?.profilePicture}
                  alt=""
                  className="feed-page__mine-tab-avatar"
                />
              ) : (
                tab.label
              )}
            </button>
          )
        })}
      </div>

      {type === "MINE" ? (
        <>
          {isLoadingMine ? (
            <div className="centered-spinner">
              <Spinner animation="border" style={{ color: "#FF7A2F" }} />
            </div>
          ) : myPosts?.content.length === 0 ? (
            <p className="feed-page__empty-text">
              Non hai ancora pubblicato nulla.
            </p>
          ) : (
            <div
              className="post-grid"
              style={{ opacity: isFetchingMine ? 0.6 : 1 }}
            >
              {myPosts?.content.map((post) => (
                <Link
                  key={post.id}
                  to={`/posts/${post.id}`}
                  className="post-grid__item"
                >
                  {post.media?.[0] && (
                    <img src={post.media[0].mediaUrl} alt="" />
                  )}
                </Link>
              ))}
            </div>
          )}

          {myPosts?.totalPages > 1 && (
            <div className="pagination-row">
              <button
                type="button"
                className="btn-secondary"
                style={{
                  height: 40,
                  padding: "0 16px",
                  opacity: myPosts.first ? 0.4 : 1,
                }}
                disabled={myPosts.first || isFetchingMine}
                onClick={() => setPage((p) => p - 1)}
              >
                PRECEDENTE
              </button>
              <span className="pagination-row__label">
                {myPosts.number + 1} / {myPosts.totalPages}
              </span>
              <button
                type="button"
                className="btn-secondary"
                style={{
                  height: 40,
                  padding: "0 16px",
                  opacity: myPosts.last ? 0.4 : 1,
                }}
                disabled={myPosts.last || isFetchingMine}
                onClick={() => setPage((p) => p + 1)}
              >
                SUCCESSIVA
              </button>
            </div>
          )}
        </>
      ) : (
        <>
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
        </>
      )}

      <CreatePostModal show={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  )
}

export default FeedPage
