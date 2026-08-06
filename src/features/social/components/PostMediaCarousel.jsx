import { useRef, useState } from "react"
import { COLORS } from "../../../styles/theme"

function PostMediaCarousel({ media }) {
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
    <div style={{ position: "relative" }} className="carousel-scroll">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          display: "flex",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          borderRadius: 16,
          border: `1px solid ${COLORS.borderSoft}`,
          scrollbarWidth: "none",
        }}
      >
        {media.map((m) => (
          <div
            key={m.id}
            style={{
              flex: "0 0 100%",
              scrollSnapAlign: "center",
              height: 210,
            }}
          >
            <img
              src={m.mediaUrl}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
              draggable={false}
            />
          </div>
        ))}
      </div>

      {media.length > 1 && (
        <div
          style={{
            position: "absolute",
            bottom: 10,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            gap: 5,
          }}
        >
          {media.map((_, i) => (
            <span
              key={i}
              style={{
                width: i === activeIndex ? 14 : 5,
                height: 5,
                borderRadius: 3,
                background:
                  i === activeIndex ? COLORS.accent : "rgba(255,255,255,.35)",
                transition: "width 0.2s ease",
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default PostMediaCarousel
