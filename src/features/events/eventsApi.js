import { apiSlice } from "../../api/apiSlice"

export const eventsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    searchEvents: builder.query({
      query: ({
        title,
        dateFrom,
        dateTo,
        lat,
        lng,
        radiusKm,
        page = 0,
        size = 20,
      } = {}) => {
        const params = new URLSearchParams({ page, size })
        if (title) params.append("title", title)
        if (dateFrom) params.append("dateFrom", dateFrom)
        if (dateTo) params.append("dateTo", dateTo)
        if (lat != null) params.append("lat", lat)
        if (lng != null) params.append("lng", lng)
        if (radiusKm) params.append("radiusKm", radiusKm)
        return `/events/search?${params.toString()}`
      },
      providesTags: ["Event"],
    }),
    getOrganizedEvents: builder.query({
      query: ({ page = 0, size = 20 } = {}) =>
        `/events/organized?page=${page}&size=${size}`,
      providesTags: ["Event"],
    }),
    getParticipatingEvents: builder.query({
      query: ({ page = 0, size = 20 } = {}) =>
        `/events/participating?page=${page}&size=${size}`,
      providesTags: ["Event"],
    }),
    getEventById: builder.query({
      query: (eventId) => `/events/${eventId}`,
      providesTags: (result, error, eventId) => [
        { type: "Event", id: eventId },
      ],
    }),
    createEvent: builder.mutation({
      query: (body) => ({
        url: "/events",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Event"],
    }),
    updateEvent: builder.mutation({
      query: ({ eventId, ...body }) => ({
        url: `/events/${eventId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { eventId }) => [
        { type: "Event", id: eventId },
        "Event",
      ],
    }),
    changeEventStatus: builder.mutation({
      query: ({ eventId, status }) => ({
        url: `/events/${eventId}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (result, error, { eventId }) => [
        { type: "Event", id: eventId },
        "Event",
      ],
    }),
    getAccessCode: builder.query({
      query: (eventId) => `/events/${eventId}/access-code`,
      providesTags: (result, error, eventId) => [
        { type: "Event", id: eventId },
      ],
    }),
    regenerateAccessCode: builder.mutation({
      query: ({ eventId, currentPassword, newAccessCode }) => ({
        url: `/events/${eventId}/access-code`,
        method: "PATCH",
        body: { currentPassword, newAccessCode },
      }),
      invalidatesTags: (result, error, { eventId }) => [
        { type: "Event", id: eventId },
      ],
    }),
    addEventDay: builder.mutation({
      query: ({ tripId, ...body }) => ({
        url: `/events/${tripId}/days`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { tripId }) => [
        { type: "Event", id: tripId },
        "Event",
      ],
    }),
    requestAccessCode: builder.mutation({
      query: (eventId) => ({
        url: `/events/${eventId}/access-requests`,
        method: "POST",
      }),
      invalidatesTags: (result, error, eventId) => [
        { type: "Event", id: eventId },
      ],
    }),
    getAccessCodeRequests: builder.query({
      query: (eventId) => `/events/${eventId}/access-requests`,
      providesTags: (result, error, eventId) => [
        { type: "AccessRequest", id: eventId },
      ],
    }),
    approveAccessCodeRequest: builder.mutation({
      query: ({ eventId, requestId }) => ({
        url: `/events/${eventId}/access-requests/${requestId}/approve`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, { eventId }) => [
        { type: "AccessRequest", id: eventId },
      ],
    }),
    rejectAccessCodeRequest: builder.mutation({
      query: ({ eventId, requestId }) => ({
        url: `/events/${eventId}/access-requests/${requestId}/reject`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, { eventId }) => [
        { type: "AccessRequest", id: eventId },
      ],
    }),
  }),
})

export const {
  useSearchEventsQuery,
  useGetOrganizedEventsQuery,
  useGetParticipatingEventsQuery,
  useGetEventByIdQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useChangeEventStatusMutation,
  useGetAccessCodeQuery,
  useRegenerateAccessCodeMutation,
  useAddEventDayMutation,
  useRequestAccessCodeMutation,
  useGetAccessCodeRequestsQuery,
  useApproveAccessCodeRequestMutation,
  useRejectAccessCodeRequestMutation,
} = eventsApi
