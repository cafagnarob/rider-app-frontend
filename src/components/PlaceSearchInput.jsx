import { useRef, useState } from "react"
import { searchPlaces } from "../utils/geocoding"
import { COLORS, FONTS, styles } from "../styles/theme"

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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "11px 14px",
          borderRadius: 12,
          background: COLORS.accentSoftBg,
          border: `1px solid ${COLORS.accentSoftBorder}`,
        }}
      >
        <span
          style={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.accent }}
        >
          {value.label}
        </span>
        <button
          type="button"
          onClick={() => onChange(null)}
          style={{
            background: "none",
            border: "none",
            color: COLORS.accent,
            cursor: "pointer",
            fontFamily: FONTS.mono,
            fontSize: 10,
          }}
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
        placeholder={placeholder}
        value={search}
        onChange={handleChange}
        style={styles.input}
      />
      {results.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 6,
            zIndex: 10,
            ...styles.card,
            overflow: "hidden",
          }}
        >
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => handlePick(r)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "11px 13px",
                background: "none",
                border: "none",
                borderBottom: `1px solid ${COLORS.borderSoft}`,
                color: COLORS.text,
                fontFamily: FONTS.body,
                fontSize: 13,
                cursor: "pointer",
              }}
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
