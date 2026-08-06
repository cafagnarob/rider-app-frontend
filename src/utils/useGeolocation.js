import { useState, useEffect } from "react"

export function useGeolocation() {
  const [position, setPosition] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setError("Geolocalizzazione non supportata.")
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setPosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      (err) => setError(err.message),
      { enableHighAccuracy: false, timeout: 10000 },
    )
  }, [])

  return { position, error }
}
