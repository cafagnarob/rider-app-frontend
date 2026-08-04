import { apiSlice } from "../../api/apiSlice"

export const ridesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMyRides: builder.query({
      query: ({ page = 0, size = 20 } = {}) =>
        `/rides?page=${page}&size=${size}`,
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
