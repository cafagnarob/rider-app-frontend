import { useState } from "react"
import { Card, Spinner, Button, Form, Badge, Carousel } from "react-bootstrap"
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
      <div className="text-center py-5">
        <Spinner animation="border" variant="light" />
      </div>
    )
  }

  if (isError) {
    return <div className="alert alert-danger">Post non trovato.</div>
  }

  return (
    <div style={{ maxWidth: "540px", margin: "0 auto" }}>
      <Button
        variant="outline-light"
        size="sm"
        className="mb-3"
        onClick={() => navigate(-1)}
      >
        <FaArrowLeft /> Indietro
      </Button>

      <Card className="bg-dark text-light border-secondary mb-4">
        <Card.Header className="bg-dark border-secondary d-flex align-items-center gap-2">
          <img
            src={post.authorProfilePicture}
            alt={post.authorUsername}
            className="rounded-circle"
            style={{ width: "36px", height: "36px", objectFit: "cover" }}
          />
          <div className="flex-grow-1">
            <span className="fw-semibold">{post.authorUsername}</span>
            <div className="text-secondary" style={{ fontSize: "0.75rem" }}>
              {formatRelativeTime(post.createdAt)}
            </div>
          </div>
          {isAuthor && (
            <Button
              variant="outline-danger"
              size="sm"
              disabled={isDeletingPost}
              onClick={handleDeletePost}
            >
              <FaTrash />
            </Button>
          )}
        </Card.Header>

        {post.media?.length === 1 && (
          <div className="ratio ratio-1x1">
            <img
              src={post.media[0].mediaUrl}
              alt=""
              style={{ objectFit: "cover" }}
            />
          </div>
        )}

        {post.media?.length > 1 && (
          <Carousel interval={null} data-bs-theme="dark">
            {post.media.map((m) => (
              <Carousel.Item key={m.id}>
                <div className="ratio ratio-1x1">
                  <img src={m.mediaUrl} alt="" style={{ objectFit: "cover" }} />
                </div>
              </Carousel.Item>
            ))}
          </Carousel>
        )}

        <Card.Body>
          <Button
            variant="link"
            className="p-0 text-decoration-none d-flex align-items-center gap-1 mb-2"
            style={{ color: post.likedByCurrentUser ? "#dc3545" : "#adb5bd" }}
            onClick={() =>
              toggleLike({ postId, liked: post.likedByCurrentUser })
            }
          >
            {post.likedByCurrentUser ? <FaHeart /> : <FaRegHeart />}
            <span className="small">{post.likeCount}</span>
          </Button>

          {post.text && <p className="mb-2">{post.text}</p>}

          {post.event && (
            <Link
              to={`/events/${post.event.id}`}
              className="text-decoration-none"
            >
              <Badge bg="warning" text="dark">
                Evento: {post.event.title}
              </Badge>
            </Link>
          )}
        </Card.Body>
      </Card>

      <h5 className="mb-3">Commenti ({post.commentCount})</h5>

      <Form onSubmit={handleSubmit} className="mb-4">
        <div className="d-flex gap-2">
          <Form.Control
            as="textarea"
            rows={2}
            maxLength={500}
            className="bg-transparent text-light"
            placeholder="Scrivi un commento..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
          />
          <Button
            type="submit"
            variant="warning"
            disabled={isSending || !text.trim()}
            className="align-self-end"
          >
            Invia
          </Button>
        </div>
        <Form.Text className="text-secondary">{text.length}/500</Form.Text>
      </Form>

      {errorMsg && <div className="alert alert-danger py-2">{errorMsg}</div>}

      <div className="d-flex flex-column gap-3">
        {comments?.content.length === 0 && (
          <p className="text-secondary small">
            Nessun commento. Scrivi il primo!
          </p>
        )}

        {comments?.content.map((comment) => {
          const canDelete = me?.username === comment.authorUsername || isAuthor
          return (
            <div key={comment.id} className="d-flex gap-2">
              <img
                src={comment.authorProfilePicture}
                alt={comment.authorUsername}
                className="rounded-circle"
                style={{ width: "32px", height: "32px", objectFit: "cover" }}
              />
              <div className="flex-grow-1">
                <div className="d-flex align-items-baseline gap-2">
                  <span className="fw-semibold small">
                    {comment.authorUsername}
                  </span>
                  <span
                    className="text-secondary"
                    style={{ fontSize: "0.7rem" }}
                  >
                    {formatRelativeTime(comment.createdAt)}
                  </span>
                </div>
                <p className="mb-0 small">{comment.text}</p>
              </div>
              {canDelete && (
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 text-secondary"
                  onClick={() => handleDeleteComment(comment.id)}
                >
                  <FaTrash />
                </Button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default PostDetailPage
