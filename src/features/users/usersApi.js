import { apiSlice } from "../../api/apiSlice"

export const usersApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCurrentUser: builder.query({
      query: () => "/users/me",
      providesTags: ["User"],
    }),
  }),
})
export const { useGetCurrentUserQuery } = usersApi
