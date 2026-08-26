import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import { logout } from "../features/auth/authSlice"

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token
    if (token) headers.set("Authorization", `Bearer ${token}`)
    return headers
  },
})

const baseQueryWithReauth = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions)
  if (result.error?.status === 401) {
    api.dispatch(logout())
  }
  return result
}

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Event",
    "Post",
    "Vehicle",
    "User",
    "Notification",
    "Brand",
    "Model",
    "Comment",
    "Follow",
    "Ride",
    "Route",
    "Participation",
    "Invite",
    "MyInvites",
    "AdminUser",
  ],
  endpoints: () => ({}),
})
