import { configureStore } from "@reduxjs/toolkit"
import { apiSlice } from "../api/apiSlice"
import authReducer, { logout } from "../features/auth/authSlice"
import rideReducer from "../features/rides/rideSlice"

const resetApiCacheOnLogout = (storeAPI) => (next) => (action) => {
  const result = next(action)
  if (action.type === logout.type) {
    storeAPI.dispatch(apiSlice.util.resetApiState())
  }
  return result
}

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ride: rideReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware, resetApiCacheOnLogout),
})
