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
        { postId, liked },
        { dispatch, queryFulfilled, getState },
      ) {
        const patches = []

        const applyChange = (draftPost) => {
          draftPost.likedByCurrentUser = !liked
          draftPost.likeCount += liked ? -1 : 1
        }
        const cachedFeedArgs = postsApi.util.selectCachedArgsForQuery(
          getState(),
          "getFeed",
        )
        cachedFeedArgs.forEach((args) => {
          patches.push(
            dispatch(
              postsApi.util.updateQueryData("getFeed", args, (draft) => {
                const p = draft.content.find((x) => x.id === postId)
                if (p) applyChange(p)
              }),
            ),
          )
        })

        patches.push(
          dispatch(
            postsApi.util.updateQueryData("getPostById", postId, applyChange),
          ),
        )

        try {
          await queryFulfilled
        } catch {
          patches.forEach((p) => p.undo())
        }
      },
    }),

    getComments: builder.query({
      query: ({ postId, page = 0, size = 20 }) =>
        `/posts/${postId}/comments?page=${page}&size=${size}`,
      providesTags: (result, error, { postId }) => [
        { type: "Comment", id: postId },
      ],
    }),
    addComment: builder.mutation({
      query: ({ postId, text }) => ({
        url: `/posts/${postId}/comments`,
        method: "POST",
        body: { text },
      }),
      invalidatesTags: (result, error, { postId }) => [
        { type: "Comment", id: postId },
        { type: "Post", id: postId },
        "Post",
      ],
    }),
    deleteComment: builder.mutation({
      query: ({ postId, commentId }) => ({
        url: `/posts/${postId}/comments/${commentId}`,
        method: "DELETE",
      }),
      invalidatesTags: (
        result,
        error,
        { postId, parentCommentId, commentId },
      ) => [
        { type: "Comment", id: postId },
        { type: "Post", id: postId },
        "Post",
        { type: "Reply", id: parentCommentId || commentId },
      ],
    }),
    createPost: builder.mutation({
      query: ({ data, files }) => {
        const formData = new FormData()
        formData.append(
          "data",
          new Blob([JSON.stringify(data)], { type: "application/json" }),
        )
        files.forEach((file) => formData.append("media", file))

        return {
          url: "/posts",
          method: "POST",
          body: formData,
        }
      },
      invalidatesTags: ["Post"],
    }),
    getUserPosts: builder.query({
      query: ({ userId, page = 0, size = 20 }) =>
        `/posts/user/${userId}?page=${page}&size=${size}`,
      providesTags: ["Post"],
    }),
    getPostsByVehicle: builder.query({
      query: ({ vehicleId, page = 0, size = 20 }) =>
        `/posts/vehicle/${vehicleId}?page=${page}&size=${size}`,
      providesTags: ["Post"],
    }),
    toggleCommentLike: builder.mutation({
      query: ({ postId, commentId }) => ({
        url: `/posts/${postId}/comments/${commentId}/like`,
        method: "POST",
      }),
      invalidatesTags: (
        result,
        error,
        { postId, parentCommentId, commentId },
      ) => [
        { type: "Comment", id: postId },
        { type: "Reply", id: parentCommentId || commentId },
      ],
    }),

    addReply: builder.mutation({
      query: ({ postId, commentId, text }) => ({
        url: `/posts/${postId}/comments/${commentId}/replies`,
        method: "POST",
        body: { text },
      }),
      invalidatesTags: (result, error, { postId, commentId }) => [
        { type: "Comment", id: postId },
        { type: "Reply", id: commentId },
      ],
    }),

    getReplies: builder.query({
      query: ({ postId, commentId }) =>
        `/posts/${postId}/comments/${commentId}/replies`,
      providesTags: (result, error, { commentId }) => [
        { type: "Reply", id: commentId },
      ],
    }),
  }),
})

export const {
  useGetFeedQuery,
  useGetPostByIdQuery,
  useDeletePostMutation,
  useToggleLikeMutation,
  useGetCommentsQuery,
  useAddCommentMutation,
  useDeleteCommentMutation,
  useCreatePostMutation,
  useGetPostsByVehicleQuery,
  useGetUserPostsQuery,
  useToggleCommentLikeMutation,
  useAddReplyMutation,
  useGetRepliesQuery,
} = postsApi
