import { apiSlice } from "../../api/apiSlice"

export const postsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getFeed: builder.query({
      query: ({ type = "FOLLOWING", page = 0, size = 20 } = {}) =>
        `/posts?type=${type}&page=${page}&size=${size}`,
      providesTags: ["Post"],
    }),
    getPostById: builder.query({
      query: (postId) => `/posts/${postId}`,
      providesTags: (result, error, postId) => [{ type: "Post", id: postId }],
    }),
    deletePost: builder.mutation({
      query: (postId) => ({
        url: `/posts/${postId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Post"],
    }),
    toggleLike: builder.mutation({
      query: ({ postId, liked }) => ({
        url: `/posts/${postId}/likes`,
        method: liked ? "DELETE" : "POST",
      }),
      async onQueryStarted(
        { postId, liked, feedArgs },
        { dispatch, queryFulfilled },
      ) {
        const patch = dispatch(
          postsApi.util.updateQueryData("getFeed", feedArgs, (draft) => {
            const post = draft.content.find((p) => p.id === postId)
            if (post) {
              post.likedByCurrentUser = !liked
              post.likeCount += liked ? -1 : 1
            }
          }),
        )
        try {
          await queryFulfilled
        } catch {
          patch.undo()
        }
      },
    }),
  }),
})

export const {
  useGetFeedQuery,
  useGetPostByIdQuery,
  useDeletePostMutation,
  useToggleLikeMutation,
} = postsApi
