import { useParams, useNavigate } from "react-router-dom"
import { FaTimes } from "react-icons/fa"
import { Spinner } from "react-bootstrap"
import { useGetPostByIdQuery } from "../features/social/postsApi"

import ReelPost from "../features/social/components/ReelPost"

function PostDetailPage() {
  const { postId } = useParams()
  const navigate = useNavigate()
  const { data: post, isLoading, isError } = useGetPostByIdQuery(postId)

  return (
    <div className="reel-feed">
      <div className="reel-feed__top-overlay">
        <button
          type="button"
          className="reel-feed__close-btn"
          onClick={() => navigate(-1)}
        >
          <FaTimes />
        </button>
      </div>

      {isLoading ? (
        <div className="reel-feed__loading">
          <Spinner animation="border" style={{ color: "#FF7A2F" }} />
        </div>
      ) : isError || !post ? (
        <div className="reel-feed__loading">
          <span className="feed-page__empty-text">Post non trovato.</span>
        </div>
      ) : (
        <div className="reel-feed__scroll" style={{ overflowY: "hidden" }}>
          <ReelPost post={post} onDeleted={() => navigate("/feed")} />
        </div>
      )}
    </div>
  )
}

export default PostDetailPage
