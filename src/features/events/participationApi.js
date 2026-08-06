import { apiSlice } from "../../api/apiSlice"

export const participationApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    joinEvent: builder.mutation({
      query: ({ eventId, accessCode }) => ({
        url: `/events/${eventId}/participations`,
        method: "POST",
        body: { accessCode: accessCode || null },
      }),
      invalidatesTags: (result, error, { eventId }) => [
        { type: "Event", id: eventId },
        "Event",
      ],
    }),
    cancelMyParticipation: builder.mutation({
      query: (eventId) => ({
        url: `/events/${eventId}/participations/me`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, eventId) => [
        { type: "Event", id: eventId },
        "Event",
      ],
    }),
    getPendingParticipants: builder.query({
      query: (eventId) => `/events/${eventId}/participations/pending`,
      providesTags: (result, error, eventId) => [
        { type: "Participation", id: eventId },
      ],
    }),
    getAcceptedParticipants: builder.query({
      query: (eventId) => `/events/${eventId}/participations/accepted`,
      providesTags: (result, error, eventId) => [
        { type: "Participation", id: eventId },
      ],
    }),
    approveParticipation: builder.mutation({
      query: ({ eventId, participationId }) => ({
        url: `/events/${eventId}/participations/${participationId}/approve`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, { eventId }) => [
        { type: "Participation", id: eventId },
        { type: "Event", id: eventId },
        "Event",
      ],
    }),
    rejectParticipation: builder.mutation({
      query: ({ eventId, participationId }) => ({
        url: `/events/${eventId}/participations/${participationId}/reject`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, { eventId }) => [
        { type: "Participation", id: eventId },
        { type: "Event", id: eventId },
        "Event",
      ],
    }),
  }),
})

export const {
  useJoinEventMutation,
  useCancelMyParticipationMutation,
  useGetPendingParticipantsQuery,
  useGetAcceptedParticipantsQuery,
  useApproveParticipationMutation,
  useRejectParticipationMutation,
} = participationApi
