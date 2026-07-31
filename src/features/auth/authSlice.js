import { createSlice } from "@reduxjs/toolkit"

const tokenFromStorage = localStorage.getItem("token")

const authSlice = createSlice({
  name: "auth",
  initialState: { token: tokenFromStorage || null },
  reducers: {
    setCredentials: (state, action) => {
      state.token = action.payload.token
      if (action.payload.remember) {
        localStorage.setItem("token", action.payload.token)
      }
    },
    logout: (state) => {
      state.token = null
      localStorage.removeItem("token")
    },
  },
})

export const { setCredentials, logout } = authSlice.actions
export default authSlice.reducer
