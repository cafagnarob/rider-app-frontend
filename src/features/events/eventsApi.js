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
} = eventsApi
