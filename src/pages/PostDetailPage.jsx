import { useState } from "react"
import { Spinner } from "react-bootstrap"
import { FaHeart, FaRegHeart, FaTrash, FaArrowLeft } from "react-icons/fa"
import { useParams, useNavigate, Link } from "react-router-dom"
import {
  useGetPostByIdQuery,
  useGetCommentsQuery,
  useAddCommentMutation,
  useDeleteCommentMutation,
  useDeletePostMutation,
  useToggleLikeMutation,
} from "../features/social/postsApi"
import { useGetCurrentUserQuery } from "../features/users/usersApi"
import { formatRelativeTime } from "../utils/dateFormat"
import { COLORS, FONTS, styles } from "../styles/theme"
import PostAutoCarousel from "../features/social/components/PostAutoCarousel"

function PostDetailPage() {
  const { postId } = useParams()
  const navigate = useNavigate()

  const { data: post, isLoading, isError } = useGetPostByIdQuery(postId)
  const { data: comments } = useGetCommentsQuery({ postId })
  const { data: me } = useGetCurrentUserQuery()

  const [addComment, { isLoading: isSending }] = useAddCommentMutation()
  const [deleteComment] = useDeleteCommentMutation()
  const [deletePost, { isLoading: isDeletingPost }] = useDeletePostMutation()
  const [toggleLike] = useToggleLikeMutation()

  const [text, setText] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  const isAuthor = me?.username === post?.authorUsername

  const handleLike = () => {
    if (!post) return
    toggleLike({ postId, liked: post.likedByCurrentUser })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg("")
    try {
      await addComment({ postId, text }).unwrap()
      setText("")
    } catch (err) {
      setErrorMsg(err.data?.message || "Impossibile inviare il commento.")
    }
  }

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment({ postId, commentId }).unwrap()
    } catch (err) {
      setErrorMsg(err.data?.message || "Impossibile eliminare il commento.")
    }
  }

  const handleDeletePost = async () => {
    try {
      await deletePost(postId).unwrap()
      navigate("/feed")
    } catch (err) {
      setErrorMsg(err.data?.message || "Impossibile eliminare il post.")
    }
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <Spinner animation="border" style={{ color: COLORS.accent }} />
      </div>
    )
  }

  if (isError) {
    return (
      <div style={{ ...styles.emptyState, margin: 20 }}>Post non trovato.</div>
    )
  }

  if (!post) {
    return null
  }

  const bikeLabel = post.vehicle
    ? post.vehicle.nickname ||
      `${post.vehicle.brandName} ${post.vehicle.modelName}`
    : null

  return (
    <div style={{ ...styles.pageBg, paddingTop: 20, paddingBottom: 20 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 20px 16px",
        }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={styles.iconButton}
        >
          <FaArrowLeft />
        </button>
        {isAuthor && (
          <button
            type="button"
            onClick={handleDeletePost}
            disabled={isDeletingPost}
            style={{
              ...styles.iconButton,
              marginLeft: "auto",
              color: COLORS.danger,
            }}
          >
            <FaTrash size={14} />
          </button>
        )}
      </div>

      <div style={{ padding: "0 20px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 14,
          }}
        >
          <Link to={`/profile/${post.authorUsername}`}>
            <img
              src={post.authorProfilePicture}
              alt={post.authorUsername}
              style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                objectFit: "cover",
                background: COLORS.surfaceRaised,
              }}
            />
          </Link>
          <div>
            <Link
              to={`/profile/${post.authorUsername}`}
              style={{
                fontFamily: FONTS.heading,
                fontWeight: 600,
                fontSize: 19,
                color: COLORS.text,
                textDecoration: "none",
              }}
            >
              {post.authorUsername}
            </Link>
            <div
              style={{
                fontFamily: FONTS.mono,
                fontSize: 10,
                color: COLORS.textMuted,
                marginTop: 2,
              }}
            >
              {bikeLabel ? `${bikeLabel} · ` : ""}
              {formatRelativeTime(post.createdAt)}
            </div>
          </div>
        </div>

        {post.event && (
          <Link
            to={`/events/${post.event.id}`}
            style={{
              display: "inline-block",
              marginBottom: 14,
              padding: "7px 12px",
              borderRadius: 11,
              background: COLORS.accentSoftBg,
              border: `1px solid ${COLORS.accentSoftBorder}`,
              fontFamily: FONTS.mono,
              fontSize: 11,
              color: COLORS.accent,
              textDecoration: "none",
            }}
          >
            {post.event.title}
          </Link>
        )}

        {post.ride && (
          <div
            style={{
              display: "inline-block",
              marginBottom: 14,
              marginLeft: post.event ? 8 : 0,
              padding: "7px 12px",
              borderRadius: 11,
              background: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              fontFamily: FONTS.mono,
              fontSize: 11,
              color: COLORS.textSecondary,
            }}
          >
            {post.ride.distanceKm?.toFixed(1)} KM
          </div>
        )}

        {post.media?.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <PostAutoCarousel media={post.media} onDoubleClick={handleLike} />
          </div>
        )}

        {post.text && (
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.5,
              color: "rgba(255,255,255,.88)",
              marginBottom: 16,
            }}
          >
            {post.text}
          </p>
        )}

        <button
          type="button"
          onClick={handleLike}
          style={{
            height: 42,
            padding: "0 15px",
            borderRadius: 13,
            marginBottom: 24,
            background: post.likedByCurrentUser
              ? COLORS.accentSoftBg
              : COLORS.card,
            border: `1px solid ${COLORS.border}`,
            color: post.likedByCurrentUser
              ? COLORS.accent
              : COLORS.textSecondary,
            fontFamily: FONTS.mono,
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            gap: 7,
            cursor: "pointer",
          }}
        >
          {post.likedByCurrentUser ? (
            <FaHeart size={14} />
          ) : (
            <FaRegHeart size={14} />
          )}
          MI PIACE · {post.likeCount}
        </button>
      </div>

      <div style={{ padding: "0 20px" }}>
        <div style={styles.sectionTitle}>COMMENTI ({post.commentCount})</div>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", gap: 8, margin: "16px 0" }}
        >
          <input
            type="text"
            maxLength={500}
            placeholder="Scrivi un commento..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
            style={{ ...styles.input, height: 44, flex: 1 }}
          />
          <button
            type="submit"
            disabled={isSending || !text.trim()}
            style={{
              height: 44,
              padding: "0 16px",
              borderRadius: 12,
              background: COLORS.accent,
              border: "none",
              color: COLORS.onAccent,
              fontFamily: FONTS.heading,
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              opacity: isSending || !text.trim() ? 0.5 : 1,
            }}
          >
            INVIA
          </button>
        </form>

        {errorMsg && (
          <div
            style={{
              fontFamily: FONTS.body,
              fontSize: 13,
              color: COLORS.danger,
              marginBottom: 12,
            }}
          >
            {errorMsg}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {comments?.content.length === 0 && (
            <p
              style={{
                fontFamily: FONTS.body,
                fontSize: 13,
                color: COLORS.textFaint,
              }}
            >
              Nessun commento. Scrivi il primo!
            </p>
          )}

          {comments?.content.map((comment) => {
            const canDelete =
              me?.username === comment.authorUsername || isAuthor
            return (
              <div key={comment.id} style={{ display: "flex", gap: 10 }}>
                <img
                  src={comment.authorProfilePicture}
                  alt={comment.authorUsername}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    objectFit: "cover",
                    background: COLORS.surfaceRaised,
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{ display: "flex", alignItems: "baseline", gap: 8 }}
                  >
                    <span
                      style={{
                        fontFamily: FONTS.heading,
                        fontWeight: 600,
                        fontSize: 15,
                      }}
                    >
                      {comment.authorUsername}
                    </span>
                    <span
                      style={{
                        fontFamily: FONTS.mono,
                        fontSize: 9,
                        color: COLORS.textFaint,
                      }}
                    >
                      {formatRelativeTime(comment.createdAt)}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: 13.5,
                      color: "rgba(255,255,255,.82)",
                      margin: "3px 0 0",
                    }}
                  >
                    {comment.text}
                  </p>
                </div>
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => handleDeleteComment(comment.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: COLORS.textFaint,
                      cursor: "pointer",
                      padding: 4,
                    }}
                  >
                    <FaTrash size={11} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default PostDetailPage
