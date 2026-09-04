import { useNavigate } from "react-router-dom"
import PostWidgetLoader from "../../../pages/PostWidgetLoader"

function PostWidgetsOverlay({ widgets, mediaId }) {
  const navigate = useNavigate()
  const mine = (widgets || []).filter((w) => w.mediaId === mediaId)
  if (mine.length === 0) return null

  const goTo = (w, e) => {
    e.stopPropagation()
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
          className="post-widget-overlay-item"
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
