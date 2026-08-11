import { useRef, useState } from "react"
import { searchPlaces } from "../utils/geocoding"

function PlaceSearchInput({
  value,
  onChange,
  placeholder = "Cerca una città o un luogo...",
}) {
  const [search, setSearch] = useState("")
  const [results, setResults] = useState([])
  const timerRef = useRef(null)

  const handleChange = (e) => {
    const val = e.target.value
    setSearch(val)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      if (!val.trim()) {
        setResults([])
        return
      }
      try {
        setResults(await searchPlaces(val))
      } catch {
        setResults([])
      }
    }, 500)
  }

  const handlePick = (place) => {
    onChange({ label: place.name, lat: place.latitude, lng: place.longitude })
    setSearch("")
    setResults([])
  }

  if (value?.label) {
    return (
      <div className="meeting-point__chip">
        <span className="meeting-point__label">{value.label}</span>
        <button
          type="button"
          className="meeting-point__change-btn"
          onClick={() => onChange(null)}
        >
          CAMBIA
        </button>
      </div>
    )
  }

  return (
    <div style={{ position: "relative" }}>
      <input
        type="text"
        className="input"
        placeholder={placeholder}
        value={search}
        onChange={handleChange}
      />
      {results.length > 0 && (
        <div className="card search-results">
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              className="search-results__item"
              onClick={() => handlePick(r)}
            >
              {r.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default PlaceSearchInput
