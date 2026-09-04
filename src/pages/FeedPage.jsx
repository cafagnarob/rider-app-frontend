import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Spinner } from "react-bootstrap"
import { FaTimes, FaHeart, FaRegHeart, FaRegComment } from "react-icons/fa"
import {
  useGetFeedQuery,
  useGetUserPostsQuery,
  useToggleLikeMutation,
} from "../features/social/postsApi"
import { useGetCurrentUserQuery } from "../features/users/usersApi"
import { useGetUnreadCountQuery } from "../features/notification/notificationsApi"
import PostAutoCarousel from "../features/social/components/PostAutoCarousel"
import PostWidgetsOverlay from "../features/social/components/PostWidgetsOverlay"
import Avatar from "../components/Avatar"
import "../pages/CSS/FeedPage.css"

function ReelPost({ post }) {
  const navigate = useNavigate()
  const [toggleLike] = useToggleLikeMutation()

  const handleLike = () =>
    toggleLike({ postId: post.id, liked: post.likedByCurrentUser })

  return (
    <div className="reel-feed__post">
      <div className="reel-feed__media">
        <PostAutoCarousel
          media={post.media}
          onDoubleClick={handleLike}
          renderOverlay={(m) => (
            <PostWidgetsOverlay widgets={post.widgets} mediaId={m.id} />
          )}
        />
      </div>

      <div className="reel-overlay__bottom">
        <div className="reel-overlay__author-row">
          <Avatar
            src={post.authorProfilePicture}
            alt=""
            className="reel-overlay__avatar"
            onClick={() => navigate(`/profile/${post.authorUsername}`)}
          />
          <span
            className="reel-overlay__username"
            onClick={() => navigate(`/profile/${post.authorUsername}`)}
          >
            {post.authorUsername}
          </span>
        </div>
        {post.text && <p className="reel-overlay__caption">{post.text}</p>}
        <div className="reel-overlay__badges">
          {post.event && (
            <button
              type="button"
              className="post-ref-badge post-ref-badge--event"
              onClick={() => navigate(`/events/${post.event.id}`)}
            >
              {post.event.title}
            </button>
          )}
          {post.ride && (
            <button
              type="button"
              className="post-ref-badge post-ref-badge--ride"
              onClick={() => navigate(`/rides/${post.ride.id}`)}
            >
              {post.ride.title || "GIRO"} · {post.ride.distanceKm?.toFixed(1)}{" "}
              KM
            </button>
          )}
          {post.routeId && (
            <button
              type="button"
              className="post-ref-badge post-ref-badge--ride"
              onClick={() => navigate(`/routes/${post.routeId}`)}
            >
              {post.routeName || "PERCORSO"}
            </button>
          )}
        </div>
      </div>

      <div className="reel-overlay__actions">
        <button
          type="button"
          className="reel-overlay__action-btn"
          onClick={handleLike}
        >
          {post.likedByCurrentUser ? (
            <FaHeart size={26} />
          ) : (
            <FaRegHeart size={26} />
          )}
          <span>{post.likeCount}</span>
        </button>
        <button
          type="button"
          className="reel-overlay__action-btn"
          onClick={() => navigate(`/posts/${post.id}`)}
        >
          <FaRegComment size={26} />
          <span>{post.commentCount}</span>
        </button>
      </div>
    </div>
  )
}

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
    isError,
  } = useGetFeedQuery(
    { type, page },
    { skip: type === "MINE", refetchOnMountOrArgChange: true },
  )

  const handleTabChange = (newType) => {
    setType(newType)
    setPage(0)
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
      ) : isLoading ? (
        <div className="reel-feed__loading">
          <Spinner animation="border" style={{ color: "#FF7A2F" }} />
        </div>
      ) : isError ? (
        <div className="reel-feed__loading">
          <span className="feed-page__empty-text">
            Impossibile caricare il feed.
          </span>
        </div>
      ) : feed?.content.length === 0 ? (
        <div className="reel-feed__loading">
          <span className="feed-page__empty-text">
            {type === "FOLLOWING"
              ? "Non ci sono ancora post dagli utenti che segui."
              : "Nessun post da esplorare al momento."}
          </span>
        </div>
      ) : (
        <div className="reel-feed__scroll">
          {feed?.content.map((post) => (
            <ReelPost key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}

export default FeedPage
