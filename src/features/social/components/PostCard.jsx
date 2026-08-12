import { useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { FaHeart, FaRegHeart, FaRegComment } from "react-icons/fa"
import { useToggleLikeMutation } from "../postsApi"
import { formatRelativeTime } from "../../../utils/dateFormat"
import PostMediaCarousel from "./PostMediaCarousel"

function PostCard({ post }) {
  const navigate = useNavigate()
  const clickTimer = useRef(null)
  const [toggleLike] = useToggleLikeMutation()

  const [justLiked, setJustLiked] = useState(false)

  const handleLike = () => {
    const willLike = !post.likedByCurrentUser
    toggleLike({ postId: post.id, liked: post.likedByCurrentUser })
    if (willLike) {
      setJustLiked(true)
      setTimeout(() => setJustLiked(false), 350)
    }
  }

  const goToProfile = () => navigate(`/profile/${post.authorUsername}`)
  const goToDetail = () => navigate(`/posts/${post.id}`)

  const bikeLabel = post.vehicle
    ? post.vehicle.nickname ||
      `${post.vehicle.brandName} ${post.vehicle.modelName}`
    : null

  const handleImageClick = () => {
    if (clickTimer.current) {
      clearTimeout(clickTimer.current)
      clickTimer.current = null
      handleLike()
    } else {
      clickTimer.current = setTimeout(() => {
        clickTimer.current = null
      }, 260)
    }
  }

  return (
    <div className="post-card">
      <div className="post-author-row">
        <img
          src={post.authorProfilePicture}
          alt={post.authorUsername}
          className="post-author-row__avatar"
          onClick={goToProfile}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <span className="post-author-row__name" onClick={goToProfile}>
            {post.authorUsername}
          </span>
          <div className="post-author-row__meta">
            {bikeLabel ? `${bikeLabel} · ` : ""}
            {formatRelativeTime(post.createdAt)}
          </div>
        </div>
      </div>

      <div className="post-ref-badges">
        {post.event && (
          <button
            type="button"
            className="post-ref-badge post-ref-badge--event"
            onClick={goToDetail}
          >
            {post.event.title}
          </button>
        )}
        {post.ride && (
          <button
            type="button"
            className="post-ref-badge post-ref-badge--ride"
            onClick={goToDetail}
          >
            {post.ride.title || "GIRO"} · {post.ride.distanceKm?.toFixed(1)} KM
          </button>
        )}
      </div>

      {post.media?.length > 0 && (
        <div
          style={{ marginTop: 12, cursor: "pointer" }}
          onClick={handleImageClick}
        >
          <PostMediaCarousel media={post.media} />
        </div>
      )}

      {post.text && (
        <div className="post-text" onClick={goToDetail}>
          {post.text}
        </div>
      )}

      <div className="post-actions-row">
        <button
          type="button"
          className={`post-action-btn ${post.likedByCurrentUser ? "post-action-btn--liked" : ""}`}
          onClick={handleLike}
        >
          <span
            className={`post-action-btn__icon ${justLiked ? "post-action-btn__icon--pop" : ""}`}
          >
            {post.likedByCurrentUser ? (
              <FaHeart size={13} />
            ) : (
              <FaRegHeart size={13} />
            )}
          </span>
          MI PIACE · {post.likeCount}
        </button>

        <button type="button" className="post-action-btn" onClick={goToDetail}>
          <FaRegComment size={13} />
          COMMENTI · {post.commentCount}
        </button>
      </div>
    </div>
  )
}

export default PostCard
