import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { FaTimes, FaImages, FaSyncAlt } from "react-icons/fa"
import { useCreatePostMutation } from "../features/social/postsApi"
import "../pages/CSS/StoryComposerPage.css"
import {
  FaTachometerAlt,
  FaRoute,
  FaCalendarAlt,
  FaMotorcycle,
} from "react-icons/fa"
import { useGetMyRidesQuery } from "../features/rides/ridesApi"
import { useGetMyRoutesQuery } from "../features/routesMap/routesApi"
import {
  useGetParticipatingEventsQuery,
  useGetOrganizedEventsQuery,
} from "../features/events/eventsApi"
import { useGetMyVehiclesQuery } from "../features/vehicles/vehiclesApi"
import PostWidgetPreview from "../features/social/components/PostWidgetPreview"

const MAX_SLIDES = 6
const PRESET_COLORS = [
  "#FF7A2F",
  "#0B0B0C",
  "#E04A3A",
  "#2D6A4F",
  "#1D3557",
  "#7B2CBF",
]

function resolveWidgetSize(dx, dy) {
  const distance = Math.sqrt(dx * dx + dy * dy)
  if (distance < 45) return "MINI"
  if (distance >= 150) return "LARGE"

  const angleDeg = Math.abs((Math.atan2(dy, dx) * 180) / Math.PI)
  const isMoreHorizontal = angleDeg < 45 || angleDeg > 135
  return isMoreHorizontal ? "WIDE" : "TALL"
}

function emptySlide(type, extra) {
  return { id: crypto.randomUUID(), type, ...extra }
}

async function colorToFile(hex) {
  const canvas = document.createElement("canvas")
  canvas.width = 1080
  canvas.height = 1350
  const ctx = canvas.getContext("2d")
  ctx.fillStyle = hex
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  )
  return new File([blob], "sfondo.png", { type: "image/png" })
}

function StoryComposerPage() {
  const navigate = useNavigate()
  const [createPost, { isLoading: isPublishing }] = useCreatePostMutation()

  const [slides, setSlides] = useState([])
  const [activeIndex, setActiveIndex] = useState(null) // null = modalità fotocamera/aggiunta
  const [caption, setCaption] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [cameraError, setCameraError] = useState(false)
  const [showColors, setShowColors] = useState(false)

  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const galleryInputRef = useRef(null)
  const nativeCaptureInputRef = useRef(null)

  const inCameraMode = activeIndex === null
  const remainingSlots = MAX_SLIDES - slides.length

  const [widgets, setWidgets] = useState([]) // { id, slideId, type, referenceId, label, size, xPercent, yPercent }
  const [activeTagPicker, setActiveTagPicker] = useState(null) // null | "RIDE" | "ROUTE" | "EVENT" | "VEHICLE"
  const [selectedWidgetId, setSelectedWidgetId] = useState(null)
  const dragRef = useRef(null)
  const viewerRef = useRef(null)

  const [facingMode, setFacingMode] = useState("environment")

  const resizeDragRef = useRef(null)

  const { data: ridesPage } = useGetMyRidesQuery(
    { page: 0, size: 20 },
    { skip: activeTagPicker !== "RIDE" },
  )
  const { data: routesPage } = useGetMyRoutesQuery(
    { page: 0, size: 20 },
    { skip: activeTagPicker !== "ROUTE" },
  )
  const { data: participatingPage } = useGetParticipatingEventsQuery(
    { page: 0, size: 10 },
    { skip: activeTagPicker !== "EVENT" },
  )
  const { data: organizedPage } = useGetOrganizedEventsQuery(
    { page: 0, size: 10 },
    { skip: activeTagPicker !== "EVENT" },
  )
  const { data: vehicles } = useGetMyVehiclesQuery(undefined, {
    skip: activeTagPicker !== "VEHICLE",
  })

  const eventOptions = Array.from(
    new Map(
      [
        ...(organizedPage?.content || []),
        ...(participatingPage?.content || []),
      ].map((ev) => [ev.id, ev]),
    ).values(),
  )

  const addWidget = (type, data) => {
    if (activeIndex === null) return
    const slide = slides[activeIndex]
    const countOnSlide = widgets.filter((w) => w.slideId === slide.id).length

    setWidgets((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        slideId: slide.id,
        type,
        data,
        size: "MINI",
        xPercent: 50,
        yPercent: 20 + countOnSlide * 12,
      },
    ])
    setActiveTagPicker(null)
  }

  const handleWidgetPointerDown = (e, widgetId) => {
    e.stopPropagation()
    setSelectedWidgetId(widgetId)
    dragRef.current = { widgetId, pointerId: e.pointerId }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handleResizeHandlePointerDown = (e, widgetId) => {
    e.stopPropagation()
    const widgetEl = e.currentTarget.closest(".story-composer__widget-wrap")
    const rect = widgetEl.getBoundingClientRect()
    resizeDragRef.current = {
      widgetId,
      pointerId: e.pointerId,
      anchorX: rect.left + rect.width / 2,
      anchorY: rect.top + rect.height / 2,
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const rafRef = useRef(null)
  const pendingUpdateRef = useRef(null)

  const scheduleFrame = () => {
    if (rafRef.current) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      const update = pendingUpdateRef.current
      if (!update) return
      if (update.kind === "move") {
        setWidgets((prev) =>
          prev.map((w) =>
            w.id === update.widgetId
              ? { ...w, xPercent: update.xPercent, yPercent: update.yPercent }
              : w,
          ),
        )
      } else {
        setWidgets((prev) =>
          prev.map((w) =>
            w.id === update.widgetId ? { ...w, size: update.nextSize } : w,
          ),
        )
      }
    })
  }

  const handleViewerPointerMove = (e) => {
    if (dragRef.current && dragRef.current.pointerId === e.pointerId) {
      if (!viewerRef.current) return
      const rect = viewerRef.current.getBoundingClientRect()
      const xPercent = Math.min(
        96,
        Math.max(4, ((e.clientX - rect.left) / rect.width) * 100),
      )
      const yPercent = Math.min(
        96,
        Math.max(4, ((e.clientY - rect.top) / rect.height) * 100),
      )
      pendingUpdateRef.current = {
        kind: "move",
        widgetId: dragRef.current.widgetId,
        xPercent,
        yPercent,
      }
      scheduleFrame()
      return
    }

    if (
      resizeDragRef.current &&
      resizeDragRef.current.pointerId === e.pointerId
    ) {
      const { widgetId, anchorX, anchorY } = resizeDragRef.current
      const dx = e.clientX - anchorX
      const dy = e.clientY - anchorY
      const nextSize = resolveWidgetSize(dx, dy)
      pendingUpdateRef.current = { kind: "resize", widgetId, nextSize }
      scheduleFrame()
    }
  }

  const handleViewerPointerUp = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    pendingUpdateRef.current = null
    dragRef.current = null
    resizeDragRef.current = null
  }

  const removeWidget = (widgetId) => {
    setWidgets((prev) => prev.filter((w) => w.id !== widgetId))
    setSelectedWidgetId(null)
  }

  const handlePublish = async () => {
    if (slides.length === 0) {
      setErrorMsg("Aggiungi almeno una foto o uno sfondo.")
      return
    }
    setErrorMsg("")
    try {
      const files = await Promise.all(
        slides.map((s) => (s.type === "photo" ? s.file : colorToFile(s.color))),
      )
      const widgetsPayload = widgets.map((w) => ({
        mediaIndex: slides.findIndex((s) => s.id === w.slideId),
        type: w.type,
        referenceId: w.type === "VEHICLE" ? w.data.model.id : w.data.id,
        size: w.size,
        xPercent: w.xPercent,
        yPercent: w.yPercent,
      }))
      await createPost({
        data: {
          text: caption.trim() || null,
          eventId: null,
          rideId: null,
          vehicleId: null,
          includeRoutePhoto: false,
          widgets: widgetsPayload,
        },
        files,
      }).unwrap()
      slides.forEach((s) => s.previewUrl && URL.revokeObjectURL(s.previewUrl))
      navigate("/feed")
    } catch (err) {
      setErrorMsg(err.data?.message || "Errore durante la pubblicazione.")
    }
  }

  useEffect(() => {
    if (!inCameraMode) {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      return
    }
    console.log(facingMode)
    let cancelled = false
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
        setCameraError(false)
      })
      .catch(() => {
        if (!cancelled) setCameraError(true)
      })

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [inCameraMode, facingMode])

  const addSlide = (slide) => {
    const newIndex = slides.length
    setSlides((prev) => [...prev, slide])
    setActiveIndex(newIndex)
  }

  const handleShutter = () => {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, 0, 0)
    canvas.toBlob(
      (blob) => {
        const file = new File([blob], "scatto.jpg", { type: "image/jpeg" })
        addSlide(
          emptySlide("photo", { file, previewUrl: URL.createObjectURL(file) }),
        )
      },
      "image/jpeg",
      0.9,
    )
  }

  const handleNativeCapture = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    addSlide(
      emptySlide("photo", { file, previewUrl: URL.createObjectURL(file) }),
    )
    e.target.value = ""
  }

  const handleGalleryPick = (e) => {
    const files = Array.from(e.target.files || []).slice(0, remainingSlots)
    if (files.length === 0) return
    const newSlides = files.map((file) =>
      emptySlide("photo", { file, previewUrl: URL.createObjectURL(file) }),
    )
    const newIndex = slides.length + newSlides.length - 1
    setSlides((prev) => [...prev, ...newSlides])
    setActiveIndex(newIndex)
    e.target.value = ""
  }

  const handlePickColor = (hex) => {
    addSlide(emptySlide("color", { color: hex }))
    setShowColors(false)
  }

  const handleDeleteSlide = (index) => {
    setSlides((prev) => {
      const target = prev[index]
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl)
      const next = prev.filter((_, i) => i !== index)

      if (next.length === 0) {
        setActiveIndex(null)
      } else {
        setActiveIndex(Math.min(index, next.length - 1))
      }

      return next
    })
  }

  const handleClose = () => {
    slides.forEach((s) => s.previewUrl && URL.revokeObjectURL(s.previewUrl))
    navigate(-1)
  }

  const activeSlide = activeIndex !== null ? slides[activeIndex] : null

  return (
    <div className="story-composer">
      <div className="story-composer__frame">
        <div className="story-composer__top-bar">
          <button
            type="button"
            className="story-composer__close-btn"
            onClick={handleClose}
          >
            <FaTimes />
          </button>

          {!inCameraMode && (
            <div className="story-composer__tags">
              <button
                type="button"
                className="story-composer__tag-btn"
                onClick={() => setActiveTagPicker("RIDE")}
              >
                <FaTachometerAlt size={16} />
              </button>
              <button
                type="button"
                className="story-composer__tag-btn"
                onClick={() => setActiveTagPicker("ROUTE")}
              >
                <FaRoute size={16} />
              </button>
              <button
                type="button"
                className="story-composer__tag-btn"
                onClick={() => setActiveTagPicker("EVENT")}
              >
                <FaCalendarAlt size={16} />
              </button>
              <button
                type="button"
                className="story-composer__tag-btn"
                onClick={() => setActiveTagPicker("VEHICLE")}
              >
                <FaMotorcycle size={16} />
              </button>
            </div>
          )}

          <span className="story-composer__counter">
            {slides.length}/{MAX_SLIDES}
          </span>
        </div>

        <div
          className="story-composer__viewer"
          ref={viewerRef}
          onPointerMove={handleViewerPointerMove}
          onPointerUp={handleViewerPointerUp}
          onClick={() => setSelectedWidgetId(null)}
        >
          {inCameraMode && !cameraError && (
            <video
              ref={videoRef}
              className={`story-composer__video ${facingMode === "user" ? "story-composer__video--mirrored" : ""}`}
              autoPlay
              playsInline
              muted
            />
          )}

          {inCameraMode && cameraError && (
            <div className="story-composer__camera-error">
              Impossibile accedere alla fotocamera del browser — usa lo scatto
              per aprire la fotocamera del telefono, oppure scegli dalla
              galleria.
            </div>
          )}

          {!inCameraMode && activeSlide?.type === "photo" && (
            <img
              src={activeSlide.previewUrl}
              alt=""
              className="story-composer__preview-img"
            />
          )}

          {!inCameraMode && activeSlide?.type === "color" && (
            <div
              className="story-composer__preview-color"
              style={{ background: activeSlide.color }}
            />
          )}

          {!inCameraMode &&
            activeSlide &&
            widgets
              .filter((w) => w.slideId === activeSlide.id)
              .map((w) => (
                <div
                  key={w.id}
                  className={`story-composer__widget-wrap ${selectedWidgetId === w.id ? "story-composer__widget-wrap--selected" : ""}`}
                  style={{ left: `${w.xPercent}%`, top: `${w.yPercent}%` }}
                  onPointerDown={(e) => handleWidgetPointerDown(e, w.id)}
                  onClick={(e) => e.stopPropagation()}
                >
                  <PostWidgetPreview
                    type={w.type}
                    size={w.size}
                    data={w.data}
                  />

                  {selectedWidgetId === w.id && (
                    <>
                      <div
                        className="story-composer__widget-controls"
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => removeWidget(w.id)}
                        >
                          <FaTimes size={10} />
                        </button>
                      </div>
                      <div
                        className="story-composer__widget-resize-handle"
                        onPointerDown={(e) =>
                          handleResizeHandlePointerDown(e, w.id)
                        }
                      />
                    </>
                  )}
                </div>
              ))}
        </div>

        <div className="story-composer__bottom-overlay">
          {!inCameraMode && (
            <div className="story-composer__dots">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  className={`story-composer__dot ${activeIndex === i ? "story-composer__dot--active" : ""}`}
                  onClick={() => setActiveIndex(i)}
                >
                  <div className="story-composer__dot-media">
                    {s.type === "photo" ? (
                      <img src={s.previewUrl} alt="" />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          background: s.color,
                        }}
                      />
                    )}
                  </div>
                  {activeIndex === i && (
                    <span
                      className="story-composer__dot-remove"
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteSlide(i)
                      }}
                    >
                      <FaTimes size={9} />
                    </span>
                  )}
                </button>
              ))}
              {slides.length < MAX_SLIDES && (
                <button
                  type="button"
                  className="story-composer__dot story-composer__dot--add"
                  onClick={() => setActiveIndex(null)}
                >
                  +
                </button>
              )}
            </div>
          )}

          {!inCameraMode && (
            <textarea
              className="story-composer__caption"
              placeholder="Aggiungi una didascalia..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={2}
              maxLength={1000}
            />
          )}

          {errorMsg && <div className="story-composer__error">{errorMsg}</div>}

          <div className="story-composer__toolbar">
            {inCameraMode && (
              <>
                <button
                  type="button"
                  className="story-composer__gallery-btn"
                  disabled={remainingSlots === 0}
                  onClick={() => galleryInputRef.current?.click()}
                >
                  <FaImages size={18} />
                </button>
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={handleGalleryPick}
                />

                {!cameraError && (
                  <button
                    type="button"
                    className="story-composer__shutter"
                    onClick={handleShutter}
                  >
                    <span className="story-composer__shutter-inner" />
                  </button>
                )}

                {cameraError && (
                  <>
                    <button
                      type="button"
                      className="story-composer__shutter"
                      onClick={() => nativeCaptureInputRef.current?.click()}
                    >
                      <span className="story-composer__shutter-inner" />
                    </button>
                    <input
                      ref={nativeCaptureInputRef}
                      type="file"
                      accept="image/*"
                      capture={facingMode === "user" ? "user" : "environment"}
                      hidden
                      onChange={handleNativeCapture}
                    />
                  </>
                )}

                <div style={{ position: "relative" }}>
                  <button
                    type="button"
                    className="story-composer__color-btn"
                    onClick={() => setShowColors((v) => !v)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width={18}
                      height={18}
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M12.433 10.07C14.133 10.585 16 11.15 16 8a8 8 0 1 0-8 8c1.996 0 1.826-1.504 1.649-3.08-.124-1.101-.252-2.237.351-2.92.465-.527 1.42-.237 2.433.07M8 5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m4.5 3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3M5 6.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m.5 6.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3" />
                    </svg>
                  </button>

                  {showColors && (
                    <>
                      <div
                        className="story-composer__popover-overlay"
                        onClick={() => setShowColors(false)}
                      />
                      <div className="story-composer__colors story-composer__colors--popover">
                        {PRESET_COLORS.map((hex) => (
                          <button
                            key={hex}
                            type="button"
                            className="story-composer__color-swatch"
                            style={{ background: hex }}
                            onClick={() => handlePickColor(hex)}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {!inCameraMode && (
            <button
              type="button"
              className="story-composer__publish-btn"
              disabled={isPublishing}
              onClick={handlePublish}
            >
              {isPublishing ? "..." : "PUBBLICA"}
            </button>
          )}
        </div>
      </div>

      {inCameraMode && !cameraError && (
        <button
          type="button"
          className="story-composer__flip-btn"
          onClick={() =>
            setFacingMode((m) => (m === "environment" ? "user" : "environment"))
          }
        >
          <FaSyncAlt size={16} />
        </button>
      )}

      {activeTagPicker && (
        <div
          className="story-composer__picker-overlay"
          onClick={() => setActiveTagPicker(null)}
        >
          <div
            className="story-composer__picker-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="story-composer__picker-title">
              {activeTagPicker === "RIDE" && "SCEGLI UN GIRO"}
              {activeTagPicker === "ROUTE" && "SCEGLI UN PERCORSO"}
              {activeTagPicker === "EVENT" && "SCEGLI UN EVENTO"}
              {activeTagPicker === "VEHICLE" && "SCEGLI UNA MOTO"}
            </div>

            {activeTagPicker === "RIDE" &&
              ridesPage?.content.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className="story-composer__picker-row"
                  onClick={() => addWidget("RIDE", r)}
                >
                  {r.title || "Giro senza titolo"} · {r.distanceKm?.toFixed(1)}{" "}
                  km
                </button>
              ))}

            {activeTagPicker === "ROUTE" &&
              routesPage?.content.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className="story-composer__picker-row"
                  onClick={() => addWidget("ROUTE", r)}
                >
                  {r.name} ·{" "}
                  {(r.distanceMeters / 1000).toFixed(1).replace(".", ",")} km
                </button>
              ))}

            {activeTagPicker === "EVENT" &&
              eventOptions.map((ev) => (
                <button
                  key={ev.id}
                  type="button"
                  className="story-composer__picker-row"
                  onClick={() => addWidget("EVENT", ev)}
                >
                  {ev.title}
                </button>
              ))}

            {activeTagPicker === "VEHICLE" &&
              vehicles?.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  className="story-composer__picker-row"
                  onClick={() => addWidget("VEHICLE", v)}
                >
                  {v.nickname || `${v.model.brand.name} ${v.model.name}`}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default StoryComposerPage
