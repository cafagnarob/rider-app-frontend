import { apiSlice } from "../../api/apiSlice"

export const vehiclesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMyVehicles: builder.query({
      query: () => "/vehicles",
      providesTags: ["Vehicle"],
    }),
    addVehicle: builder.mutation({
      query: ({ data, photo }) => {
        const formData = new FormData()
        formData.append(
          "data",
          new Blob([JSON.stringify(data)], { type: "application/json" }),
        )
        if (photo) formData.append("photo", photo)

        return {
          url: "/vehicles",
          method: "POST",
          body: formData,
        }
      },
      invalidatesTags: ["Vehicle"],
    }),
    deleteVehicle: builder.mutation({
      query: (vehicleId) => ({
        url: `/vehicles/${vehicleId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Vehicle"],
    }),
    updateVehicle: builder.mutation({
      query: ({ vehicleId, ...body }) => ({
        url: `/vehicles/${vehicleId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Vehicle"],
    }),

    updateVehiclePhoto: builder.mutation({
      query: ({ vehicleId, photo }) => {
        const formData = new FormData()
        formData.append("photo", photo)
        return {
          url: `/vehicles/${vehicleId}/photo`,
          method: "PATCH",
          body: formData,
        }
      },
      invalidatesTags: ["Vehicle"],
    }),
    deleteVehiclePhoto: builder.mutation({
      query: (vehicleId) => ({
        url: `/vehicles/${vehicleId}/photo`,
        method: "DELETE",
      }),
      invalidatesTags: ["Vehicle"],
    }),
  }),
})

export const {
  useGetMyVehiclesQuery,
  useAddVehicleMutation,
  useDeleteVehicleMutation,
  useUpdateVehicleMutation,
  useUpdateVehiclePhotoMutation,
  useDeleteVehiclePhotoMutation,
} = vehiclesApi
