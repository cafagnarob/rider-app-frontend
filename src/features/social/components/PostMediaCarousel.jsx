import { useRef, useState } from "react"

function PostMediaCarousel({ media, renderOverlay }) {
  const containerRef = useRef(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const handleScroll = () => {
    const el = containerRef.current
    if (!el) return
    const index = Math.round(el.scrollLeft / el.clientWidth)
    setActiveIndex(index)
  }

  if (!media || media.length === 0) return null

  return (
    <div className="media-carousel">
      <div
        ref={containerRef}
        className="media-carousel__scroll"
        onScroll={handleScroll}
      >
        {media.map((m) => (
          <div key={m.id} className="media-carousel__slide">
            <img src={m.mediaUrl} alt="" draggable={false} />
            {renderOverlay && renderOverlay(m)}
          </div>
        ))}
      </div>

      {media.length > 1 && (
        <div className="media-carousel__dots">
          {media.map((_, i) => (
            <span
              key={i}
              className={`media-carousel__dot ${i === activeIndex ? "media-carousel__dot--active" : ""}`}
              style={{ width: i === activeIndex ? 14 : 5 }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default PostMediaCarousel
