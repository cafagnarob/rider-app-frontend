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
  }),
})
export const {
  useGetCurrentUserQuery,
  useSelectVehicleMutation,
  useClearVehicleMutation,
  useUpdateProfileMutation,
  useUpdateProfilePictureMutation,
} = usersApi
