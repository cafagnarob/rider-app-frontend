import { configureStore } from "@reduxjs/toolkit"
import { apiSlice } from "../api/apiSlice"
import authReducer from "../features/auth/authSlice"
import rideReducer from "../features/rides/rideSlice"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ride: rideReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefault) => getDefault().concat(apiSlice.middleware),
})
