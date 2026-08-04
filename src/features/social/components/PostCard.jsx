import { Card, Button, Badge } from "react-bootstrap"
import { FaHeart, FaRegHeart, FaRegComment } from "react-icons/fa"
import { Link } from "react-router-dom"
import { useToggleLikeMutation } from "../postsApi"
import { formatRelativeTime } from "../../../utils/dateFormat"

function PostCard({ post, feedArgs }) {
  const [toggleLike] = useToggleLikeMutation()

  const handleLike = () => {
    toggleLike({ postId: post.id, liked: post.likedByCurrentUser, feedArgs })
  }

  const cover = post.media?.[0]

  return (
    <Card className="bg-dark text-light border-secondary">
      <Card.Header className="bg-dark border-secondary d-flex align-items-center gap-2">
        <img
          src={post.authorProfilePicture}
          alt={post.authorUsername}
          className="rounded-circle"
          style={{ width: "36px", height: "36px", objectFit: "cover" }}
        />
        <div className="flex-grow-1">
          <Link
            to={`/profile/${post.authorUsername}`}
            className="text-decoration-none text-light fw-semibold"
          >
            {post.authorUsername}
          </Link>
          <div className="text-secondary" style={{ fontSize: "0.75rem" }}>
            {formatRelativeTime(post.createdAt)}
          </div>
        </div>
      </Card.Header>

      {cover && (
        <div className="ratio ratio-1x1">
          <img src={cover.mediaUrl} alt="" style={{ objectFit: "cover" }} />
        </div>
      )}

      {post.media?.length > 1 && (
        <div className="text-center text-secondary small py-1">
          +{post.media.length - 1} altre immagini
        </div>
      )}

      <Card.Body>
        <div className="d-flex align-items-center gap-3 mb-2">
          <Button
            variant="link"
            className="p-0 text-decoration-none d-flex align-items-center gap-1"
            style={{ color: post.likedByCurrentUser ? "#dc3545" : "#adb5bd" }}
            onClick={handleLike}
          >
            {post.likedByCurrentUser ? <FaHeart /> : <FaRegHeart />}
            <span className="small">{post.likeCount}</span>
          </Button>

          <Link
            to={`/posts/${post.id}`}
            className="text-decoration-none d-flex align-items-center gap-1 text-secondary"
          >
            <FaRegComment />
            <span className="small">{post.commentCount}</span>
          </Link>
        </div>

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

        {post.ride && (
          <Badge bg="secondary" className="ms-2">
            {post.ride.distanceKm?.toFixed(1)} km
          </Badge>
        )}
      </Card.Body>
    </Card>
  )
}

export default PostCard
