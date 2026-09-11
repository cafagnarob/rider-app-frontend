import { useNavigate } from "react-router-dom"
import PostWidgetLoader from "../../../pages/PostWidgetLoader"
import { useGetCurrentUserQuery } from "../../users/usersApi"

function PostWidgetsOverlay({ widgets, mediaId, postAuthorUsername }) {
  const navigate = useNavigate()
  const { data: me } = useGetCurrentUserQuery()
  const isOwner = me?.username === postAuthorUsername

  const mine = (widgets || []).filter((w) => w.mediaId === mediaId)
  if (mine.length === 0) return null

  const goTo = (w, e) => {
    e.stopPropagation()
    if (!isOwner && w.type === "RIDE") return
    if (w.type === "RIDE") navigate(`/rides/${w.referenceId}`)
    if (w.type === "ROUTE") navigate(`/routes/${w.referenceId}`)
    if (w.type === "EVENT") navigate(`/events/${w.referenceId}`)
    if (w.type === "VEHICLE") navigate(`/catalog/models/${w.referenceId}`)
  }

  return (
    <>
      {mine.map((w) => (
        <div
          key={w.id}
          className={`post-widget-overlay-item ${!isOwner && w.type === "RIDE" ? "post-widget-overlay-item--static" : ""}`}
          style={{ left: `${w.xPercent}%`, top: `${w.yPercent}%` }}
          onClick={(e) => goTo(w, e)}
        >
          <PostWidgetLoader
            type={w.type}
            referenceId={w.referenceId}
            size={w.size}
          />
        </div>
      ))}
    </>
  )
}

export default PostWidgetsOverlay
