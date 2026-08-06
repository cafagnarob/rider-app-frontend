import { apiSlice } from "../../api/apiSlice"

export const invitesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getEventInvites: builder.query({
      query: (eventId) => `/events/${eventId}/invites`,
      providesTags: (result, error, eventId) => [
        { type: "Invite", id: eventId },
      ],
    }),
    inviteUser: builder.mutation({
      query: ({ eventId, username }) => ({
        url: `/events/${eventId}/invites`,
        method: "POST",
        body: { username },
      }),
      invalidatesTags: (result, error, { eventId }) => [
        { type: "Invite", id: eventId },
      ],
    }),
    getMyInvites: builder.query({
      query: () => "/invites/me",
      providesTags: ["MyInvites"],
    }),
    acceptInvite: builder.mutation({
      query: (inviteId) => ({
        url: `/invites/${inviteId}/accept`,
        method: "PATCH",
      }),
      invalidatesTags: ["MyInvites", "Event"],
    }),
    rejectInvite: builder.mutation({
      query: (inviteId) => ({
        url: `/invites/${inviteId}/reject`,
        method: "PATCH",
      }),
      invalidatesTags: ["MyInvites"],
    }),
  }),
})

export const {
  useGetEventInvitesQuery,
  useInviteUserMutation,
  useGetMyInvitesQuery,
  useAcceptInviteMutation,
  useRejectInviteMutation,
} = invitesApi
