import { useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { FaArrowLeft, FaHeart, FaRegHeart, FaTrash } from "react-icons/fa"
import { Spinner } from "react-bootstrap"
import {
  useGetPostByIdQuery,
  useGetCommentsQuery,
  useAddCommentMutation,
  useDeleteCommentMutation,
  useDeletePostMutation,
  useToggleLikeMutation,
} from "../features/social/postsApi"
import { useGetCurrentUserQuery } from "../features/users/usersApi"
import PostAutoCarousel from "../features/social/components/PostAutoCarousel"
import { formatRelativeTime } from "../utils/dateFormat"
import "../pages/CSS/PostDetailPage.css"
import Avatar from "../components/Avatar"
import PostWidgetsOverlay from "./PostWidgetsOverlay"

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
      <div className="centered-spinner">
        <Spinner animation="border" style={{ color: "#FF7A2F" }} />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="empty-state" style={{ margin: 20 }}>
        Post non trovato.
      </div>
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
    <div className="page" style={{ paddingBottom: 20 }}>
      <div className="icon-header">
        <button type="button" className="btn-icon" onClick={() => navigate(-1)}>
          <FaArrowLeft />
        </button>
        {isAuthor && (
          <button
            type="button"
            className="btn-icon icon-btn--danger ml-auto"
            onClick={handleDeletePost}
            disabled={isDeletingPost}
          >
            <FaTrash size={14} />
          </button>
        )}
      </div>

      <div className="post-detail-page__section">
        <div className="post-detail-page__author-row">
          <Link to={`/profile/${post.authorUsername}`}>
            <Avatar
              src={post.authorProfilePicture}
              alt={post.authorUsername}
              className="post-detail-page__avatar"
            />
          </Link>
          <div>
            <Link
              to={`/profile/${post.authorUsername}`}
              className="post-detail-page__author-name"
            >
              {post.authorUsername}
            </Link>
            <div className="post-detail-page__author-meta">
              {bikeLabel ? `${bikeLabel} · ` : ""}
              {formatRelativeTime(post.createdAt)}
            </div>
          </div>
        </div>

        {post.event && (
          <Link
            to={`/events/${post.event.id}`}
            className="post-detail-page__event-badge"
          >
            {post.event.title}
          </Link>
        )}

        {post.ride && (
          <div
            className={`post-detail-page__ride-badge ${post.event ? "post-detail-page__ride-badge--after-event" : ""}`}
          >
            {post.ride.distanceKm?.toFixed(1)} KM
          </div>
        )}

        {post.routeId && (
          <Link
            to={`/routes/${post.routeId}`}
            className={`post-detail-page__event-badge ${post.event || post.ride ? "post-detail-page__ride-badge--after-event" : ""}`}
          >
            {post.routeName || "PERCORSO"} ·{" "}
            {post.routeDistanceMeters != null
              ? (post.routeDistanceMeters / 1000).toFixed(1).replace(".", ",")
              : "—"}{" "}
            KM
          </Link>
        )}

        {post.media?.length > 0 && (
          <div className="post-detail-page__media">
            <PostAutoCarousel
              media={post.media}
              onDoubleClick={handleLike}
              renderOverlay={(m) => (
                <PostWidgetsOverlay widgets={post.widgets} mediaId={m.id} />
              )}
            />
          </div>
        )}

        {post.text && <p className="post-detail-page__text">{post.text}</p>}

        <button
          type="button"
          className={`post-detail-page__like-btn ${post.likedByCurrentUser ? "post-detail-page__like-btn--liked" : ""}`}
          onClick={handleLike}
        >
          {post.likedByCurrentUser ? (
            <FaHeart size={14} />
          ) : (
            <FaRegHeart size={14} />
          )}
          MI PIACE · {post.likeCount}
        </button>
      </div>

      <div className="post-detail-page__section">
        <div className="section-title">COMMENTI ({post.commentCount})</div>

        <form
          className="post-detail-page__comment-form"
          onSubmit={handleSubmit}
        >
          <input
            type="text"
            className="input post-detail-page__comment-input"
            maxLength={500}
            placeholder="Scrivi un commento..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
          />
          <button
            type="submit"
            className="post-detail-page__send-btn"
            disabled={isSending || !text.trim()}
            style={{ opacity: isSending || !text.trim() ? 0.5 : 1 }}
          >
            INVIA
          </button>
        </form>

        {errorMsg && (
          <div className="error-text" style={{ marginBottom: 12 }}>
            {errorMsg}
          </div>
        )}

        <div className="post-detail-page__comment-list">
          {comments?.content.length === 0 && (
            <p className="post-detail-page__empty-comments">
              Nessun commento. Scrivi il primo!
            </p>
          )}

          {comments?.content.map((comment) => {
            const canDelete =
              me?.username === comment.authorUsername || isAuthor
            return (
              <div key={comment.id} className="comment-row">
                <Avatar
                  src={comment.authorProfilePicture}
                  alt={comment.authorUsername}
                  className="comment-row__avatar"
                />
                <div className="comment-row__body">
                  <div className="comment-row__header">
                    <span className="comment-row__author">
                      {comment.authorUsername}
                    </span>
                    <span className="comment-row__time">
                      {formatRelativeTime(comment.createdAt)}
                    </span>
                  </div>
                  <p className="comment-row__text">{comment.text}</p>
                </div>
                {canDelete && (
                  <button
                    type="button"
                    className="comment-row__delete-btn"
                    onClick={() => handleDeleteComment(comment.id)}
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
