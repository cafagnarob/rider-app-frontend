import { FaHeart, FaRegHeart, FaRegComment } from "react-icons/fa"
import { useNavigate } from "react-router-dom"
import { useToggleLikeMutation } from "../postsApi"
import { formatRelativeTime } from "../../../utils/dateFormat"
import { COLORS, FONTS } from "../../../styles/theme"
import PostMediaCarousel from "./PostMediaCarousel"
import { useRef, useState } from "react"

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
    <div
      style={{
        borderTop: `1px solid ${COLORS.borderSoft}`,
        padding: "16px 20px 4px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <img
          src={post.authorProfilePicture}
          alt={post.authorUsername}
          onClick={goToProfile}
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            objectFit: "cover",
            background: COLORS.surfaceRaised,
            cursor: "pointer",
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <span
            onClick={goToProfile}
            style={{
              fontFamily: FONTS.heading,
              fontWeight: 600,
              fontSize: 18,
              lineHeight: 1,
              color: COLORS.text,
              cursor: "pointer",
            }}
          >
            {post.authorUsername}
          </span>
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 10,
              color: COLORS.textMuted,
              marginTop: 3,
            }}
          >
            {bikeLabel ? `${bikeLabel} · ` : ""}
            {formatRelativeTime(post.createdAt)}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
        {post.event && (
          <button
            type="button"
            onClick={goToDetail}
            style={{
              display: "inline-block",
              marginTop: 12,
              padding: "6px 11px",
              borderRadius: 10,
              background: COLORS.accentSoftBg,
              border: `1px solid ${COLORS.accentSoftBorder}`,
              fontFamily: FONTS.mono,
              fontSize: 11,
              color: COLORS.accent,
              cursor: "pointer",
            }}
          >
            {post.event.title}
          </button>
        )}

        {post.ride && (
          <button
            type="button"
            onClick={goToDetail}
            style={{
              display: "inline-block",
              marginTop: 12,
              marginLeft: post.event ? 8 : 0,
              padding: "6px 11px",
              borderRadius: 10,
              background: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              fontFamily: FONTS.mono,
              fontSize: 11,
              color: COLORS.textSecondary,
              cursor: "pointer",
            }}
          >
            {post.ride.title || "GIRO"} · {post.ride.distanceKm?.toFixed(1)} KM
          </button>
        )}
      </div>

      {post.media?.length > 0 && (
        <div
          onClick={handleImageClick}
          style={{ marginTop: 12, cursor: "pointer" }}
        >
          <PostMediaCarousel media={post.media} />
        </div>
      )}

      {post.text && (
        <div
          onClick={goToDetail}
          style={{
            fontSize: 14,
            lineHeight: 1.45,
            color: "rgba(255,255,255,.86)",
            marginTop: 12,
            cursor: "pointer",
          }}
        >
          {post.text}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, margin: "12px 0" }}>
        <button
          type="button"
          onClick={handleLike}
          style={{
            height: 40,
            padding: "0 14px",
            borderRadius: 12,
            background: post.likedByCurrentUser
              ? COLORS.accentSoftBg
              : COLORS.card,
            border: `1px solid ${COLORS.border}`,
            color: post.likedByCurrentUser
              ? COLORS.accent
              : COLORS.textSecondary,
            fontFamily: FONTS.mono,
            fontSize: 11,
            display: "flex",
            alignItems: "center",
            gap: 6,
            cursor: "pointer",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              animation: justLiked ? "heartPop 0.35s ease-out" : "none",
            }}
          >
            {post.likedByCurrentUser ? (
              <FaHeart size={13} />
            ) : (
              <FaRegHeart size={13} />
            )}
          </span>
          MI PIACE · {post.likeCount}
        </button>

        <button
          type="button"
          onClick={goToDetail}
          style={{
            height: 40,
            padding: "0 14px",
            borderRadius: 12,
            background: COLORS.card,
            border: `1px solid ${COLORS.border}`,
            color: COLORS.textSecondary,
            fontFamily: FONTS.mono,
            fontSize: 11,
            display: "flex",
            alignItems: "center",
            gap: 6,
            cursor: "pointer",
          }}
        >
          <FaRegComment size={13} />
          COMMENTI · {post.commentCount}
        </button>
      </div>
    </div>
  )
}

export default PostCard
