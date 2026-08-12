import { store } from "../../app/store"
import { pointRecorded } from "./rideSlice"
import { toLocalDateTimeString } from "../../utils/geo"

let watchId = null

export function startTracking(onError) {
  if (watchId !== null) return

  if (!("geolocation" in navigator)) {
    onError?.("Il tuo dispositivo non supporta la geolocalizzazione.")
    return
  }

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude, speed, altitude } = position.coords
      store.dispatch(
        pointRecorded({
          latitude,
          longitude,
          speedKmh: speed != null ? speed * 3.6 : 0,
          altitude: altitude ?? null,
          recordedAt: toLocalDateTimeString(new Date(position.timestamp)),
        }),
      )
    },
    (error) => {
      const messages = {
        1: "Permesso di geolocalizzazione negato.",
        2: "Posizione non disponibile.",
        3: "Timeout nella ricerca della posizione.",
      }
      onError?.(messages[error.code] || "Errore di geolocalizzazione.")
    },
    { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
  )
}

export function stopTracking() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId)
    watchId = null
  }
}

export function isWatching() {
  return watchId !== null
}
