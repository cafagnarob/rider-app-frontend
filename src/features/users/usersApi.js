import { apiSlice } from "../../api/apiSlice"

export const usersApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCurrentUser: builder.query({
      query: () => "/users/me",
      providesTags: ["User"],
    }),
    selectVehicle: builder.mutation({
      query: (vehicleId) => ({
        url: `/users/me/vehicle/${vehicleId}`,
        method: "PATCH",
      }),
      invalidatesTags: ["User"],
    }),
    clearVehicle: builder.mutation({
      query: () => ({
        url: "/users/me/vehicle",
        method: "DELETE",
      }),
      invalidatesTags: ["User"],
    }),
    updateProfile: builder.mutation({
      query: (body) => ({
        url: "/users/me",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["User"],
    }),
    updateProfilePicture: builder.mutation({
      query: (file) => {
        const formData = new FormData()
        formData.append("file", file)
        return {
          url: "/users/me/picture",
          method: "PATCH",
          body: formData,
          responseHandler: "text",
        }
      },
      invalidatesTags: ["User"],
    }),

    addProfileLink: builder.mutation({
      query: (body) => ({
        url: "/users/me/links",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User"],
    }),
    updateProfileLink: builder.mutation({
      query: ({ linkId, ...body }) => ({
        url: `/users/me/links/${linkId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["User"],
    }),
    deleteProfileLink: builder.mutation({
      query: (linkId) => ({
        url: `/users/me/links/${linkId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["User"],
    }),
    changePassword: builder.mutation({
      query: (body) => ({
        url: "/users/me/password",
        method: "PATCH",
        body,
      }),
    }),
    updateUsername: builder.mutation({
      query: (body) => ({
        url: "/users/me/username",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["User"],
    }),
    updateEmail: builder.mutation({
      query: (body) => ({
        url: "/users/me/email",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["User"],
    }),
    deactivateAccount: builder.mutation({
      query: () => ({
        url: "/users/me/deactivate",
        method: "PATCH",
      }),
    }),
    getPublicProfile: builder.query({
      query: (username) => `/users/${username}`,
      providesTags: (result, error, username) => [
        { type: "User", id: username },
      ],
    }),
  }),
})
export const {
  useGetCurrentUserQuery,
  useSelectVehicleMutation,
  useClearVehicleMutation,
  useUpdateProfileMutation,
  useUpdateProfilePictureMutation,
  useAddProfileLinkMutation,
  useUpdateProfileLinkMutation,
  useDeleteProfileLinkMutation,
  useChangePasswordMutation,
  useUpdateUsernameMutation,
  useUpdateEmailMutation,
  useDeactivateAccountMutation,
  useGetPublicProfileQuery,
} = usersApi
