import { apiSlice } from "../../api/apiSlice"

export const adminApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAdminUsers: builder.query({
      query: ({
        query,
        status,
        page = 0,
        size = 20,
        orderBy = "createdAt",
      } = {}) => {
        const params = new URLSearchParams({ page, size, orderBy })
        if (query) params.append("query", query)
        if (status) params.append("status", status)
        return `/admin/users?${params.toString()}`
      },
      providesTags: ["AdminUser"],
    }),
    deactivateAdminUser: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/admin/users/${id}/deactivate`,
        method: "PATCH",
        body: reason ? { reason } : {},
      }),
      invalidatesTags: ["AdminUser"],
    }),
    reactivateAdminUser: builder.mutation({
      query: (id) => ({
        url: `/admin/users/${id}/reactivate`,
        method: "PATCH",
      }),
      invalidatesTags: ["AdminUser"],
    }),

    createAdminBrand: builder.mutation({
      query: ({ name, logo }) => {
        const formData = new FormData()
        formData.append("name", name)
        formData.append("logo", logo)
        return { url: "/admin/brands", method: "POST", body: formData }
      },
    }),
    createAdminModel: builder.mutation({
      query: ({ data, image }) => {
        const formData = new FormData()
        formData.append(
          "data",
          new Blob([JSON.stringify(data)], { type: "application/json" }),
        )
        if (image) formData.append("image", image)
        return {
          url: "/admin/motorcycle-models",
          method: "POST",
          body: formData,
        }
      },
    }),
    broadcastNotification: builder.mutation({
      query: (message) => ({
        url: "/admin/notifications/broadcast",
        method: "POST",
        body: { message },
      }),
    }),
    getAdminEvents: builder.query({
      query: (filters = {}) => {
        const params = new URLSearchParams({
          page: filters.page ?? 0,
          size: filters.size ?? 20,
        })
        if (filters.onlyPendingAccessRequests)
          params.append("onlyPendingAccessRequests", "true")
        if (filters.title) params.append("title", filters.title)
        if (filters.status) params.append("status", filters.status)
        if (filters.visibility) params.append("visibility", filters.visibility)
        if (filters.type) params.append("type", filters.type)
        if (filters.organizerUsername)
          params.append("organizerUsername", filters.organizerUsername)
        if (filters.dateFrom) params.append("dateFrom", filters.dateFrom)
        if (filters.dateTo) params.append("dateTo", filters.dateTo)
        if (filters.lat != null) params.append("lat", filters.lat)
        if (filters.lng != null) params.append("lng", filters.lng)
        if (filters.radiusKm != null)
          params.append("radiusKm", filters.radiusKm)
        return `/admin/events?${params.toString()}`
      },
      providesTags: ["AdminEvent"],
    }),
    adminCancelEvent: builder.mutation({
      query: ({ eventId, reason }) => ({
        url: `/admin/events/${eventId}/cancel`,
        method: "PATCH",
        body: reason ? { reason } : {},
      }),
      invalidatesTags: ["AdminEvent"],
    }),
    getCatalogSuggestions: builder.query({
      query: ({ status, page = 0, size = 20 } = {}) => {
        const params = new URLSearchParams({ page, size })
        if (status) params.append("status", status)
        return `/admin/catalog-suggestions?${params.toString()}`
      },
      providesTags: ["CatalogSuggestion"],
    }),
    updateCatalogSuggestionStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/admin/catalog-suggestions/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["CatalogSuggestion"],
    }),
    adminDeleteUser: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/admin/users/${id}`,
        method: "DELETE",
        body: { reason },
      }),
      invalidatesTags: ["AdminUser"],
    }),
    getAdminReports: builder.query({
      query: ({ status, targetType, page = 0, size = 20 } = {}) => {
        const params = new URLSearchParams({ page, size })
        if (status) params.append("status", status)
        if (targetType) params.append("targetType", targetType)
        return `/admin/reports?${params.toString()}`
      },
      providesTags: ["AdminReport"],
    }),
    dismissReport: builder.mutation({
      query: (id) => ({
        url: `/admin/reports/${id}/dismiss`,
        method: "PATCH",
      }),
      invalidatesTags: ["AdminReport"],
    }),
    resolveReport: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/admin/reports/${id}/resolve`,
        method: "PATCH",
        body: reason ? { reason } : {},
      }),
      invalidatesTags: ["AdminReport"],
    }),
    getAdminDashboard: builder.query({
      query: () => "/admin/dashboard",
      providesTags: ["AdminDashboard"],
    }),
  }),
})

export const {
  useGetAdminUsersQuery,
  useDeactivateAdminUserMutation,
  useReactivateAdminUserMutation,
  useCreateAdminBrandMutation,
  useCreateAdminModelMutation,
  useBroadcastNotificationMutation,
  useGetAdminEventsQuery,
  useAdminCancelEventMutation,
  useGetCatalogSuggestionsQuery,
  useUpdateCatalogSuggestionStatusMutation,
  useAdminDeleteUserMutation,
  useGetAdminReportsQuery,
  useDismissReportMutation,
  useResolveReportMutation,
  useGetAdminDashboardQuery,
} = adminApi
