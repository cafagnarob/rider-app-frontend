import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Spinner } from "react-bootstrap"
import { FaTimes } from "react-icons/fa"
import {
  useGetFeedQuery,
  useGetUserPostsQuery,
} from "../features/social/postsApi"
import { useGetCurrentUserQuery } from "../features/users/usersApi"
import { useGetUnreadCountQuery } from "../features/notification/notificationsApi"

import Avatar from "../components/Avatar"
import "../pages/CSS/FeedPage.css"
import ReelPost from "../features/social/components/ReelPost"

function MineAvatarTab({
  me,
  active,
  onSelect,
  unreadCount,
  navigate,
  badgeClickable,
}) {
  return (
    <button
      type="button"
      className={`tab-pill tab-pill--avatar ${active ? "tab-pill--active" : ""}`}
      style={{ position: "relative" }}
      onClick={onSelect}
    >
      <Avatar
        src={me?.profilePicture}
        alt=""
        className="feed-page__mine-tab-avatar"
      />
      {unreadCount > 0 && (
        <span
          className="reel-feed__avatar-badge"
          onClick={(e) => {
            if (!badgeClickable) return
            e.stopPropagation()
            navigate("/notifications")
          }}
          style={{ cursor: badgeClickable ? "pointer" : "default" }}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  )
}

function FeedPage() {
  const [type, setType] = useState("FOLLOWING")
  const [page, setPage] = useState(0)
  const [feedAccumulated, setFeedAccumulated] = useState([])
  const [prevFeedData, setPrevFeedData] = useState(null)
  const [isSwitchingTab, setIsSwitchingTab] = useState(false)
  const navigate = useNavigate()

  const { data: me } = useGetCurrentUserQuery()
  const { data: unread } = useGetUnreadCountQuery(undefined, {
    pollingInterval: 30000,
  })
  const unreadCount = unread?.count || 0

  const { data: myPosts, isLoading: isLoadingMine } = useGetUserPostsQuery(
    { userId: me?.id, page },
    { skip: type !== "MINE" || !me?.id, refetchOnMountOrArgChange: true },
  )

  const {
    data: feed,
    isLoading,
    isFetching,
    isError,
  } = useGetFeedQuery(
    { type, page },
    { skip: type === "MINE", refetchOnMountOrArgChange: true },
  )

  if (feed && feed !== prevFeedData) {
    setPrevFeedData(feed)
    setFeedAccumulated((prev) =>
      page === 0 ? feed.content : [...prev, ...feed.content],
    )
    if (page === 0) setIsSwitchingTab(false)
  }

  const handleFeedScroll = (e) => {
    if (isFetching || feed?.last) return
    const el = e.target
    if (
      el.scrollTop + el.clientHeight >=
      el.scrollHeight - window.innerHeight * 0.5
    ) {
      setPage((p) => p + 1)
    }
  }

  const handleTabChange = (newType) => {
    if (newType === type) return
    setType(newType)
    setPage(0)
    setFeedAccumulated([])
    setPrevFeedData(null)
    setIsSwitchingTab(true)
  }

  return (
    <div className="reel-feed">
      <div className="reel-feed__top-overlay">
        <button
          type="button"
          className="reel-feed__close-btn"
          onClick={() => navigate("/")}
        >
          <FaTimes />
        </button>

        {type === "MINE" ? (
          <div className="reel-feed__grid-header-row">
            <button
              type="button"
              className="tab-pill"
              onClick={() => handleTabChange("FOLLOWING")}
            >
              FEED
            </button>
            <div className="reel-feed__grid-header-spacer" />

            <MineAvatarTab
              me={me}
              active
              navigate={navigate}
              unreadCount={unreadCount}
              onSelect={() => {}}
              badgeClickable={true}
            />
          </div>
        ) : (
          <div className="tab-pills reel-feed__tabs">
            <button
              type="button"
              className={`tab-pill ${type === "FOLLOWING" ? "tab-pill--active" : ""}`}
              onClick={() => handleTabChange("FOLLOWING")}
            >
              SEGUITI
            </button>
            <button
              type="button"
              className={`tab-pill ${type === "EXPLORE" ? "tab-pill--active" : ""}`}
              onClick={() => handleTabChange("EXPLORE")}
            >
              ESPLORA
            </button>
            <MineAvatarTab
              me={me}
              active={false}
              navigate={navigate}
              unreadCount={unreadCount}
              onSelect={() => handleTabChange("MINE")}
              badgeClickable={false}
            />
          </div>
        )}

        <button
          type="button"
          className="reel-feed__create-btn"
          onClick={() => navigate("/posts/new")}
        >
          +
        </button>
      </div>

      {type === "MINE" ? (
        <div className="reel-feed__grid-wrap">
          {isLoadingMine ? (
            <div className="centered-spinner">
              <Spinner animation="border" style={{ color: "#FF7A2F" }} />
            </div>
          ) : myPosts?.content.length === 0 ? (
            <p className="feed-page__empty-text">
              Non hai ancora pubblicato nulla.
            </p>
          ) : (
            <div className="post-grid">
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
        </div>
      ) : isLoading || isSwitchingTab ? (
        <div className="reel-feed__loading">
          <Spinner animation="border" style={{ color: "#FF7A2F" }} />
        </div>
      ) : isError ? (
        <div className="reel-feed__loading">
          <span className="feed-page__empty-text">
            Impossibile caricare il feed.
          </span>
        </div>
      ) : !feed ? (
        <div className="reel-feed__loading">
          <Spinner animation="border" style={{ color: "#FF7A2F" }} />
        </div>
      ) : feed.content.length === 0 ? (
        <div className="reel-feed__loading">
          <span className="feed-page__empty-text">
            {type === "FOLLOWING"
              ? "Non ci sono ancora post dagli utenti che segui."
              : "Nessun post da esplorare al momento."}
          </span>
        </div>
      ) : (
        <div className="reel-feed__scroll" onScroll={handleFeedScroll}>
          {feedAccumulated.map((post) => (
            <ReelPost
              key={post.id}
              post={post}
              onDeleted={(id) =>
                setFeedAccumulated((prev) => prev.filter((p) => p.id !== id))
              }
            />
          ))}
          {isFetching && page > 0 && (
            <div className="reel-feed__post reel-feed__loading-more">
              <Spinner animation="border" style={{ color: "#FF7A2F" }} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default FeedPage
