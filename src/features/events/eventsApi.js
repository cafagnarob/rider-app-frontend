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
        viewerLat,
        viewerLng,
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
        if (viewerLat != null) params.append("viewerLat", viewerLat)
        if (viewerLng != null) params.append("viewerLng", viewerLng)
        return `/events/search?${params.toString()}`
      },
      providesTags: ["Event"],
    }),
    getOrganizedEvents: builder.query({
      query: ({
        history = false,
        viewerLat,
        viewerLng,
        page = 0,
        size = 20,
      } = {}) => {
        const params = new URLSearchParams({ history, page, size })
        if (viewerLat != null) params.append("viewerLat", viewerLat)
        if (viewerLng != null) params.append("viewerLng", viewerLng)
        return `/events/organized?${params.toString()}`
      },
      providesTags: ["Event"],
    }),
    getParticipatingEvents: builder.query({
      query: ({
        history = false,
        viewerLat,
        viewerLng,
        page = 0,
        size = 20,
      } = {}) => {
        const params = new URLSearchParams({ history, page, size })
        if (viewerLat != null) params.append("viewerLat", viewerLat)
        if (viewerLng != null) params.append("viewerLng", viewerLng)
        return `/events/participating?${params.toString()}`
      },
      providesTags: ["Event"],
    }),
    getEventById: builder.query({
      query: (eventId) => `/events/${eventId}`,
      providesTags: (result, error, eventId) => [
        { type: "Event", id: eventId },
      ],
    }),
    getHistoryEvents: builder.query({
      query: ({ viewerLat, viewerLng, page = 0, size = 20 } = {}) => {
        const params = new URLSearchParams({ page, size })
        if (viewerLat != null) params.append("viewerLat", viewerLat)
        if (viewerLng != null) params.append("viewerLng", viewerLng)
        return `/events/history?${params.toString()}`
      },
      providesTags: ["Event"],
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
      query: ({ eventId, data }) => ({
        url: `/events/${eventId}`,
        method: "PATCH",
        body: data,
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
    updateEventDay: builder.mutation({
      query: ({ tripId, dayId, data }) => ({
        url: `/events/${tripId}/days/${dayId}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { tripId, dayId }) => [
        { type: "Event", id: tripId },
        { type: "Event", id: dayId },
        "Event",
      ],
    }),
    updateEventCoverPhoto: builder.mutation({
      query: ({ eventId, image }) => {
        const formData = new FormData()
        formData.append("image", image)
        return {
          url: `/events/${eventId}/cover-photo`,
          method: "PATCH",
          body: formData,
        }
      },
      invalidatesTags: (result, error, { eventId }) => [
        { type: "Event", id: eventId },
        "Event",
      ],
    }),
    deleteEventDay: builder.mutation({
      query: ({ tripId, dayId }) => ({
        url: `/events/${tripId}/days/${dayId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { tripId }) => [
        { type: "Event", id: tripId },
        "Event",
      ],
    }),
    reorderEventDays: builder.mutation({
      query: ({ tripId, dayIds }) => ({
        url: `/events/${tripId}/days/reorder`,
        method: "PATCH",
        body: { dayIds },
      }),
      invalidatesTags: (result, error, { tripId }) => [
        { type: "Event", id: tripId },
        "Event",
      ],
    }),
  }),
})

export const {
  useUpdateEventDayMutation,
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
  useGetHistoryEventsQuery,
  useUpdateEventCoverPhotoMutation,
  useDeleteEventDayMutation,
  useReorderEventDaysMutation,
} = eventsApi
