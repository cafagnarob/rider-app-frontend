import { useNavigate } from "react-router-dom"
import { useGetCurrentUserQuery } from "../../users/usersApi"
import {
  useAddCommentMutation,
  useAddReplyMutation,
  useDeleteCommentMutation,
  useDeletePostMutation,
  useGetCommentsQuery,
  useToggleLikeMutation,
} from "../postsApi"
import { useState } from "react"
import PostAutoCarousel from "./PostAutoCarousel"
import PostWidgetsOverlay from "./PostWidgetsOverlay"
import {
  FaHeart,
  FaRegComment,
  FaRegHeart,
  FaTimes,
  FaTrash,
} from "react-icons/fa"
import Avatar from "../../../components/Avatar"

import CommentThread from "./CommentThread"

function ReelPost({ post, onDeleted }) {
  const navigate = useNavigate()
  const { data: me } = useGetCurrentUserQuery()
  const [toggleLike] = useToggleLikeMutation()
  const [deletePost, { isLoading: isDeletingPost }] = useDeletePostMutation()

  const [showComments, setShowComments] = useState(false)
  const { data: comments } = useGetCommentsQuery(
    { postId: post.id },
    { skip: !showComments },
  )
  const [addComment, { isLoading: isSending }] = useAddCommentMutation()
  const [deleteComment] = useDeleteCommentMutation()
  const [commentText, setCommentText] = useState("")
  const [commentError, setCommentError] = useState("")
  const [replyingTo, setReplyingTo] = useState(null) // { commentId, username } | null
  const [replyText, setReplyText] = useState("")
  const [addReply] = useAddReplyMutation()

  const handleStartReply = (commentId, username) => {
    setReplyingTo((prev) =>
      prev?.commentId === commentId ? null : { commentId, username },
    )
    setReplyText("")
  }

  const handleSubmitReply = async (commentId) => {
    if (!replyText.trim()) return
    try {
      await addReply({ postId: post.id, commentId, text: replyText }).unwrap()
      setReplyText("")
      setReplyingTo(null)
    } catch (err) {
      setCommentError(err.data?.message || "Impossibile inviare la risposta.")
    }
  }

  const isAuthor = me?.username === post.authorUsername

  const handleLike = () =>
    toggleLike({ postId: post.id, liked: post.likedByCurrentUser })

  const handleDeletePost = async () => {
    try {
      await deletePost(post.id).unwrap()
      onDeleted?.(post.id)
    } catch (err) {
      setCommentError(err.data?.message || "Impossibile eliminare il post.")
    }
  }

  const handleSubmitComment = async (e) => {
    e.preventDefault()
    setCommentError("")
    try {
      await addComment({ postId: post.id, text: commentText }).unwrap()
      setCommentText("")
    } catch (err) {
      setCommentError(err.data?.message || "Impossibile inviare il commento.")
    }
  }

  const handleDeleteComment = async (commentId, parentCommentId) => {
    try {
      await deleteComment({
        postId: post.id,
        commentId,
        parentCommentId,
      }).unwrap()
    } catch (err) {
      setCommentError(err.data?.message || "Impossibile eliminare il commento.")
    }
  }

  return (
    <div className="reel-feed__post">
      <div className="reel-feed__media">
        <PostAutoCarousel
          media={post.media}
          onDoubleClick={handleLike}
          renderOverlay={(m) => (
            <PostWidgetsOverlay
              widgets={post.widgets}
              mediaId={m.id}
              postAuthorUsername={post.authorUsername}
            />
          )}
        />
      </div>

      {isAuthor && (
        <button
          type="button"
          className="reel-post__delete-btn"
          onClick={handleDeletePost}
          disabled={isDeletingPost}
        >
          <FaTrash size={14} />
        </button>
      )}

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
          onClick={() => setShowComments(true)}
        >
          <FaRegComment size={26} />
          <span>{post.commentCount}</span>
        </button>
      </div>

      {showComments && (
        <>
          <div
            className="reel-comments__scrim"
            onClick={() => setShowComments(false)}
          />
          <div className="reel-comments__panel">
            <div className="reel-comments__top-bar">
              <button
                type="button"
                className="reel-comments__close-btn"
                onClick={() => setShowComments(false)}
              >
                <FaTimes size={14} />
              </button>
            </div>

            <div className="reel-comments__list">
              <div className="reel-comments__caption-entry">
                <div className="reel-overlay__author-row">
                  <Avatar
                    src={post.authorProfilePicture}
                    alt=""
                    className="reel-overlay__avatar"
                  />
                  <span className="reel-overlay__username">
                    {post.authorUsername}
                  </span>
                </div>
                {post.text && (
                  <p className="reel-overlay__caption reel-comments__caption-full">
                    {post.text}
                  </p>
                )}
              </div>

              <div className="reel-comments__count-label">
                COMMENTI ({post.commentCount})
              </div>

              {comments?.content.length === 0 && (
                <p className="post-detail-page__empty-comments">
                  Nessun commento. Scrivi il primo!
                </p>
              )}

              {comments?.content.map((comment) => (
                <CommentThread
                  key={comment.id}
                  comment={comment}
                  postId={post.id}
                  isPostAuthor={isAuthor}
                  currentUsername={me?.username}
                  replyingTo={replyingTo}
                  onStartReply={handleStartReply}
                  onSubmitReply={handleSubmitReply}
                  replyText={replyText}
                  setReplyText={setReplyText}
                  onDelete={handleDeleteComment}
                />
              ))}
            </div>

            {commentError && (
              <div className="error-text" style={{ padding: "0 16px" }}>
                {commentError}
              </div>
            )}

            <form
              className="reel-comments__form"
              onSubmit={handleSubmitComment}
            >
              <input
                type="text"
                className="input reel-comments__input"
                maxLength={500}
                placeholder="Scrivi un commento..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                required
              />
              <button
                type="submit"
                className="reel-comments__send-btn"
                disabled={isSending || !commentText.trim()}
              >
                INVIA
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  )
}

export default ReelPost
