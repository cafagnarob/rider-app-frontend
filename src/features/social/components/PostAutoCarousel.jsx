import { useEffect, useRef, useState } from "react"
import { COLORS } from "../../../styles/theme"

const AUTOPLAY_INTERVAL = 4000
const RESUME_DELAY = 5000
const SWIPE_THRESHOLD = 40
const TAP_THRESHOLD = 8

function PostAutoCarousel({ media, height = 320, onDoubleClick }) {
  const [index, setIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)

  const resumeTimer = useRef(null)
  const dragStartX = useRef(null)
  const dragDeltaX = useRef(0)

  const count = media?.length || 0

  useEffect(() => {
    if (count < 2 || isPaused) return
    const id = setInterval(
      () => setIndex((i) => (i + 1) % count),
      AUTOPLAY_INTERVAL,
    )
    return () => clearInterval(id)
  }, [count, isPaused])

  useEffect(() => () => clearTimeout(resumeTimer.current), [])

  const pauseThenResume = () => {
    setIsPaused(true)
    clearTimeout(resumeTimer.current)
    resumeTimer.current = setTimeout(() => setIsPaused(false), RESUME_DELAY)
  }

  const handlePointerDown = (e) => {
    if (count < 2) return
    dragStartX.current = e.clientX
    setIsDragging(true)
    pauseThenResume()
  }

  const handlePointerCancel = () => {
    dragStartX.current = null
    dragDeltaX.current = 0
    setDragOffset(0)
    setIsDragging(false)
  }

  const handlePointerMove = (e) => {
    if (dragStartX.current == null) return
    dragDeltaX.current = e.clientX - dragStartX.current
    setDragOffset(dragDeltaX.current)
  }

  const handlePointerUp = () => {
    if (count < 2) {
      handleTap()
      return
    }
    if (dragStartX.current == null) return
    const delta = dragDeltaX.current
    if (delta < -SWIPE_THRESHOLD) {
      setIndex((i) => (i + 1) % count)
    } else if (delta > SWIPE_THRESHOLD) {
      setIndex((i) => (i - 1 + count) % count)
    } else if (Math.abs(delta) < TAP_THRESHOLD) {
      handleTap()
    }
    dragStartX.current = null
    dragDeltaX.current = 0
    setDragOffset(0)
    setIsDragging(false)
  }

  const tapTimer = useRef(null)

  useEffect(() => () => clearTimeout(tapTimer.current), [])

  const handleTap = () => {
    if (tapTimer.current) {
      clearTimeout(tapTimer.current)
      tapTimer.current = null
      onDoubleClick?.()
    } else {
      tapTimer.current = setTimeout(() => {
        tapTimer.current = null
      }, 260)
    }
  }

  if (count === 0) return null

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerCancel}
      style={{
        position: "relative",
        height,
        borderRadius: 18,
        overflow: "hidden",
        border: `1px solid ${COLORS.borderSoft}`,
        touchAction: "pan-y",
      }}
    >
      <div
        style={{
          display: "flex",
          width: `${count * 100}%`,
          height: "100%",
          transform: `translateX(calc(${-index * (100 / count)}% + ${dragOffset}px))`,
          transition: isDragging
            ? "none"
            : "transform 0.6s cubic-bezier(.22,.68,0,1)",
        }}
      >
        {media.map((m) => (
          <div
            key={m.id}
            style={{ width: `${100 / count}%`, height: "100%", flexShrink: 0 }}
          >
            <img
              src={m.mediaUrl}
              alt=""
              draggable={false}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          </div>
        ))}
      </div>

      {count > 1 && (
        <div
          style={{
            position: "absolute",
            bottom: 12,
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
                width: i === index ? 16 : 5,
                height: 5,
                borderRadius: 3,
                background:
                  i === index ? COLORS.accent : "rgba(255,255,255,.35)",
                transition: "width 0.25s ease",
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default PostAutoCarousel
