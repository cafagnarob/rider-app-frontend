import { useState } from "react"
import { FaTimes } from "react-icons/fa"
import { useCreatePostMutation } from "../postsApi"
import { useGetMyRidesQuery } from "../../rides/ridesApi"
import { useGetParticipatingEventsQuery } from "../../events/eventsApi"
import { useGetMyVehiclesQuery } from "../../vehicles/vehiclesApi"
import { COLORS, FONTS, styles } from "../../../styles/theme"

const MAX_FILES = 6
const MAX_SIZE = 5 * 1024 * 1024

function CreatePostModal({ show, onClose }) {
  const [createPost, { isLoading }] = useCreatePostMutation()

  const [text, setText] = useState("")
  const [items, setItems] = useState([])
  const [errorMsg, setErrorMsg] = useState("")

  const [linkType, setLinkType] = useState(null)
  const [rideId, setRideId] = useState(null)
  const [eventId, setEventId] = useState(null)
  const [vehicleId, setVehicleId] = useState(null)

  const { data: ridesPage } = useGetMyRidesQuery(
    { page: 0, size: 10 },
    { skip: linkType !== "ride" },
  )
  const { data: eventsPage } = useGetParticipatingEventsQuery(
    { page: 0, size: 10 },
    { skip: linkType !== "event" },
  )
  const { data: vehicles } = useGetMyVehiclesQuery(undefined, {
    skip: linkType !== "vehicle",
  })

  const revokeAll = (list) =>
    list.forEach((i) => URL.revokeObjectURL(i.preview))

  const handleClose = () => {
    revokeAll(items)
    setItems([])
    setText("")
    setErrorMsg("")
    setLinkType(null)
    setRideId(null)
    setEventId(null)
    setVehicleId(null)
    onClose()
  }

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || [])
    if (selected.length === 0) return

    if (items.length + selected.length > MAX_FILES) {
      setErrorMsg(`Puoi caricare al massimo ${MAX_FILES} immagini.`)
      return
    }

    const invalid = selected.find(
      (f) => !f.type.startsWith("image/") || f.size > MAX_SIZE,
    )
    if (invalid) {
      setErrorMsg("Ogni file deve essere un'immagine sotto i 5 MB.")
      return
    }

    setErrorMsg("")
    setItems((prev) => [
      ...prev,
      ...selected.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
      })),
    ])
    e.target.value = ""
  }

  const handleRemove = (id) => {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id)
      if (target) URL.revokeObjectURL(target.preview)
      return prev.filter((i) => i.id !== id)
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg("")

    if (items.length === 0) {
      setErrorMsg("Aggiungi almeno un'immagine.")
      return
    }

    try {
      await createPost({
        data: {
          text: text.trim() || null,
          eventId: eventId || null,
          rideId: rideId || null,
          vehicleId: vehicleId || null,
          includeRoutePhoto: false,
        },
        files: items.map((i) => i.file),
      }).unwrap()
      handleClose()
    } catch (err) {
      setErrorMsg(err.data?.message || "Errore durante la pubblicazione.")
    }
  }

  if (!show) return null

  const selectedRide = ridesPage?.content.find((r) => r.id === rideId)
  const selectedEvent = eventsPage?.content.find((ev) => ev.id === eventId)
  const selectedVehicle = vehicles?.find((v) => v.id === vehicleId)

  const pillLabel = (type) => {
    if (type === "ride")
      return selectedRide
        ? `RIDE · ${selectedRide.title || "Senza titolo"}`
        : "+ RIDE"
    if (type === "event")
      return selectedEvent ? `EVENTO · ${selectedEvent.title}` : "+ EVENTO"
    return selectedVehicle
      ? `MOTO · ${selectedVehicle.nickname || selectedVehicle.brandName}`
      : "+ MOTO"
  }

  const isPicked = (type) =>
    (type === "ride" && rideId) ||
    (type === "event" && eventId) ||
    (type === "vehicle" && vehicleId)

  const togglePicker = (type) =>
    setLinkType((cur) => (cur === type ? null : type))

  const clearLink = (type) => {
    if (type === "ride") setRideId(null)
    if (type === "event") setEventId(null)
    if (type === "vehicle") setVehicleId(null)
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(6,6,7,.72)",
        zIndex: 200,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          maxHeight: "92vh",
          overflowY: "auto",
          background: COLORS.bg,
          borderRadius: "24px 24px 0 0",
          border: `1px solid ${COLORS.borderSoft}`,
          borderBottom: "none",
        }}
      >
        <div
          style={{
            position: "sticky",
            top: 0,
            background: COLORS.bg,
            zIndex: 2,
            borderBottom: `1px solid ${COLORS.borderSoft}`,
            padding: "20px 20px 14px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <button type="button" onClick={handleClose} style={styles.iconButton}>
            <FaTimes />
          </button>
          <div style={{ flex: 1, ...styles.pageTitle, fontSize: 22 }}>
            NUOVO POST
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || items.length === 0}
            style={{
              height: 40,
              padding: "0 16px",
              borderRadius: 13,
              background: COLORS.accent,
              border: "none",
              color: COLORS.onAccent,
              fontFamily: FONTS.heading,
              fontWeight: 700,
              fontSize: 15,
              letterSpacing: ".05em",
              cursor: "pointer",
              opacity: isLoading || items.length === 0 ? 0.5 : 1,
            }}
          >
            {isLoading ? "..." : "PUBBLICA"}
          </button>
        </div>

        <div
          style={{
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={1000}
            placeholder="Com'è andata l'uscita?"
            style={{
              width: "100%",
              minHeight: 130,
              borderRadius: 16,
              background: COLORS.card,
              border: `1px solid ${COLORS.borderStrong}`,
              color: COLORS.text,
              fontFamily: FONTS.body,
              fontSize: 15,
              lineHeight: 1.5,
              padding: 14,
              outline: "none",
              resize: "none",
              boxSizing: "border-box",
            }}
          />
          <div
            style={{
              textAlign: "right",
              fontFamily: FONTS.mono,
              fontSize: 10,
              color: COLORS.textFaint,
            }}
          >
            {text.length}/1000
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            <span style={styles.fieldLabel}>FOTO · FINO A {MAX_FILES}</span>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 8,
              }}
            >
              {items.map((item) => (
                <div
                  key={item.id}
                  style={{ position: "relative", aspectRatio: "1" }}
                >
                  <img
                    src={item.preview}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: 13,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    style={{
                      position: "absolute",
                      top: 5,
                      right: 5,
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: "rgba(10,10,12,.85)",
                      border: "none",
                      color: COLORS.text,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    <FaTimes size={11} />
                  </button>
                </div>
              ))}
              {items.length < MAX_FILES && (
                <label
                  style={{
                    aspectRatio: "1",
                    borderRadius: 13,
                    background: COLORS.card,
                    border: `1px dashed ${COLORS.borderStrong}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    fontFamily: FONTS.heading,
                    fontSize: 26,
                    color: COLORS.textFaint,
                  }}
                >
                  +
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={handleFileChange}
                  />
                </label>
              )}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            <span style={styles.fieldLabel}>COLLEGA</span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["ride", "event", "vehicle"].map((type) => (
                <div key={type} style={{ position: "relative" }}>
                  <button
                    type="button"
                    onClick={() => togglePicker(type)}
                    style={{
                      padding: "11px 14px",
                      borderRadius: 12,
                      background: isPicked(type)
                        ? COLORS.accentSoftBg
                        : COLORS.card,
                      border: `1px solid ${isPicked(type) ? COLORS.accentSoftBorder : COLORS.borderStrong}`,
                      fontFamily: FONTS.mono,
                      fontSize: 11,
                      color: isPicked(type)
                        ? COLORS.accent
                        : COLORS.textSecondary,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {pillLabel(type)}
                    {isPicked(type) && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation()
                          clearLink(type)
                        }}
                        style={{ display: "flex" }}
                      >
                        <FaTimes size={10} />
                      </span>
                    )}
                  </button>
                </div>
              ))}
            </div>

            {linkType === "ride" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  marginTop: 4,
                }}
              >
                {ridesPage?.content.length === 0 && (
                  <span
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 13,
                      color: COLORS.textFaint,
                    }}
                  >
                    Nessun giro registrato.
                  </span>
                )}
                {ridesPage?.content.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setRideId(r.id)
                      setLinkType(null)
                    }}
                    style={pickerRowStyle}
                  >
                    {r.title || "Giro senza titolo"} ·{" "}
                    {r.distanceKm?.toFixed(1)} km
                  </button>
                ))}
              </div>
            )}

            {linkType === "event" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  marginTop: 4,
                }}
              >
                {eventsPage?.content.length === 0 && (
                  <span
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 13,
                      color: COLORS.textFaint,
                    }}
                  >
                    Non partecipi a nessun evento.
                  </span>
                )}
                {eventsPage?.content.map((ev) => (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => {
                      setEventId(ev.id)
                      setLinkType(null)
                    }}
                    style={pickerRowStyle}
                  >
                    {ev.title}
                  </button>
                ))}
              </div>
            )}

            {linkType === "vehicle" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  marginTop: 4,
                }}
              >
                {vehicles?.length === 0 && (
                  <span
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 13,
                      color: COLORS.textFaint,
                    }}
                  >
                    Il tuo garage è vuoto.
                  </span>
                )}
                {vehicles?.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      setVehicleId(v.id)
                      setLinkType(null)
                    }}
                    style={pickerRowStyle}
                  >
                    {v.nickname || `${v.model.brand.name} ${v.model.name}`}
                  </button>
                ))}
              </div>
            )}
          </div>

          {errorMsg && (
            <div
              style={{
                fontFamily: FONTS.body,
                fontSize: 13,
                color: COLORS.danger,
              }}
            >
              {errorMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const pickerRowStyle = {
  textAlign: "left",
  padding: "12px 14px",
  borderRadius: 12,
  background: COLORS.card,
  border: `1px solid ${COLORS.borderSoft}`,
  color: COLORS.text,
  fontFamily: FONTS.body,
  fontSize: 14,
  cursor: "pointer",
}
export default CreatePostModal
