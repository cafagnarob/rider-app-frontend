import { apiSlice } from "../../api/apiSlice"

export const ridesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMyRides: builder.query({
      query: ({ vehicleId, page = 0, size = 20 } = {}) => {
        const params = new URLSearchParams({ page, size })
        if (vehicleId) params.append("vehicleId", vehicleId)
        return `/rides?${params.toString()}`
      },
      providesTags: ["Ride"],
    }),
    getRideById: builder.query({
      query: (rideId) => `/rides/${rideId}`,
      providesTags: (result, error, rideId) => [{ type: "Ride", id: rideId }],
    }),
    startRide: builder.mutation({
      query: (body) => ({
        url: "/rides",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Ride"],
    }),
    finishRide: builder.mutation({
      query: ({ rideId, ...body }) => ({
        url: `/rides/${rideId}/finish`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Ride"],
    }),
    deleteRide: builder.mutation({
      query: (rideId) => ({
        url: `/rides/${rideId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Ride"],
    }),
  }),
})

export const {
  useGetMyRidesQuery,
  useGetRideByIdQuery,
  useStartRideMutation,
  useFinishRideMutation,
  useDeleteRideMutation,
} = ridesApi
