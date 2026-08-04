import { apiSlice } from "../../api/apiSlice"

export const followApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getFollowStats: builder.query({
      query: (username) => `/users/${username}/follow/stats`,
      providesTags: (result, error, username) => [
        { type: "Follow", id: username },
      ],
    }),
    getFollowers: builder.query({
      query: ({ username, page = 0, size = 20 }) =>
        `/users/${username}/follow/followers?page=${page}&size=${size}`,
      providesTags: (result, error, { username }) => [
        { type: "Follow", id: username },
      ],
    }),
    getFollowing: builder.query({
      query: ({ username, page = 0, size = 20 }) =>
        `/users/${username}/follow/following?page=${page}&size=${size}`,
      providesTags: (result, error, { username }) => [
        { type: "Follow", id: username },
      ],
    }),
    toggleFollow: builder.mutation({
      query: ({ username, isFollowing }) => ({
        url: `/users/${username}/follow`,
        method: isFollowing ? "DELETE" : "POST",
      }),
      invalidatesTags: (result, error, { username }) => [
        { type: "Follow", id: username },
        "Post",
      ],
    }),
  }),
})

export const {
  useGetFollowStatsQuery,
  useGetFollowersQuery,
  useGetFollowingQuery,
  useToggleFollowMutation,
} = followApi
