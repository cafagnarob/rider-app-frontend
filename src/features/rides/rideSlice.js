import { createSlice } from "@reduxjs/toolkit"
import { haversineDistance } from "../../utils/geo"

const STORAGE_KEY = "activeRide"

const SPEED_STOP_THRESHOLD = 3 // km/h sotto cui si considera fermo
const MIN_STOP_DURATION = 30 // secondi minimi perché conti come sosta
const MIN_POINT_DISTANCE = 0.005 // 5 metri: scarta il rumore GPS

const emptyState = {
  rideId: null,
  startedAt: null,
  points: [],
  distanceKm: 0,
  maxSpeedKmH: 0,
  stopsCount: 0,
  totalStopDurationSeconds: 0,
  stoppedSince: null,
  isTracking: false,
}

const loadState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : emptyState
  } catch {
    return emptyState
  }
}

const persist = (state) => {
  try {
    if (state.rideId) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    // spazio esaurito: il giro continua comunque in memoria
  }
}

const rideSlice = createSlice({
  name: "ride",
  initialState: loadState(),
  reducers: {
    rideStarted: (state, action) => {
      Object.assign(state, emptyState, {
        rideId: action.payload.rideId,
        startedAt: action.payload.startedAt,
        isTracking: true,
      })
      persist(state)
    },

    pointRecorded: (state, action) => {
      const { latitude, longitude, speedKmh, altitude, recordedAt } =
        action.payload
      const last = state.points[state.points.length - 1]

      if (last) {
        const delta = haversineDistance(last, { latitude, longitude })
        if (delta < MIN_POINT_DISTANCE && speedKmh < SPEED_STOP_THRESHOLD) {
          // fermo: aggiorno solo la logica delle soste, non registro il punto
          if (!state.stoppedSince) {
            state.stoppedSince = recordedAt
          } else {
            const elapsed =
              (new Date(recordedAt) - new Date(state.stoppedSince)) / 1000
            if (
              elapsed >= MIN_STOP_DURATION &&
              state.stoppedSince !== "counted"
            ) {
              state.stopsCount += 1
              state.stoppedSince = "counted"
            }
          }
          persist(state)
          return
        }
        state.distanceKm += delta
      }

      if (state.stoppedSince) {
        const stopEnd = new Date(recordedAt)
        const stopStart = new Date(
          state.stoppedSince === "counted" ? recordedAt : state.stoppedSince,
        )
        state.totalStopDurationSeconds += Math.max(
          0,
          (stopEnd - stopStart) / 1000,
        )
        state.stoppedSince = null
      }

      if (speedKmh > state.maxSpeedKmH) state.maxSpeedKmH = speedKmh

      state.points.push({
        latitude,
        longitude,
        sequence: state.points.length,
        speedKmh,
        altitude,
        recordedAt,
      })

      persist(state)
    },

    trackingPaused: (state) => {
      state.isTracking = false
      persist(state)
    },

    trackingResumed: (state) => {
      state.isTracking = true
      persist(state)
    },

    rideCleared: (state) => {
      Object.assign(state, emptyState)
      persist(state)
    },
  },
})

export const {
  rideStarted,
  pointRecorded,
  trackingPaused,
  trackingResumed,
  rideCleared,
} = rideSlice.actions

export default rideSlice.reducer
