import { apiSlice } from "../../api/apiSlice"

export const routesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMyRoutes: builder.query({
      query: ({ page = 0, size = 20 } = {}) =>
        `/routes/my?page=${page}&size=${size}`,
      providesTags: ["Route"],
    }),
    getRouteById: builder.query({
      query: (routeId) => `/routes/${routeId}`,
      providesTags: (result, error, routeId) => [
        { type: "Route", id: routeId },
      ],
    }),
    createRoute: builder.mutation({
      query: ({ data, images }) => {
        const formData = new FormData()
        formData.append(
          "data",
          new Blob([JSON.stringify(data)], { type: "application/json" }),
        )
        ;(images || []).forEach((file) => formData.append("images", file))

        console.log("BODY:", formData)
        console.log("IS FORMDATA:", formData instanceof FormData)

        return { url: "/routes", method: "POST", body: formData }
      },
      invalidatesTags: ["Route"],
    }),
    updateRoute: builder.mutation({
      query: ({ routeId, data, images }) => {
        const formData = new FormData()
        formData.append(
          "data",
          new Blob([JSON.stringify(data)], { type: "application/json" }),
        )
        ;(images || []).forEach((file) => formData.append("images", file))
        return { url: `/routes/${routeId}`, method: "PATCH", body: formData }
      },
      invalidatesTags: (result, error, { routeId }) => [
        { type: "Route", id: routeId },
      ],
    }),
    updateWaypointImage: builder.mutation({
      query: ({ routeId, waypointId, image }) => {
        const formData = new FormData()
        formData.append("image", image)
        return {
          url: `/routes/${routeId}/waypoints/${waypointId}/image`,
          method: "PATCH",
          body: formData,
        }
      },
      invalidatesTags: (result, error, { routeId }) => [
        { type: "Route", id: routeId },
      ],
    }),
    deleteRoute: builder.mutation({
      query: (routeId) => ({
        url: `/routes/${routeId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Route"],
    }),
    setImportable: builder.mutation({
      query: ({ routeId, value }) => ({
        url: `/routes/${routeId}/importable?value=${value}`,
        method: "PATCH",
      }),
      invalidatesTags: ["Route"],
    }),
    importRoute: builder.mutation({
      query: (routeId) => ({
        url: `/routes/${routeId}/import`,
        method: "POST",
      }),
      invalidatesTags: ["Route"],
    }),
    previewRoute: builder.mutation({
      query: (body) => ({
        url: "/routes/preview",
        method: "POST",
        body,
      }),
    }),
    getUserRoutes: builder.query({
      query: ({ username, page = 0, size = 20 }) =>
        `/routes/user/${username}?page=${page}&size=${size}`,
    }),
    getImportableRoutesForMap: builder.query({
      query: () => "/routes/importable",
      providesTags: ["Route"],
    }),
  }),
})

export const {
  useGetMyRoutesQuery,
  useGetRouteByIdQuery,
  useCreateRouteMutation,
  useDeleteRouteMutation,
  useSetImportableMutation,
  useImportRouteMutation,
  usePreviewRouteMutation,
  useGetUserRoutesQuery,
  useUpdateWaypointImageMutation,
  useUpdateRouteMutation,
  useGetImportableRoutesForMapQuery,
} = routesApi
