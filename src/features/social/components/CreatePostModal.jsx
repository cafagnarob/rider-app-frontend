import { useState } from "react"
import { FaTimes } from "react-icons/fa"
import { useCreatePostMutation } from "../postsApi"
import { useGetMyRidesQuery } from "../../rides/ridesApi"
import { useGetParticipatingEventsQuery } from "../../events/eventsApi"
import { useGetMyVehiclesQuery } from "../../vehicles/vehiclesApi"

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
    <div className="sheet-overlay" onClick={handleClose}>
      <div className="sheet-panel" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header">
          <button type="button" className="btn-icon" onClick={handleClose}>
            <FaTimes />
          </button>
          <div className="sheet-header__title">NUOVO POST</div>
          <button
            type="button"
            className="sheet-save-btn"
            disabled={isLoading || items.length === 0}
            style={{ opacity: isLoading || items.length === 0 ? 0.5 : 1 }}
            onClick={handleSubmit}
          >
            {isLoading ? "..." : "PUBBLICA"}
          </button>
        </div>

        <div className="sheet-body">
          <textarea
            className="textarea"
            style={{ minHeight: 130, fontSize: 15 }}
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={1000}
            placeholder="Com'è andata l'uscita?"
          />
          <div className="char-counter">{text.length}/1000</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            <span className="field-label">FOTO · FINO A {MAX_FILES}</span>
            <div className="photo-upload-grid">
              {items.map((item) => (
                <div key={item.id} className="photo-upload-grid__item">
                  <img src={item.preview} alt="" />
                  <button
                    type="button"
                    className="photo-upload-grid__remove"
                    onClick={() => handleRemove(item.id)}
                  >
                    <FaTimes size={11} />
                  </button>
                </div>
              ))}
              {items.length < MAX_FILES && (
                <label className="photo-upload-grid__add-tile">
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
            <span className="field-label">COLLEGA</span>
            <div className="link-chips-row">
              {["ride", "event", "vehicle"].map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`link-chip ${isPicked(type) ? "link-chip--picked" : ""}`}
                  onClick={() => togglePicker(type)}
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
              ))}
            </div>

            {linkType === "ride" && (
              <div className="picker-list">
                {ridesPage?.content.length === 0 && (
                  <span className="picker-empty-text">
                    Nessun giro registrato.
                  </span>
                )}
                {ridesPage?.content.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className="picker-row"
                    onClick={() => {
                      setRideId(r.id)
                      setLinkType(null)
                    }}
                  >
                    {r.title || "Giro senza titolo"} ·{" "}
                    {r.distanceKm?.toFixed(1)} km
                  </button>
                ))}
              </div>
            )}

            {linkType === "event" && (
              <div className="picker-list">
                {eventsPage?.content.length === 0 && (
                  <span className="picker-empty-text">
                    Non partecipi a nessun evento.
                  </span>
                )}
                {eventsPage?.content.map((ev) => (
                  <button
                    key={ev.id}
                    type="button"
                    className="picker-row"
                    onClick={() => {
                      setEventId(ev.id)
                      setLinkType(null)
                    }}
                  >
                    {ev.title}
                  </button>
                ))}
              </div>
            )}

            {linkType === "vehicle" && (
              <div className="picker-list">
                {vehicles?.length === 0 && (
                  <span className="picker-empty-text">
                    Il tuo garage è vuoto.
                  </span>
                )}
                {vehicles?.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    className="picker-row"
                    onClick={() => {
                      setVehicleId(v.id)
                      setLinkType(null)
                    }}
                  >
                    {v.nickname || `${v.model.brand.name} ${v.model.name}`}
                  </button>
                ))}
              </div>
            )}
          </div>

          {errorMsg && <div className="error-text">{errorMsg}</div>}
        </div>
      </div>
    </div>
  )
}

export default CreatePostModal
